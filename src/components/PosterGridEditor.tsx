
"use client";

import { useState, useEffect, useDeferredValue, useMemo } from "react";
import Image from "next/image";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "./LanguageSelector";
import { ImageUploader } from "./ImageUploader";
import { MuralCanvas } from "./MuralCanvas";
import { ThemeToggle } from "./ThemeToggle";
import { 
  Settings2, 
  Layers, 
  FileDown, 
  Scissors,
  Loader2,
  RefreshCcw,
  Plus,
  Minus,
  ChevronLeft,
  Maximize2,
  Ruler,
  Zap,
  Square,
  Info,
  ChevronDown,
  Expand,
  ScrollText,
  Anchor
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger as SelectTriggerUI, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import logo from "@/app/icono.png";

const PAPER_DIMENSIONS: Record<string, { width: number; height: number; format: string }> = {
  'Carta': { width: 215.9, height: 279.4, format: 'letter' },
  'A4': { width: 210, height: 297, format: 'a4' },
  'A3': { width: 297, height: 420, format: 'a3' },
  'Oficio (Legal 35.5cm)': { width: 215.9, height: 355.6, format: 'legal' },
  'Folio (33cm)': { width: 215.9, height: 330.2, format: 'folio' },
  'Oficio (34cm)': { width: 216, height: 340, format: 'oficio' },
  'Extra Oficio (38cm)': { width: 216, height: 380, format: 'extra-oficio' },
  'Personalizado (Rollo)': { width: 610, height: 1000, format: 'custom' }
};

const DEFAULT_MAX_CM = 200;
const GIANT_MAX_CM = 1000;
const MAX_ROLL_LENGTH_MM = 5000;

export default function PosterGridEditor() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const [image, setImage] = useState<{ url: string; file: File; width: number; height: number } | null>(null);
  
  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [overlap, setOverlap] = useState(0.3); 
  const [marginV, setMarginV] = useState(0.7); 
  const [marginH, setMarginH] = useState(0.7); 
  const [paperSize, setPaperSize] = useState('Carta');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showGuides, setShowGuides] = useState(true);
  const [showOutline, setShowOutline] = useState(false);
  const [lockAspect, setLockAspect] = useState(true);
  const [isGiantMode, setIsGiantMode] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const [customRollWidth, setCustomRollWidth] = useState(215.9);
  const [customRollLength, setCustomRollLength] = useState(1000);

  const [targetWidth, setTargetWidth] = useState<string>('0');
  const [targetHeight, setTargetHeight] = useState<string>('0');

  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pref-lang') as Language;
    if (savedLang === 'en' || savedLang === 'es') setLang(savedLang);
  }, []);

  const t = translations[lang];

  // Helper para parsear números manejando puntos o comas
  const parseNum = (val: string): number => {
    const normalized = val.replace(',', '.');
    return parseFloat(normalized) || 0;
  };

  const getAppliedMargins = (orient: 'portrait' | 'landscape', mV: number, mH: number) => {
    return {
      appliedMH: orient === 'portrait' ? mH : mV,
      appliedMV: orient === 'portrait' ? mV : mH
    };
  };

  const calculateOptimizedGrid = (
    w_cm: number, 
    h_cm: number, 
    pSize: string, 
    ov_cm: number, 
    mV_cm: number, 
    mH_cm: number,
    cW_mm?: number,
    forceOrient?: 'portrait' | 'landscape'
  ) => {
    const targetW_mm = w_cm * 10;
    const targetH_mm = h_cm * 10;
    const overlap_mm = ov_cm * 10;

    if (pSize.includes('Personalizado')) {
      const rollWidth = cW_mm || 215.9;
      const isLandscapeImage = targetW_mm > targetH_mm;
      const finalOrient = isLandscapeImage ? 'landscape' : 'portrait';
      
      const { appliedMH, appliedMV } = getAppliedMargins(finalOrient, mV_cm, mH_cm);
      
      const fixedDimPrintable = rollWidth - ( (finalOrient === 'landscape' ? appliedMV : appliedMH) * 20);
      const variableDimPrintable = MAX_ROLL_LENGTH_MM - ( (finalOrient === 'landscape' ? appliedMH : appliedMV) * 20);
      
      const effectiveFixed = fixedDimPrintable - overlap_mm;
      const effectiveVariable = variableDimPrintable - overlap_mm;

      const fixedPanels = Math.ceil(( (finalOrient === 'landscape' ? targetH_mm : targetW_mm) - overlap_mm) / effectiveFixed);
      const variablePanels = Math.ceil(( (finalOrient === 'landscape' ? targetW_mm : targetH_mm) - overlap_mm) / effectiveVariable);

      const neededLength = ( (finalOrient === 'landscape' ? targetW_mm : targetH_mm) ) + ( (finalOrient === 'landscape' ? appliedMH : appliedMV) * 20) + overlap_mm;
      const finalLength = Math.min(MAX_ROLL_LENGTH_MM, Math.max(100, neededLength));

      return { 
        rows: finalOrient === 'landscape' ? Math.max(1, fixedPanels) : Math.max(1, variablePanels), 
        cols: finalOrient === 'landscape' ? Math.max(1, variablePanels) : Math.max(1, fixedPanels), 
        total: Math.max(1, fixedPanels) * Math.max(1, variablePanels), 
        orientation: finalOrient, 
        dynamicLength: finalLength 
      };
    } else {
      const calcForOrientation = (orient: 'portrait' | 'landscape') => {
        const paperBase = PAPER_DIMENSIONS[pSize];
        const paper = orient === 'portrait' 
          ? { width: Math.min(paperBase.width, paperBase.height), height: Math.max(paperBase.width, paperBase.height) }
          : { width: Math.max(paperBase.width, paperBase.height), height: Math.min(paperBase.width, paperBase.height) };
        
        const { appliedMH, appliedMV } = getAppliedMargins(orient, mV_cm, mH_cm);
        const printableW = paper.width - (appliedMH * 20);
        const printableH = paper.height - (appliedMV * 20);
        const effectiveW = printableW - overlap_mm;
        const effectiveH = printableH - overlap_mm;
        
        const c = Math.ceil((targetW_mm - overlap_mm) / effectiveW);
        const r = Math.ceil((targetH_mm - overlap_mm) / effectiveH);
        
        return { rows: Math.max(1, r), cols: Math.max(1, c), total: Math.max(1, r) * Math.max(1, c), orientation: orient };
      };

      if (forceOrient) return calcForOrientation(forceOrient);

      const pResults = calcForOrientation('portrait');
      const lResults = calcForOrientation('landscape');
      return pResults.total <= lResults.total ? pResults : lResults;
    }
  };

  const handleWidthChange = (val: string) => {
    if (!image) return;
    const num = parseNum(val);
    if (isNaN(num)) { setTargetWidth(val); return; }

    if (lockAspect) {
      const aspect = image.width / image.height;
      const newHeight = num / aspect;
      setTargetWidth(num.toString());
      setTargetHeight(newHeight.toFixed(2).replace('.', ','));
      
      const opt = calculateOptimizedGrid(num, newHeight, paperSize, overlap, marginV, marginH, customRollWidth);
      setRows(opt.rows);
      setCols(opt.cols);
      setOrientation(opt.orientation);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    } else {
      setTargetWidth(num.toString());
      const curH = parseNum(targetHeight);
      const opt = calculateOptimizedGrid(num, curH, paperSize, overlap, marginV, marginH, customRollWidth, orientation);
      setRows(opt.rows);
      setCols(opt.cols);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    }
  };

  const handleHeightChange = (val: string) => {
    if (!image) return;
    const num = parseNum(val);
    if (isNaN(num)) { setTargetHeight(val); return; }

    if (lockAspect) {
      const aspect = image.width / image.height;
      const newWidth = num * aspect;
      setTargetHeight(num.toString());
      setTargetWidth(newWidth.toFixed(2).replace('.', ','));
      
      const opt = calculateOptimizedGrid(newWidth, num, paperSize, overlap, marginV, marginH, customRollWidth);
      setRows(opt.rows);
      setCols(opt.cols);
      setOrientation(opt.orientation);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    } else {
      setTargetHeight(num.toString());
      const curW = parseNum(targetWidth);
      const opt = calculateOptimizedGrid(curW, num, paperSize, overlap, marginV, marginH, customRollWidth, orientation);
      setRows(opt.rows);
      setCols(opt.cols);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    }
  };

  const syncGrid = () => {
    if (!image) return;
    const w = parseNum(targetWidth);
    const h = parseNum(targetHeight);
    const opt = calculateOptimizedGrid(w, h, paperSize, overlap, marginV, marginH, customRollWidth);
    setRows(opt.rows);
    setCols(opt.cols);
    setOrientation(opt.orientation);
    if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
  };

  const handleImageUpload = (file: File, url: string) => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage({ file, url, width: img.width, height: img.height });
      const aspect = img.width / img.height;
      const initialW = 40; // Base inicial de 40cm
      const initialH = initialW / aspect;
      
      setTargetWidth(initialW.toString());
      setTargetHeight(initialH.toFixed(1).replace('.', ','));
      
      const opt = calculateOptimizedGrid(initialW, initialH, paperSize, overlap, marginV, marginH, customRollWidth);
      setRows(opt.rows);
      setCols(opt.cols);
      setOrientation(opt.orientation);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    };
  };

  const physicalInfo = useMemo(() => {
    if (!image) return null;
    const tw = parseNum(targetWidth);
    const th = parseNum(targetHeight);
    
    let paper;
    if (paperSize.includes('Personalizado')) { 
      if (orientation === 'portrait') { paper = { width: customRollWidth, height: customRollLength }; } 
      else { paper = { width: customRollLength, height: customRollWidth }; } 
    } else { 
      const pB = PAPER_DIMENSIONS[paperSize]; 
      paper = orientation === 'portrait' 
        ? { width: Math.min(pB.width, pB.height), height: Math.max(pB.width, pB.height) } 
        : { width: Math.max(pB.width, pB.height), height: Math.min(pB.width, pB.height) }; 
    }

    const { appliedMH, appliedMV } = getAppliedMargins(orientation, marginV, marginH);
    const pW = paper.width - (appliedMH * 20); 
    const pH = paper.height - (appliedMV * 20);
    const ovMm = overlap * 10; 
    const eW = pW - ovMm; 
    const eH = pH - ovMm;
    const tGW = (cols * eW) + ovMm; 
    const tGH = (rows * eH) + ovMm;

    return { 
      imgW: tw.toFixed(1), 
      imgH: th.toFixed(1), 
      printableW: (pW / 10).toFixed(1), 
      printableH: (pH / 10).toFixed(1), 
      blankW: Math.max(0, (tGW - (tw * 10)) / 10).toFixed(1), 
      blankH: Math.max(0, (tGH - (th * 10)) / 10).toFixed(1) 
    };
  }, [image, rows, cols, overlap, marginV, marginH, paperSize, orientation, targetWidth, targetHeight, customRollWidth, customRollLength]);

  const renderSettings = (isMobileView?: boolean) => {
    const isLetterSnap = Math.abs(customRollWidth - 215.9) < 2;
    const isA4Snap = Math.abs(customRollWidth - 210) < 2;
    const isSnapped = isLetterSnap || isA4Snap;

    const curW = targetWidth;
    const curH = targetHeight;

    return (
      <div className={cn("space-y-6", isMobileView ? "p-4 pt-1 pb-40" : "p-4")}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 bg-card px-2 py-1 rounded-md shadow-sm border border-border/20">
              <Maximize2 className="h-3.5 w-3.5 text-primary" /> {lang === 'es' ? 'Dimensiones' : 'Dimensions'}
            </h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="lock" className="text-[8px] font-black text-muted-foreground uppercase cursor-pointer">{t.keepAspectRatio}</Label>
              <Switch id="lock" checked={lockAspect} onCheckedChange={setLockAspect} className="scale-75 origin-right" />
            </div>
          </div>

          <div className="bg-card p-4 rounded-xl border border-primary/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Expand className="h-3 w-3 text-primary" />
                <Label htmlFor="giant" className="text-[9px] font-black uppercase text-primary tracking-widest cursor-pointer">Gigantografía</Label>
              </div>
              <Switch id="giant" checked={isGiantMode} onCheckedChange={setIsGiantMode} className="scale-75 origin-right" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[8px] font-bold text-muted-foreground uppercase">{t.width} (cm)</Label>
                <span className="text-xs font-black text-primary">{curW} cm</span>
              </div>
              <div className="flex items-center gap-3">
                <Input value={curW} onChange={(e) => handleWidthChange(e.target.value)} className="w-20 h-8 font-black text-xs text-primary bg-primary/5 border-primary/20" />
                <Slider value={[parseNum(curW)]} onValueChange={(v) => handleWidthChange(v[0].toString())} min={1} max={isGiantMode ? GIANT_MAX_CM : DEFAULT_MAX_CM} step={0.1} className="flex-1" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[8px] font-bold text-muted-foreground uppercase">{t.height} (cm)</Label>
                <span className="text-xs font-black text-primary">{curH} cm</span>
              </div>
              <div className="flex items-center gap-3">
                <Input value={curH} onChange={(e) => handleHeightChange(e.target.value)} className="w-20 h-8 font-black text-xs text-primary bg-primary/5 border-primary/20" />
                <Slider value={[parseNum(curH)]} onValueChange={(v) => handleHeightChange(v[0].toString())} min={1} max={isGiantMode ? GIANT_MAX_CM : DEFAULT_MAX_CM} step={0.1} className="flex-1" />
              </div>
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />

        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 bg-card px-2 py-1 rounded-md shadow-sm border border-border/20">
            <Settings2 className="h-3.5 w-3.5 text-amber-600" /> {lang === 'es' ? 'Impresión' : 'Print'}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.paperSize}</Label>
              <Select value={paperSize} onValueChange={(v) => { setPaperSize(v); setTimeout(syncGrid, 0); }}>
                <SelectTriggerUI className="h-8 rounded-lg text-xs font-bold bg-card border-border/10"><SelectValue /></SelectTriggerUI>
                <SelectContent className="z-[1000]">{Object.keys(PAPER_DIMENSIONS).map(key => <SelectItem key={key} value={key} className="text-xs font-bold">{key}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {!paperSize.includes('Personalizado') && (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.orientation}</Label>
                <Select value={orientation} onValueChange={(v: any) => { setOrientation(v); setTimeout(syncGrid, 0); }}>
                  <SelectTriggerUI className="h-8 rounded-lg text-xs font-bold bg-card border-border/10"><SelectValue /></SelectTriggerUI>
                  <SelectContent className="z-[1000]"><SelectItem value="portrait" className="text-xs font-bold">{t.portrait}</SelectItem><SelectItem value="landscape" className="text-xs font-bold">{t.landscape}</SelectItem></SelectContent>
                </Select>
              </div>
            )}
          </div>

          {paperSize.includes('Personalizado') && (
            <div className={cn("p-4 rounded-xl border transition-all space-y-4 shadow-sm", isSnapped ? "bg-primary/10 border-primary/40 ring-4 ring-primary/5" : "bg-amber-500/5 border-amber-500/10")}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ScrollText className={cn("h-3.5 w-3.5", isSnapped ? "text-primary" : "text-amber-600")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", isSnapped ? "text-primary" : "text-amber-700")}>{lang === 'es' ? 'Ajustes de Rollo' : 'Roll Settings'}</span>
                </div>
                {isSnapped && (<Badge className="bg-primary text-white text-[7px] px-1.5 py-0.5 rounded-sm">{isLetterSnap ? 'Carta Snap' : 'A4 Snap'}</Badge>)}
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between"><Label className="text-[8px] font-bold text-muted-foreground uppercase">{t.rollWidth}</Label><span className={cn("text-[10px] font-black", isSnapped ? "text-primary" : "text-amber-600")}>{(customRollWidth/10).toFixed(1)} cm</span></div>
                  <Slider value={[customRollWidth]} onValueChange={(v) => { let val = v[0]; if (Math.abs(val-210)<3) val=210; if (Math.abs(val-215.9)<3) val=215.9; setCustomRollWidth(val); setTimeout(syncGrid, 0); }} min={100} max={1600} step={0.1} />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between"><Label className="text-[8px] font-bold text-muted-foreground uppercase">Largo Automático</Label><span className="text-[10px] font-black text-muted-foreground">{(customRollLength/10).toFixed(1)} cm</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden border"><div className="h-full bg-primary/40" style={{ width: `${(customRollLength/MAX_ROLL_LENGTH_MM)*100}%` }} /></div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black uppercase text-muted-foreground"><Scissors className="h-3 w-3 inline mr-1" /> {t.overlap}</Label>
              <span className="text-xs font-black text-amber-600">{overlap} cm</span>
            </div>
            <Slider value={[overlap]} onValueChange={(v) => { setOverlap(v[0]); setTimeout(syncGrid, 0); }} min={0} max={10} step={0.1} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor="g">{t.guides}</Label><Switch id="g" checked={showGuides} onCheckedChange={setShowGuides} className="bg-muted scale-75" /></div>
            <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor="o">{t.outline}</Label><Switch id="o" checked={showOutline} onCheckedChange={setShowOutline} className="bg-muted scale-75" /></div>
          </div>
        </div>
        
        <Collapsible open={isInfoOpen} onOpenChange={setIsInfoOpen} className="mt-8">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 rounded-xl transition-all">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">{isInfoOpen ? t.closeInfo : t.learnMore}</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-primary transition-transform", isInfoOpen ? "rotate-180" : "rotate-0")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4 text-left">
            <p className="text-xs text-muted-foreground font-medium leading-relaxed">{t.posterSeoIntro}</p>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen w-full font-body bg-background text-foreground overflow-hidden">
      <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-50 shadow-sm shrink-0 sticky top-0">
        <div className="flex items-center gap-2 lg:gap-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 font-bold text-muted-foreground px-2">
              <ChevronLeft className="h-4 w-4" /> 
              <span className="hidden lg:inline">Inicio</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="w-6 h-6 lg:w-8 lg:h-8 relative overflow-hidden rounded-lg shadow-sm bg-white border border-border/10">
              <Image src={logo} alt="Logo" fill className="object-contain" />
            </div>
            <h1 className="text-lg lg:text-xl font-headline font-black tracking-tighter text-primary uppercase">CUADRÍCULA POSTER</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <ThemeToggle />
          <LanguageSelector language={lang} setLanguage={setLang} />
          <Button className="hidden lg:flex bg-primary hover:bg-primary/90 text-white font-black gap-2 h-10 px-6 rounded-xl shadow-md transition-all active:scale-95 text-xs" onClick={handleExport} disabled={!image || isExporting}>
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
            {isExporting ? "..." : t.export}
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        <section className={cn(
          "flex-1 relative bg-muted/30 flex flex-col items-center overflow-y-auto lg:overflow-hidden",
          !image ? "justify-center" : "justify-start"
        )}>
          {!image ? (
            <div className="max-w-lg w-full px-6 lg:p-8 animate-fade-in text-center flex flex-col gap-6 lg:gap-8">
              <ImageUploader onImageUpload={handleImageUpload} language={lang} t={t} />
              <div className="space-y-2">
                <h2 className="text-2xl lg:text-3xl font-headline font-black tracking-tighter">Preparar poster</h2>
                <p className="text-muted-foreground font-medium text-sm lg:text-base">Sube una imagen de alta resolución.</p>
              </div>
            </div>
          ) : (
            <>
              {physicalInfo && (
                <div className="absolute top-4 lg:top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-5xl px-4 lg:px-8">
                  <div className="bg-background/80 backdrop-blur-xl border border-primary/20 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] px-4 lg:px-6 py-2 lg:py-3 rounded-2xl flex items-center justify-between pointer-events-auto animate-fade-in">
                    <div className="flex items-center gap-3 lg:gap-6">
                      <div className="flex flex-col">
                        <span className="text-[6px] lg:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{t.finalMeasures}</span>
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          <Maximize2 className="h-2.5 w-2.5 lg:h-3.5 lg:w-3.5 text-primary" />
                          <span className="text-xs lg:text-base font-black text-foreground">{physicalInfo.imgW} x {physicalInfo.imgH} cm</span>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-6 lg:h-8 opacity-50" />
                      <div className="flex flex-col">
                        <span className="text-[6px] lg:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Paneles</span>
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          <Layers className="h-2.5 w-2.5 lg:h-3.5 lg:w-3.5 text-amber-500" />
                          <span className="text-xs lg:text-base font-black text-foreground">{rows * cols} <span className="hidden sm:inline">{lang === 'es' ? 'HOJAS' : 'SHEETS'}</span></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 lg:gap-4">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => setImage(null)}
                        className="h-8 lg:h-10 text-[10px] lg:text-xs font-black uppercase gap-2 rounded-xl border border-border/50 shadow-sm"
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline">{lang === 'es' ? 'Cambiar Imagen' : 'Change Image'}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="w-full h-[calc(100svh-4rem)] p-4 lg:p-8 flex flex-col pt-20 lg:pt-24 overflow-hidden">
                <div className="flex-1 min-h-0">
                  <MuralCanvas 
                    imageUrl={image.url} 
                    rows={rows} 
                    cols={cols} 
                    overlap={overlap} 
                    marginV={marginV} 
                    marginH={marginH}
                    paperSize={paperSize} 
                    orientation={orientation}
                    showGuides={showGuides} 
                    showOutline={showOutline}
                    imageWidth={parseNum(targetWidth)} 
                    imageHeight={parseNum(targetHeight)} 
                    customPaperWidth={customRollWidth} 
                    customPaperHeight={customRollLength} 
                  />
                </div>
              </div>
            </>
          )}
        </section>
        <aside className="hidden lg:block w-80 border-l border-border bg-background overflow-y-auto shadow-xl z-10 shrink-0 h-full">
          {renderSettings()}
        </aside>
      </main>

      <div className="lg:hidden fixed bottom-6 right-6 z-40 pointer-events-auto flex gap-3">
        {image && (
          <Button 
            className="h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-2xl px-8" 
            onClick={handleExport} 
            disabled={isExporting}
          >
            {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileDown className="h-5 w-5" />}
          </Button>
        )}
        <Sheet open={isMenuOpen} onOpenChange={handleMenuOpenChange}>
          <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-primary text-white border-4 border-white" onClick={() => setIsMenuOpen(true)}>
            <Settings2 className="h-6 w-6" />
          </Button>
          <SheetContent side="right" className="w-[85%] sm:w-[400px] p-0 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col z-[150]">
            <SheetHeader className="sr-only"><SheetTitle>Ajustes</SheetTitle></SheetHeader>
            <div className="p-3 bg-primary/5 flex flex-col gap-3">
              <Button className="w-full h-12 bg-primary text-white font-black rounded-xl" onClick={handleExport} disabled={!image || isExporting}>
                {isExporting ? "Generando..." : t.export}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto relative">
              {renderSettings(true)}
              <Button 
                size="icon" 
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-primary text-white z-[210] border-4 border-white" 
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings2 className="h-6 w-6" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
