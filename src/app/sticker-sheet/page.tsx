
import type { Metadata } from "next";
import StickerSheetEditor from "@/components/StickerSheetEditor";

export const metadata: Metadata = {
  title: "Sticker Sheet Maker | Cuántos Stickers Caben en una Hoja",
  description: "Calcula cuántos stickers de tu tamaño caben en una hoja carta, A4 u oficio. Genera el PDF listo para imprimir con tus stickers distribuidos automáticamente.",
  keywords: [
    "cuántos stickers caben en una hoja", "plancha de stickers", "sticker sheet maker",
    "dividir imagen en stickers", "impresión de stickers", "stickers por hoja",
    "sticker layout", "hacer plancha de stickers", "sticker printing layout"
  ],
};

export default function StickerSheetPage() {
  return <StickerSheetEditor />;
}
