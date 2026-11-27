
import type { Metadata } from "next";
import CollageEditor from "@/components/CollageEditor";

export const metadata: Metadata = {
  title: "Collage Pro | Crear Mosaicos de Fotos Profesionales Online",
  description: "Crea collages de fotos avanzados con secciones personalizables, cabeceras y degradados. Ideal para Instagram, portafolios o impresión de alta resolución. Todo procesado localmente.",
  keywords: ["crear collage online", "mosaico de fotos profesional", "collage instagram 9:16", "unir fotos en cuadricula", "collage maker local"],
};

export default function CollagePage() {
  return <CollageEditor />;
}
