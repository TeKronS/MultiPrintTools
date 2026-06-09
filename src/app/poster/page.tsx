import type { Metadata } from "next";
import PosterGridEditor from "@/components/PosterGridEditor";

export const metadata: Metadata = {
  title: "Cuadrícula para Poster | Dividir Imágenes para Pósters Gigantes (Carta, Oficio, A4)",
  description: "Herramienta técnica para dividir cualquier imagen en paneles imprimibles. Crea pósters gigantes y decoraciones DIY dividiendo fotos en hojas Carta, Oficio o A4 con solapes técnicos precisos. Ideal para impresiones en casa.",
  keywords: [
    "dividir imagen para imprimir", "crear poster gigante", "poster maker", "tiled printing", 
    "dividir fotos en hojas a4", "poster wall maker", "gigantografías", "hojas carta", 
    "hojas oficio", "dividir fotos en hojas carta", "imprimir posters en casa", 
    "decoración de pared DIY", "mosaico de fotos para pared", "imprimir imagen grande en varias hojas",
    "dividir imagen en cuadrícula", "imprimir fotos gigantes con impresora común"
  ],
};

export default function PosterGridPage() {
  return <PosterGridEditor />;
}