"use client";

import { useState, useEffect } from "react";
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

export default function TextCaseConverter() {
  const [mounted, setMounted] = useState(false);
  const [lang, setLang] = useState<Language>('es');
  const t = translations[lang];
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast({ title: t.copied });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toUppercase = () => setText(text.toUpperCase());
  const toLowercase = () => setText(text.toLowerCase());
  
  const toSentenceCase = () => {
    const transformed = text.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g, (m) => m.toUpperCase());
    setText(transformed);
  };

  const toCapitalize = () => {
    const transformed = text.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    setText(transformed);
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
            
            {/* Area de Texto principal */}
            <div className="relative group rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-card bg-card">
              <Textarea 
                placeholder={lang === 'es' ? "Pega tu texto aquí..." : "Paste your text here..."}
                className="min-h-[40vh] w-full p-8 text-lg font-medium border-none focus-visible:ring-0 resize-none leading-relaxed"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              
              <div className="absolute bottom-6 right-6 flex items-center gap-3">
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="rounded-xl shadow-lg"
                  onClick={() => setText("")}
                  disabled={!text}
                >
                  <Trash2 className="h-5 w-5 text-destructive" />
                </Button>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700 text-white font-black gap-2 rounded-xl shadow-lg px-6"
                  onClick={handleCopy}
                  disabled={!text}
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {isCopied ? t.copied : t.copy}
                </Button>
              </div>
            </div>

            {/* Opciones de conversión */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="h-14 font-black rounded-2xl border-2 border-border hover:border-amber-500 hover:bg-amber-50 text-xs uppercase"
                onClick={toUppercase}
                disabled={!text}
              >
                {t.uppercase}
              </Button>
              <Button 
                variant="outline" 
                className="h-14 font-black rounded-2xl border-2 border-border hover:border-amber-500 hover:bg-amber-50 text-xs uppercase"
                onClick={toLowercase}
                disabled={!text}
              >
                {t.lowercase}
              </Button>
              <Button 
                variant="outline" 
                className="h-14 font-black rounded-2xl border-2 border-border hover:border-amber-500 hover:bg-amber-50 text-xs uppercase"
                onClick={toSentenceCase}
                disabled={!text}
              >
                {t.sentenceCase}
              </Button>
              <Button 
                variant="outline" 
                className="h-14 font-black rounded-2xl border-2 border-border hover:border-amber-500 hover:bg-amber-50 text-xs uppercase"
                onClick={toCapitalize}
                disabled={!text}
              >
                {t.capitalize}
              </Button>
            </div>

            {/* Título y descripción ahora después de las opciones y más pequeño */}
            <div className="text-center space-y-2 pt-4">
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 font-black px-3 py-1">
                <Zap className="h-3 w-3 mr-2" /> {t.localProcessing}
              </Badge>
              <h2 className="text-xl font-headline font-black tracking-tighter text-foreground/80 uppercase">
                {t.textToolsDesc}
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
              <div className="bg-muted p-4 rounded-2xl border border-border space-y-4">
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
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
