
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Convertir PDF a Imagen | Exportar Páginas a JPEG/PNG",
  description: "Convierte cada página de tu documento PDF en una imagen de alta resolución. Selecciona calidad y formato (JPEG/PNG) localmente sin subir tus archivos a la nube.",
  keywords: ["pdf a jpg gratis", "convertir pdf a png", "extraer imagenes de pdf", "pdf a imagen alta calidad"],
};

const PdfToImageConverter = dynamic(
  () => import("@/components/PdfToImageConverter"),
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

export default function PdfToImgPage() {
  return <PdfToImageConverter />;
}
