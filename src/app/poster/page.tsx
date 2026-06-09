import type { Metadata } from "next";
import PosterGridEditor from "@/components/PosterGridEditor";

export const metadata: Metadata = {
  title: "Cuadrícula para Poster Pro | Generador Automático de Murales Imprimibles",
  description: "La herramienta líder para automatizar la creación de posters gigantes. Divide cualquier imagen en hojas Carta, Oficio o A4 con solapes técnicos y márgenes automáticos. Resultados profesionales en segundos.",
  keywords: [
    "automatizar poster gigante", "dividir imagen para imprimir", "poster maker profesional", 
    "tiled printing automation", "generador de murales automático", "imprimir fotos grandes en casa",
    "dividir fotos en hojas carta automático", "hojas oficio impresión poster", "reprografía digital avanzada",
    "poster wall maker automático", "mosaico de fotos para pared profesional"
  ],
};

export default function PosterGridPage() {
  return <PosterGridEditor />;
}
