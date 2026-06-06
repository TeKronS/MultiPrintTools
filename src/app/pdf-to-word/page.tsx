
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "PDF a Word | Convertir Documentos Editables con Alta Calidad",
  description: "Convierte tus archivos PDF en documentos de Word (.docx) editables manteniendo el diseño original, fuentes y tablas. Procesamiento seguro de alta fidelidad.",
  keywords: ["convertir pdf a word gratis", "pdf a docx editable", "extraer texto pdf a word"],
};

const PdfToWordConverter = dynamic(
  () => import("@/components/PdfToWordConverter"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <p className="font-black text-primary uppercase tracking-widest text-xs">Cargando herramienta...</p>
        </div>
      </div>
    )
  }
);

export default function PdfToWordPage() {
  return <PdfToWordConverter />;
}
