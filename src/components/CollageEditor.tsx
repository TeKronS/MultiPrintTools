
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  Settings2,
  RefreshCcw,
  Plus,
  Minus,
  Trash2,
  PlusCircle,
  ImageIcon,
  Layout,
  Check,
  RotateCcw,
  Info,
  ChevronDown,
  Palette,
  Type,
  Square,
  RectangleVertical,
  Instagram,
  Download,
  Loader2,
  GripVertical
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import logo from "@/app/icono.png";
import { cn } from "@/lib/utils";

// Lógica de empaquetado para collage: Intenta llenar un área dada con N imágenes
class CollagePacker {
  width: number;
  height: number;
  spacing: number;
  freeRects: { x: number; y: number; w: number; h: number }[];

  constructor(w: number, h: number, spacing: number) {
    this.width = w;
    this.height = h;
    this.spacing = spacing;
    this.freeRects = [{ x: 0, y: 0, w: w, h: h }];
  }

  // A diferencia de la plancha de stickers, aquí queremos que la foto se estire/ajuste a un hueco
  // Por lo que buscamos el mejor rectángulo libre y lo dividimos
  pack() {
    if (this.freeRects.length === 0) return null;
    
    // Tomamos el rectángulo más grande disponible
    const bestIdx = this.freeRects.reduce((prev, curr, idx, arr) => 
      (curr.w * curr.h > arr[prev].w * arr[prev].h) ? idx : prev, 0);
    
    const rect = this.freeRects.splice(bestIdx, 1)[0];
    
    // Para collage, dividimos el rectángulo en dos si hay espacio, o lo tomamos entero
    // Aquí implementamos una lógica de "llenado" secuencial simple
    return rect;
  }
}

