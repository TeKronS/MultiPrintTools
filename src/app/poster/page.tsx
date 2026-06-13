
import type { Metadata } from "next";
import PosterGridEditor from "@/components/PosterGridEditor";

export const metadata: Metadata = {
  title: "Dividir Imagen para Imprimir | Cuadrícula para Poster Pro",
  description: "La mejor herramienta para dividir imagen para imprimir en varias hojas. Crea posters gigantes automáticamente dividiendo fotos en hojas Carta, Oficio o A4 con solapes técnicos y márgenes automáticos. Resultados profesionales en segundos.",
  keywords: [
    "dividir imagen para imprimir", "dividir imagen en varias hojas", "crear poster gigante", 
    "dividir fotos para imprimir", "tiled printing automation", "generador de murales automático", 
    "imprimir fotos grandes en casa", "dividir fotos en hojas carta automático", 
    "hojas oficio impresión poster", "reprografía digital avanzada", "poster wall maker automático"
  ],
};

export default function PosterGridPage() {
  return <PosterGridEditor />;
}
