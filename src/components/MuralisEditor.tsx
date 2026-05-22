
"use client";

import { useState } from "react";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "./LanguageSelector";
import { ImageUploader } from "./ImageUploader";
import { MuralCanvas } from "./MuralCanvas";
import { MockupPreview } from "./MockupPreview";
import { 
  Settings2, 
  Grid3X3, 
  Layout, 
  FileDown, 
  Undo2, 
  Eye, 
  Settings,
  Scissors,
  Layers,
  Info,
  Loader2,
  Maximize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

const PAPER_DIMENSIONS: Record<string, { width: number; height: number; format: string }> = {
  'A4': { width: 210, height: 297, format: 'a4' },
  'A3': { width: 297, height: 420, format: 'a3' },
  'Letter': { width: 215.9, height: 279.4, format: 'letter' },
  'Legal': { width: 215.9, height: 355.6, format: 'legal' }
};

export default function MuralisEditor() {
  const [lang, setLang] = useState<Language>('es');
  const [image, setImage] = useState<{ url: string; file: File } | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(4);
  const [overlap, setOverlap] = useState(1.5); // cm standard
  const [margins, setMargins] = useState(1); // cm
  const [paperSize, setPaperSize] = useState('A4');
  const [showGuides, setShowGuides] = useState(true);
  const [view, setView] = useState<'editor' | 'preview'>('editor');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const t = translations[lang];

  const handleImageUpload = (file: File, url: string) => {
    setImage({ file, url });
  };

  const handleExport = async () => {
    if (!image) return;
    
    setIsExporting(true);
    try {
      const img = new Image();
      img.src = image.url;
      
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const paper = PAPER_DIMENSIONS[paperSize];
      const isLandscape = img.width > img.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'l' : 'p',
        unit: 'mm',
        format: paper.format as any
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not initialize canvas");

      // Printable area (mm)
      const printableW = paper.width - (margins * 20);
      const printableH = paper.height - (margins * 20);
      const overlapMm = overlap * 10;

      // Calculate total mural physical size to determine scaling
      // The total width of the image will correspond to:
      // totalW_mm = cols * printableW - (cols - 1) * overlapMm
      const totalW_mm = cols * printableW - (cols - 1) * overlapMm;
      const totalH_mm = rows * printableH - (rows - 1) * overlapMm;

      // Aspect ratio correction: we match the image to the grid
      const pxPerMm = img.width / totalW_mm;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (r > 0 || c > 0) pdf.addPage();

          // Pixel coordinates for current slice
          // Each sheet starts at c * (printableW - overlapMm)
          const sx = c * (printableW - overlapMm) * pxPerMm;
          const sy = r * (printableH - overlapMm) * pxPerMm;
          const sw = printableW * pxPerMm;
          const sh = printableH * pxPerMm;

          canvas.width = sw;
          canvas.height = sh;
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

          const sliceData = canvas.toDataURL('image/jpeg', 0.95);
          
          // Add image to PDF centered in margins
          pdf.addImage(sliceData, 'JPEG', margins * 10, margins * 10, printableW, printableH);

          // Draw overlap technical guides (faint lines)
          pdf.setDrawColor(220, 220, 220);
          pdf.setLineDashPattern([2, 1], 0);
          
          if (c < cols - 1) {
             const guideX = (margins * 10) + printableW - overlapMm;
             pdf.line(guideX, margins * 10, guideX, margins * 10 + printableH);
          }
          if (r < rows - 1) {
            const guideY = (margins * 10) + printableH - overlapMm;
            pdf.line(margins * 10, guideY, margins * 10 + printableW, guideY);
          }

          // Metadata footer
          pdf.setFontSize(7);
          pdf.setTextColor(180);
          pdf.text(`PANEL ${r + 1}-${c + 1} | SOLAPE: ${overlap}cm | MARGEN: ${margins}cm | MURALIS`, 10, paper.height - 7);
        }
      }

      pdf.save(`muralis-${Date.now()}.pdf`);
      toast({
        title: lang === 'es' ? "PDF Generado" : "PDF Generated",
        description: lang === 'es' ? "Contenido sincronizado para impresión local." : "Content synchronized for local printing.",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: lang === 'es' ? "Error en el procesamiento del PDF." : "Error processing PDF.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full font-body bg-[#fafafa] text-foreground">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border bg-white flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/10">
              <Layers className="text-white h-6 w-6" />
            </div>
            <h1 className="text-2xl font-headline font-black tracking-tighter text-primary">
              MURALIS<span className="text-accent">.</span>
            </h1>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex bg-muted/50 p-1 rounded-xl">
            <Button 
              variant={view === 'editor' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('editor')}
              className="gap-2 font-bold h-9 rounded-lg"
            >
              <Layout className="h-4 w-4" /> {t.editor}
            </Button>
            <Button 
              variant={view === 'preview' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('preview')}
              className="gap-2 font-bold h-9 rounded-lg"
            >
              <Eye className="h-4 w-4" /> {t.preview}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector language={lang} setLanguage={setLang} />
          <Button 
            variant="default" 
            className="bg-primary hover:bg-primary/90 text-white font-black gap-2 h-11 px-8 shadow-xl shadow-primary/10 transition-all active:scale-95" 
            onClick={handleExport}
            disabled={!image || isExporting}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-5 w-5" />}
            {isExporting ? (lang === 'es' ? "PROCESANDO..." : "PROCESSING...") : t.export}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Central Canvas Area */}
        <section className="flex-1 relative bg-[#f4f4f5] overflow-hidden flex items-center justify-center">
          {!image ? (
            <div className="max-w-lg w-full p-8 animate-fade-in">
              <ImageUploader onImageUpload={handleImageUpload} language={lang} t={t} />
            </div>
          ) : (
            <div className="w-full h-full p-4 md:p-8">
              {view === 'editor' ? (
                <MuralCanvas 
                  imageUrl={image.url} 
                  rows={rows} 
                  cols={cols} 
                  overlap={overlap} 
                  margins={margins}
                  paperSize={paperSize}
                  showGuides={showGuides} 
                />
              ) : (
                <div className="w-full h-full animate-scale-in">
                  <MockupPreview imageUrl={image.url} rows={rows} cols={cols} />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Adjustment Panel */}
        <aside className="w-85 border-l border-border bg-white overflow-y-auto custom-scrollbar shadow-2xl z-40">
          <div className="p-8 space-y-10">
            <div className="flex items-center justify-between">
              <h2 className="text-[11px] font-headline font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" /> {t.gridSettings}
              </h2>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => setImage(null)}>
                <Undo2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-8">
              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">{t.rows}</Label>
                  <span className="text-sm font-mono text-primary font-black bg-primary/5 px-2 py-0.5 rounded">{rows}</span>
                </div>
                <Slider 
                  value={[rows]} 
                  onValueChange={(v) => setRows(v[0])} 
                  min={1} 
                  max={15} 
                  step={1} 
                />
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">{t.columns}</Label>
                  <span className="text-sm font-mono text-primary font-black bg-primary/5 px-2 py-0.5 rounded">{cols}</span>
                </div>
                <Slider 
                  value={[cols]} 
                  onValueChange={(v) => setCols(v[0])} 
                  min={1} 
                  max={15} 
                  step={1} 
                />
              </div>

              <Separator />

              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground">{t.paperSize}</Label>
                  <Info className="h-3 w-3 text-muted-foreground/60" />
                </div>
                <Select value={paperSize} onValueChange={setPaperSize}>
                  <SelectTrigger className="bg-white border-border h-11 text-xs font-bold rounded-xl">
                    <SelectValue placeholder="Papel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4" className="font-bold">A4 (210 x 297 mm)</SelectItem>
                    <SelectItem value="A3" className="font-bold">A3 (297 x 420 mm)</SelectItem>
                    <SelectItem value="Letter" className="font-bold">Carta (8.5 x 11 in)</SelectItem>
                    <SelectItem value="Legal" className="font-bold">Oficio (8.5 x 14 in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-accent" /> {t.overlap}
                  </Label>
                  <span className="text-sm font-mono text-accent font-black bg-accent/5 px-2 py-0.5 rounded">{overlap} cm</span>
                </div>
                <Slider 
                  value={[overlap]} 
                  onValueChange={(v) => setOverlap(v[0])} 
                  min={0} 
                  max={5} 
                  step={0.1} 
                />
              </div>

              <div className="space-y-5">
                <div className="flex justify-between items-end">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground flex items-center gap-2">
                    <Maximize className="h-4 w-4 text-primary" /> {t.margins}
                  </Label>
                  <span className="text-sm font-mono text-primary font-black bg-primary/5 px-2 py-0.5 rounded">{margins} cm</span>
                </div>
                <Slider 
                  value={[margins]} 
                  onValueChange={(v) => setMargins(v[0])} 
                  min={0} 
                  max={3} 
                  step={0.5} 
                />
              </div>

              <div className="pt-4 space-y-5">
                <div className="flex items-center justify-between bg-muted/30 p-4 rounded-xl border border-border/50">
                  <Label className="text-[11px] font-black uppercase text-muted-foreground cursor-pointer" htmlFor="guides-switch">
                    {t.guides}
                  </Label>
                  <Switch 
                    id="guides-switch" 
                    checked={showGuides} 
                    onCheckedChange={setShowGuides} 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl space-y-2">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">{t.totalPanels}</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-primary leading-none">{rows * cols}</span>
                <span className="text-xs text-muted-foreground font-black uppercase">Unidades</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <footer className="h-10 border-t border-border bg-white px-6 flex items-center justify-between text-[10px] text-muted-foreground font-mono uppercase tracking-widest z-50">
        <div className="flex gap-6">
          <span className="flex items-center gap-2 font-black text-primary"><Settings className="h-3 w-3" /> MURALIS ENGINE</span>
          <span className="opacity-60">Local Processing Active</span>
        </div>
        <div className="flex gap-6">
          <span className="font-black text-accent">{paperSize} FORMAT</span>
          <span className="text-primary font-black">STABLE</span>
        </div>
      </footer>
    </div>
  );
}
