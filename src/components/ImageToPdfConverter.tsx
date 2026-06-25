"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  FileDown, 
  Loader2, 
  Settings2,
  X,
  PlusCircle,
  ArrowLeft,
  ArrowRight,
  Smartphone,
  Monitor,
  ImageIcon,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger 
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "./LanguageSelector";
import logo from "@/app/icono.png";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";

const PAPER_DIMENSIONS: Record<string, { width: number; height: number; format: string }> = {
  'Carta': { width: 215.9, height: 279.4, format: 'letter' },
  'A4': { width: 210, height: 297, format: 'a4' },
  'A3': { width: 297, height: 420, format: 'a3' },
  'Oficio (Legal 35.5cm)': { width: 215.9, height: 355.6, format: 'legal' },
  'Folio (33cm)': { width: 215.9, height: 330.2, format: 'folio' },
  'Oficio (34cm)': { width: 216, height: 340, format: 'oficio' },
  'Extra Oficio (38cm)': { width: 216, height: 380, format: 'extra-oficio' }
};

interface ImageData {
  id: string;
  url: string;
  file: File;
  name: string;
  quantity: number;
  orientation?: 'portrait' | 'landscape';
}

export default function ImageToPdfConverter() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageData[]>([]);
  const [paperSize, setPaperSize] = useState('Carta');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [margin, setMargin] = useState(1);
  const [fitMode, setFitMode] = useState<'fit' | 'fill'>('fit');
  const [imagesPerPage, setImagesPerPage] = useState('1');
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pref-lang') as Language;
    if (savedLang === 'en' || savedLang === 'es') {
      setLang(savedLang);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'en') setLang('en');
    }
  }, []);

  const paper = useMemo(() => PAPER_DIMENSIONS[paperSize], [paperSize]);

  const expandedImagesList = useMemo(() => {
    const list: (ImageData & { originalId: string })[] = [];
    images.forEach(img => {
      for (let i = 0; i < img.quantity; i++) {
        list.push({ ...img, id: `${img.id}-copy-${i}`, originalId: img.id });
      }
    });
    return list;
  }, [images]);

  const pages = useMemo(() => {
    const p = [];
    const n = parseInt(imagesPerPage);
    for (let i = 0; i < expandedImagesList.length; i += n) {
      p.push(expandedImagesList.slice(i, i + n));
    }
    return p;
  }, [expandedImagesList, imagesPerPage]);

  const processFiles = (files: FileList | File[]) => {
    const newImages: ImageData[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: Math.random().toString(36).substring(2, 9),
        url: URL.createObjectURL(file),
        file,
        name: file.name,
        quantity: 1,
        orientation: orientation 
      }));

    if (newImages.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Por favor selecciona archivos de imagen válidos." });
      return;
    }

    setImages(prev => [...prev, ...newImages]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, quantity: Math.max(1, qty) } : img));
  };

  const updateImageOrientation = (id: string, orient: 'portrait' | 'landscape') => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, orientation: orient } : img));
  };

  const moveOriginalImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  const getGridConfig = (n: number, orient: 'portrait' | 'landscape') => {
    const isP = orient === 'portrait';
    switch (n) {
      case 1: return { rows: 1, cols: 1 };
      case 2: return isP ? { rows: 2, cols: 1 } : { rows: 1, cols: 2 };
      case 3: return isP ? { rows: 3, cols: 1 } : { rows: 1, cols: 3 };
      case 4: return { rows: 2, cols: 2 };
      case 5:
      case 6: return isP ? { rows: 3, cols: 2 } : { rows: 2, cols: 3 };
      case 7:
      case 8: return isP ? { rows: 4, cols: 2 } : { rows: 2, cols: 4 };
      case 9: return { rows: 3, cols: 3 };
      case 10: return isP ? { rows: 5, cols: 2 } : { rows: 2, cols: 5 };
      default: return { rows: 1, cols: 1 };
    }
  };

  const exportPdf = async () => {
    if (expandedImagesList.length === 0) return;
    setIsExporting(true);

    try {
      const nPerPage = parseInt(imagesPerPage);
      const initialOrient = (nPerPage === 1 && expandedImagesList[0].orientation) 
        ? expandedImagesList[0].orientation 
        : orientation;

      const pdf = new jsPDF({
        orientation: initialOrient === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: paper.format as any
      });

      for (let i = 0; i < expandedImagesList.length; i += nPerPage) {
        const pageImages = expandedImagesList.slice(i, i + nPerPage);
        let currentPageOrient = orientation;
        if (nPerPage === 1) {
          currentPageOrient = pageImages[0].orientation || orientation;
        }

        if (i > 0) {
          pdf.addPage(paper.format as any, currentPageOrient === 'portrait' ? 'p' : 'l');
        }

        const pageWidth = currentPageOrient === 'portrait' ? paper.width : paper.height;
        const pageHeight = currentPageOrient === 'portrait' ? paper.height : paper.width;
        const marginMm = margin * 10;
        const usableWidth = pageWidth - (marginMm * 2);
        const usableHeight = pageHeight - (marginMm * 2);

        const { rows, cols } = getGridConfig(nPerPage, currentPageOrient);
        const cellWidth = usableWidth / cols;
        const cellHeight = usableHeight / rows;

        for (let j = 0; j < pageImages.length; j++) {
          const imgData = pageImages[j];
          const htmlImg = new window.Image();
          htmlImg.src = imgData.url;
          await new Promise((resolve) => (htmlImg.onload = resolve));

          const rowIdx = Math.floor(j / cols);
          const colIdx = j % cols;

          const imgRatio = htmlImg.width / htmlImg.height;
          const cellRatio = cellWidth / cellHeight;

          let drawW, drawH, x, y;

          if (fitMode === 'fit') {
            if (imgRatio > cellRatio) {
              drawW = cellWidth;
              drawH = cellWidth / imgRatio;
            } else {
              drawH = cellHeight;
              drawW = cellHeight * imgRatio;
            }
          } else {
            if (imgRatio > cellRatio) {
              drawH = cellHeight;
              drawW = cellHeight * imgRatio;
            } else {
              drawW = cellWidth;
              drawH = cellWidth / imgRatio;
            }
          }

          x = marginMm + (colIdx * cellWidth) + (cellWidth - drawW) / 2;
          y = marginMm + (rowIdx * cellHeight) + (cellHeight - drawH) / 2;

          const canvas = document.createElement('canvas');
          canvas.width = htmlImg.width;
          canvas.height = htmlImg.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(htmlImg, 0, 0);
          }
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          pdf.addImage(dataUrl, 'JPEG', x, y, drawW, drawH);
        }
      }

      pdf.save(`MultiPrintTools-ImageToPdf-${Date.now()}.pdf`);
      toast({ title: "PDF Generado", description: "El documento se ha descargado con éxito." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted) return null;

  const renderSettingsContent = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Settings2 className="h-4 w-4 text-primary" />
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuración</h2>
      </div>

      <div className="space-y-1.5">
        <div className="space-y-0.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t.paperSize}</Label>
          <Select value={paperSize} onValueChange={setPaperSize}>
            <SelectTrigger className="font-bold border-2 h-8 text-xs bg-card">
              <span className="truncate">{paperSize}</span>
            </SelectTrigger>
            <SelectContent>
              {Object.keys(PAPER_DIMENSIONS).map(size => (
                <SelectItem key={size} value={size} className="font-bold text-xs">{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-0.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t.orientation} Global</Label>
          <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
            <SelectTrigger className="font-bold border-2 h-8 text-xs bg-card">
              <span className="truncate">{orientation === 'portrait' ? t.portrait : t.landscape}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="portrait" className="font-bold text-xs">{t.portrait}</SelectItem>
              <SelectItem value="landscape" className="font-bold text-xs">{t.landscape}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-0.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t.imagesPerPage}</Label>
          <Select value={imagesPerPage} onValueChange={setImagesPerPage}>
            <SelectTrigger className="font-bold border-2 h-8 text-xs bg-card">
              <span className="truncate">{imagesPerPage}</span>
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <SelectItem key={n} value={n.toString()} className="font-bold text-xs">{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-0.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t.imageFit}</Label>
          <Select value={fitMode} onValueChange={(v: any) => setFitMode(v)}>
            <SelectTrigger className="font-bold border-2 h-8 text-xs bg-card">
              <span className="truncate">{fitMode === 'fit' ? t.fit : t.fill}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fit" className="font-bold text-xs">{t.fit}</SelectItem>
              <SelectItem value="fill" className="font-bold text-xs">{t.fill}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-0.5">
          <div className="flex justify-between">
            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">{t.margins}</Label>
            <span className="text-[10px] font-black text-primary">{margin} cm</span>
          </div>
          <div className="flex items-center gap-2 py-0.5">
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg shrink-0" onClick={() => setMargin(Math.max(0, margin - 0.5))}>
              <X className="h-3 w-3 rotate-45" />
            </Button>
            <div className="flex-1 h-1 bg-muted rounded-full relative overflow-hidden">
              <div 
                className="absolute h-full bg-primary rounded-full transition-all" 
                style={{ width: `${(margin / 5) * 100}%` }}
              />
            </div>
            <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg shrink-0" onClick={() => setMargin(Math.min(5, margin + 0.5))}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      <Separator className="my-1 opacity-50" />

      <div className="bg-muted p-2 rounded-xl border border-border space-y-0.5">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Originales</span>
          <span className="text-[10px] font-black text-primary">#{images.length}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Hojas Totales</span>
          <span className="text-[10px] font-black text-foreground">{pages.length}</span>
        </div>
      </div>

      <div className="pt-2 space-y-4">
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground hover:text-destructive transition-colors font-bold text-[9px] uppercase tracking-widest"
          onClick={() => setImages([])}
          disabled={images.length === 0}
        >
          {t.clearAll}
        </Button>
        <div className="h-32 sm:h-0" />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background font-body overflow-hidden transition-colors duration-300">
      <header className="h-16 shrink-0 border-b border-border bg-background flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 font-bold text-muted-foreground px-2">
              <ChevronLeft className="h-4 w-4" /> 
              <span className="hidden sm:inline text-xs">Inicio</span>
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border bg-white dark:bg-slate-200">
              <Image src={logo} alt="Logo" fill className="object-contain" />
            </div>
            <h1 className="text-xl font-headline font-black tracking-tighter text-primary uppercase">
              IMAGEN A PDF
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <LanguageSelector language={lang} setLanguage={setLang} />
          <Button 
            className="hidden sm:flex bg-primary hover:bg-primary/90 text-white font-black gap-2 rounded-xl shadow-md h-9 px-5 text-xs"
            onClick={exportPdf}
            disabled={expandedImagesList.length === 0 || isExporting}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {isExporting ? t.generating : t.export}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <aside className="hidden md:flex w-[80px] bg-card border-r border-border flex-col items-center py-4 gap-4 overflow-y-auto shrink-0 shadow-inner z-10 scrollbar-hide">
          <div className="flex flex-col gap-4 w-full items-center">
            <span className="text-[8px] font-black text-muted-foreground uppercase text-center px-1">Páginas</span>
            {pages.map((page, idx) => {
               const { rows, cols } = getGridConfig(parseInt(imagesPerPage), orientation);
               return (
                <div 
                  key={idx} 
                  className="relative w-12 aspect-[3/4] border border-border rounded-sm overflow-hidden bg-muted/30 shadow-sm transition-all hover:border-primary/50 group cursor-pointer shrink-0"
                  onClick={() => {
                    document.getElementById(`page-view-${idx}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                >
                  <div 
                    className="grid h-full gap-[1px] bg-muted/20"
                    style={{
                      gridTemplateRows: `repeat(${rows}, 1fr)`,
                      gridTemplateColumns: `repeat(${cols}, 1fr)`
                    }}
                  >
                    {page.map((img, i) => (
                      <img key={i} src={img.url} alt="" className="w-full h-full object-cover" />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
                  <div className="absolute top-0 left-0 bg-primary/90 backdrop-blur-sm text-[8px] font-black text-white px-1 min-w-[14px] text-center rounded-br-[2px] shadow-sm">
                    {idx + 1}
                  </div>
                </div>
              );
            })}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-12 h-12 border border-dashed border-border rounded-sm flex items-center justify-center hover:bg-muted hover:border-primary/50 transition-colors text-muted-foreground shrink-0"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </aside>

        <div className="flex-1 overflow-y-auto p-4 sm:p-12 bg-muted/30 scroll-smooth">
          <div className="max-w-6xl mx-auto h-full">
            {images.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[300px] w-full">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-[400px] h-full w-full border-4 border-dashed rounded-[3rem] transition-all cursor-pointer group bg-card shadow-xl",
                    isDragging ? "border-primary bg-primary/5 scale-[1.02]" : "border-primary/20 hover:border-primary/40"
                  )}
                >
                  <div className="p-8 bg-primary/10 rounded-full group-hover:scale-110 transition-transform">
                    <ImageIcon className="h-16 w-16 text-primary" />
                  </div>
                  <h3 className="mt-8 text-2xl font-headline font-black text-foreground uppercase tracking-tight">{t.imgToPdfTitle}</h3>
                  <p className="mt-2 text-muted-foreground font-medium">{t.dragDrop}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-16 items-center pb-40">
                {pages.map((pageImgs, pageIdx) => {
                  const nPerPage = parseInt(imagesPerPage);
                  const isSingle = nPerPage === 1;
                  const currentOrient = (isSingle && pageImgs[0].orientation) ? pageImgs[0].orientation : orientation;
                  const paperW = currentOrient === 'portrait' ? paper.width : paper.height;
                  const paperH = currentOrient === 'portrait' ? paper.height : paper.width;
                  const aspect = paperW / paperH;
                  const marginMm = margin * 10;
                  const marginX = (marginMm / paperW) * 100;
                  const marginY = (marginMm / paperH) * 100;

                  const { rows, cols } = getGridConfig(nPerPage, currentOrient);

                  return (
                    <div 
                      key={pageIdx} 
                      id={`page-view-${pageIdx}`}
                      className="relative w-full max-w-[500px] animate-fade-in group"
                    >
                      <div className="mb-4 flex items-center justify-between px-2">
                        <Badge variant="outline" className="bg-white/80 dark:bg-slate-800 border-primary/20 text-[10px] font-black px-3 py-1">
                          PÁGINA {pageIdx + 1} / {pages.length}
                        </Badge>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{currentOrient === 'portrait' ? 'Vertical' : 'Horizontal'}</span>
                      </div>

                      <div 
                        className="relative w-full bg-white dark:bg-slate-200 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] rounded-sm overflow-hidden border border-border"
                        style={{ aspectRatio: `${aspect}` }}
                      >
                        <div 
                          className="absolute inset-0 grid gap-2" 
                          style={{ 
                            padding: `${marginY}% ${marginX}%`,
                            gridTemplateRows: `repeat(${rows}, 1fr)`,
                            gridTemplateColumns: `repeat(${cols}, 1fr)`
                          }}
                        >
                          {pageImgs.map((img, i) => (
                            <div key={img.id} className="relative group/img w-full h-full bg-muted/5 rounded-[1px] overflow-hidden">
                              <img 
                                src={img.url} 
                                alt="" 
                                className={cn(
                                  "w-full h-full",
                                  fitMode === 'fit' ? 'object-contain' : 'object-cover'
                                )} 
                              />
                              
                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none" />
                              <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-auto">
                                <Button 
                                  size="icon" 
                                  variant="destructive" 
                                  className="h-6 w-6 rounded-md shadow-lg" 
                                  onClick={() => removeImage(img.originalId)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="absolute bottom-1 left-1 flex gap-1 opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-auto">
                                <Button 
                                  variant="secondary" 
                                  size="icon" 
                                  className="h-6 w-6 rounded-md shadow-lg bg-white/90"
                                  onClick={() => updateImageOrientation(img.originalId, img.orientation === 'landscape' ? 'portrait' : 'landscape')}
                                >
                                  {img.orientation === 'landscape' ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                                </Button>
                                <div className="bg-white/90 px-1.5 h-6 rounded-md flex items-center shadow-lg border border-border">
                                  <span className="text-[9px] font-black text-primary">QTY: {img.quantity}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <Button 
                  variant="outline" 
                  className="w-full max-w-[200px] aspect-square border-2 border-dashed border-primary/20 hover:border-primary/40 hover:bg-card text-primary/60 font-black gap-2 rounded-xl transition-all flex flex-col justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PlusCircle className="h-6 w-6" />
                  <span className="uppercase tracking-widest text-[10px]">{t.addImages}</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <aside className="hidden lg:block w-72 bg-card border-l border-border shadow-xl p-5 overflow-y-auto shrink-0 z-20">
          <div className="mb-6 bg-primary/5 p-4 rounded-2xl border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Gestionar Originales</span>
            </div>
            <div className="space-y-3">
              {images.map((img, idx) => (
                <div key={img.id} className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
                  <div className="w-8 h-8 rounded bg-muted overflow-hidden shrink-0">
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold truncate leading-none mb-1">{img.name}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(img.id, img.quantity - 1)} className="text-muted-foreground hover:text-primary"><X className="h-2.5 w-2.5 rotate-45"/></button>
                      <span className="text-[9px] font-black">{img.quantity}</span>
                      <button onClick={() => updateQuantity(img.id, img.quantity + 1)} className="text-muted-foreground hover:text-primary"><Plus className="h-2.5 w-2.5"/></button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button onClick={() => moveOriginalImage(idx, 'up')} disabled={idx === 0} className="text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowLeft className="h-3 w-3 rotate-90"/></button>
                    <button onClick={() => moveOriginalImage(idx, 'down')} disabled={idx === images.length - 1} className="text-muted-foreground hover:text-primary disabled:opacity-30"><ArrowRight className="h-3 w-3 rotate-90"/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {renderSettingsContent()}
        </aside>

        {expandedImagesList.length > 0 && (
          <div className="lg:hidden fixed bottom-6 left-6 md:left-[104px] right-24 z-[100] pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
            <Button 
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black gap-3 rounded-2xl shadow-2xl transition-all active:scale-95 text-sm uppercase tracking-widest border-4 border-white/10"
              onClick={exportPdf}
              disabled={isExporting}
            >
              {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {isExporting ? t.generating : t.export}
            </Button>
          </div>
        )}

        <div className="lg:hidden fixed bottom-6 right-6 z-[100] pointer-events-auto">
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <Button 
              size="icon" 
              className="h-14 w-14 rounded-full shadow-2xl bg-primary text-white hover:bg-primary/90 transition-all active:scale-95 border-4 border-white"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
            >
              <Settings2 className="h-6 w-6" />
            </Button>
            <SheetContent side="right" className="w-[85%] sm:w-[350px] p-5 bg-card backdrop-blur-xl shadow-2xl overflow-y-auto">
              <SheetHeader className="sr-only">
                <SheetTitle>Configuración</SheetTitle>
                <SheetDescription>Ajustes de exportación a PDF</SheetDescription>
              </SheetHeader>
              {renderSettingsContent()}
            </SheetContent>
          </Sheet>
        </div>
      </main>

      <input 
        type="file" 
        ref={fileInputRef} 
        multiple 
        accept="image/*" 
        onChange={handleFileSelect} 
        className="hidden" 
      />
    </div>
  );
}
