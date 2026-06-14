
import type { Metadata } from "next";
import TextCaseConverter from "@/components/TextCaseConverter";

export const metadata: Metadata = {
  title: "Convertidor de Mayúsculas y Minúsculas | Herramienta de Texto",
  description: "Transforma tu texto al instante: cambia a mayúsculas, minúsculas, tipo oración o capitaliza cada palabra. Procesamiento local y privado.",
  keywords: ["convertidor mayusculas", "mayuscula despues del punto", "capitalizar texto", "pasar a minusculas", "case converter"],
};

export default function TextToolsPage() {
  return <TextCaseConverter />;
}
