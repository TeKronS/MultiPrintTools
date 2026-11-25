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
  ChevronLeft,
  Maximize2,
  Ruler,
  Zap,
  Square,
  Info,
  ChevronDown,
  Expand,
  ScrollText,
  Maximize,
  FileText
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

  const [customRollWidth, setCustomRollWidth] = useState(210); // A4 por defecto (210mm)
  const [customRollLength, setCustomRollLength] = useState(1000);

  const [targetWidth, setTargetWidth] = useState<string>('0');
  const [targetHeight, setTargetHeight] = useState<string>('0');

  // Draft states for mobile menu
  const [draftRows, setDraftRows] = useState(2);
  const [draftCols, setDraftCols] = useState(2);
  const [draftOverlap, setDraftOverlap] = useState(0.3);
  const [draftMarginV, setDraftMarginV] = useState(0.7);
  const [draftMarginH, setDraftMarginH] = useState(0.7);
  const [draftPaperSize, setDraftPaperSize] = useState('Carta');
  const [draftOrientation, setDraftOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [draftShowGuides, setDraftShowGuides] = useState(true);
  const [draftShowOutline, setDraftShowOutline] = useState(false);
  const [draftLockAspect, setDraftLockAspect] = useState(true);
  const [draftIsGiantMode, setDraftIsGiantMode] = useState(false);
  const [draftTargetWidth, setDraftTargetWidth] = useState<string>('0');
  const [draftTargetHeight, setDraftTargetHeight] = useState<string>('0');
  const [draftCustomRollWidth, setDraftCustomRollWidth] = useState(210);
  const [draftCustomRollLength, setDraftCustomRollLength] = useState(1000);

  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pref-lang') as Language;
    if (savedLang === 'en' || savedLang === 'es') setLang(savedLang);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      window.history.pushState({ menuOpen: true }, '');
    }
    const handlePopState = () => { if (isMenuOpen) setIsMenuOpen(false); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isMenuOpen]);

  const t = translations[lang];

  const parseNum = (val: string): number => {
    const normalized = val.toString().replace(',', '.');
    return parseFloat(normalized) || 0;
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
      const rollWidth = cW_mm || 210;
      // Detect based on image shape to minimize pages
      const isLandscapeImage = targetW_mm > targetH_mm;
      const finalOrient = isLandscapeImage ? 'landscape' : 'portrait';
      
      const appliedMH = finalOrient === 'portrait' ? mH_cm : mV_cm;
      const appliedMV = finalOrient === 'portrait' ? mV_cm : mH_cm;
      
      const fixedDimPrintable = rollWidth - ((finalOrient === 'landscape' ? appliedMV : appliedMH) * 20);
      const variableDimPrintable = MAX_ROLL_LENGTH_MM - ((finalOrient === 'landscape' ? appliedMH : appliedMV) * 20);
      
      const effectiveFixed = fixedDimPrintable - overlap_mm;
      const effectiveVariable = variableDimPrintable - overlap_mm;

      const fixedPanels = Math.ceil(((finalOrient === 'landscape' ? targetH_mm : targetW_mm) - overlap_mm) / effectiveFixed);
      const variablePanels = Math.ceil(((finalOrient === 'landscape' ? targetW_mm : targetH_mm) - overlap_mm) / effectiveVariable);

      // Auto length
      const neededLength = ((finalOrient === 'landscape' ? targetW_mm : targetH_mm)) + ((finalOrient === 'landscape' ? appliedMH : appliedMV) * 20) + overlap_mm;
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
        
        const appliedMH = orient === 'portrait' ? mH_cm : mV_cm;
        const appliedMV = orient === 'portrait' ? mV_cm : mH_cm;
        
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

  const syncGrid = (targetPaperSize?: string, isDraftMode?: boolean) => {
    if (!image) return;
    const curWVal = isDraftMode ? draftTargetWidth : targetWidth;
    const curHVal = isDraftMode ? draftTargetHeight : targetHeight;
    const w = parseNum(curWVal);
    const h = parseNum(curHVal);
    const pSize = targetPaperSize || (isDraftMode ? draftPaperSize : paperSize);
    const ov = isDraftMode ? draftOverlap : overlap;
    const mV = isDraftMode ? draftMarginV : marginV;
    const mH = isDraftMode ? draftMarginH : marginH;
    const cW = isDraftMode ? draftCustomRollWidth : customRollWidth;

    const opt = calculateOptimizedGrid(w, h, pSize, ov, mV, mH, cW);
    
    if (isDraftMode) {
      setDraftRows(opt.rows);
      setDraftCols(opt.cols);
      setDraftOrientation(opt.orientation);
      if (opt.dynamicLength) setDraftCustomRollLength(opt.dynamicLength);
    } else {
      setRows(opt.rows);
      setCols(opt.cols);
      setOrientation(opt.orientation);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    }
  };

  const handleWidthChange = (val: string, isDraftMode?: boolean) => {
    if (!image) return;
    const num = parseNum(val);
    const setW = isDraftMode ? setDraftTargetWidth : setTargetWidth;
    const setH = isDraftMode ? setDraftTargetHeight : setTargetHeight;
    const isLocked = isDraftMode ? draftLockAspect : lockAspect;

    if (isNaN(num)) { setW(val); return; }

    let finalW = num;
    let finalH = parseNum(isDraftMode ? draftTargetHeight : targetHeight);

    if (isLocked) {
      const aspect = image.width / image.height;
      finalH = num / aspect;
      setH(finalH.toFixed(2).replace('.', ','));
    }
    setW(num.toString());

    const pSize = isDraftMode ? draftPaperSize : paperSize;
    const ov = isDraftMode ? draftOverlap : overlap;
    const mV = isDraftMode ? draftMarginV : marginV;
    const mH = isDraftMode ? draftMarginH : marginH;
    const cW = isDraftMode ? draftCustomRollWidth : customRollWidth;

    const opt = calculateOptimizedGrid(finalW, finalH, pSize, ov, mV, mH, cW);
    
    if (isDraftMode) {
      setDraftRows(opt.rows); setDraftCols(opt.cols); setDraftOrientation(opt.orientation);
      if (opt.dynamicLength) setDraftCustomRollLength(opt.dynamicLength);
    } else {
      setRows(opt.rows); setCols(opt.cols); setOrientation(opt.orientation);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    }
  };

  const handleHeightChange = (val: string, isDraftMode?: boolean) => {
    if (!image) return;
    const num = parseNum(val);
    const setW = isDraftMode ? setDraftTargetWidth : setTargetWidth;
    const setH = isDraftMode ? setDraftTargetHeight : setTargetHeight;
    const isLocked = isDraftMode ? draftLockAspect : lockAspect;

    if (isNaN(num)) { setH(val); return; }

    let finalH = num;
    let finalW = parseNum(isDraftMode ? draftTargetWidth : targetWidth);

    if (isLocked) {
      const aspect = image.width / image.height;
      finalW = num * aspect;
      setW(finalW.toFixed(2).replace('.', ','));
    }
    setH(num.toString());

    const pSize = isDraftMode ? draftPaperSize : paperSize;
    const ov = isDraftMode ? draftOverlap : overlap;
    const mV = isDraftMode ? draftMarginV : marginV;
    const mH = isDraftMode ? draftMarginH : marginH;
    const cW = isDraftMode ? draftCustomRollWidth : customRollWidth;

    const opt = calculateOptimizedGrid(finalW, finalH, pSize, ov, mV, mH, cW);
    
    if (isDraftMode) {
      setDraftRows(opt.rows); setDraftCols(opt.cols); setDraftOrientation(opt.orientation);
      if (opt.dynamicLength) setDraftCustomRollLength(opt.dynamicLength);
    } else {
      setRows(opt.rows); setCols(opt.cols); setOrientation(opt.orientation);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    }
  };

  const handleImageUpload = (file: File, url: string) => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage({ file, url, width: img.width, height: img.height });
      const aspect = img.width / img.height;
      const initialW = 40; 
      const initialH = initialW / aspect;
      
      setTargetWidth(initialW.toString());
      setTargetHeight(initialH.toFixed(2).replace('.', ','));
      
      const opt = calculateOptimizedGrid(initialW, initialH, paperSize, overlap, marginV, marginH, customRollWidth);
      setRows(opt.rows);
      setCols(opt.cols);
      setOrientation(opt.orientation);
      if (opt.dynamicLength) setCustomRollLength(opt.dynamicLength);
    };
  };

  const handleMenuOpenChange = (open: boolean) => {
    if (open) {
      setDraftRows(rows); setDraftCols(cols); setDraftOverlap(overlap);
      setDraftMarginV(marginV); setDraftMarginH(marginH); setDraftPaperSize(paperSize);
      setDraftOrientation(orientation); setDraftShowGuides(showGuides);
      setDraftShowOutline(showOutline); setDraftLockAspect(lockAspect);
      setDraftIsGiantMode(isGiantMode); setDraftTargetWidth(targetWidth);
      setDraftTargetHeight(targetHeight); setDraftCustomRollWidth(customRollWidth);
      setDraftCustomRollLength(customRollLength);
    } else {
      setRows(draftRows); setCols(draftCols); setOverlap(draftOverlap);
      setMarginV(draftMarginV); setMarginH(draftMarginH); setPaperSize(draftPaperSize);
      setOrientation(draftOrientation); setShowGuides(draftShowGuides);
      setShowOutline(draftShowOutline); setLockAspect(draftLockAspect);
      setIsGiantMode(draftIsGiantMode); setTargetWidth(draftTargetWidth);
      setTargetHeight(draftTargetHeight); setCustomRollWidth(draftCustomRollWidth);
      setCustomRollLength(draftCustomRollLength);
    }
    setIsMenuOpen(open);
  };

  const handleExport = async () => {
    if (!image) return;
    setIsExporting(true);
    try {
      const img = new window.Image();
      img.src = image.url;
      await new Promise((resolve) => img.onload = resolve);

      const activeRows = isMenuOpen ? draftRows : rows;
      const activeCols = isMenuOpen ? draftCols : cols;
      const activeOverlap = isMenuOpen ? draftOverlap : overlap;
      const activeMarginV = isMenuOpen ? draftMarginV : marginV;
      const activeMarginH = isMenuOpen ? draftMarginH : marginH;
      const activePaperSize = isMenuOpen ? draftPaperSize : paperSize;
      const activeOrientation = isMenuOpen ? draftOrientation : orientation;
      const activeTargetW = parseNum(isMenuOpen ? draftTargetWidth : targetWidth);
      const activeTargetH = parseNum(isMenuOpen ? draftTargetHeight : targetHeight);
      const activeRollW = isMenuOpen ? draftCustomRollWidth : customRollWidth;
      const activeRollL = isMenuOpen ? draftCustomRollLength : customRollLength;

      const paperBase = PAPER_DIMENSIONS[activePaperSize];
      const isRoll = activePaperSize.includes('Personalizado');
      
      let paperW, paperH;
      if (isRoll) {
        paperW = activeOrientation === 'portrait' ? activeRollW : activeRollL;
        paperH = activeOrientation === 'portrait' ? activeRollL : activeRollW;
      } else {
        paperW = activeOrientation === 'portrait' ? Math.min(paperBase.width, paperBase.height) : Math.max(paperBase.width, paperBase.height);
        paperH = activeOrientation === 'portrait' ? Math.max(paperBase.width, paperBase.height) : Math.min(paperBase.width, paperBase.height);
      }

      const pdf = new jsPDF({
        orientation: activeOrientation === 'portrait' ? 'p' : 'l',
        unit: 'mm',
        format: [paperW, paperH]
      });

      const appliedMH = activeOrientation === 'portrait' ? activeMarginH : activeMarginV;
      const appliedMV = activeOrientation === 'portrait' ? activeMarginV : activeMarginH;

      const printableW = paperW - (appliedMH * 20);
      const printableH = paperH - (appliedMV * 20);
      const overlapMm = activeOverlap * 10;
      const effectiveSheetW = printableW - overlapMm;
      const effectiveSheetH = printableH - overlapMm;

      const totalGridW = (activeCols * effectiveSheetW) + overlapMm;
      const totalGridH = (activeRows * effectiveSheetH) + overlapMm;

      const finalW_mm = activeTargetW * 10;
      const finalH_mm = activeTargetH * 10;
      const offsetX_mm = (totalGridW - finalW_mm) / 2;
      const offsetY_mm = (totalGridH - finalH_mm) / 2;

      // Quality settings
      const targetDPI = 300;
      const outputPxPerMm = targetDPI / 25.4;
      
      // Calculate independent scales for high fidelity distorsion (if ratio lock is off)
      const sourcePxPerMmW = img.width / finalW_mm;
      const sourcePxPerMmH = img.height / finalH_mm;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas fail");

      for (let r = 0; r < activeRows; r++) {
        for (let c = 0; c < activeCols; c++) {
          if (r > 0 || c > 0) {
            pdf.addPage([paperW, paperH], activeOrientation === 'portrait' ? 'p' : 'l');
          }
          
          const sheetLeft_mm = c * effectiveSheetW;
          const sheetTop_mm = r * effectiveSheetH;
          
          const drawInSheetX_mm = Math.max(0, offsetX_mm - sheetLeft_mm);
          const drawInSheetY_mm = Math.max(0, offsetY_mm - sheetTop_mm);
          
          const visibleW_mm = Math.min(effectiveSheetW + overlapMm - drawInSheetX_mm, finalW_mm - Math.max(0, sheetLeft_mm - offsetX_mm));
          const visibleH_mm = Math.min(effectiveSheetH + overlapMm - drawInSheetY_mm, finalH_mm - Math.max(0, sheetTop_mm - offsetY_mm));

          const sx = Math.max(0, (sheetLeft_mm - offsetX_mm) * sourcePxPerMmW);
          const sy = Math.max(0, (sheetTop_mm - offsetY_mm) * sourcePxPerMmH);
          const sw = visibleW_mm * sourcePxPerMmW;
          const sh = visibleH_mm * sourcePxPerMmH;

          const dw = visibleW_mm * outputPxPerMm;
          const dh = visibleH_mm * outputPxPerMm;

          if (sw > 0 && sh > 0) {
            canvas.width = Math.max(1, dw);
            canvas.height = Math.max(1, dh);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
            
            pdf.addImage(
              canvas.toDataURL('image/jpeg', 0.95), 
              'JPEG', 
              (appliedMH * 10) + drawInSheetX_mm, 
              (appliedMV * 10) + drawInSheetY_mm, 
              visibleW_mm, 
              visibleH_mm
            );
          }

          if (isMenuOpen ? draftShowGuides : showGuides) {
            pdf.setDrawColor(220);
            pdf.setLineDashPattern([2, 2], 0);
            if (c < activeCols - 1) {
              const gx = (appliedMH * 10) + (printableW - overlapMm);
              pdf.line(gx, appliedMV * 10, gx, appliedMV * 10 + printableH);
            }
            if (r < activeRows - 1) {
              const gy = (appliedMV * 10) + (printableH - overlapMm);
              pdf.line(appliedMH * 10, gy, appliedMH * 10 + printableW, gy);
            }
          }
          
          pdf.setFontSize(7);
          pdf.setTextColor(180);
          const footerText = `MULTIPRINTTOOLS | ${t.muralisTitle.toUpperCase()} | PANEL ${r+1}-${c+1} | ${activePaperSize} (${activeOrientation === 'portrait' ? 'P' : 'L'})`;
          pdf.text(footerText, appliedMH * 10, paperH - (appliedMV * 5));
        }
      }
      
      const fileName = `PosterGrid_${activeTargetW}x${activeTargetH}cm_${activePaperSize.replace(/\s/g, '')}_MultiPrint.pdf`;
      pdf.save(fileName);
      toast({ title: t.export, description: "Documento exportado en alta resolución." });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar el PDF." });
    } finally {
      setIsExporting(false);
    }
  };

  const physicalInfo = useMemo(() => {
    if (!image) return null;
    const tw = parseNum(targetWidth);
    const th = parseNum(targetHeight);
    
    let p;
    if (paperSize.includes('Personalizado')) { 
      if (orientation === 'portrait') { p = { width: customRollWidth, height: customRollLength }; } 
      else { p = { width: customRollLength, height: customRollWidth }; } 
    } else { 
      const pB = PAPER_DIMENSIONS[paperSize]; 
      p = orientation === 'portrait' 
        ? { width: Math.min(pB.width, pB.height), height: Math.max(pB.width, pB.height) } 
        : { width: Math.max(pB.width, pB.height), height: Math.min(pB.width, pB.height) }; 
    }

    const appliedMH = orientation === 'portrait' ? marginH : marginV;
    const appliedMV = orientation === 'portrait' ? marginV : marginH;
    
    const pW = p.width - (appliedMH * 20); 
    const pH = p.height - (appliedMV * 20);
    const ovMm = overlap * 10; 
    const eW = pW - ovMm; 
    const eH = pH - ovMm;
    const tGW = (cols * eW) + ovMm; 
    const tGH = (rows * eH) + ovMm;

    return { 
      imgW: tw.toFixed(1), 
      imgH: th.toFixed(1), 
      paperName: paperSize,
      printableW: (pW / 10).toFixed(1), 
      printableH: (pH / 10).toFixed(1), 
      blankW: Math.max(0, (tGW - (tw * 10)) / 10).toFixed(1), 
      blankH: Math.max(0, (tGH - (th * 10)) / 10).toFixed(1) 
    };
  }, [image, rows, cols, overlap, marginV, marginH, paperSize, orientation, targetWidth, targetHeight, customRollWidth, customRollLength]);

  const renderSettings = (isMobileView?: boolean) => {
    const cW = isMobileView ? draftCustomRollWidth : customRollWidth;
    const cL = isMobileView ? draftCustomRollLength : customRollLength;
    const isLetterSnap = Math.abs(cW - 215.9) < 1;
    const isA4Snap = Math.abs(cW - 210) < 1;
    const isSnapped = isLetterSnap || isA4Snap;
    const pS = isMobileView ? draftPaperSize : paperSize;
    const orient = isMobileView ? draftOrientation : orientation;
    const tW = isMobileView ? draftTargetWidth : targetWidth;
    const tH = isMobileView ? draftTargetHeight : targetHeight;
    const isLocked = isMobileView ? draftLockAspect : lockAspect;
    const isGiant = isMobileView ? draftIsGiantMode : isGiantMode;
    const ov = isMobileView ? draftOverlap : overlap;
    const mV = isMobileView ? draftMarginV : marginV;
    const mH = isMobileView ? draftMarginH : marginH;
    const sG = isMobileView ? draftShowGuides : showGuides;
    const sO = isMobileView ? draftShowOutline : showOutline;

    return (
      <div className={cn("space-y-6", isMobileView ? "p-4 pt-1 pb-40" : "p-4")}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 bg-card px-2 py-1 rounded-md shadow-sm border border-border/20">
              <Maximize2 className="h-3.5 w-3.5 text-primary" /> {lang === 'es' ? 'Dimensiones' : 'Dimensions'}
            </h2>
            <div className="flex items-center gap-2">
              <Label htmlFor="lock" className="text-[8px] font-black text-muted-foreground uppercase cursor-pointer">{t.keepAspectRatio}</Label>
              <Switch id="lock" checked={isLocked} onCheckedChange={(v) => { if (isMobileView) setDraftLockAspect(v); else setLockAspect(v); }} className="scale-75 origin-right" />
            </div>
          </div>

          <div className="bg-card p-4 rounded-xl border border-primary/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Expand className="h-3 w-3 text-primary" />
                <Label htmlFor="giant" className="text-[9px] font-black uppercase text-primary tracking-widest cursor-pointer">Gigantografía</Label>
              </div>
              <Switch id="giant" checked={isGiant} onCheckedChange={(v) => { if (isMobileView) setDraftIsGiantMode(v); else setIsGiantMode(v); }} className="scale-75 origin-right" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[8px] font-bold text-muted-foreground uppercase">{t.width} (cm)</Label>
                <span className="text-xs font-black text-primary">{tW} cm</span>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  type="number" 
                  step="0.1" 
                  value={tW.toString().replace(',', '.')} 
                  onChange={(e) => handleWidthChange(e.target.value, !!isMobileView)} 
                  className="w-24 h-9 font-black text-sm text-primary bg-primary/5 border-primary/20" 
                />
                <Slider value={[parseNum(tW)]} onValueChange={(v) => handleWidthChange(v[0].toString(), !!isMobileView)} min={1} max={isGiant ? GIANT_MAX_CM : DEFAULT_MAX_CM} step={0.1} className="flex-1" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-[8px] font-bold text-muted-foreground uppercase">{t.height} (cm)</Label>
                <span className="text-xs font-black text-primary">{tH} cm</span>
              </div>
              <div className="flex items-center gap-3">
                <Input 
                  type="number" 
                  step="0.1" 
                  value={tH.toString().replace(',', '.')} 
                  onChange={(e) => handleHeightChange(e.target.value, !!isMobileView)} 
                  className="w-24 h-9 font-black text-sm text-primary bg-primary/5 border-primary/20" 
                />
                <Slider value={[parseNum(tH)]} onValueChange={(v) => handleHeightChange(v[0].toString(), !!isMobileView)} min={1} max={isGiant ? GIANT_MAX_CM : DEFAULT_MAX_CM} step={0.1} className="flex-1" />
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
              <Select value={pS} onValueChange={(v) => { if (isMobileView) setDraftPaperSize(v); else setPaperSize(v); syncGrid(v, !!isMobileView); }}>
                <SelectTriggerUI className="h-8 rounded-lg text-xs font-bold bg-card border-border/10"><SelectValue /></SelectTriggerUI>
                <SelectContent className="z-[1000]">{Object.keys(PAPER_DIMENSIONS).map(key => <SelectItem key={key} value={key} className="text-xs font-bold">{key}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {!pS.includes('Personalizado') && (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.orientation}</Label>
                <Select value={orient} onValueChange={(v: any) => { if (isMobileView) setDraftOrientation(v); else setOrientation(v); setTimeout(() => syncGrid(undefined, !!isMobileView), 0); }}>
                  <SelectTriggerUI className="h-8 rounded-lg text-xs font-bold bg-card border-border/10"><SelectValue /></SelectTriggerUI>
                  <SelectContent className="z-[1000]"><SelectItem value="portrait" className="text-xs font-bold">{t.portrait}</SelectItem><SelectItem value="landscape" className="text-xs font-bold">{t.landscape}</SelectItem></SelectContent>
                </Select>
              </div>
            )}
          </div>

          {pS.includes('Personalizado') && (
            <div className={cn("p-4 rounded-xl border transition-all space-y-4 shadow-sm bg-primary/5 border-primary/20")}>
              <div className="flex items-center gap-2 mb-1">
                <ScrollText className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{lang === 'es' ? 'Ajustes de Rollo' : 'Roll Settings'}</span>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-[8px] font-bold text-muted-foreground uppercase">Ancho del Material</Label>
                  <div className="grid grid-cols-3 gap-1">
                    <Button 
                      variant={isA4Snap ? "default" : "outline"} 
                      size="sm" 
                      className="h-7 text-[9px] font-black rounded-lg"
                      onClick={() => {
                        if (isMobileView) setDraftCustomRollWidth(210); else setCustomRollWidth(210);
                        setTimeout(() => syncGrid(undefined, !!isMobileView), 0);
                      }}
                    >A4 (21cm)</Button>
                    <Button 
                      variant={isLetterSnap ? "default" : "outline"} 
                      size="sm" 
                      className="h-7 text-[9px] font-black rounded-lg"
                      onClick={() => {
                        if (isMobileView) setDraftCustomRollWidth(215.9); else setCustomRollWidth(215.9);
                        setTimeout(() => syncGrid(undefined, !!isMobileView), 0);
                      }}
                    >CARTA (21.6cm)</Button>
                    <Button 
                      variant={(!isSnapped) ? "default" : "outline"} 
                      size="sm" 
                      className="h-7 text-[9px] font-black rounded-lg"
                      onClick={() => {
                        if (isSnapped) {
                           if (isMobileView) setDraftCustomRollWidth(300); else setCustomRollWidth(300);
                        }
                        setTimeout(() => syncGrid(undefined, !!isMobileView), 0);
                      }}
                    >OTRO</Button>
                  </div>
                </div>

                <div className="space-y-1 animate-in slide-in-from-top-1 duration-200">
                  <div className="flex justify-between">
                    <Label className="text-[8px] font-bold text-muted-foreground uppercase">Ancho del Rollo</Label>
                    <span className="text-[10px] font-black text-primary">{(cW/10).toFixed(1)} cm</span>
                  </div>
                  <Slider value={[cW]} onValueChange={(v) => { 
                    if (isMobileView) setDraftCustomRollWidth(v[0]); else setCustomRollWidth(v[0]); 
                    setTimeout(() => syncGrid(undefined, !!isMobileView), 0); 
                  }} min={100} max={1600} step={0.1} />
                </div>

                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label className="text-[8px] font-bold text-primary uppercase">Largo de Corte</Label>
                    <Badge className="bg-primary text-white text-[10px] font-black px-2 py-0.5 border-none shadow-sm">{(cL/10).toFixed(1)} cm</Badge>
                  </div>
                  <p className="text-[8px] text-muted-foreground font-medium leading-tight">
                    {lang === 'es' 
                      ? `Corta tiras de este largo para cada panel. El sistema generará ${isMobileView ? (draftRows * draftCols) : (rows * cols)} ${ (isMobileView ? (draftRows * draftCols) : (rows * cols)) === 1 ? 'tira' : 'tiras' }.` 
                      : `Cut strips of this length for each panel. System will generate ${isMobileView ? (draftRows * draftCols) : (rows * cols)} ${ (isMobileView ? (draftRows * draftCols) : (rows * cols)) === 1 ? 'strip' : 'strips' }.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black uppercase text-muted-foreground"><Scissors className="h-3 w-3 inline mr-1" /> {t.overlap}</Label>
              <span className="text-xs font-black text-amber-600">{ov} cm</span>
            </div>
            <Slider value={[ov]} onValueChange={(v) => { if (isMobileView) setDraftOverlap(v[0]); else setOverlap(v[0]); setTimeout(() => syncGrid(undefined, !!isMobileView), 0); }} min={0} max={10} step={0.1} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black uppercase text-muted-foreground"><Maximize className="h-3 w-3 inline mr-1" /> {t.marginsVertical}</Label>
              <span className="text-xs font-black text-primary">{mV} cm</span>
            </div>
            <Slider value={[mV]} onValueChange={(v) => { if (isMobileView) setDraftMarginV(v[0]); else setMarginV(v[0]); setTimeout(() => syncGrid(undefined, !!isMobileView), 0); }} min={0} max={5} step={0.1} />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black uppercase text-muted-foreground"><Maximize className="h-3 w-3 inline mr-1" /> {t.marginsHorizontal}</Label>
              <span className="text-xs font-black text-primary">{mH} cm</span>
            </div>
            <Slider value={[mH]} onValueChange={(v) => { if (isMobileView) setDraftMarginH(v[0]); else setMarginH(v[0]); setTimeout(() => syncGrid(undefined, !!isMobileView), 0); }} min={0} max={5} step={0.1} />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor="g">{t.guides}</Label><Switch id="g" checked={sG} onCheckedChange={(v) => { if (isMobileView) setDraftShowGuides(v); else setShowGuides(v); }} className="bg-muted scale-75" /></div>
            <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor="o">{t.outline}</Label><Switch id="o" checked={sO} onCheckedChange={(v) => { if (isMobileView) setDraftShowOutline(v); else setShowOutline(v); }} className="bg-muted scale-75" /></div>
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
          <CollapsibleContent className="space-y-6 pt-6 text-left">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{t.posterSeoTitle}</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">{t.posterSeoIntro}</p>
            </div>
            
            <div className="grid gap-4">
              <div className="p-3 bg-card border rounded-xl space-y-1">
                <h4 className="text-[10px] font-black text-primary uppercase">{t.posterSeoStep1Title}</h4>
                <p className="text-[10px] text-muted-foreground font-medium">{t.posterSeoStep1Desc}</p>
              </div>
              <div className="p-3 bg-card border rounded-xl space-y-1">
                <h4 className="text-[10px] font-black text-primary uppercase">{t.posterSeoStep2Title}</h4>
                <p className="text-[10px] text-muted-foreground font-medium">{t.posterSeoStep2Desc}</p>
              </div>
              <div className="p-3 bg-card border rounded-xl space-y-1">
                <h4 className="text-[10px] font-black text-primary uppercase">{t.posterSeoStep3Title}</h4>
                <p className="text-[10px] text-muted-foreground font-medium">{t.posterSeoStep3Desc}</p>
              </div>
              <div className="p-3 bg-card border rounded-xl space-y-1">
                <h4 className="text-[10px] font-black text-primary uppercase">{t.posterSeoStep4Title}</h4>
                <p className="text-[10px] text-muted-foreground font-medium">{t.posterSeoStep4Desc}</p>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-2xl border border-dashed">
              <h4 className="text-xs font-black text-foreground uppercase mb-1">{t.posterSeoWhyTitle}</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{t.posterSeoWhyDesc}</p>
            </div>
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
                <p className="text-muted-foreground font-medium text-sm lg:text-base">Sube una imagen de alta resolución para generar tu cuadrícula técnica.</p>
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
                        <span className="text-[6px] lg:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{t.paperSize}</span>
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          <FileText className="h-2.5 w-2.5 lg:h-3.5 lg:w-3.5 text-amber-600" />
                          <span className="text-xs lg:text-base font-black text-foreground uppercase">{physicalInfo.paperName}</span>
                        </div>
                      </div>
                      <Separator orientation="vertical" className="h-6 lg:h-8 opacity-50" />
                      <div className="flex flex-col">
                        <span className="text-[6px] lg:text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Paneles</span>
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          <Layers className="h-2.5 w-2.5 lg:h-3.5 lg:w-3.5 text-primary" />
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
          <Button size="icon" className="h-14 w-14 rounded-full shadow-2xl bg-primary text-white border-4 border-white" onClick={() => handleMenuOpenChange(true)}>
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
                onClick={() => handleMenuOpenChange(false)}
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
