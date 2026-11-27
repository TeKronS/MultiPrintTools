
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
  AlignRight,
  Type,
  ImageIcon,
  X,
  Maximize2,
  LayoutGrid
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
  aspectRatio: number; // width / height
}

interface HeaderColumn {
  id: string;
  type: 'text' | 'image';
  content: string; 
  align: 'left' | 'center' | 'right';
}

interface CellLayout {
  x: number; // percentage
  y: number; // percentage
  w: number; // percentage
  h: number; // percentage
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

// Helper to calculate smart mosaic layout
function getMosaicLayout(count: number, sectionRatio: number): CellLayout[] {
  if (count <= 1) return [{ x: 0, y: 0, w: 100, h: 100 }];
  
  if (count === 2) {
    return sectionRatio > 1 
      ? [{ x: 0, y: 0, w: 50, h: 100 }, { x: 50, y: 0, w: 50, h: 100 }]
      : [{ x: 0, y: 0, w: 100, h: 50 }, { x: 0, y: 50, w: 100, h: 50 }];
  }

  if (count === 3) {
    return [
      { x: 0, y: 0, w: 60, h: 100 },
      { x: 60, y: 0, w: 40, h: 50 },
      { x: 60, y: 50, w: 40, h: 50 }
    ];
  }

  if (count === 4) {
    return [
      { x: 0, y: 0, w: 50, h: 50 },
      { x: 50, y: 0, w: 50, h: 50 },
      { x: 0, y: 50, w: 50, h: 50 },
      { x: 50, y: 50, w: 50, h: 50 }
    ];
  }

  // Generic grid for 5+ images
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const layouts: CellLayout[] = [];
  for (let i = 0; i < count; i++) {
    layouts.push({
      x: (i % cols) * cellW,
      y: Math.floor(i / cols) * cellH,
      w: cellW,
      h: cellH
    });
  }
  return layouts;
}

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
    if (hasHeader && headerColumns.length === 0) {
      setHeaderColumns([
        { id: Math.random().toString(36).substring(2, 9), type: 'text', content: 'TITULO COLLAGE', align: 'center' }
      ]);
    }
  };

  const addHeaderColumn = () => {
    setHeaderColumns(prev => [
      ...prev,
      { id: Math.random().toString(36).substring(2, 9), type: 'text', content: 'Nuevo Elemento', align: 'center' }
    ]);
  };

  const removeHeaderColumn = (id: string) => {
    setHeaderColumns(prev => prev.filter(c => c.id !== id));
  };

  const updateHeaderColumn = (id: string, updates: Partial<HeaderColumn>) => {
    setHeaderColumns(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleHeaderImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateHeaderColumn(id, { content: url });
    }
  };

  const handleAddImages = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: number) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    const newImgs: CollageImage[] = await Promise.all(files.map(async file => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.src = url;
      await new Promise(r => img.onload = r);
      return {
        id: Math.random().toString(36).substring(2, 9),
        url,
        file,
        sectionId,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        aspectRatio: img.width / img.height
      };
    }));

    setImages(prev => [...prev, ...newImgs]);
    setActiveSection(sectionId);
    e.target.value = '';
  };

  const updateImageTransform = (id: string, updates: Partial<CollageImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  // Function to auto-fill all images in a section
  const autoFillSection = (sectionId: number, layouts: CellLayout[], sectionW: number, sectionH: number) => {
    const sectionImages = images.filter(img => img.sectionId === sectionId);
    const updatedImages = images.map(img => {
      if (img.sectionId !== sectionId) return img;
      
      const idx = sectionImages.findIndex(si => si.id === img.id);
      if (idx === -1) return img;
      
      const layout = layouts[idx];
      const cellW = (layout.w / 100) * sectionW;
      const cellH = (layout.h / 100) * sectionH;
      const cellRatio = cellW / cellH;
      
      // Calculate zoom to cover
      let zoom = 1;
      if (img.aspectRatio > cellRatio) {
        // Image is wider than cell, match height
        zoom = img.aspectRatio / cellRatio;
      } else {
        // Image is taller than cell, match width
        zoom = cellRatio / img.aspectRatio;
      }

      return { ...img, zoom: Math.max(1, zoom), offsetX: 0, offsetY: 0 };
    });
    setImages(updatedImages);
    toast({ title: lang === 'es' ? "Ajustado" : "Filled", description: lang === 'es' ? "Imágenes adaptadas al espacio." : "Images adapted to area." });
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

      const baseW = 1440; // Increased quality
      const baseH = baseW / aspectRatio.ratio;
      canvas.width = baseW;
      canvas.height = baseH;

      // Scale helper
      const scale = baseW / 450; 

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

      // 2. Cabecera Modular
      if (hasHeader) {
        const hHeight = (headerHeight / 100) * canvas.height;
        for (const col of headerColumns) {
          const x = col.align === 'left' ? 40 * scale : col.align === 'right' ? canvas.width - (40 * scale) : canvas.width / 2;
          
          if (col.type === 'text') {
            ctx.fillStyle = (bgColor === '#000000' || activeGradient.includes('#232526')) ? 'white' : 'black';
            ctx.font = `bold ${32 * scale}px sans-serif`;
            ctx.textAlign = col.align;
            ctx.textBaseline = 'middle';
            ctx.fillText(col.content.toUpperCase(), x, hHeight / 2);
          } else if (col.type === 'image' && col.content) {
            const hImg = new window.Image();
            hImg.src = col.content;
            await new Promise(r => hImg.onload = r);
            
            const maxH = hHeight * 0.7;
            const aspect = hImg.width / hImg.height;
            const drawH = maxH;
            const drawW = drawH * aspect;
            
            const drawX = col.align === 'left' ? 40 * scale : col.align === 'right' ? canvas.width - drawW - (40 * scale) : (canvas.width - drawW) / 2;
            ctx.drawImage(hImg, drawX, (hHeight - drawH) / 2, drawW, drawH);
          }
        }
      }

      // 3. Secciones e Imágenes con Mosaico
      for (const section of sectionsLayout) {
        const sImgs = images.filter(img => img.sectionId === section.id);
        if (sImgs.length === 0) continue;

        const sTop = (section.top / 100) * canvas.height;
        const sHeight = (section.height / 100) * canvas.height;
        const sWidth = canvas.width;
        const sRatio = sWidth / sHeight;
        
        const pad = (spacing * 37.8) * scale;
        const mosaic = getMosaicLayout(sImgs.length, sRatio);

        for (let i = 0; i < sImgs.length; i++) {
          const imgData = sImgs[i];
          const layout = mosaic[i];
          
          const cellX = (layout.x / 100) * sWidth + pad;
          const cellY = sTop + (layout.y / 100) * sHeight + pad;
          const cellW = (layout.w / 100) * sWidth - (pad * 2);
          const cellH = (layout.h / 100) * sHeight - (pad * 2);

          const img = new window.Image();
          img.src = imgData.url;
          await new Promise(r => img.onload = r);

          ctx.save();
          ctx.beginPath();
          ctx.rect(cellX, cellY, cellW, cellH);
          ctx.clip();

          const cellRatio = cellW / cellH;
          let drawW, drawH;

          if (imgData.aspectRatio > cellRatio) {
            drawW = cellW;
            drawH = cellW / imgData.aspectRatio;
          } else {
            drawH = cellH;
            drawW = cellH * imgData.aspectRatio;
          }

          const finalW = drawW * imgData.zoom;
          const finalH = drawH * imgData.zoom;
          const offX = imgData.offsetX * scale;
          const offY = imgData.offsetY * scale;

          const drawX = cellX + (cellW - finalW) / 2 + offX;
          const drawY = cellY + (cellH - finalH) / 2 + offY;

          ctx.drawImage(img, drawX, drawY, finalW, finalH);
          ctx.restore();
        }
      }

      const link = document.createElement('a');
      link.download = `Collage_${Date.now()}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
      toast({ title: lang === 'es' ? "Collage Exportado" : "Collage Exported", description: lang === 'es' ? "Guardado correctamente." : "Saved successfully." });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error", description: "No se pudo generar la imagen." });
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
                <Label className="text-[9px] font-black uppercase text-muted-foreground">Altura de Cabecera</Label>
                <Slider value={[headerHeight]} onValueChange={v => setHeaderHeight(v[0])} min={5} max={30} />
             </div>
             <div className="space-y-3">
               {headerColumns.map((col) => (
                 <div key={col.id} className="p-2 bg-background rounded-lg border border-border space-y-2 relative group">
                    <button onClick={() => removeHeaderColumn(col.id)} className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-2 w-2"/></button>
                    <div className="flex items-center justify-between gap-2">
                       <div className="flex gap-1 bg-muted p-0.5 rounded-md">
                          <Button size="icon" variant={col.type === 'text' ? 'default' : 'ghost'} className="h-6 w-6 rounded-sm" onClick={() => updateHeaderColumn(col.id, { type: 'text' })}><Type className="h-3 w-3"/></Button>
                          <Button size="icon" variant={col.type === 'image' ? 'default' : 'ghost'} className="h-6 w-6 rounded-sm" onClick={() => updateHeaderColumn(col.id, { type: 'image' })}><ImageIcon className="h-3 w-3"/></Button>
                       </div>
                       <div className="flex gap-1">
                          <Button size="icon" variant={col.align === 'left' ? 'secondary' : 'ghost'} className="h-5 w-5" onClick={() => updateHeaderColumn(col.id, { align: 'left' })}><AlignLeft className="h-2.5 w-2.5"/></Button>
                          <Button size="icon" variant={col.align === 'center' ? 'secondary' : 'ghost'} className="h-5 w-5" onClick={() => updateHeaderColumn(col.id, { align: 'center' })}><AlignCenter className="h-2.5 w-2.5"/></Button>
                          <Button size="icon" variant={col.align === 'right' ? 'secondary' : 'ghost'} className="h-5 w-5" onClick={() => updateHeaderColumn(col.id, { align: 'right' })}><AlignRight className="h-2.5 w-2.5"/></Button>
                       </div>
                    </div>
                    {col.type === 'text' ? (
                      <Input 
                        placeholder="Texto..." 
                        value={col.content} 
                        onChange={e => updateHeaderColumn(col.id, { content: e.target.value })}
                        className="h-7 text-[10px] font-bold"
                      />
                    ) : (
                      <div className="space-y-2">
                        {col.content ? (
                          <div className="relative w-full aspect-video rounded border overflow-hidden bg-muted">
                            <img src={col.content} className="w-full h-full object-contain" alt="Header img" />
                            <button className="absolute top-1 right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center" onClick={() => updateHeaderColumn(col.id, { content: '' })}><X className="h-3 w-3"/></button>
                          </div>
                        ) : (
                          <Button variant="outline" className="w-full h-7 text-[9px] font-black border-dashed" onClick={() => document.getElementById(`header-img-${col.id}`)?.click()}>Subir Logo</Button>
                        )}
                        <input type="file" id={`header-img-${col.id}`} accept="image/*" className="hidden" onChange={(e) => handleHeaderImageUpload(col.id, e)} />
                      </div>
                    )}
                 </div>
               ))}
               <Button variant="outline" className="w-full h-8 text-[9px] font-black border-dashed gap-1" onClick={addHeaderColumn}><Plus className="h-3 w-3" />Añadir Sección</Button>
             </div>
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
            {/* Modular Header Rendering */}
            {hasHeader && (
              <div 
                className="absolute top-0 left-0 w-full flex items-center px-4 overflow-hidden z-30"
                style={{ height: `${headerHeight}%` }}
              >
                {headerColumns.map(col => (
                  <div key={col.id} className={cn("flex-1 h-full flex items-center", col.align === 'center' ? 'justify-center text-center' : col.align === 'right' ? 'justify-end text-right' : 'justify-start text-left')}>
                    {col.type === 'text' ? (
                      <span className={cn("text-[11px] font-black uppercase tracking-widest leading-none", (bgColor === '#000000' || activeGradient.includes('#232526')) ? 'text-white' : 'text-foreground')}>
                        {col.content}
                      </span>
                    ) : (
                      col.content && <img src={col.content} className="max-h-[70%] w-auto object-contain" alt="H" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Sections Rendering */}
            {sectionsLayout.map(section => {
              const sectionImages = images.filter(img => img.sectionId === section.id);
              const isActive = activeSection === section.id;
              
              const sectionW_px = 450;
              const sectionH_px = (section.height / 100) * (450 / aspectRatio.ratio);
              const sRatio = sectionW_px / sectionH_px;
              const mosaic = getMosaicLayout(sectionImages.length, sRatio);

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
                      {sectionImages.map((img, i) => {
                        const layout = mosaic[i];
                        const cellPad = spacing * 10; // Simple padding in px approx

                        return (
                          <div 
                            key={img.id} 
                            className={cn(
                              "absolute overflow-hidden bg-black/5 rounded-sm group/img",
                              selectedImageId === img.id ? "ring-2 ring-accent z-10" : ""
                            )}
                            style={{
                              left: `${layout.x}%`,
                              top: `${layout.y}%`,
                              width: `${layout.w}%`,
                              height: `${layout.h}%`,
                              padding: `${spacing * 2}px`
                            }}
                            onClick={(e) => { e.stopPropagation(); setSelectedImageId(img.id); }}
                          >
                            <div className="w-full h-full relative overflow-hidden">
                              <img 
                                src={img.url} 
                                alt=""
                                className="w-full h-full object-contain transition-transform select-none"
                                style={{ transform: `scale(${img.zoom}) translate(${img.offsetX}px, ${img.offsetY}px)` }}
                                draggable={false}
                              />
                            </div>
                            
                            {selectedImageId === img.id && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
                                <div className="bg-background/95 p-2 rounded-xl shadow-2xl flex flex-col gap-3 w-[80%] pointer-events-auto">
                                   <div className="flex items-center justify-between gap-4">
                                      <div className="flex flex-col"><span className="text-[7px] font-black uppercase text-muted-foreground">Zoom</span></div>
                                      <Slider value={[img.zoom]} min={1} max={5} step={0.01} onValueChange={v => updateImageTransform(img.id, { zoom: v[0] })} className="flex-1" />
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
                        );
                      })}
                    </div>
                  )}

                  {isActive && !selectedImageId && (
                    <div className="absolute bottom-2 right-2 flex gap-2 z-40">
                      {sectionImages.length > 0 && (
                        <Button 
                          size="icon" 
                          variant="secondary"
                          className="h-8 w-8 rounded-full shadow-lg bg-accent text-white" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            autoFillSection(section.id, mosaic, sectionW_px, sectionH_px); 
                          }}
                          title={lang === 'es' ? "Rellenar Espacios" : "Fill Area"}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      )}
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
        </div>

        <aside className="hidden lg:flex w-80 bg-card border-l border-border flex-col shrink-0 shadow-2xl z-20">
          <div className="flex-1 overflow-y-auto">{renderSectionContent()}</div>
          <div className="p-6 border-t bg-muted/50">
            <Button className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs gap-3 transition-all active:scale-95" onClick={handleExport} disabled={images.length === 0 || isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}{isExporting ? "Generando..." : t.exportJpg}
            </Button>
          </div>
        </aside>

        {!showConfig && (
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
        )}
      </main>

      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader className="space-y-3">
             <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-2"><LayoutGrid className="h-6 w-6 text-primary" /></div>
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

