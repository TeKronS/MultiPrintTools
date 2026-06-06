
import type { Metadata } from "next";
import MuralisEditor from "@/components/MuralisEditor";

export const metadata: Metadata = {
  title: "Cuadrícula para Murales | Dividir Imágenes para Pósters Gigantes (Carta, Oficio, A4)",
  description: "Herramienta técnica para dividir cualquier imagen en paneles imprimibles. Crea murales, pósters gigantes y decoraciones DIY dividiendo fotos en hojas Carta, Oficio o A4 con solapes técnicos precisos. Ideal para impresiones en casa.",
  keywords: [
    "dividir imagen para imprimir", "crear poster gigante", "mural maker", "tiled printing", 
    "dividir fotos en hojas a4", "poster wall maker", "gigantografías", "hojas carta", 
    "hojas oficio", "dividir fotos en hojas carta", "imprimir posters en casa", 
    "decoración de pared DIY", "mosaico de fotos para pared", "imprimir imagen grande en varias hojas"
  ],
};

export default function MuralisPage() {
  return <MuralisEditor />;
}
