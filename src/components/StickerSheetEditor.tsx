"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  StickyNote, 
  FileDown, 
  Loader2, 
  Settings2,
  RefreshCcw,
  Maximize2,
  Ruler,
  Zap,
  Crop,
  Check,
  Plus,
  Minus,
  Layout,
  Scissors,
  FileText
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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import { ImageUploader } from "./ImageUploader";
import logo from "@/app/icono.png";
import { cn } from "@/lib/utils";

const PAPER_DIMENSIONS: Record<string, { width: number; height: number; format: string }> = {
  'Carta': { width: 215.9, height: 279.4, format: 'letter' },
  'A4': { width: 210, height: 297, format: 'a4' },
  'A3': { width: 297, height: 420, format: 'a3' },
  'Oficio (Legal 35.5cm)': { width: 215.9, height: 355.6, format: 'legal' },
  'Folio (33cm)': { width: 215.9, height: 330.2, format: 'folio' },
  'Oficio (34cm)': { width: 216, height: 340, format: 'oficio' },
  'Extra Oficio (38cm)': { width: 216, height: 380, format: 'extra-oficio' }
};

export default function StickerSheetEditor() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];
  const { toast } = useToast();

  const [image, setImage] = useState<{ url: string; file: File; width: number; height: number } | null>(null);
  const [isCropping, setIsCropping] = useState(true);
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 }); 
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const [stickerWidth, setStickerWidth] = useState(5); 
  const [stickerHeight, setStickerHeight] = useState(5); 
  const [spacing, setSpacing] = useState(0.2); // cm
  const [paperSize, setPaperSize] = useState('Carta');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginV, setMarginV] = useState(0.7); 
  const [marginH, setMarginH] = useState(0.5); 
  
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const cropAspectRatio = useMemo(() => {
    if (!image) return 1;
    const w = (crop.width / 100) * image.width;
    const h = (crop.height / 100) * image.height;
    return w / h;
  }, [image, crop]);

  const updateSizes = (val: number, source: 'w' | 'h') => {
    const num = Math.max(0.1, Math.round(val * 100) / 100);
    if (source === 'w') {
      setStickerWidth(num);
      setStickerHeight(parseFloat((num / cropAspectRatio).toFixed(2)));
    } else {
      setStickerHeight(num);
      setStickerWidth(parseFloat((num * cropAspectRatio).toFixed(2)));
    }
  };

  const paper = useMemo(() => {
    const p = PAPER_DIMENSIONS[paperSize];
    return orientation === 'portrait' 
      ? { width: Math.min(p.width, p.height), height: Math.max(p.width, p.height), format: p.format }
      : { width: Math.max(p.width, p.height), height: Math.min(p.width, p.height), format: p.format };
  }, [paperSize, orientation]);

  const stats = useMemo(() => {
    const printableW = paper.width - (marginH * 20);
    const printableH = paper.height - (marginV * 20);
    const stickerW_mm = stickerWidth * 10;
    const stickerH_mm = stickerHeight * 10;
    const spacing_mm = spacing * 10;

    if (stickerW_mm <= 0 || stickerH_mm <= 0) return { cols: 0, rows: 0, total: 0, totalW_mm: 0, totalH_mm: 0 };

    const cols = Math.floor((printableW + spacing_mm) / (stickerW_mm + spacing_mm));
    const rows = Math.floor((printableH + spacing_mm) / (stickerH_mm + spacing_mm));

    return {
      cols: Math.max(0, cols),
      rows: Math.max(0, rows),
      total: Math.max(0, cols * rows),
      totalW_mm: cols > 0 ? cols * stickerW_mm + (cols - 1) * spacing_mm : 0,
      totalH_mm: rows > 0 ? rows * stickerH_mm + (rows - 1) * spacing_mm : 0
    };
  }, [paper, stickerWidth, stickerHeight, spacing, marginV, marginH]);

  const handleImageUpload = (file: File, url: string) => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage({ url, file, width: img.width, height: img.height });
      setIsCropping(true);
      setCrop({ x: 10, y: 10, width: 80, height: 80 });
      const initialAspect = img.width / img.height;
      setStickerWidth(5);
      setStickerHeight(parseFloat((5 / initialAspect).toFixed(2)));
    };
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragType(type);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartCrop({ ...crop });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragType) return;

    const container = e.currentTarget.getBoundingClientRect();
    const dx = ((e.clientX - startPos.x) / container.width) * 100;
    const dy = ((e.clientY - startPos.y) / container.height) * 100;

    setCrop(prev => {
      let next = { ...prev };
      if (dragType === 'move') {
        next.x = Math.min(Math.max(0, startCrop.x + dx), 100 - startCrop.width);
        next.y = Math.min(Math.max(0, startCrop.y + dy), 100 - startCrop.height);
      } else {
        if (dragType.includes('n')) {
          const newY = Math.max(0, Math.min(startCrop.y + dy, startCrop.y + startCrop.height - 5));
          next.height = startCrop.height - (newY - startCrop.y);
          next.y = newY;
        }
        if (dragType.includes('s')) {
          next.height = Math.max(5, Math.min(startCrop.height + dy, 100 - startCrop.y));
        }
        if (dragType.includes('w')) {
          const newX = Math.max(0, Math.min(startCrop.x + dx, startCrop.x + startCrop.width - 5));
          next.width = startCrop.width - (newX - startCrop.x);
          next.x = newX;
        }
        if (dragType.includes('e')) {
          next.width = Math.max(5, Math.min(startCrop.width + dx, 100 - startCrop.x));
        }
      }
      return next;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const exportPdf = async () => {
    if (!image || stats.total === 0) return;
    setIsExporting(true);

    try {
      const img = new window.Image();
      img.src = image.url;
      await new Promise((resolve) => img.onload = resolve);

      const pdf = new jsPDF({
        orientation: orientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: paper.format as any
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas error");

      const sx = (crop.x / 100) * image.width;
      const sy = (crop.y / 100) * image.height;
      const sw = (crop.width / 100) * image.width;
      const sh = (crop.height / 100) * image.height;

      const targetDpi = 300;
      const mmToPx = targetDpi / 25.4;
      const dw = (stickerWidth * 10) * mmToPx;
      const dh = (stickerHeight * 10) * mmToPx;

      canvas.width = dw;
      canvas.height = dh;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, dw, dh);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);

      const stickerDataUrl = canvas.toDataURL('image/png');
      const offsetX = (paper.width - stats.totalW_mm) / 2;
      const offsetY = (paper.height - stats.totalH_mm) / 2;
      const stepW = (stickerWidth + spacing) * 10;
      const stepH = (stickerHeight + spacing) * 10;

      for (let r = 0; r < stats.rows; r++) {
        for (let c = 0; c < stats.cols; c++) {
          pdf.addImage(
            stickerDataUrl, 
            'PNG', 
            offsetX + (c * stepW), 
            offsetY + (r * stepH), 
            stickerWidth * 10, 
            stickerHeight * 10
          );
        }
      }

      pdf.save(`MultiPrint-Stickers-${Date.now()}.pdf`);
      toast({ title: t.export, description: "La plancha de stickers se ha descargado correctamente." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al generar el PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  const renderSettings = (isMobile?: boolean) => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-yellow-500" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.gridSettings}</h2>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 relative z-10">
            <div className="space-y-1">
               <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">ANCHO</Label>
               <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-2 rounded-lg bg-white" onClick={() => updateSizes(stickerWidth - 0.1, 'w')}><Minus className="h-3 w-3"/></Button>
                  <Input 
                    type="number" 
                    value={stickerWidth} 
                    onChange={(e) => updateSizes(parseFloat(e.target.value), 'w')}
                    className="h-8 flex-1 min-w-0 font-black text-xs bg-muted/20 border-2 rounded-lg text-center text-yellow-600 shadow-inner px-1"
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-2 rounded-lg bg-white" onClick={() => updateSizes(stickerWidth + 0.1, 'w')}><Plus className="h-3 w-3"/></Button>
               </div>
            </div>
            <div className="space-y-1">
               <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">ALTO</Label>
               <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-2 rounded-lg bg-white" onClick={() => updateSizes(stickerHeight - 0.1, 'h')}><Minus className="h-3 w-3"/></Button>
                  <Input 
                    type="number" 
                    value={stickerHeight} 
                    onChange={(e) => updateSizes(parseFloat(e.target.value), 'h')}
                    className="h-8 flex-1 min-w-0 font-black text-xs bg-muted/20 border-2 rounded-lg text-center text-yellow-600 shadow-inner px-1"
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-2 rounded-lg bg-white" onClick={() => updateSizes(stickerHeight + 0.1, 'h')}><Plus className="h-3 w-3"/></Button>
               </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">AJUSTAR TAMAÑO</Label>
             <Slider 
                value={[stickerWidth]} 
                onValueChange={(v) => updateSizes(v[0], 'w')} 
                min={0.5} 
                max={20} 
                step={0.01} 
              />
          </div>

          <Separator className="opacity-50" />

          <div className="space-y-2">
             <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">SEPARACIÓN (GAP CM)</Label>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-2 rounded-lg bg-white" onClick={() => setSpacing(Math.max(0, parseFloat((spacing - 0.05).toFixed(2))))}><Minus className="h-3 w-3"/></Button>
                <Input 
                  type="number" 
                  value={spacing} 
                  onChange={(e) => setSpacing(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="h-8 font-black text-xs bg-muted/20 border-2 rounded-lg text-center text-yellow-600"
                />
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0 border-2 rounded-lg bg-white" onClick={() => setSpacing(parseFloat((spacing + 0.05).toFixed(2)))}><Plus className="h-3 w-3"/></Button>
             </div>
          </div>
        </div>

        <Separator className="opacity-50" />

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.paperSize}</Label>
            <Select value={paperSize} onValueChange={setPaperSize}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-2 rounded-lg bg-white">
                <span className="truncate">{paperSize}</span>
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PAPER_DIMENSIONS).map(size => (
                  <SelectItem key={size} value={size} className="text-xs font-bold">{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.orientation}</Label>
            <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-2 rounded-lg bg-white">
                <span className="truncate">{orientation === 'portrait' ? t.portrait : t.landscape}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait" className="text-xs font-bold">{t.portrait}</SelectItem>
                <SelectItem value="landscape" className="text-xs font-bold">{t.landscape}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.marginsVertical}</Label>
              <span className="text-[9px] font-black text-yellow-600">{marginV} cm</span>
            </div>
            <Slider value={[marginV]} onValueChange={(v) => setMarginV(v[0])} min={0} max={5} step={0.1} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{t.marginsHorizontal}</Label>
              <span className="text-[9px] font-black text-yellow-600">{marginH} cm</span>
            </div>
            <Slider value={[marginH]} onValueChange={(v) => setMarginH(v[0])} min={0} max={5} step={0.1} />
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-background font-body overflow-hidden transition-colors duration-300">
      <header className="h-16 shrink-0 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 z-50 shadow-sm">
        <div className="flex items-center gap-1 sm:gap-4 overflow-hidden">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 font-bold text-muted-foreground px-1 sm:px-2">
              <ChevronLeft className="h-4 w-4" /> 
              <span className="hidden sm:inline text-xs">Inicio</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="w-7 h-7 sm:w-8 sm:h-8 relative rounded-lg overflow-hidden border bg-white dark:bg-slate-200 shrink-0">
              <Image src={logo} alt="Logo" fill className="object-contain" />
            </div>
            <h1 className="text-xs xs:text-sm sm:text-xl font-headline font-black tracking-tighter text-yellow-600 uppercase truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none shrink-0">
              {t.stickerSheetTitle}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <ThemeToggle />
          <LanguageSelector language={lang} setLanguage={setLang} />
          <Button 
            className="hidden sm:flex bg-yellow-600 hover:bg-yellow-700 text-white font-black gap-2 h-9 px-6 rounded-xl shadow-md transition-all active:scale-95 text-xs" 
            onClick={exportPdf} 
            disabled={!image || isExporting || stats.total === 0}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {isExporting ? "..." : t.export}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/30 flex flex-col items-center justify-start lg:justify-center">
          {!image ? (
            <div className="max-w-lg w-full">
              <ImageUploader 
                onImageUpload={handleImageUpload} 
                language={lang} 
                t={t} 
              />
            </div>
          ) : isCropping ? (
            <div className="w-full max-w-2xl space-y-4 flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="text-center space-y-1">
                <h2 className="text-xl font-black uppercase tracking-tight text-foreground">{t.cropSticker}</h2>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Define el área de impresión</p>
              </div>
              
              <div 
                className="relative bg-black rounded-3xl overflow-hidden shadow-2xl group border-4 border-card cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <img 
                  src={image.url} 
                  alt="To Crop" 
                  className="max-h-[55vh] object-contain select-none"
                  draggable={false}
                />
                <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                
                <div 
                  className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move"
                  style={{
                    left: `${crop.x}%`,
                    top: `${crop.y}%`,
                    width: `${crop.width}%`,
                    height: `${crop.height}%`
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                >
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border-[0.5px] border-white" />
                    ))}
                  </div>

                  <div className="absolute -top-2.5 -left-2.5 w-6 h-6 bg-white rounded-full border-2 border-yellow-600 cursor-nw-resize z-50 shadow-lg flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, 'nw')}><div className="w-1 h-1 bg-yellow-600 rounded-full"/></div>
                  <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-white rounded-full border-2 border-yellow-600 cursor-ne-resize z-50 shadow-lg flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, 'ne')}><div className="w-1 h-1 bg-yellow-600 rounded-full"/></div>
                  <div className="absolute -bottom-2.5 -left-2.5 w-6 h-6 bg-white rounded-full border-2 border-yellow-600 cursor-sw-resize z-50 shadow-lg flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, 'sw')}><div className="w-1 h-1 bg-yellow-600 rounded-full"/></div>
                  <div className="absolute -bottom-2.5 -right-2.5 w-6 h-6 bg-white rounded-full border-2 border-yellow-600 cursor-se-resize z-50 shadow-lg flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, 'se')}><div className="w-1 h-1 bg-yellow-600 rounded-full"/></div>
                </div>
              </div>

              <Button 
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-black h-11 px-10 rounded-2xl shadow-xl gap-2 text-xs uppercase tracking-widest transition-all active:scale-95"
                onClick={() => {
                  setIsCropping(false);
                  const finalAspect = (crop.width / 100 * image.width) / ((crop.height / 100 * image.height));
                  setStickerHeight(parseFloat((stickerWidth / finalAspect).toFixed(2)));
                }}
              >
                <Check className="h-5 w-5" />
                {t.confirmCrop}
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center lg:items-start justify-center gap-4 md:gap-8 pb-20 sm:pb-0">
              
              <div className="flex flex-col gap-3 w-full max-w-[360px] animate-in slide-in-from-left-10 duration-500">
                <div className="bg-card p-4 rounded-[2rem] border-4 border-card shadow-2xl space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />

                  <div className="flex items-center justify-between relative z-10 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                        <Maximize2 className="h-4 w-4 text-yellow-600" />
                      </div>
                      <h3 className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Dimensiones</h3>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 text-yellow-600 font-black text-[9px] uppercase gap-1 hover:bg-yellow-50 rounded-lg px-2"
                      onClick={() => setIsCropping(true)}
                    >
                      <Crop className="h-3 w-3" />
                      Recortar
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 relative z-10">
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Ancho</Label>
                      <div className="flex items-center gap-1">
                         <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg shrink-0 border-2 shadow-sm bg-white" onClick={() => updateSizes(stickerWidth - 0.1, 'w')}><Minus className="h-3 w-3"/></Button>
                         <Input 
                           type="number" 
                           value={stickerWidth} 
                           onChange={(e) => updateSizes(parseFloat(e.target.value), 'w')}
                           className="h-8 md:h-9 flex-1 min-w-0 font-black text-xs md:text-sm bg-muted/20 border-2 rounded-lg text-center text-yellow-600 shadow-inner px-1"
                         />
                         <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg shrink-0 border-2 shadow-sm bg-white" onClick={() => updateSizes(stickerWidth + 0.1, 'w')}><Plus className="h-3 w-3"/></Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest pl-1">Alto</Label>
                      <div className="flex items-center gap-1">
                         <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg shrink-0 border-2 shadow-sm bg-white" onClick={() => updateSizes(stickerHeight - 0.1, 'h')}><Minus className="h-3 w-3"/></Button>
                         <Input 
                           type="number" 
                           value={stickerHeight} 
                           onChange={(e) => updateSizes(parseFloat(e.target.value), 'h')}
                           className="h-8 md:h-9 flex-1 min-w-0 font-black text-xs md:text-sm bg-muted/20 border-2 rounded-lg text-center text-yellow-600 shadow-inner px-1"
                         />
                         <Button variant="outline" size="icon" className="h-8 w-8 md:h-9 md:w-9 rounded-lg shrink-0 border-2 shadow-sm bg-white" onClick={() => updateSizes(stickerHeight + 0.1, 'h')}><Plus className="h-3 w-3"/></Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 relative z-10 pt-1">
                    <Slider 
                      value={[stickerWidth]} 
                      onValueChange={(v) => updateSizes(v[0], 'w')} 
                      min={0.5} 
                      max={20} 
                      step={0.01} 
                      className="py-1"
                    />
                  </div>

                  <div className="bg-[#FFFDF0] p-3 rounded-2xl border border-yellow-100/50 shadow-inner relative z-10">
                    <div className="grid grid-cols-2 gap-2 divide-x divide-yellow-100/50">
                      <div className="flex flex-col items-center justify-center text-center">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Stickers por Hoja</span>
                        <span className="text-xl md:text-2xl font-black text-[#D4AF37] tracking-tighter flex items-center gap-1">
                          {stats.cols} <span className="text-yellow-400 text-base">×</span> {stats.rows}
                        </span>
                      </div>
                      <div className="flex flex-col items-center justify-center text-center pl-2">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">Stickers Totales</span>
                        <span className="text-2xl md:text-3xl font-black text-foreground tracking-tighter">{stats.total}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 relative z-10">
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-xl border border-border shadow-sm">
                      <span className="text-[10px] font-black text-foreground uppercase tracking-tight truncate">{paperSize}</span>
                      <Badge variant="secondary" className="text-[8px] font-black uppercase px-2 py-0.5 bg-white shadow-sm border border-border/10 shrink-0">
                        {orientation === 'portrait' ? 'Vertical' : 'Horizontal'}
                      </Badge>
                    </div>
                  </div>

                  <div className="pt-1 relative z-10">
                    <Button 
                      variant="outline" 
                      className="w-full h-9 rounded-xl border-2 font-black uppercase text-[9px] tracking-widest gap-2 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 transition-all border-dashed border-muted-foreground/30"
                      onClick={() => setImage(null)}
                    >
                      <RefreshCcw className="h-3.5 w-3.5" />
                      {t.changeSticker}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center animate-in slide-in-from-right-10 duration-500 w-full lg:w-auto">
                <div 
                  className="relative bg-white dark:bg-slate-200 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] rounded-sm overflow-hidden border border-border shrink-0 origin-top transform scale-75 sm:scale-100"
                  style={{
                    width: '320px',
                    aspectRatio: `${paper.width} / ${paper.height}`
                  }}
                >
                  <div 
                    className="absolute inset-0"
                    style={{
                      padding: `${(marginV / paper.height) * 100}% ${(marginH / paper.width) * 100}%`
                    }}
                  >
                    <div 
                      className="w-full h-full grid content-center justify-center"
                      style={{
                        gridTemplateColumns: `repeat(${stats.cols}, 1fr)`,
                        gridTemplateRows: `repeat(${stats.rows}, 1fr)`,
                        gap: `${(spacing / Math.max(paper.width, paper.height)) * 100}%`
                      }}
                    >
                      {Array.from({ length: stats.total }).map((_, i) => (
                        <div 
                          key={i} 
                          className="bg-muted/10 border-[0.5px] border-black/5 overflow-hidden"
                          style={{
                            aspectRatio: `${stickerWidth} / ${stickerHeight}`
                          }}
                        >
                          <div className="w-full h-full relative overflow-hidden">
                            <img 
                              src={image.url}
                              alt=""
                              className="absolute max-w-none"
                              style={{
                                width: `${(100 / crop.width) * 100}%`,
                                height: `${(100 / crop.height) * 100}%`,
                                left: `-${(crop.x / crop.width) * 100}%`,
                                top: `-${(crop.y / crop.height) * 100}%`,
                              }}
                              draggable={false}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-2 lg:mt-6 text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] bg-white px-3 py-1 rounded-full shadow-sm border border-border/40">
                  Vista Previa Técnica
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="hidden lg:flex w-72 bg-card border-l border-border flex-col shrink-0 shadow-2xl z-20">
          <div className="flex-1 overflow-y-auto p-5">
            {renderSettings()}
          </div>
          {image && !isCropping && (
            <div className="p-5 border-t bg-muted/50">
              <Button 
                className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white font-black rounded-xl shadow-xl shadow-yellow-600/20 text-xs gap-3 transition-all active:scale-95"
                onClick={exportPdf}
                disabled={isExporting || stats.total === 0}
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {isExporting ? "Generando..." : t.export}
              </Button>
            </div>
          )}
        </aside>

        {image && !isCropping && (
          <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100] flex gap-3 pointer-events-auto">
            <div className="flex-1">
              <Button 
                className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white font-black rounded-2xl shadow-xl shadow-yellow-600/20 uppercase tracking-widest text-xs gap-3 border-4 border-white/10"
                onClick={exportPdf}
                disabled={isExporting || stats.total === 0}
              >
                {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-4 w-4" />}
                {isExporting ? "..." : t.export}
              </Button>
            </div>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <Button 
                size="icon" 
                className="h-12 w-12 shrink-0 rounded-full shadow-2xl bg-slate-800 text-white hover:bg-slate-900 transition-all active:scale-95 border-4 border-white"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
              >
                <Settings2 className="h-5 w-5" />
              </Button>
              <SheetContent 
                side="right" 
                className="w-[85%] sm:w-[350px] p-5 bg-card backdrop-blur-xl shadow-2xl overflow-y-auto"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Configuración de Stickers</SheetTitle>
                  <SheetDescription>Ajustes de dimensiones y papel</SheetDescription>
                </SheetHeader>
                {renderSettings(true)}
              </SheetContent>
            </Sheet>
          </div>
        )}
      </main>
    </div>
  );
}
