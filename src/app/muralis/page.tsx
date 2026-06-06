
import type { Metadata } from "next";
import MuralisEditor from "@/components/MuralisEditor";

export const metadata: Metadata = {
  title: "Cuadrícula para Murales | Dividir Imágenes para Imprimir Pósters Gigantes",
  description: "Herramienta técnica para dividir cualquier imagen en paneles imprimibles. Ideal para crear murales, pósters gigantes y decoraciones de pared dividiendo fotos en hojas A4/Carta con solapes técnicos precisos.",
  keywords: ["dividir imagen para imprimir", "crear poster gigante", "mural maker", "tiled printing", "dividir fotos en hojas a4", "poster wall maker", "gigantografías"],
};

export default function MuralisPage() {
  return <MuralisEditor />;
}
