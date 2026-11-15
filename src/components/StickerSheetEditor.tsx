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
  FileText,
  Move,
  Maximize,
  Trash2,
  PlusCircle,
  ImageIcon,
  Layers,
  Sparkles
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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

interface StickerData {
  id: string;
  url: string;
  file: File;
  originalWidth: number;
  originalHeight: number;
  width: number; height: number;
  quantity: number;
  quantityMode: 'auto' | 'manual';
  crop: { x: number; y: number; width: number; height: number };
}

export default function StickerSheetEditor() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];
  const { toast } = useToast();

  const [stickers, setStickers] = useState<StickerData[]>([]);
  const [isCropping, setIsCropping] = useState(false);
  const [currentImage, setCurrentImage] = useState<{ url: string; file: File; width: number; height: number } | null>(null);
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<'move' | 'nw' | 'ne' | 'sw' | 'se' | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [startCrop, setStartCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const [spacing, setSpacing] = useState(0.2); 
  const [paperSize, setPaperSize] = useState('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginV, setMarginV] = useState(0.7); 
  const [marginH, setMarginH] = useState(0.5); 
  
  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pref-lang') as Language;
    if (savedLang === 'en' || savedLang === 'es') setLang(savedLang);
  }, []);

  const paper = useMemo(() => {
    const p = PAPER_DIMENSIONS[paperSize];
    return orientation === 'portrait' 
      ? { width: Math.min(p.width, p.height), height: Math.max(p.width, p.height), format: p.format }
      : { width: Math.max(p.width, p.height), height: Math.min(p.width, p.height), format: p.format };
  }, [paperSize, orientation]);

  const handleImageUpload = (file: File, url: string) => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setCurrentImage({ url, file, width: img.width, height: img.height });
      setIsCropping(true);
      setCrop({ x: 10, y: 10, width: 80, height: 80 });
    };
  };

  const confirmSticker = () => {
    if (!currentImage) return;
    const cropAspect = (crop.width * currentImage.width) / (crop.height * currentImage.height);
    const newSticker: StickerData = {
      id: Math.random().toString(36).substring(2, 9),
      url: currentImage.url,
      file: currentImage.file,
      originalWidth: currentImage.width,
      originalHeight: currentImage.height,
      width: 5,
      height: parseFloat((5 / cropAspect).toFixed(2)),
      quantity: 1,
      quantityMode: 'auto',
      crop: { ...crop }
    };
    setStickers(prev => [...prev, newSticker]);
    setIsCropping(false);
    setCurrentImage(null);
  };

  const updateStickerSize = (id: string, val: number, source: 'w' | 'h') => {
    setStickers(prev => prev.map(s => {
      if (s.id !== id) return s;
      const num = Math.max(0.1, Math.round(val * 100) / 100);
      const cropW = (s.crop.width / 100) * s.originalWidth;
      const cropH = (s.crop.height / 100) * s.originalHeight;
      const aspect = cropW / cropH;
      return source === 'w' 
        ? { ...s, width: num, height: parseFloat((num / aspect).toFixed(2)) }
        : { ...s, height: num, width: parseFloat((num * aspect).toFixed(2)) };
    }));
  };

  const updateQuantity = (id: string, qty: number) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, quantity: Math.max(1, qty), quantityMode: 'manual' } : s));
  };

  const toggleMode = (id: string) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, quantityMode: s.quantityMode === 'auto' ? 'manual' : 'auto' } : s));
  };

  const removeSticker = (id: string) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  const itemsToDraw = useMemo(() => {
    if (stickers.length === 0) return [];
    
    const marginXMm = marginH * 10;
    const marginYMm = marginV * 10;
    const spacingMm = spacing * 10;
    const printableW = paper.width - (marginXMm * 2);
    const printableH = paper.height - (marginYMm * 2);

    let currentX = 0;
    let currentY = 0;
    let maxRowHeight = 0;
    const results: any[] = [];

    const manualStickers = stickers.filter(s => s.quantityMode === 'manual');
    const autoStickers = stickers.filter(s => s.quantityMode === 'auto');

    const drawList = [];
    manualStickers.forEach(s => {
      for(let i=0; i<s.quantity; i++) drawList.push(s);
    });

    const processItem = (s: StickerData) => {
      const sW = s.width * 10;
      const sH = s.height * 10;
      if (currentX + sW > printableW) {
        currentX = 0;
        currentY += maxRowHeight + spacingMm;
        maxRowHeight = 0;
      }
      if (currentY + sH > printableH) return false;
      
      results.push({ ...s, x: currentX, y: currentY });
      maxRowHeight = Math.max(maxRowHeight, sH);
      currentX += sW + spacingMm;
      return true;
    };

    drawList.forEach(item => processItem(item));

    if (autoStickers.length > 0) {
      let autoIdx = 0;
      let possible = true;
      while(possible) {
        const s = autoStickers[autoIdx];
        possible = processItem(s);
        autoIdx = (autoIdx + 1) % autoStickers.length;
        if (results.length > 500) break;
      }
    }

    return results;
  }, [stickers, paper, spacing, marginV, marginH]);

  const startDragging = (clientX: number, clientY: number, type: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    setIsDragging(true);
    setDragType(type);
    setStartPos({ x: clientX, y: clientY });
    setStartCrop({ ...crop });
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault(); e.stopPropagation();
    startDragging(e.clientX, e.clientY, type);
  };

  const handleTouchStart = (e: React.TouchEvent, type: 'move' | 'nw' | 'ne' | 'sw' | 'se') => {
    e.stopPropagation(); if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    startDragging(touch.clientX, touch.clientY, type);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragType(null);
  };

  const performDragging = (clientX: number, clientY: number, container: DOMRect) => {
    if (!isDragging || !dragType) return;
    const dx = ((clientX - startPos.x) / container.width) * 100;
    const dy = ((clientY - startPos.y) / container.height) * 100;

    setCrop(prev => {
      let next = { ...prev };
      if (dragType === 'move') {
        next.x = Math.min(Math.max(0, startCrop.x + dx), 100 - startCrop.width);
        next.y = Math.min(Math.max(0, startCrop.y + dy), 100 - startCrop.height);
      } else {
        if (dragType.includes('n')) {
          const newY = Math.max(0, Math.min(startCrop.y + dy, startCrop.y + startCrop.height - 5));
          next.height = startCrop.height - (newY - startCrop.y); next.y = newY;
        }
        if (dragType.includes('s')) next.height = Math.max(5, Math.min(startCrop.height + dy, 100 - startCrop.y));
        if (dragType.includes('w')) {
          const newX = Math.max(0, Math.min(startCrop.x + dx, startCrop.x + startCrop.width - 5));
          next.width = startCrop.width - (newX - startCrop.x); next.x = newX;
        }
        if (dragType.includes('e')) next.width = Math.max(5, Math.min(startCrop.width + dx, 100 - startCrop.x));
      }
      return next;
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const container = e.currentTarget.getBoundingClientRect();
    performDragging(e.clientX, e.clientY, container);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    if (e.cancelable) e.preventDefault();
    const container = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const touch = e.touches[0];
    performDragging(touch.clientX, touch.clientY, container);
  };

  const exportPdf = async () => {
    if (stickers.length === 0) return;
    setIsExporting(true);

    try {
      const pdfFormat = ['letter', 'a4', 'a3', 'legal'].includes(PAPER_DIMENSIONS[paperSize].format) 
        ? PAPER_DIMENSIONS[paperSize].format 
        : [paper.width, paper.height];

      const pdf = new jsPDF({ orientation: orientation === 'portrait' ? 'p' : 'l', unit: 'mm', format: pdfFormat as any });

      const marginXMm = marginH * 10;
      const marginYMm = marginV * 10;
      const spacingMm = spacing * 10;
      const printableW = paper.width - (marginXMm * 2);
      const printableH = paper.height - (marginYMm * 2);

      let currentX = marginXMm;
      let currentY = marginYMm;
      let maxRowHeight = 0;

      const assets = new Map();
      for (const s of stickers) {
        const img = new window.Image();
        img.src = s.url;
        await new Promise(resolve => img.onload = resolve);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        const sx = (s.crop.x / 100) * s.originalWidth;
        const sy = (s.crop.y / 100) * s.originalHeight;
        const sw = (s.crop.width / 100) * s.originalWidth;
        const sh = (s.crop.height / 100) * s.originalHeight;
        const targetDpi = 300;
        const mmToPx = targetDpi / 25.4;
        canvas.width = (s.width * 10) * mmToPx;
        canvas.height = (s.height * 10) * mmToPx;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        assets.set(s.id, canvas.toDataURL('image/png'));
      }

      const manualStickers = stickers.filter(s => s.quantityMode === 'manual');
      const autoStickers = stickers.filter(s => s.quantityMode === 'auto');

      const placeSticker = (s: StickerData) => {
        const sW = s.width * 10;
        const sH = s.height * 10;
        if (currentX + sW > marginXMm + printableW + 0.1) {
          currentX = marginXMm;
          currentY += maxRowHeight + spacingMm;
          maxRowHeight = 0;
        }

        if (currentY + sH > marginYMm + printableH + 0.1) {
          pdf.addPage(pdfFormat as any, orientation === 'portrait' ? 'p' : 'l');
          currentX = marginXMm;
          currentY = marginYMm;
          maxRowHeight = 0;
        }

        pdf.addImage(assets.get(s.id), 'PNG', currentX, currentY, sW, sH);
        maxRowHeight = Math.max(maxRowHeight, sH);
        currentX += sW + spacingMm;
      };

      manualStickers.forEach(s => {
        for(let i=0; i<s.quantity; i++) placeSticker(s);
      });

      if (autoStickers.length > 0) {
        let autoIdx = 0;
        let originalPageCount = pdf.internal.pages.length;
        while(pdf.internal.pages.length <= Math.max(originalPageCount, 3)) {
          const s = autoStickers[autoIdx];
          const sW = s.width * 10;
          const sH = s.height * 10;
          const willNeedNewPage = (currentY + sH > marginYMm + printableH + 0.1) && (currentX + sW > marginXMm + printableW + 0.1);
          if (willNeedNewPage && pdf.internal.pages.length >= Math.max(originalPageCount, 3)) break;
          placeSticker(s);
          autoIdx = (autoIdx + 1) % autoStickers.length;
        }
      }

      pdf.save(`MultiPrint-StickerSheet-${Date.now()}.pdf`);
      toast({ title: "PDF Generado", description: "La plancha de stickers se ha descargado correctamente." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Ocurrió un error al generar el PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  const renderSettings = (isMobile?: boolean) => (
    <div className={cn("space-y-6", isMobile ? "p-4 pt-1 pb-32" : "")}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-yellow-500" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Configuración de Hoja</h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Papel</Label>
            <Select value={paperSize} onValueChange={setPaperSize}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-2 rounded-lg bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(PAPER_DIMENSIONS).map(size => (
                  <SelectItem key={size} value={size} className="text-xs font-bold">{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Orientación</Label>
            <Select value={orientation} onValueChange={(v: any) => setOrientation(v)}>
              <SelectTrigger className="h-8 font-bold text-[10px] border-2 rounded-lg bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait" className="text-xs font-bold">Vertical</SelectItem>
                <SelectItem value="landscape" className="text-xs font-bold">Horizontal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between"><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Separación (cm)</Label><span className="text-[9px] font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 px-1.5 rounded">{spacing} cm</span></div>
            <Slider value={[spacing]} onValueChange={(v) => setSpacing(v[0])} min={0} max={2} step={0.05} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between"><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Margen V</Label><span className="text-[9px] font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 px-1.5 rounded">{marginV} cm</span></div>
            <Slider value={[marginV]} onValueChange={(v) => setMarginV(v[0])} min={0} max={5} step={0.1} />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between"><Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Margen H</Label><span className="text-[9px] font-black text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 px-1.5 rounded">{marginH} cm</span></div>
            <Slider value={[marginH]} onValueChange={(v) => setMarginH(v[0])} min={0} max={5} step={0.1} />
          </div>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-yellow-500" />
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stickers en lista</h2>
          </div>
          <Badge variant="secondary" className="font-black text-[9px]">{stickers.length}</Badge>
        </div>

        <div className={cn("space-y-4 overflow-y-auto pr-2 custom-scrollbar", isMobile ? "max-h-none" : "max-h-[35vh]")}>
          {stickers.map((s, idx) => (
            <div key={s.id} className="bg-muted/50 p-3 rounded-2xl border-2 border-border space-y-3 relative group">
              <button onClick={() => removeSticker(s.id)} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 className="h-3 w-3" /></button>
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white dark:bg-slate-300 rounded-lg border overflow-hidden shrink-0"><img src={s.url} className="w-full h-full object-cover" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] font-black text-muted-foreground uppercase truncate">Sticker #{idx + 1}</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-[8px] font-bold text-muted-foreground uppercase">Auto</Label>
                      <Switch checked={s.quantityMode === 'auto'} onCheckedChange={() => toggleMode(s.id)} className="scale-75 origin-left" />
                    </div>
                    {s.quantityMode === 'manual' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(s.id, s.quantity - 1)} className="text-muted-foreground hover:text-yellow-600"><Minus className="h-2.5 w-2.5"/></button>
                        <span className="text-[10px] font-black">{s.quantity}</span>
                        <button onClick={() => updateQuantity(s.id, s.quantity + 1)} className="text-muted-foreground hover:text-yellow-600"><Plus className="h-2.5 w-2.5"/></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-[8px] font-bold text-muted-foreground uppercase">Ancho (cm)</Label><Input type="number" value={s.width} onChange={(e) => updateStickerSize(s.id, parseFloat(e.target.value), 'w')} className="h-7 text-[10px] font-black bg-card" /></div>
                <div className="space-y-1"><Label className="text-[8px] font-bold text-muted-foreground uppercase">Alto (cm)</Label><Input type="number" value={s.height} onChange={(e) => updateStickerSize(s.id, parseFloat(e.target.value), 'h')} className="h-7 text-[10px] font-black bg-card" /></div>
              </div>
            </div>
          ))}
          
          <Button 
            variant="outline" 
            className="w-full border-2 border-dashed border-yellow-200 text-yellow-600 font-black h-12 rounded-2xl gap-2 uppercase text-[10px] tracking-widest"
            onClick={() => {
              const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
              input.onchange = (e: any) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, URL.createObjectURL(file)); };
              input.click();
            }}
          ><PlusCircle className="h-4 w-4" />Añadir Sticker</Button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  const previewScale = 320 / paper.width;

  return (
    <div className="flex flex-col h-screen bg-background font-body overflow-hidden transition-colors duration-300">
      <header className="h-16 shrink-0 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="ghost" size="sm" className="gap-2 font-bold text-muted-foreground px-2"><ChevronLeft className="h-4 w-4" /><span className="hidden sm:inline text-xs">Inicio</span></Button></Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border bg-white dark:bg-slate-200"><Image src={logo} alt="Logo" fill className="object-contain" /></div>
            <h1 className="text-sm sm:text-xl font-headline font-black tracking-tighter text-yellow-600 uppercase">PLANCHA DE STICKERS</h1>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle /><LanguageSelector language={lang} setLanguage={setLang} />
          <Button className="hidden sm:flex bg-yellow-600 hover:bg-yellow-700 text-white font-black gap-2 h-9 px-6 rounded-xl shadow-md transition-all active:scale-95 text-xs" onClick={exportPdf} disabled={stickers.length === 0 || isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}{isExporting ? "..." : "Exportar PDF"}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-muted/30 flex flex-col items-center justify-start lg:justify-center relative">
          {isCropping && currentImage ? (
            <div className="w-full max-w-2xl space-y-6 flex flex-col items-center animate-in zoom-in-95 duration-300 z-[60]">
              <div className="text-center space-y-1"><h2 className="text-2xl font-black uppercase tracking-tight text-foreground">Recortar Sticker</h2><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Define el área de este nuevo diseño</p></div>
              <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl group border-4 border-card cursor-crosshair touch-none" onMouseMove={handleMouseMove} onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onTouchMove={handleTouchMove} onTouchEnd={handleDragEnd}>
                <img src={currentImage.url} alt="To Crop" className="max-h-[55vh] object-contain select-none" draggable={false} />
                <div className="absolute inset-0 bg-black/60 pointer-events-none" />
                <div className="absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] cursor-move" style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.width}%`, height: `${crop.height}%` }} onMouseDown={(e) => handleMouseDown(e, 'move')} onTouchStart={(e) => handleTouchStart(e, 'move')}>
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none">{Array.from({ length: 9 }).map((_, i) => (<div key={i} className="border-[0.5px] border-white" />))}</div>
                  <div className="absolute -top-5 -left-5 w-10 h-10 bg-white rounded-full border-2 border-yellow-600 cursor-nw-resize z-[60] shadow-xl flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, 'nw')} onTouchStart={(e) => handleTouchStart(e, 'nw')}><div className="w-2 h-2 bg-yellow-600 rounded-full"/></div>
                  <div className="absolute -top-5 -right-5 w-10 h-10 bg-white rounded-full border-2 border-yellow-600 cursor-ne-resize z-[60] shadow-xl flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, 'ne')} onTouchStart={(e) => handleTouchStart(e, 'ne')}><div className="w-2 h-2 bg-yellow-600 rounded-full"/></div>
                  <div className="absolute -bottom-5 -left-5 w-10 h-10 bg-white rounded-full border-2 border-yellow-600 cursor-sw-resize z-[60] shadow-xl flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, 'sw')} onTouchStart={(e) => handleTouchStart(e, 'sw')}><div className="w-2 h-2 bg-yellow-600 rounded-full"/></div>
                  <div className="absolute -bottom-5 -right-5 w-10 h-10 bg-white rounded-full border-2 border-yellow-600 cursor-se-resize z-[60] shadow-xl flex items-center justify-center" onMouseDown={(e) => handleMouseDown(e, 'se')} onTouchStart={(e) => handleTouchStart(e, 'se')}><div className="w-2 h-2 bg-yellow-600 rounded-full"/></div>
                </div>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="border-2 border-yellow-600 text-yellow-600 font-black h-12 px-8 rounded-2xl bg-white hover:bg-yellow-50" onClick={() => setCrop({ x: 0, y: 0, width: 100, height: 100 })}><Maximize className="h-4 w-4" />Toda la imagen</Button>
                <Button className="bg-yellow-600 hover:bg-yellow-700 text-white font-black h-12 px-12 rounded-2xl shadow-xl gap-2 text-sm uppercase tracking-widest transition-all active:scale-95" onClick={confirmSticker}><Check className="h-5 w-5" />Confirmar Sticker</Button>
              </div>
            </div>
          ) : stickers.length === 0 ? (
            <div className="max-w-lg w-full">
              <div onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e: any) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file, URL.createObjectURL(file)); }; input.click(); }} className="w-full aspect-video border-4 border-dashed border-yellow-200 bg-card rounded-[3rem] flex flex-col items-center justify-center cursor-pointer transition-all hover:border-yellow-400 group shadow-xl p-8 text-center">
                <div className="p-8 bg-yellow-50 rounded-full group-hover:scale-110 transition-transform mb-6"><ImageIcon className="h-16 w-16 text-yellow-500" /></div>
                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Carga tu primer sticker</h3><p className="mt-2 text-muted-foreground font-medium">Sube una imagen para empezar a crear tu plancha.</p>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-6xl flex flex-col items-center justify-center gap-6 pb-20">
              <div className="relative bg-white dark:bg-slate-300 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] rounded-sm overflow-hidden border border-border shrink-0" style={{ width: '320px', aspectRatio: `${paper.width} / ${paper.height}` }}>
                <div className="absolute inset-0 bg-yellow-500/5 pointer-events-none border border-dashed border-yellow-600/20" style={{ top: `${(marginV * 10 * previewScale)}px`, bottom: `${(marginV * 10 * previewScale)}px`, left: `${(marginH * 10 * previewScale)}px`, right: `${(marginH * 10 * previewScale)}px` }} />
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ paddingTop: `${marginV * 10 * previewScale}px`, paddingLeft: `${marginH * 10 * previewScale}px`, paddingRight: `${marginH * 10 * previewScale}px`, paddingBottom: `${marginV * 10 * previewScale}px` }}>
                  {itemsToDraw.map((s, i) => (
                    <div key={i} className="absolute bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] border-[0.1px] border-black/10 overflow-hidden" style={{ width: `${s.width * 10 * previewScale}px`, height: `${s.height * 10 * previewScale}px`, left: `${(marginH * 10 + s.x) * previewScale}px`, top: `${(marginV * 10 + s.y) * previewScale}px` }}>
                      <img src={s.url} alt="" className="absolute max-w-none" style={{ width: `${(100 / s.crop.width) * 100}%`, height: `${(100 / s.crop.height) * 100}%`, left: `-${(s.crop.x / s.crop.width) * 100}%`, top: `-${(s.crop.y / s.crop.height) * 100}%` }} />
                    </div>
                  ))}
                </div>
                <div className="absolute top-2 right-2 bg-black/5 px-2 py-0.5 rounded text-[7px] font-black text-black/30 uppercase tracking-widest pointer-events-none">{paperSize} {paper.width}x{paper.height}mm</div>
              </div>
              <div className="flex items-center gap-4 bg-card/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-border shadow-xl">
                 <div className="flex flex-col"><span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Capacidad Total</span><span className="text-xs font-black text-foreground">{itemsToDraw.length} Stickers</span></div>
                 <Separator orientation="vertical" className="h-6" />
                 <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /><span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest">Autocompletado Activo</span></div>
              </div>
            </div>
          )}
        </div>

        <aside className="hidden lg:flex w-80 bg-card border-l border-border flex-col shrink-0 shadow-2xl z-20">
          <div className="flex-1 overflow-y-auto p-6">{renderSettings()}</div>
          {stickers.length > 0 && !isCropping && (<div className="p-6 border-t bg-muted/50"><Button className="w-full h-14 bg-yellow-600 hover:bg-yellow-700 text-white font-black rounded-2xl shadow-xl shadow-yellow-600/20 uppercase tracking-widest text-xs gap-3 transition-all active:scale-95" onClick={exportPdf} disabled={isExporting}>{isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}{isExporting ? "Generando..." : "Descargar Plancha PDF"}</Button></div>)}
        </aside>

        {stickers.length > 0 && !isCropping && (
          <div className="lg:hidden fixed bottom-6 left-6 right-6 z-[40] flex gap-3 pointer-events-auto">
            <div className="flex-1"><Button className="w-full h-14 bg-yellow-600 hover:bg-yellow-700 text-white font-black rounded-2xl shadow-xl shadow-yellow-600/20 uppercase tracking-widest text-sm gap-3 border-4 border-white/10" onClick={exportPdf} disabled={isExporting}>{isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-4 w-4" />}{isExporting ? "..." : "Exportar"}</Button></div>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <Button 
                size="icon" 
                className="h-14 w-14 shrink-0 rounded-full shadow-2xl bg-slate-800 text-white hover:bg-slate-900 transition-all active:scale-95 border-4 border-white"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
              >
                <Settings2 className="h-6 w-6" />
              </Button>
              <SheetContent 
                side="right" 
                className="w-[85%] sm:w-[400px] p-0 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col z-[200]"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Ajustes de Plancha</SheetTitle>
                  <SheetDescription>Configura tamaños, papel y espaciado</SheetDescription>
                </SheetHeader>
                <div className="p-4 bg-yellow-500/5 border-b shrink-0">
                  <Button 
                    className="w-full h-12 bg-yellow-600 hover:bg-yellow-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest gap-2"
                    onClick={exportPdf}
                    disabled={isExporting}
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                    {isExporting ? "..." : "Exportar PDF"}
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {renderSettings(true)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </main>
    </div>
  );
}
