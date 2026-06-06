
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Separar PDF | Extraer Páginas de Documentos PDF",
  description: "Extrae rangos de páginas o selecciona hojas específicas de un PDF para crear un nuevo documento. Rápido, con vista previa interactiva y procesamiento 100% local.",
  keywords: ["separar paginas pdf", "extraer hojas pdf", "dividir pdf online local", "cortar pdf"],
};

const PdfSplitTool = dynamic(
  () => import("@/components/PdfSplitTool"),
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

export default function PdfSplitPage() {
  return <PdfSplitTool />;
}
