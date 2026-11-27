
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  Settings2,
  Plus,
  Trash2,
  PlusCircle,
  Check,
  ChevronDown,
  Palette,
  Square,
  RectangleVertical,
  Instagram,
  Download,
  Loader2,
  GripVertical,
  AlignLeft,
  AlignCenter,
  AlignRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import logo from "@/app/icono.png";
import { cn } from "@/lib/utils";

interface CollageImage {
  id: string;
  url: string;
  sectionId: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  file: File;
}

interface HeaderColumn {
  id: string;
  type: 'text' | 'image';
  content: string;
  align: 'left' | 'center' | 'right';
  width: number; // %
}

const ASPECT_RATIOS = [
  { id: '1:1', label: 'square', icon: Square, ratio: 1 },
  { id: '4:5', label: 'portrait45', icon: RectangleVertical, ratio: 4/5 },
  { id: '9:16', label: 'story916', icon: Instagram, ratio: 9/16 }
];

const COLORS = [
  '#ffffff', '#000000', '#f8fafc', '#fee2e2', '#fef3c7', '#ecfdf5', '#eff6ff', '#f5f3ff', '#fdf2f8'
];

const GRADIENTS = [
  { name: 'None', value: 'none' },
  { name: 'Sunrise', value: 'linear-gradient(to bottom, #ff9a9e 0%, #fecfef 100%)' },
  { name: 'Ocean', value: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)' },
  { name: 'Forest', value: 'linear-gradient(to right, #11998e, #38ef7d)' },
  { name: 'Luxury', value: 'linear-gradient(135deg, #232526 0%, #414345 100%)' }
];

