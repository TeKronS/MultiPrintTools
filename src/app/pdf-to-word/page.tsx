
import type { Metadata } from "next";
import PdfToWordClient from "@/components/PdfToWordClient";

export const metadata: Metadata = {
  title: "PDF a Word | Convertir Documentos Editables con Alta Calidad",
  description: "Convierte tus archivos PDF en documentos de Word (.docx) editables manteniendo el diseño original, fuentes y tablas. Procesamiento seguro de alta fidelidad.",
  keywords: ["convertir pdf a word gratis", "pdf a docx editable", "extraer texto pdf a word"],
};

export default function PdfToWordPage() {
  return <PdfToWordClient />;
}
