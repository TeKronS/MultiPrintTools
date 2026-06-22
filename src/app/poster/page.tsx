
import type { Metadata } from "next";
import PosterGridEditor from "@/components/PosterGridEditor";

export const metadata: Metadata = {
  title: "Split Image for Poster Printing | Dividir Imagen para Imprimir",
  description: "The best tool to split image for poster printing on multiple sheets. Automate tiled printing for Carta, A4 or Legal paper with technical overlaps. Dividir imagen en varias hojas automáticamente con resultados profesionales.",
  keywords: [
    "split image for poster printing", "tiled printing automation", "divide photo into multiple pages",
    "dividir imagen para imprimir", "dividir imagen en varias hojas", "crear poster gigante", 
    "dividir fotos para imprimir", "poster wall maker", "printable poster grid",
    "imprimir fotos grandes en casa", "dividir fotos en hojas carta automático", 
    "hojas oficio impresión poster", "reprografía digital avanzada"
  ],
};

export default function PosterGridPage() {
  return <PosterGridEditor />;
}
