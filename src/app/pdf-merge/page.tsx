
import type { Metadata } from "next";
import PdfMergeTool from "@/components/PdfMergeTool";

export const metadata: Metadata = {
  title: "Combinar PDF | Unir Archivos PDF Local y Privado",
  description: "Une múltiples documentos PDF en un solo archivo de forma instantánea. Procesamiento local en el navegador: tus archivos nunca se suben a internet, garantizando privacidad total.",
  keywords: ["combinar pdf gratis", "unir pdf sin internet", "merge pdf local", "herramientas pdf privadas"],
};

export default function PdfMergePage() {
  return <PdfMergeTool />;
}
