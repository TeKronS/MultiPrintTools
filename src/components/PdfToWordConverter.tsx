"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronLeft, 
  FileType, 
  Loader2, 
  X,
  FileCheck,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "./LanguageSelector";
import logo from "@/app/icono.png";
import { convertPdfToWordStructure } from "@/ai/flows/pdf-to-word-flow";

const DOCX_VERSION = "7.1.0";
const FILE_SAVER_VERSION = "2.0.5";

const LIBS = [
  { id: 'docx', url: `https://unpkg.com/docx@${DOCX_VERSION}/build/index.js` },
  { id: 'file-saver', url: `https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/${FILE_SAVER_VERSION}/FileSaver.min.js` }
];

export default function PdfToWordConverter() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [libsReady, setLibsReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const loadScript = (url: string) => {
      return new Promise((resolve, reject) => {
        if (typeof document === 'undefined') return;
        const script = document.createElement("script");
        script.src = url;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = (e) => {
          console.error(`Error cargando motor: ${url}`, e);
          reject(e);
        };
        document.head.appendChild(script);
      });
    };

    const loadAllLibs = async () => {
      try {
        for (const lib of LIBS) {
          await loadScript(lib.url);
        }
        setLibsReady(true);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error de inicialización",
          description: "No se pudieron cargar los componentes locales."
        });
      }
    };

    loadAllLibs();
  }, [toast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    }
  };

  const convertToWordAI = async () => {
    if (!pdfFile || !libsReady) return;
    
    const docx = (window as any).docx;
    const saveAs = (window as any).saveAs;

    if (!docx || !saveAs) {
      toast({ variant: "destructive", title: "Error", description: "Librerías no listas." });
      return;
    }

    setIsConverting(true);
    setProgress(10);
    setStatusText("La IA está analizando tu documento...");

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(pdfFile);
      });

      const pdfDataUri = await base64Promise;
      
      // Llamamos a la IA para obtener la estructura
      const structure = await convertPdfToWordStructure({ pdfDataUri });
      
      setProgress(60);
      setStatusText("Reconstruyendo documento Word...");

      const { Document, Packer, Paragraph, TextRun, AlignmentType } = docx;
      const docChildren: any[] = [];

      structure.pages.forEach((page, pageIdx) => {
        page.paragraphs.forEach((p) => {
          const textRuns = p.runs.map(run => new TextRun({
            text: run.text,
            bold: run.bold,
            underline: run.underline ? {} : undefined,
            italics: run.italic,
            size: run.fontSize ? run.fontSize * 2 : 24, // Word usa medio-puntos
            font: run.fontFamily || "Arial",
          }));

          let alignment = AlignmentType.LEFT;
          if (p.alignment === 'center') alignment = AlignmentType.CENTER;
          if (p.alignment === 'right') alignment = AlignmentType.RIGHT;
          if (p.alignment === 'justify') alignment = AlignmentType.JUSTIFIED;

          docChildren.push(new Paragraph({
            children: textRuns,
            alignment: alignment,
            spacing: { after: p.spacingAfter || 200 }
          }));
        });

        if (pageIdx < structure.pages.length - 1) {
          docChildren.push(new Paragraph({ children: [new TextRun({ text: "", break: 1 })] }));
        }
      });

      const docObj = new Document({
        creator: "MultiPrintTools AI",
        title: pdfFile.name,
        sections: [{
          properties: { 
            page: { 
              margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } 
            } 
          },
          children: docChildren,
        }],
      });

      const blob = await Packer.toBlob(docObj);
      saveAs(blob, pdfFile.name.replace(/\.[^/.]+$/, "") + " (AI-Convertido).docx");
      
      setProgress(100);
      toast({ title: "¡Éxito!", description: "Conversión de alta fidelidad completada." });
    } catch (error) {
      console.error("Error en conversión AI:", error);
      toast({ variant: "destructive", title: "Error", description: "La IA no pudo procesar este documento." });
    } finally {
      setIsConverting(false);
      setTimeout(() => setProgress(0), 3000);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-body overflow-hidden">
      <header className="h-16 shrink-0 border-b border-border bg-white flex items-center justify-between px-6 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 font-bold text-muted-foreground hover:text-primary px-2">
              <ChevronLeft className="h-4 w-4" /> 
              <span className="hidden sm:inline text-xs">Inicio</span>
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-lg overflow-hidden border">
              <Image src={logo} alt="Logo" fill className="object-contain" />
            </div>
            <h1 className="text-xl font-headline font-black tracking-tighter text-primary uppercase">PDF A WORD AI</h1>
          </div>
        </div>
        <LanguageSelector language={lang} setLanguage={setLang} />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-2xl space-y-8 animate-fade-in">
          <div className="text-center space-y-3">
            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-black mb-2">
              <Sparkles className="h-3 w-3 mr-1" /> POTENCIADO POR INTELIGENCIA ARTIFICIAL
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-headline font-black tracking-tighter text-slate-900 uppercase">
              FIDELIDAD EXTREMA
            </h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto">
              Nuestra IA analiza el diseño original para respetar tipos de letra, negritas, subrayados y espaciado real.
            </p>
          </div>

          <Card className="border-4 border-dashed border-primary/20 p-8 sm:p-12 bg-white rounded-[2.5rem] relative shadow-xl overflow-hidden group">
            {!libsReady ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="font-bold text-primary uppercase tracking-widest text-[10px]">Iniciando motores de IA...</p>
              </div>
            ) : !pdfFile ? (
              <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center space-y-6 cursor-pointer">
                <div className="p-8 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-300">
                  <FileType className="h-16 w-16 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{t.dropPdf}</h3>
                  <p className="text-slate-500 font-bold text-sm">La IA leerá tu PDF y lo reconstruirá desde cero.</p>
                </div>
                <Button className="bg-primary hover:bg-primary/90 text-white font-black px-8 py-6 rounded-2xl text-lg uppercase tracking-widest shadow-xl">
                  {t.selectPdf}
                </Button>
                <input type="file" ref={fileInputRef} accept="application/pdf" onChange={handleFileSelect} className="hidden" />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center gap-6 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                  <div className="p-4 bg-primary/10 rounded-2xl">
                    <FileType className="h-10 w-10 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-black text-slate-800 truncate">{pdfFile.name}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full text-slate-400 hover:text-destructive"
                    onClick={() => setPdfFile(null)}
                    disabled={isConverting}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                {isConverting && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black text-primary uppercase tracking-widest">
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        {statusText}
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 bg-primary/10 rounded-full" />
                  </div>
                )}

                <Button 
                  className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-2xl text-lg uppercase tracking-widest gap-3"
                  onClick={convertToWordAI}
                  disabled={isConverting}
                >
                  {isConverting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
                  {isConverting ? "Analizando..." : "Convertir con IA"}
                </Button>
              </div>
            )}
          </Card>

          <div className="flex items-start gap-3 bg-slate-100 p-4 rounded-2xl border border-slate-200">
            <AlertCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Modo Inteligente</p>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Este modo utiliza modelos de visión avanzados para entender el diseño original. Es mucho más lento que el modo clásico pero respeta estilos como Times New Roman y Negritas.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
