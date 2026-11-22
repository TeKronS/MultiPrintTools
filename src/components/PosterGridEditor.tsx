
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
const GIANT_MAX_CM = 500;
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

  const [draftRows, setDraftRows] = useState(2);
  const [draftCols, setDraftCols] = useState(2);
  const [draftOverlap, setDraftOverlap] = useState(0.3);
  const [draftMarginV, setDraftMarginV] = useState(0.7);
  const [draftMarginH, setDraftMarginH] = useState(0.7);
  const [draftPaperSize, setDraftPaperSize] = useState('Carta');
  const [draftOrientation, setDraftOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [draftShowGuides, setDraftShowGuides] = useState(true);
  const [draftShowOutline, setDraftShowOutline] = useState(false);
  const [draftTargetWidth, setDraftTargetWidth] = useState<string>('0');
  const [draftTargetHeight, setDraftTargetHeight] = useState<string>('0');
  const [draftLockAspect, setDraftLockAspect] = useState(true);
  const [draftGiantMode, setDraftGiantMode] = useState(false);
  const [draftCustomRollWidth, setDraftCustomRollWidth] = useState(215.9);
  const [draftCustomRollLength, setDraftCustomRollLength] = useState(1000);

  const deferredRows = useDeferredValue(rows);
  const deferredCols = useDeferredValue(cols);
  const deferredOverlap = useDeferredValue(overlap);
  const deferredMarginV = useDeferredValue(marginV);
  const deferredMarginH = useDeferredValue(marginH);

  const [isExporting, setIsExporting] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    const savedLang = localStorage.getItem('pref-lang') as Language;
    if (savedLang === 'en' || savedLang === 'es') setLang(savedLang);
  }, []);

  const t = translations[lang];

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
    cW_mm?: number
  ) => {
    const targetW_mm = w_cm * 10;
    const targetH_mm = h_cm * 10;
    const overlap_mm = ov_cm * 10;

    const calcForOrientation = (orient: 'portrait' | 'landscape') => {
      let paper;
      let calculatedLength = 0;
      
      if (pSize.includes('Personalizado')) {
        const rollWidth = cW_mm || 215.9;
        // Determine natural orientation based on image dimensions for roll
        const isLandscapeImage = targetW_mm > targetH_mm;
        
        // If the user hasn't explicitly chosen, we force orientation to fit best
        const finalOrient = isLandscapeImage ? 'landscape' : 'portrait';
        
        if (finalOrient === 'landscape') {
          paper = { width: MAX_ROLL_LENGTH_MM, height: rollWidth };
        } else {
          paper = { width: rollWidth, height: MAX_ROLL_LENGTH_MM };
        }

        const { appliedMH, appliedMV } = getAppliedMargins(finalOrient, mV_cm, mH_cm);
        const printableW = (finalOrient === 'landscape' ? paper.width : paper.width) - (appliedMH * 20);
        const printableH = (finalOrient === 'landscape' ? paper.height : paper.height) - (appliedMV * 20);
        
        const effectiveW = printableW - overlap_mm;
        const effectiveH = printableH - overlap_mm;

        // How many panels in the 'fixed width' dimension?
        const crossPanels = Math.ceil(( (finalOrient === 'landscape' ? targetH_mm : targetW_mm) - overlap_mm) / ( (finalOrient === 'landscape' ? printableH : printableW) - overlap_mm));
        // How many panels in the 'variable length' dimension?
        const longPanels = Math.ceil(( (finalOrient === 'landscape' ? targetW_mm : targetH_mm) - overlap_mm) / ( (finalOrient === 'landscape' ? printableW : printableH) - overlap_mm));

        calculatedLength = Math.min(MAX_ROLL_LENGTH_MM, (isLandscapeImage ? targetW_mm : targetH_mm) + (appliedMV * 20) + overlap_mm);
        
        return { 
          rows: finalOrient === 'landscape' ? crossPanels : longPanels, 
          cols: finalOrient === 'landscape' ? longPanels : crossPanels, 
          total: crossPanels * longPanels, 
          orientation: finalOrient, 
          dynamicLength: calculatedLength 
        };
      } else {
        const paperBase = PAPER_DIMENSIONS[pSize];
        paper = orient === 'portrait' 
          ? { width: Math.min(paperBase.width, paperBase.height), height: Math.max(paperBase.width, paperBase.height) }
          : { width: Math.max(paperBase.width, paperBase.height), height: Math.min(paperBase.width, paperBase.height) };
        
        const { appliedMH, appliedMV } = getAppliedMargins(orient, mV_cm, mH_cm);
        const printableW = paper.width - (appliedMH * 20);
        const printableH = paper.height - (appliedMV * 20);
        const effectiveW = printableW - overlap_mm;
        const effectiveH = printableH - overlap_mm;
        
        const c = Math.ceil((targetW_mm - overlap_mm) / effectiveW);
        const r = Math.ceil((targetH_mm - overlap_mm) / effectiveH);
        
        return { rows: Math.max(1, r), cols: Math.max(1, c), total: r * c, orientation: orient };
      }
    };

    if (pSize.includes('Personalizado')) {
       const res = calcForOrientation('portrait'); // Internal logic handles best fit
       if (res.dynamicLength) {
         if (isMenuOpen) setDraftCustomRollLength(res.dynamicLength); else setCustomRollLength(res.dynamicLength);
       }
       return res;
    } else {
      const pResults = calcForOrientation('portrait');
      const lResults = calcForOrientation('landscape');
      return pResults.total <= lResults.total ? pResults : lResults;
    }
  };

  const syncGridFromTechnicalSettings = (isDraft: boolean) => {
    if (!image) return;
    const curWStr = isDraft ? draftTargetWidth : targetWidth;
    const curHStr = isDraft ? draftTargetHeight : targetHeight;
    const pSize = isDraft ? draftPaperSize : paperSize;
    const ov = isDraft ? draftOverlap : overlap;
    const mV = isDraft ? draftMarginV : marginV;
    const mH = isDraft ? draftMarginH : marginH;
    const cW = isDraft ? draftCustomRollWidth : customRollWidth;
    
    const opt = calculateOptimizedGrid(parseFloat(curWStr), parseFloat(curHStr), pSize, ov, mV, mH, cW);
    
    if (isDraft) { 
      setDraftRows(opt.rows); 
      setDraftCols(opt.cols); 
      setDraftOrientation(opt.orientation); 
    } else { 
      setRows(opt.rows); 
      setCols(opt.cols); 
      setOrientation(opt.orientation); 
    }
  };

  const handleWidthChange = (val: string, isDraft: boolean) => {
    if (!image) return;
    const num = Math.max(0.1, parseFloat(val));
    const isLocked = isDraft ? draftLockAspect : lockAspect;
    const pSize = isDraft ? draftPaperSize : paperSize;
    const cW = isDraft ? draftCustomRollWidth : customRollWidth;
    const setW = isDraft ? setDraftTargetWidth : setTargetWidth;
    const setH = isDraft ? setDraftTargetHeight : setTargetHeight;
    const setR = isDraft ? setDraftRows : setRows;
    const setC = isDraft ? setDraftCols : setCols;
    const setO = isDraft ? setDraftOrientation : setOrientation;

    if (isNaN(num)) { setW(val); return; }
    
    if (isLocked) {
      const aspect = image.width / image.height;
      const newHeight = num / aspect;
      setW(num.toString()); 
      setH(newHeight.toFixed(1));
      const opt = calculateOptimizedGrid(num, newHeight, pSize, isDraft ? draftOverlap : overlap, isDraft ? draftMarginV : marginV, isDraft ? draftMarginH : marginH, cW);
      setR(opt.rows); setC(opt.cols); setO(opt.orientation);
    } else {
      setW(num.toString());
      const curH = parseFloat(isDraft ? draftTargetHeight : targetHeight);
      const opt = calculateOptimizedGrid(num, curH, pSize, isDraft ? draftOverlap : overlap, isDraft ? draftMarginV : marginV, isDraft ? draftMarginH : marginH, cW);
      setR(opt.rows); setC(opt.cols); setO(opt.orientation);
    }
  };

  const handleHeightChange = (val: string, isDraft: boolean) => {
    if (!image) return;
    const num = Math.max(0.1, parseFloat(val));
    const isLocked = isDraft ? draftLockAspect : lockAspect;
    const pSize = isDraft ? draftPaperSize : paperSize;
    const cW = isDraft ? draftCustomRollWidth : customRollWidth;
    const setW = isDraft ? setDraftTargetWidth : setTargetWidth;
    const setH = isDraft ? setDraftTargetHeight : setTargetHeight;
    const setR = isDraft ? setDraftRows : setRows;
    const setC = isDraft ? setDraftCols : setCols;
    const setO = isDraft ? setDraftOrientation : setOrientation;

    if (isNaN(num)) { setH(val); return; }

    if (isLocked) {
      const aspect = image.width / image.height;
      const newWidth = num * aspect;
      setH(num.toString()); 
      setW(newWidth.toFixed(1));
      const opt = calculateOptimizedGrid(newWidth, num, pSize, isDraft ? draftOverlap : overlap, isDraft ? draftMarginV : marginV, isDraft ? draftMarginH : marginH, cW);
      setR(opt.rows); setC(opt.cols); setO(opt.orientation);
    } else {
      setH(num.toString());
      const curW = parseFloat(isDraft ? draftTargetWidth : targetWidth);
      const opt = calculateOptimizedGrid(curW, num, pSize, isDraft ? draftOverlap : overlap, isDraft ? draftMarginV : marginV, isDraft ? draftMarginH : marginH, cW);
      setR(opt.rows); setC(opt.cols); setO(opt.orientation);
    }
  };

  const handleImageUpload = (file: File, url: string) => {
    const img = new window.Image();
    img.src = url;
    img.onload = () => {
      setImage({ file, url, width: img.width, height: img.height });
      const pB = PAPER_DIMENSIONS[paperSize];
      const aspect = img.width / img.height;
      const calcSize = (orient: 'portrait' | 'landscape') => {
        const p = orient === 'portrait' ? { w: Math.min(pB.width, pB.height), h: Math.max(pB.width, pB.height) } : { w: Math.max(pB.width, pB.height), h: Math.min(pB.width, pB.height) };
        const { appliedMH, appliedMV } = getAppliedMargins(orient, marginV, marginH);
        const printableW = p.w - (appliedMH * 20); const printableH = p.h - (appliedMV * 20);
        const effW = printableW - (overlap * 10); const effH = printableH - (overlap * 10);
        const tGW = (2 * effW) + (overlap * 10); const tGH = (2 * effH) + (overlap * 10);
        let finalW, finalH;
        if (tGW / tGH > aspect) { finalH = tGH; finalW = finalH * aspect; } else { finalW = tGW; finalH = finalW / aspect; }
        return { w: finalW, h: finalH, area: finalW * finalH, orient };
      };
      const p = calcSize('portrait'); const l = calcSize('landscape'); const b = p.area >= l.area ? p : l;
      setRows(2); setCols(2); setOrientation(b.orient); setTargetWidth((b.w / 10).toFixed(1)); setTargetHeight((b.h / 10).toFixed(1)); setLockAspect(true);
    };
  };

  const handleMenuOpenChange = (open: boolean) => {
    if (open) {
      setDraftRows(rows); setDraftCols(cols); setDraftOverlap(overlap); setDraftMarginV(marginV); setDraftMarginH(marginH); setDraftPaperSize(paperSize); setDraftOrientation(orientation); setDraftShowGuides(showGuides); setDraftShowOutline(showOutline); setDraftTargetWidth(targetWidth); setDraftTargetHeight(targetHeight); setDraftLockAspect(lockAspect); setDraftGiantMode(isGiantMode); setDraftCustomRollWidth(customRollWidth); setDraftCustomRollLength(customRollLength);
    } else {
      setRows(draftRows); setCols(draftCols); setOverlap(draftOverlap); setMarginV(draftMarginV); setMarginH(draftMarginH); setPaperSize(draftPaperSize); setOrientation(draftOrientation); setShowGuides(draftShowGuides); setShowOutline(draftShowOutline); setTargetWidth(draftTargetWidth); setTargetHeight(draftTargetHeight); setLockAspect(draftLockAspect); setIsGiantMode(draftGiantMode); setCustomRollWidth(draftCustomRollWidth); setCustomRollLength(draftCustomRollLength);
    }
    setIsMenuOpen(open);
  };

  const handleExport = async () => {
    if (!image) return;
    setIsExporting(true);
    try {
      const img = new window.Image(); img.src = image.url; await new Promise(r => img.onload = r);
      const aR = isMenuOpen ? draftRows : rows; const aC = isMenuOpen ? draftCols : cols;
      const aO = isMenuOpen ? draftOverlap : overlap; const aMV = isMenuOpen ? draftMarginV : marginV; const aMH = isMenuOpen ? draftMarginH : marginH;
      const aPS = isMenuOpen ? draftPaperSize : paperSize; const aOrient = isMenuOpen ? draftOrientation : orientation;
      const aTW = parseFloat(isMenuOpen ? draftTargetWidth : targetWidth); const aTH = parseFloat(isMenuOpen ? draftTargetHeight : targetHeight);
      const aSO = isMenuOpen ? draftShowOutline : showOutline; const aCW = isMenuOpen ? draftCustomRollWidth : customRollWidth; const aCL = isMenuOpen ? draftCustomRollLength : customRollLength;
      let paper; let pdfFormat;
      if (aPS.includes('Personalizado')) {
        if (aTW <= aTH) { paper = { width: aCW, height: aCL }; } else { paper = { width: aCL, height: aCW }; }
        pdfFormat = [paper.width, paper.height];
      } else {
        const pB = PAPER_DIMENSIONS[aPS]; pdfFormat = ['letter', 'a4', 'a3', 'legal'].includes(pB.format) ? pB.format : [pB.width, pB.height];
        paper = aOrient === 'portrait' ? { width: Math.min(pB.width, pB.height), height: Math.max(pB.width, pB.height) } : { width: Math.max(pB.width, pB.height), height: Math.min(pB.width, pB.height) };
      }
      const pdf = new jsPDF({ orientation: aOrient === 'portrait' ? 'p' : 'l', unit: 'mm', format: pdfFormat as any });
      const { appliedMH, appliedMV } = getAppliedMargins(aOrient, aMV, aMH);
      const printableW = paper.width - (appliedMH * 20); const printableH = paper.height - (appliedMV * 20);
      const overlapMm = aO * 10; const effW = printableW - overlapMm; const effH = printableH - overlapMm;
      const totalGridW = (aC * effW) + overlapMm; const totalGridH = (aR * effH) + overlapMm;
      const finalW_mm = aTW * 10; const finalH_mm = aTH * 10;
      const offsetX = (totalGridW - finalW_mm) / 2; const offsetY = (totalGridH - finalH_mm) / 2;
      const outPxMm = 300 / 25.4; const sPxMmX = img.width / finalW_mm; const sPxMmY = img.height / finalH_mm;
      const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d')!;
      for (let r = 0; r < aR; r++) {
        for (let c = 0; c < aC; c++) {
          if (r > 0 || c > 0) pdf.addPage(pdfFormat as any, aOrient === 'portrait' ? 'p' : 'l');
          const sLeft = c * effW; const sTop = r * effH;
          const dX = Math.max(0, offsetX - sLeft); const dY = Math.max(0, offsetY - sTop);
          const vW = Math.min(effW + overlapMm - dX, finalW_mm - Math.max(0, sLeft - offsetX));
          const vH = Math.min(effH + overlapMm - dY, finalH_mm - Math.max(0, sTop - offsetY));
          const sx = Math.max(0, (sLeft - offsetX) * sPxMmX); const sy = Math.max(0, (sTop - offsetY) * sPxMmY);
          const sw = vW * sPxMmX; const sh = vH * sPxMmY;
          const dw = vW * outPxMm; const dh = vH * outPxMm;
          if (sw > 0 && sh > 0) {
            canvas.width = Math.max(1, dw); canvas.height = Math.max(1, dh);
            ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
            const pX = (appliedMH * 10) + dX; const pY = (appliedMV * 10) + dY;
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', pX, pY, vW, vH);
            if (aSO) { pdf.setDrawColor(200); pdf.rect(pX, pY, vW, vH); }
          }
          pdf.setDrawColor(220); pdf.setLineDashPattern([2, 2], 0);
          if (c < aC - 1) { const gx = (appliedMH * 10) + effW; pdf.line(gx, appliedMV * 10, gx, (appliedMV * 10) + printableH); }
          if (r < aR - 1) { const gy = (appliedMV * 10) + effH; pdf.line(appliedMH * 10, gy, (appliedMH * 10) + printableW, gy); }
          pdf.setFontSize(7); pdf.setTextColor(180);
          const footer = `MULTIPRINTTOOLS | POSTER | PANEL ${r+1}-${c+1} | ${aPS}`;
          if (aOrient === 'portrait') { pdf.text(footer, appliedMH * 10, paper.height - (appliedMV * 5)); } else { pdf.text(footer, paper.width - (appliedMH * 5), paper.height - (appliedMV * 10), { angle: 90 }); }
        }
      }
      pdf.save(`Poster_${aTW}x${aTH}cm_MultiPrint.pdf`);
      toast({ title: t.export, description: "PDF generado con éxito." });
    } catch (e) { console.error(e); toast({ variant: "destructive", title: "Error", description: "Fallo al exportar." }); } finally { setIsExporting(false); }
  };

  const physicalInfo = useMemo(() => getMeasures(rows, cols, overlap, marginV, marginH, paperSize, orientation, targetWidth, targetHeight, customRollWidth, customRollLength), [image, rows, cols, overlap, marginV, marginH, paperSize, orientation, targetWidth, targetHeight, customRollWidth, customRollLength]);
  const draftInfo = useMemo(() => getMeasures(draftRows, draftCols, draftOverlap, draftMarginV, draftMarginH, draftPaperSize, draftOrientation, draftTargetWidth, draftTargetHeight, draftCustomRollWidth, draftCustomRollLength), [image, draftRows, draftCols, draftOverlap, draftMarginV, draftMarginH, draftPaperSize, draftOrientation, draftTargetWidth, draftTargetHeight, draftCustomRollWidth, draftCustomRollLength]);

  function getMeasures(r: number, c: number, ov: number, mV: number, mH: number, pS: string, orient: 'portrait' | 'landscape', tW: string, tH: string, cW: number, cL: number) {
    if (!image) return null;
    let paper; const twMm = parseFloat(tW) * 10; const thMm = parseFloat(tH) * 10;
    if (pS.includes('Personalizado')) { if (twMm <= thMm) { paper = { width: cW, height: cL }; } else { paper = { width: cL, height: cW }; } }
    else { const pB = PAPER_DIMENSIONS[pS]; paper = orient === 'portrait' ? { width: Math.min(pB.width, pB.height), height: Math.max(pB.width, pB.height) } : { width: Math.max(pB.width, pB.height), height: Math.min(pB.width, pB.height) }; }
    const { appliedMH, appliedMV } = getAppliedMargins(orient, mV, mH);
    const pW = paper.width - (appliedMH * 20); const pH = paper.height - (appliedMV * 20);
    const ovMm = ov * 10; const eW = pW - ovMm; const eH = pH - ovMm;
    const tGW = (c * eW) + ovMm; const tGH = (r * eH) + ovMm;
    return { imgW: (twMm / 10).toFixed(1), imgH: (thMm / 10).toFixed(1), printableW: (pW / 10).toFixed(1), printableH: (pH / 10).toFixed(1), blankW: Math.max(0, (tGW - twMm) / 10).toFixed(1), blankH: Math.max(0, (tGH - thMm) / 10).toFixed(1) };
  }

  const renderSettings = (currentRows: number, currentCols: number, currentOverlap: number, currentMarginV: number, currentMarginH: number, currentPaperSize: string, currentOrientation: 'portrait' | 'landscape', currentShowGuides: boolean, currentShowOutline: boolean, curWidth: string, curHeight: string, info: any, isLocked: boolean, isGiant: boolean, cW: number, cL: number, isMobile?: boolean) => {
    const isLetterSnap = Math.abs(cW - 215.9) < 2;
    const isA4Snap = Math.abs(cW - 210) < 2;
    const isSnapped = isLetterSnap || isA4Snap;
    return (
      <div className={cn("space-y-6", isMobile ? "p-4 pt-1 pb-40" : "p-4")}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 bg-card px-2 py-1 rounded-md shadow-sm border border-border/20"><Maximize2 className="h-3.5 w-3.5 text-primary" /> {lang === 'es' ? 'Dimensiones' : 'Dimensions'}</h2>
            <div className="flex items-center gap-2">
              <Label htmlFor={isMobile ? "d-lock" : "lock"} className="text-[8px] font-black text-muted-foreground uppercase cursor-pointer">{t.keepAspectRatio}</Label>
              <Switch id={isMobile ? "d-lock" : "lock"} checked={isLocked} onCheckedChange={(v) => isMobile ? setDraftLockAspect(v) : setLockAspect(v)} className="scale-75 origin-right" />
            </div>
          </div>
          <div className="bg-card p-4 rounded-xl border border-primary/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2"><Expand className="h-3 w-3 text-primary" /><Label htmlFor={isMobile ? "d-giant" : "giant"} className="text-[9px] font-black uppercase text-primary tracking-widest cursor-pointer">Gigantografía</Label></div>
              <Switch id={isMobile ? "d-giant" : "giant"} checked={isGiant} onCheckedChange={(v) => isMobile ? setDraftGiantMode(v) : setIsGiantMode(v)} className="scale-75 origin-right" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><Label className="text-[8px] font-bold text-muted-foreground uppercase">{t.width} (cm)</Label><span className="text-xs font-black text-primary">{curWidth} cm</span></div>
              <div className="flex items-center gap-3"><Input type="number" value={curWidth} onChange={(e) => handleWidthChange(e.target.value, !!isMobile)} className="w-20 h-8 font-black text-xs text-primary bg-primary/5 border-primary/20" /><Slider value={[parseFloat(curWidth) || 0]} onValueChange={(v) => handleWidthChange(v[0].toString(), !!isMobile)} min={1} max={isGiant ? GIANT_MAX_CM : DEFAULT_MAX_CM} step={0.1} className="flex-1" /></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><Label className="text-[8px] font-bold text-muted-foreground uppercase">{t.height} (cm)</Label><span className="text-xs font-black text-primary">{curHeight} cm</span></div>
              <div className="flex items-center gap-3"><Input type="number" value={curHeight} onChange={(e) => handleHeightChange(e.target.value, !!isMobile)} className="w-20 h-8 font-black text-xs text-primary bg-primary/5 border-primary/20" /><Slider value={[parseFloat(curHeight) || 0]} onValueChange={(v) => handleHeightChange(v[0].toString(), !!isMobile)} min={1} max={isGiant ? GIANT_MAX_CM : DEFAULT_MAX_CM} step={0.1} className="flex-1" /></div>
            </div>
          </div>
        </div>
        <Separator className="bg-border/40" />
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 bg-card px-2 py-1 rounded-md shadow-sm border border-border/20"><Settings2 className="h-3.5 w-3.5 text-amber-600" /> {lang === 'es' ? 'Impresión' : 'Print'}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.paperSize}</Label>
              <Select value={currentPaperSize} onValueChange={(v) => { if (isMobile) setDraftPaperSize(v); else setPaperSize(v); setTimeout(() => syncGridFromTechnicalSettings(!!isMobile), 0); }}>
                <SelectTriggerUI className="h-8 rounded-lg text-xs font-bold bg-card border-border/10"><SelectValue /></SelectTriggerUI>
                <SelectContent className="z-[1000]">{Object.keys(PAPER_DIMENSIONS).map(key => <SelectItem key={key} value={key} className="text-xs font-bold">{key}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {!currentPaperSize.includes('Personalizado') && (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">{t.orientation}</Label>
                <Select value={currentOrientation} onValueChange={(v: any) => { if (isMobile) setDraftOrientation(v); else setOrientation(v); setTimeout(() => syncGridFromTechnicalSettings(!!isMobile), 0); }}>
                  <SelectTriggerUI className="h-8 rounded-lg text-xs font-bold bg-card border-border/10"><SelectValue /></SelectTriggerUI>
                  <SelectContent className="z-[1000]"><SelectItem value="portrait" className="text-xs font-bold">{t.portrait}</SelectItem><SelectItem value="landscape" className="text-xs font-bold">{t.landscape}</SelectItem></SelectContent>
                </Select>
              </div>
            )}
          </div>
          {currentPaperSize.includes('Personalizado') && (
            <div className={cn("p-4 rounded-xl border transition-all space-y-4 shadow-sm", isSnapped ? "bg-primary/10 border-primary/40 ring-4 ring-primary/5" : "bg-amber-500/5 border-amber-500/10")}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <ScrollText className={cn("h-3.5 w-3.5", isSnapped ? "text-primary" : "text-amber-600")} />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", isSnapped ? "text-primary" : "text-amber-700")}>{lang === 'es' ? 'Ajustes de Rollo' : 'Roll Settings'}</span>
                </div>
                {isSnapped && (<Badge className="bg-primary text-white text-[7px] px-1.5 py-0.5 rounded-sm">{isLetterSnap ? 'Carta Snap' : 'A4 Snap'}</Badge>)}
              </div>
              <div className="space-y-3">
                <div className="space-y-1"><div className="flex justify-between"><Label className="text-[8px] font-bold text-muted-foreground uppercase">{t.rollWidth}</Label><span className={cn("text-[10px] font-black", isSnapped ? "text-primary" : "text-amber-600")}>{(cW/10).toFixed(1)} cm</span></div><Slider value={[cW]} onValueChange={(v) => { let val = v[0]; if (Math.abs(val-210)<3) val=210; if (Math.abs(val-215.9)<3) val=215.9; if (isMobile) setDraftCustomRollWidth(val); else setCustomRollWidth(val); syncGridFromTechnicalSettings(!!isMobile); }} min={100} max={1600} step={0.1} /></div>
                <div className="space-y-1"><div className="flex justify-between"><Label className="text-[8px] font-bold text-muted-foreground uppercase">Largo Automático</Label><span className="text-[10px] font-black text-muted-foreground">{(cL/10).toFixed(1)} cm</span></div><div className="h-2 bg-muted rounded-full overflow-hidden border"><div className="h-full bg-primary/40" style={{ width: `${(cL/MAX_ROLL_LENGTH_MM)*100}%` }} /></div></div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <div className="flex justify-between items-center"><Label className="text-[10px] font-black uppercase text-muted-foreground"><Scissors className="h-3 w-3 inline mr-1" /> {t.overlap}</Label><span className="text-xs font-black text-amber-600">{currentOverlap} cm</span></div>
            <Slider value={[currentOverlap]} onValueChange={(v) => { if (isMobile) setDraftOverlap(v[0]); else setOverlap(v[0]); syncGridFromTechnicalSettings(!!isMobile); }} min={0} max={10} step={0.1} />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor={isMobile ? "dg" : "g"}>{t.guides}</Label><Switch id={isMobile ? "dg" : "g"} checked={currentShowGuides} onCheckedChange={isMobile ? setDraftShowGuides : setShowGuides} className="bg-muted scale-75" /></div>
            <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor={isMobile ? "do" : "o"}>{t.outline}</Label><Switch id={isMobile ? "do" : "o"} checked={currentShowOutline} onCheckedChange={isMobile ? setDraftShowOutline : setShowOutline} className="bg-muted scale-75" /></div>
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
                    rows={deferredRows} 
                    cols={deferredCols} 
                    overlap={deferredOverlap} 
                    marginV={deferredMarginV} 
                    marginH={deferredMarginH}
                    paperSize={paperSize} 
                    orientation={orientation}
                    showGuides={showGuides} 
                    showOutline={showOutline}
                    imageWidth={parseFloat(targetWidth)} 
                    imageHeight={parseFloat(targetHeight)} 
                    customPaperWidth={customRollWidth} 
                    customPaperHeight={customRollLength} 
                  />
                </div>
              </div>
            </>
          )}
        </section>
        <aside className="hidden lg:block w-80 border-l border-border bg-background overflow-y-auto shadow-xl z-10 shrink-0 h-full">
          {renderSettings(rows, cols, overlap, marginV, marginH, paperSize, orientation, showGuides, showOutline, targetWidth, targetHeight, physicalInfo, lockAspect, isGiantMode, customRollWidth, customRollLength)}
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
          <SheetContent side="right" className="w-[85%] sm:w-[400px] p-0 bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col z-[50]">
            <SheetHeader className="sr-only"><SheetTitle>Ajustes</SheetTitle></SheetHeader>
            <div className="p-3 bg-primary/5 flex flex-col gap-3">
              <Button className="w-full h-12 bg-primary text-white font-black rounded-xl" onClick={handleExport} disabled={!image || isExporting}>
                {isExporting ? "Generando..." : t.export}
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto relative">
              {renderSettings(draftRows, draftCols, draftOverlap, draftMarginV, draftMarginH, draftPaperSize, draftOrientation, draftShowGuides, draftShowOutline, draftTargetWidth, draftTargetHeight, draftInfo, draftLockAspect, draftGiantMode, draftCustomRollWidth, draftCustomRollLength, true)}
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