interface CollageImage {
  id: string;
  url: string;
  sectionId: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
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

  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]);
  const [hasHeader, setHasHeader] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(15); // % de la altura total
  const [numSections, setNumSections] = useState(1);
  const [sectionSplits, setSectionSplits] = useState<number[]>([50]); // % de división entre secciones
  const [images, setImages] = useState<CollageImage[]>([]);
  const [activeSection, setActiveSection] = useState(1);
  const [spacing, setSpacing] = useState(0.5);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [activeGradient, setActiveGradient] = useState('none');
  
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>, sectionId: number) => {
    if (!e.target.files) return;
    const newImgs: CollageImage[] = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file),
      sectionId,
      zoom: 1,
      offsetX: 0,
      offsetY: 0
    }));
    setImages(prev => [...prev, ...newImgs]);
    e.target.value = '';
  };

  const clearSection = (sectionId: number) => {
    setImages(prev => prev.filter(img => img.sectionId !== sectionId));
  };

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const updateImageTransform = (id: string, updates: Partial<CollageImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const handleExport = async () => {
    setIsExporting(true);
    // Simulación de exportación para MVP
    setTimeout(() => {
      setIsExporting(false);
      toast({ title: "Collage Exportado", description: "La imagen se ha generado en alta resolución." });
    }, 1500);
  };

  // Cálculos de Layout
  const sectionsLayout = useMemo(() => {
    const layout = [];
    const baseTop = hasHeader ? headerHeight : 0;
    const remainingHeight = 100 - baseTop;

    if (numSections === 1) {
      layout.push({ id: 1, top: baseTop, height: remainingHeight });
    } else {
      let currentTop = baseTop;
      for (let i = 0; i < numSections; i++) {
        const h = (i === numSections - 1) 
          ? (100 - currentTop) 
          : (sectionSplits[i] || 50) * (remainingHeight / 100);
        layout.push({ id: i + 1, top: currentTop, height: h });
        currentTop += h;
      }
    }
    return layout;
  }, [hasHeader, headerHeight, numSections, sectionSplits]);

  if (!mounted) return null;

  const renderSectionContent = (isMobileView?: boolean) => (
    <div className={cn("space-y-6", isMobileView ? "p-4 pb-24" : "p-4")}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-primary" />
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
            <Type className="h-4 w-4 text-primary" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.header}</h2>
          </div>
          <Switch checked={hasHeader} onCheckedChange={setHasHeader} />
        </div>
        {hasHeader && (
          <div className="space-y-2">
            <div className="flex justify-between"><Label className="text-[9px] font-black uppercase text-muted-foreground">Altura</Label><span className="text-[10px] font-bold">{headerHeight}%</span></div>
            <Slider value={[headerHeight]} onValueChange={v => setHeaderHeight(v[0])} min={5} max={30} step={1} />
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-primary" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.sections}</h2>
        </div>
        <div className="flex items-center gap-4">
          <Select value={numSections.toString()} onValueChange={v => setNumSections(parseInt(v))}>
            <SelectTrigger className="h-9 font-bold rounded-xl bg-card border-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map(n => <SelectItem key={n} value={n.toString()} className="font-bold">{n} {lang === 'es' ? 'Áreas' : 'Areas'}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {numSections > 1 && (
          <div className="space-y-4 pt-2">
            {sectionSplits.slice(0, numSections - 1).map((val, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between"><Label className="text-[9px] font-black uppercase text-muted-foreground">División {idx + 1}-{idx + 2}</Label></div>
                <Slider value={[val]} onValueChange={v => {
                  const newSplits = [...sectionSplits];
                  newSplits[idx] = v[0];
                  setSectionSplits(newSplits);
                }} min={10} max={90} step={1} />
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
            <button 
              key={c} 
              className={cn("w-6 h-6 rounded-full border border-border transition-transform active:scale-90", bgColor === c && "ring-2 ring-primary")}
              style={{ backgroundColor: c }}
              onClick={() => { setBgColor(c); setActiveGradient('none'); }}
            />
          ))}
        </div>
        <Select value={activeGradient} onValueChange={setActiveGradient}>
          <SelectTrigger className="h-9 font-bold rounded-xl bg-card border-2">
            <SelectValue placeholder="Degradados" />
          </SelectTrigger>
          <SelectContent>
            {GRADIENTS.map(g => <SelectItem key={g.name} value={g.value} className="font-bold">{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="space-y-2 pt-2">
          <div className="flex justify-between"><Label className="text-[9px] font-black uppercase text-muted-foreground">{t.spacing}</Label><span className="text-[10px] font-bold">{spacing} cm</span></div>
          <Slider value={[spacing]} onValueChange={v => setSpacing(v[0])} min={0} max={2} step={0.1} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background font-body overflow-hidden transition-colors duration-300">
      <header className="h-16 shrink-0 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-50 shadow-sm">
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
            className="relative bg-white shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] rounded-sm overflow-hidden border border-border"
            style={{ 
              width: 'min(90vw, 450px)', 
              aspectRatio: `${aspectRatio.ratio}`,
              background: activeGradient !== 'none' ? activeGradient : bgColor
            }}
          >
            {/* Renderizado de Cabecera */}
            {hasHeader && (
              <div 
                className="absolute top-0 left-0 w-full bg-white/10 flex items-center justify-center border-b border-black/5"
                style={{ height: `${headerHeight}%` }}
              >
                <span className="text-[10px] font-black uppercase text-black/20 tracking-[0.3em]">Cabecera</span>
              </div>
            )}

            {/* Renderizado de Secciones */}
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
                  {/* Si no hay fotos, mostrar prompt */}
                  {sectionImages.length === 0 ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                      <PlusCircle className="h-6 w-6 text-muted-foreground/40 group-hover:scale-110 transition-transform" />
                      <span className="text-[7px] font-black uppercase text-muted-foreground/40 tracking-widest">{t.selectToEdit}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full relative" style={{ padding: `${spacing/2}cm` }}>
                      <div className="grid h-full gap-1" style={{ 
                        gridTemplateColumns: sectionImages.length > 1 ? `repeat(2, 1fr)` : '1fr',
                        gridTemplateRows: sectionImages.length > 2 ? `repeat(2, 1fr)` : '1fr'
                      }}>
                        {sectionImages.map(img => (
                          <div key={img.id} className="relative overflow-hidden bg-black/5 rounded-sm">
                            <img 
                              src={img.url} 
                              className="w-full h-full object-cover transition-transform"
                              style={{ transform: `scale(${img.zoom}) translate(${img.offsetX}px, ${img.offsetY}px)` }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            <button 
                              onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                              className="absolute top-1 right-1 bg-destructive text-white p-1 rounded-md opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón flotante para añadir fotos a la sección activa */}
                  {isActive && (
                    <div className="absolute bottom-2 right-2 flex gap-2">
                      <Button size="icon" className="h-7 w-7 rounded-full shadow-lg" onClick={() => document.getElementById(`upload-${section.id}`)?.click()}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-lg" onClick={() => clearSection(section.id)}>
                        <RefreshCcw className="h-3.5 w-3.5" />
                      </Button>
                      <input type="file" id={`upload-${section.id}`} multiple accept="image/*" className="hidden" onChange={(e) => handleAddImages(e, section.id)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 bg-card/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border shadow-xl animate-fade-in">
             <div className="flex items-center gap-4">
                <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Activo</span><span className="text-xs font-black text-primary">Sección {activeSection}</span></div>
                <Separator orientation="vertical" className="h-6" />
                <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Fotos</span><span className="text-xs font-black text-foreground">{images.length} Totales</span></div>
             </div>
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
            <Button 
              size="icon" 
              className="h-14 w-14 shrink-0 rounded-full shadow-2xl bg-slate-800 text-white hover:bg-slate-900 transition-all active:scale-95 border-4 border-white"
              onClick={() => setIsMenuOpen(true)}
            >
              <Settings2 className="h-6 w-6" />
            </Button>
            <SheetContent side="right" className="w-[85%] sm:w-[400px] p-0 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col z-[200]" onOpenAutoFocus={(e) => e.preventDefault()}>
              <SheetHeader className="sr-only"><SheetTitle>Ajustes de Collage</SheetTitle><SheetDescription>Configura formato, secciones y estilo</SheetDescription></SheetHeader>
              
              <div className="p-4 bg-primary/5 border-b shrink-0">
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest gap-2" onClick={handleExport} disabled={images.length === 0 || isExporting}>{isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{isExporting ? "..." : t.exportJpg}</Button>
              </div>

              <div className="flex-1 overflow-y-auto relative">
                {renderSectionContent(true)}
                <Button 
                  size="icon" 
                  className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary text-white z-[210] border-4 border-white animate-in fade-in zoom-in-95 duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings2 className="h-6 w-6" />
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  );
}
