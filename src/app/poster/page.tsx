import type { Metadata } from "next";
import PosterGridEditor from "@/components/PosterGridEditor";

export const metadata: Metadata = {
  title: "Dividir Imagen para Imprimir en Múltiples Hojas | Crear Poster Gigante",
  description: "La mejor herramienta para dividir imagen para imprimir en múltiples hojas A4, Carta o Rollo. Crea posters gigantes, murales y gigantografías automáticamente con solapes técnicos precisos. Gratis y privado.",
  alternates: {
    canonical: '/poster',
  },
  keywords: [
    "dividir imagen para imprimir en múltiples hojas", "imprimir poster en varias hojas",
    "dividir foto en varias hojas a4", "crear gigantografías gratis", "tiled printing online",
    "dividir imagen para imprimir a4", "mosaico de fotos para pared", "poster wall maker",
    "dividir fotos para imprimir carta", "imprimir imagen grande en varias hojas"
  ],
};

export default function PosterGridPage() {
  return <PosterGridEditor />;
}
