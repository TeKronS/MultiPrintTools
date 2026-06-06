
import type { Metadata } from "next";
import ImageToPdfConverter from "@/components/ImageToPdfConverter";

export const metadata: Metadata = {
  title: "Imagen a PDF | Convertir Fotos en Documentos PDF",
  description: "Convierte tus colecciones de imágenes en documentos PDF profesionales. Ajusta márgenes, orientación y tamaño de papel (A4, Carta, Oficio) de forma local y segura.",
  keywords: ["convertir fotos a pdf", "crear pdf desde imagenes", "imagen a pdf multiple", "convertir jpg a pdf"],
};

export default function ImageToPdfPage() {
  return <ImageToPdfConverter />;
}