export default function CollageEditor() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];
  const { toast } = useToast();

  // Configuración
  const [showConfig, setShowConfig] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [hasHeader, setHasHeader] = useState(false);
  const [numSections, setNumSections] = useState(1);
  
  // Diseño
  const [headerHeight, setHeaderHeight] = useState(12);
  const [headerColumns, setHeaderColumns] = useState<HeaderColumn[]>([]);
  const [sectionSplits, setSectionSplits] = useState<number[]>([50, 50, 50, 50]); 
  const [images, setImages] = useState<CollageImage[]>([]);
  const [activeSection, setActiveSection] = useState(1);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [spacing, setSpacing] = useState(0.2);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [activeGradient, setActiveGradient] = useState('none');
  
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startProject = () => {
    setShowConfig(false);
    if (hasHeader) {
      setHeaderColumns([
        { id: '1', type: 'text', content: 'TITULO COLLAGE', align: 'center', width: 100 }
      ]);
    }
  };

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>, sectionId: number) => {
    if (!e.target.files) return;
    const newImgs: CollageImage[] = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file),
      file,
      sectionId,
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    }));
    setImages(prev => [...prev, ...newImgs]);
    setActiveSection(sectionId);
    e.target.value = '';
  };

  const updateImageTransform = (id: string, updates: Partial<CollageImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const sectionsLayout = useMemo(() => {
    const layout = [];
    const baseTop = hasHeader ? headerHeight : 0;
    const availableH = 100 - baseTop;

    if (numSections === 1) {
      layout.push({ id: 1, top: baseTop, height: availableH });
    } else {
      let currentTop = baseTop;
      const totalShares = sectionSplits.slice(0, numSections).reduce((a, b) => a + b, 0);
      for (let i = 0; i < numSections; i++) {
        const share = sectionSplits[i] || 50;
        const hPercent = (share / totalShares) * availableH;
        layout.push({ id: i + 1, top: currentTop, height: hPercent });
        currentTop += hPercent;
      }
    }
    return layout;
  }, [hasHeader, headerHeight, numSections, sectionSplits]);

  const handleExport = async () => {
    if (images.length === 0) return;
    setIsExporting(true);

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const baseW = 1080;
      const baseH = baseW / aspectRatio.ratio;
      const exportScale = 2; // Multiplicador para 2K aprox
      canvas.width = baseW * exportScale;
      canvas.height = baseH * exportScale;

      // Importante: El factor de escala entre el UI (450px) y el Canvas (2160px)
      // para que los desplazamientos coincidan exactamente.
      const uiBaseWidth = 450; 
      const uiToCanvasRatio = canvas.width / uiBaseWidth;

      // 1. Fondo
      if (activeGradient !== 'none') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        if (activeGradient.includes('#ff9a9e')) { grad.addColorStop(0, '#ff9a9e'); grad.addColorStop(1, '#fecfef'); }
        else if (activeGradient.includes('#30cfd0')) { grad.addColorStop(0, '#30cfd0'); grad.addColorStop(1, '#330867'); }
        else if (activeGradient.includes('#11998e')) { grad.addColorStop(0, '#11998e'); grad.addColorStop(1, '#38ef7d'); }
        else if (activeGradient.includes('#232526')) { grad.addColorStop(0, '#232526'); grad.addColorStop(1, '#414345'); }
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = bgColor;
      }
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Cabecera
      if (hasHeader) {
        const hHeight = (headerHeight / 100) * canvas.height;
        for (const col of headerColumns) {
          if (col.type === 'text') {
            ctx.fillStyle = (bgColor === '#000000' || activeGradient.includes('#232526')) ? 'white' : 'black';
            ctx.font = `black ${45 * exportScale}px sans-serif`;
            ctx.textAlign = col.align;
            ctx.textBaseline = 'middle';
            const x = col.align === 'left' ? 40 * exportScale : col.align === 'right' ? canvas.width - (40 * exportScale) : canvas.width / 2;
            ctx.fillText(col.content.toUpperCase(), x, hHeight / 2);
          }
        }
      }

      // 3. Secciones e Imágenes
      for (const section of sectionsLayout) {
        const sImgs = images.filter(img => img.sectionId === section.id);
        if (sImgs.length === 0) continue;

        const sTop = (section.top / 100) * canvas.height;
        const sHeight = (section.height / 100) * canvas.height;
        
        // El espaciado se calcula en píxeles del canvas
        // En el UI es 'cm' (basado en 1cm = aprox 37px en pantalla), aquí escalamos
        const pad = (spacing * 37.8) * uiToCanvasRatio;

        const cols = sImgs.length > 1 ? 2 : 1;
        const rows = Math.ceil(sImgs.length / cols);
        const cellW = (canvas.width - (pad * (cols + 1))) / cols;
        const cellH = (sHeight - (pad * (rows + 1))) / rows;

        for (let i = 0; i < sImgs.length; i++) {
          const imgData = sImgs[i];
          const colIdx = i % cols;
          const rowIdx = Math.floor(i / cols);

          const xPos = pad + (colIdx * (cellW + pad));
          const yPos = sTop + pad + (rowIdx * (cellH + pad));

          const img = new window.Image();
          img.src = imgData.url;
          await new Promise(r => img.onload = r);

          ctx.save();
          ctx.beginPath();
          ctx.rect(xPos, yPos, cellW, cellH);
          ctx.clip();

          // Lógica 'Contain' exacta
          const imgAspect = img.width / img.height;
          const cellAspect = cellW / cellH;
          let drawW, drawH;

          if (imgAspect > cellAspect) {
            drawW = cellW;
            drawH = cellW / imgAspect;
          } else {
            drawH = cellH;
            drawW = cellH * imgAspect;
          }

          // Aplicar Zoom
          const finalW = drawW * imgData.zoom;
          const finalH = drawH * imgData.zoom;

          // Aplicar Desplazamiento escalado
          const offX = imgData.offsetX * uiToCanvasRatio;
          const offY = imgData.offsetY * uiToCanvasRatio;

          const drawX = xPos + (cellW - finalW) / 2 + offX;
          const drawY = yPos + (cellH - finalH) / 2 + offY;

          ctx.drawImage(img, drawX, drawY, finalW, finalH);
          ctx.restore();
        }
      }

      const link = document.createElement('a');
      link.download = `Collage_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.92);
      link.click();
      
      toast({ title: "Collage Exportado", description: "La imagen se ha guardado en tu dispositivo." });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error", description: "No se pudo generar la imagen final." });
    } finally {
      setIsExporting(false);
    }
  };

  if (!mounted) return null;

  const renderSectionContent = (isMobileView?: boolean) => (
    <div className={cn("space-y-6", isMobileView ? "p-4 pb-24" : "p-4")}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Square className="h-4 w-4 text-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.format}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map(item => (
            <Button 
              key={item.id}
              variant={aspectRatio.id === item.id ? 'default' : 'outline'}
              className="h-14 flex-col gap-1 rounded-xl"
              onClick={() => setAspectRatio(item)}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-[8px] font-black uppercase">{t[item.label as keyof typeof t]}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlignLeft className="h-4 w-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.header}</h2>
          </div>
          <Switch checked={hasHeader} onCheckedChange={setHasHeader} />
        </div>
        {hasHeader && (
          <div className="space-y-4 bg-muted/50 p-3 rounded-xl">
             <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Altura Cabecera</Label>
                <Slider value={[headerHeight]} onValueChange={v => setHeaderHeight(v[0])} min={5} max={30} />
             </div>
             {headerColumns.map((col, idx) => (
               <div key={col.id} className="space-y-2 pt-2 border-t">
                  <Input 
                    placeholder="Texto de cabecera..." 
                    value={col.content} 
                    onChange={e => {
                      const newCols = [...headerColumns];
                      newCols[idx].content = e.target.value;
                      setHeaderColumns(newCols);
                    }}
                    className="h-8 text-xs font-bold"
                  />
                  <div className="flex gap-1">
                    <Button size="icon" variant={col.align === 'left' ? 'default' : 'ghost'} className="h-7 w-7" onClick={() => {const c=[...headerColumns]; c[idx].align='left'; setHeaderColumns(c);}}><AlignLeft className="h-3 w-3"/></Button>
                    <Button size="icon" variant={col.align === 'center' ? 'default' : 'ghost'} className="h-7 w-7" onClick={() => {const c=[...headerColumns]; c[idx].align='center'; setHeaderColumns(c);}}><AlignCenter className="h-3 w-3"/></Button>
                    <Button size="icon" variant={col.align === 'right' ? 'default' : 'ghost'} className="h-7 w-7" onClick={() => {const c=[...headerColumns]; c[idx].align='right'; setHeaderColumns(c);}}><AlignRight className="h-3 w-3"/></Button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.sections}</h2>
        </div>
        <Select value={numSections.toString()} onValueChange={v => setNumSections(parseInt(v))}>
          <SelectTrigger className="h-9 font-bold rounded-xl bg-card border-2"><SelectValue /></SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()} className="font-bold">{n} {lang === 'es' ? 'Secciones' : 'Sections'}</SelectItem>)}
          </SelectContent>
        </Select>
        {numSections > 1 && (
          <div className="space-y-4 pt-2">
            {sectionSplits.slice(0, numSections).map((val, idx) => (
              <div key={idx} className="space-y-1">
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Tamaño Área {idx + 1}</Label>
                <Slider value={[val]} onValueChange={v => {
                  const newSplits = [...sectionSplits];
                  newSplits[idx] = v[0];
                  setSectionSplits(newSplits);
                }} min={10} max={90} />
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.background}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button key={c} className={cn("w-6 h-6 rounded-full border border-border transition-all active:scale-90", bgColor === c && "ring-2 ring-primary")} style={{ backgroundColor: c }} onClick={() => { setBgColor(c); setActiveGradient('none'); }} />
          ))}
        </div>
        <Select value={activeGradient} onValueChange={setActiveGradient}>
          <SelectTrigger className="h-9 font-bold rounded-xl bg-card border-2"><SelectValue placeholder="Degradados" /></SelectTrigger>
          <SelectContent>
            {GRADIENTS.map(g => <SelectItem key={g.name} value={g.value} className="font-bold">{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="space-y-2 pt-2">
          <div className="flex justify-between"><Label className="text-[9px] font-black uppercase text-muted-foreground">{t.spacing}</Label><span className="text-[10px] font-bold">{spacing} cm</span></div>
          <Slider value={[spacing]} onValueChange={v => setSpacing(v[0])} min={0} max={1} step={0.05} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background font-body overflow-hidden transition-colors duration-300">
      <header className="h-16 shrink-0 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="ghost" size="sm" className="gap-2 font-bold text-muted-foreground px-2"><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline text-xs">Inicio</span></Button></Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border bg-white dark:bg-slate-200"><Image src={logo} alt="Logo" fill className="object-contain" /></div>
            <h1 className="text-xl font-headline font-black tracking-tighter text-primary uppercase">{t.collageTitle}</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle /><LanguageSelector language={lang} setLanguage={setLang} />
          <Button className="hidden sm:flex bg-primary hover:bg-primary/90 text-white font-black gap-2 h-9 px-6 rounded-xl shadow-md transition-all active:scale-95 text-xs" onClick={handleExport} disabled={images.length === 0 || isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{isExporting ? "..." : t.exportJpg}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-12 bg-muted/30 flex flex-col items-center justify-start lg:justify-center relative">
          <div 
            id="collage-preview-container"
            className="relative bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden border border-border"
            style={{ 
              width: 'min(90vw, 450px)', 
              aspectRatio: `${aspectRatio.ratio}`,
              background: activeGradient !== 'none' ? activeGradient : bgColor
            }}
          >
            {/* Header Rendering */}
            {hasHeader && (
              <div 
                className="absolute top-0 left-0 w-full flex items-center px-4 overflow-hidden z-30"
                style={{ height: `${headerHeight}%` }}
              >
                {headerColumns.map(col => (
                  <div key={col.id} className={cn("flex-1", col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left')}>
                    <span className={cn("text-[11px] font-black uppercase tracking-widest leading-none", (bgColor === '#000000' || activeGradient.includes('#232526')) ? 'text-white' : 'text-foreground')}>{col.content}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Sections Rendering */}
            {sectionsLayout.map(section => {
              const sectionImages = images.filter(img => img.sectionId === section.id);
              const isActive = activeSection === section.id;
              
              return (
                <div 
                  key={section.id}
                  className={cn(
                    "absolute left-0 w-full transition-all cursor-pointer group",
                    isActive ? "ring-2 ring-primary ring-inset z-20" : "hover:bg-black/5"
                  )}
                  style={{ top: `${section.top}%`, height: `${section.height}%` }}
                  onClick={() => setActiveSection(section.id)}
                >
                  {sectionImages.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <PlusCircle className="h-6 w-6 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                      <span className="text-[7px] font-black uppercase text-muted-foreground/30 tracking-widest">{t.selectToEdit}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full relative" style={{ padding: `${spacing/2}cm` }}>
                      <div className="grid h-full gap-1" style={{ 
                        gridTemplateColumns: sectionImages.length > 1 ? `repeat(2, 1fr)` : '1fr',
                        gridTemplateRows: sectionImages.length > 2 ? `repeat(2, 1fr)` : '1fr'
                      }}>
                        {sectionImages.map(img => (
                          <div 
                            key={img.id} 
                            className={cn(
                              "relative overflow-hidden bg-black/5 rounded-sm group/img",
                              selectedImageId === img.id ? "ring-2 ring-accent z-10" : ""
                            )}
                            onClick={(e) => { e.stopPropagation(); setSelectedImageId(img.id); }}
                          >
                            <img 
                              src={img.url} 
                              alt=""
                              className="w-full h-full object-contain transition-transform select-none"
                              style={{ transform: `scale(${img.zoom}) translate(${img.offsetX}px, ${img.offsetY}px)` }}
                              draggable={false}
                            />
                            
                            <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors pointer-events-none" />
                            
                            {selectedImageId === img.id && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
                                <div className="bg-background/95 p-2 rounded-xl shadow-2xl flex flex-col gap-3 w-[80%] pointer-events-auto">
                                   <div className="flex items-center justify-between gap-4">
                                      <div className="flex flex-col"><span className="text-[7px] font-black uppercase text-muted-foreground">Zoom</span></div>
                                      <Slider value={[img.zoom]} min={1} max={3} step={0.01} onValueChange={v => updateImageTransform(img.id, { zoom: v[0] })} className="flex-1" />
                                   </div>
                                   <div className="grid grid-cols-2 gap-2">
                                      <Button size="icon" variant="secondary" className="h-8 w-full rounded-lg" onClick={(e) => { e.stopPropagation(); setSelectedImageId(null); }}><Check className="h-4 w-4"/></Button>
                                      <Button size="icon" variant="destructive" className="h-8 w-full rounded-lg" onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter(i => i.id !== img.id)); setSelectedImageId(null); }}><Trash2 className="h-4 w-4"/></Button>
                                   </div>
                                   <div className="flex items-center justify-center gap-2">
                                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateImageTransform(img.id, { offsetX: img.offsetX - 5 }); }}><AlignLeft className="h-3 w-3"/></Button>
                                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateImageTransform(img.id, { offsetY: img.offsetY - 5 }); }}><ChevronDown className="h-3 w-3 rotate-180"/></Button>
                                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateImageTransform(img.id, { offsetY: img.offsetY + 5 }); }}><ChevronDown className="h-3 w-3"/></Button>
                                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateImageTransform(img.id, { offsetX: img.offsetX + 5 }); }}><AlignRight className="h-3 w-3"/></Button>
                                   </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {isActive && !selectedImageId && (
                    <div className="absolute bottom-2 right-2 flex gap-2 z-40">
                      <Button size="icon" className="h-8 w-8 rounded-full shadow-lg bg-primary hover:bg-primary/90" onClick={(e) => { e.stopPropagation(); document.getElementById(`upload-${section.id}`)?.click(); }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <input type="file" id={`upload-${section.id}`} multiple accept="image/*" className="hidden" onChange={(e) => handleAddImages(e, section.id)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 bg-card/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-border shadow-xl animate-fade-in flex items-center gap-6">
              <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Área Activa</span><span className="text-xs font-black text-primary">Sección {activeSection}</span></div>
              <Separator orientation="vertical" className="h-8" />
              <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Total Fotos</span><span className="text-xs font-black text-foreground">{images.length}</span></div>
          </div>
        </div>

        <aside className="hidden lg:flex w-80 bg-card border-l border-border flex-col shrink-0 shadow-2xl z-20">
          <div className="flex-1 overflow-y-auto">{renderSectionContent()}</div>
          <div className="p-6 border-t bg-muted/50">
            <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs gap-3 transition-all active:scale-95" onClick={handleExport} disabled={images.length === 0 || isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{isExporting ? "Generando..." : t.exportJpg}
            </Button>
          </div>
        </aside>

        <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[100] flex gap-3 pointer-events-auto justify-end">
          {images.length > 0 && (
            <div className="flex-1">
              <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-sm gap-3 border-4 border-white/10" onClick={handleExport} disabled={isExporting}>{isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{isExporting ? "..." : "Exportar"}</Button>
            </div>
          )}
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <Button size="icon" className="h-14 w-14 shrink-0 rounded-full shadow-2xl bg-slate-800 text-white hover:bg-slate-900 transition-all active:scale-95 border-4 border-white" onClick={() => setIsMenuOpen(true)}>
              <Settings2 className="h-6 w-6" />
            </Button>
            <SheetContent side="right" className="w-[85%] sm:w-[400px] p-0 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col z-[200]" onOpenAutoFocus={(e) => e.preventDefault()}>
              <SheetHeader className="sr-only"><SheetTitle>Ajustes</SheetTitle></SheetHeader>
              <div className="p-4 bg-primary/5 border-b shrink-0"><Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest gap-2" onClick={handleExport} disabled={images.length === 0 || isExporting}>{isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{isExporting ? "..." : t.exportJpg}</Button></div>
              <div className="flex-1 overflow-y-auto relative">{renderSectionContent(true)}</div>
            </SheetContent>
          </Sheet>
        </div>
      </main>

      {/* Onboarding Wizard */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="space-y-3">
             <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2"><Square className="h-6 w-6 text-primary" /></div>
             <DialogTitle className="text-2xl font-black text-center uppercase tracking-tighter">Configuración Rápida</DialogTitle>
             <DialogDescription className="text-center font-medium">Define el estilo base para tu nuevo mosaico profesional.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
             <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Formato del Lienzo</Label>
                <div className="grid grid-cols-3 gap-2">
                  {ASPECT_RATIOS.map(item => (
                    <Button key={item.id} variant={aspectRatio.id === item.id ? 'default' : 'outline'} className="h-16 flex-col gap-1 rounded-2xl" onClick={() => setAspectRatio(item)}>
                      <item.icon className="h-5 w-5" />
                      <span className="text-[8px] font-black uppercase">{t[item.label as keyof typeof t]}</span>
                    </Button>
                  ))}
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">¿Llevará Cabecera?</Label>
                   <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-xl justify-between">
                      <span className="text-xs font-bold">{hasHeader ? 'SÍ' : 'NO'}</span>
                      <Switch checked={hasHeader} onCheckedChange={setHasHeader} />
                   </div>
                </div>
                <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Nº de Áreas</Label>
                   <Select value={numSections.toString()} onValueChange={v => setNumSections(parseInt(v))}>
                      <SelectTrigger className="h-10 font-black rounded-xl bg-muted/50 border-none"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()} className="font-bold">{n} Secciones</SelectItem>)}
                      </SelectContent>
                   </Select>
                </div>
             </div>
          </div>
          <DialogFooter>
             <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 text-md uppercase tracking-widest gap-2" onClick={startProject}>Empezar Diseño <Check className="h-5 w-5" /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
