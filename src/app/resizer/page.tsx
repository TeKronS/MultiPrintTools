
import type { Metadata } from "next";
import ImageResizer from "@/components/ImageResizer";

export const metadata: Metadata = {
  title: "Redimensionar Imagen | Cambiar DPI y Tamaño para Impresión",
  description: "Ajusta el tamaño de tus imágenes a dimensiones reales (cm/pulgadas) y cambia los DPI a 300 para impresiones de alta calidad sin pérdida de nitidez. Perfecto para gigantografías.",
  keywords: ["cambiar dpi imagen online", "redimensionar imagen para imprimir", "preparar imagen gigantografia", "300 dpi online", "cambiar cm imagen"],
};

export default function ResizerPage() {
  return <ImageResizer />;
}
