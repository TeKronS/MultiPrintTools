
import type { Metadata } from "next";
import PdfToImageClient from "@/components/PdfToImageClient";

export const metadata: Metadata = {
  title: "Convertir PDF a Imagen | Exportar Páginas a JPEG/PNG Alta Calidad",
  description: "Convierte cada página de tu documento PDF en una imagen de alta resolución (300 DPI). Selecciona calidad y formato (JPEG/PNG) localmente sin subir tus archivos a la nube. Ideal para diseño y redes sociales.",
  keywords: [
    "pdf a jpg gratis", "convertir pdf a png", "extraer imagenes de pdf", "pdf a imagen alta calidad",
    "exportar pdf a imagen local", "convertir hojas pdf a fotos", "pdf a jpeg 300 dpi"
  ],
};

export default function PdfToImgPage() {
  return <PdfToImageClient />;
}
