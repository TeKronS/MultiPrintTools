
import type { Metadata } from "next";
import PdfSplitClient from "@/components/PdfSplitClient";

export const metadata: Metadata = {
  title: "Separar PDF | Extraer Páginas de Documentos PDF",
  description: "Extrae rangos de páginas o selecciona hojas específicas de un PDF para crear un nuevo documento. Rápido, con vista previa interactiva y procesamiento 100% local.",
  keywords: ["separar paginas pdf", "extraer hojas pdf", "dividir pdf online local", "cortar pdf"],
};

export default function PdfSplitPage() {
  return <PdfSplitClient />;
}
