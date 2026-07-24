"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronLeft, 
  Type, 
  Copy, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Zap,
  AlignLeft,
  WholeWord
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Language, translations } from "@/lib/translations";
import { LanguageSelector } from "./LanguageSelector";
import { ThemeToggle } from "./ThemeToggle";
import logo from "@/app/icono.png";
import { cn } from "@/lib/utils";

type CaseMode = 'none' | 'uppercase' | 'lowercase' | 'sentence' | 'capitalize';

export default function TextCaseConverter() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [activeMode, setActiveMode] = useState<CaseMode>('none');

  useEffect(() => {
    setMounted(true);
  }, []);

  const applyConversion = (input: string, mode: CaseMode): string => {
    if (!input || mode === 'none') return input;

    switch (mode) {
      case 'uppercase':
        return input.toUpperCase();
      case 'lowercase':
        return input.toLowerCase();
      case 'sentence':
        return input.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());
      case 'capitalize':
        return input.toLowerCase().split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      default:
        return input;
    }
  };

  const handleModeToggle = (mode: CaseMode) => {
    const newMode = activeMode === mode ? 'none' : mode;
    setActiveMode(newMode);
    if (text) {
      setText(applyConversion(text, newMode));
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawValue = e.target.value;
    setText(applyConversion(rawValue, activeMode));
  };

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: t.copied });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClear = () => {
    setText("");
    // Enfocar el textarea automáticamente después de borrar
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen bg-background font-body overflow-hidden transition-colors duration-300">
      <header className="h-16 shrink-0 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 z-50 shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 font-bold text-muted-foreground px-1 sm:px-2">
              <ChevronLeft className="h-4 w-4" /> 
              <span className="hidden sm:inline text-xs">Inicio</span>
            </Button>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 relative rounded-lg overflow-hidden border bg-white dark:bg-slate-200 shrink-0">
              <Image src={logo} alt="Logo" fill className="object-contain" />
            </div>
            <h1 className="text-sm sm:text-xl font-headline font-black tracking-tighter text-amber-600 uppercase truncate max-w-[150px] sm:max-w-none">
              {t.textToolsTitle}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle />
          <LanguageSelector language={lang} setLanguage={setLang} />
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 sm:p-12 bg-muted/30 flex flex-col items-center">
          <div className="w-full max-w-4xl space-y-8">
            
            <div className="relative group rounded-[2rem] overflow-hidden shadow-2xl border-4 border-card bg-card transition-all focus-within:ring-4 focus-within:ring-amber-500/10">
              <div className="p-1 h-full">
                <Textarea 
                  ref={textareaRef}
                  placeholder={lang === 'es' ? "Pega tu texto aquí..." : "Paste your text here..."}
                  className="min-h-[45vh] w-full p-6 text-lg font-medium border-none focus-visible:ring-0 resize-none leading-relaxed bg-transparent scrollbar-hide"
                  value={text}
                  onChange={handleTextChange}
                />
              </div>
              
              <div className="absolute bottom-6 right-6 flex items-center gap-3 bg-card/80 backdrop-blur-md p-1.5 rounded-2xl shadow-xl border border-border/50">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-colors"
                  onClick={handleClear}
                  disabled={!text}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black gap-2 rounded-xl h-10 px-6 transition-all active:scale-95"
                  onClick={handleCopy}
                  disabled={!text}
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="hidden sm:inline">{isCopied ? t.copied : t.copy}</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { mode: 'uppercase', label: t.uppercase },
                { mode: 'lowercase', label: t.lowercase },
                { mode: 'sentence', label: t.sentenceCase },
                { mode: 'capitalize', label: t.capitalize }
              ].map((btn) => (
                <Button 
                  key={btn.mode}
                  variant="outline" 
                  className={cn(
                    "h-14 font-black rounded-2xl border-2 transition-all uppercase text-[10px] sm:text-xs shadow-sm active:scale-95",
                    activeMode === btn.mode 
                      ? "bg-amber-600 text-white border-amber-600 hover:bg-amber-700 hover:text-white ring-4 ring-amber-500/10" 
                      : "border-border hover:border-amber-500 hover:bg-amber-50"
                  )}
                  onClick={() => handleModeToggle(btn.mode as CaseMode)}
                >
                  {btn.label}
                </Button>
              ))}
            </div>

            <div className="text-center space-y-2 pt-4 animate-fade-in">
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 font-black px-3 py-1">
                <Zap className="h-3 w-3 mr-2" /> {t.localProcessing}
              </Badge>
              <h2 className="text-sm sm:text-xl font-headline font-black tracking-tighter text-foreground/80 uppercase">
                {activeMode !== 'none' 
                  ? (lang === 'es' ? `Auto-conversión activa: ${activeMode.toUpperCase()}` : `Auto-conversion active: ${activeMode.toUpperCase()}`)
                  : t.textToolsDesc
                }
              </h2>
            </div>
          </div>
        </div>

        <aside className="hidden lg:flex w-72 bg-card border-l border-border flex-col shrink-0 shadow-2xl z-20 p-6">
          <div className="flex-1 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.localProcessing}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                {t.privacyNote}
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-2xl border border-border space-y-4 shadow-inner">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="h-3 w-3 text-amber-600" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.characters}</span>
                  </div>
                  <span className="text-sm font-black text-foreground">{charCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <WholeWord className="h-3 w-3 text-amber-600" />
                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.words}</span>
                  </div>
                  <span className="text-sm font-black text-foreground">{wordCount}</span>
                </div>
              </div>
              
              {activeMode !== 'none' && (
                <div className="p-4 bg-amber-500/5 border border-dashed border-amber-500/20 rounded-2xl animate-in zoom-in-95">
                   <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-1">
                     <Zap className="h-3 w-3" /> Modo Inteligente
                   </p>
                   <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                     Todo el texto pegado o escrito se convertirá automáticamente mientras este modo esté activo.
                   </p>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
