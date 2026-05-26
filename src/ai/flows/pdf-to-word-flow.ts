'use server';
/**
 * @fileOverview Flow para convertir PDF a una estructura de Word editable usando IA.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PdfToWordInputSchema = z.object({
  pdfDataUri: z.string().describe("El PDF en formato data URI (base64)."),
});

const TextRunSchema = z.object({
  text: z.string(),
  bold: z.boolean().optional(),
  underline: z.boolean().optional(),
  italic: z.boolean().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
});

const ParagraphSchema = z.object({
  alignment: z.enum(['left', 'center', 'right', 'justify']).optional(),
  spacingAfter: z.number().optional(),
  runs: z.array(TextRunSchema),
});

const PdfToWordOutputSchema = z.object({
  pages: z.array(z.object({
    paragraphs: z.array(ParagraphSchema),
  })),
});

export type PdfToWordOutput = z.infer<typeof PdfToWordOutputSchema>;

export async function convertPdfToWordStructure(input: { pdfDataUri: string }): Promise<PdfToWordOutput> {
  return pdfToWordFlow(input);
}

const pdfToWordFlow = ai.defineFlow(
  {
    name: 'pdfToWordFlow',
    inputSchema: PdfToWordInputSchema,
    outputSchema: PdfToWordOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: [
        { media: { url: input.pdfDataUri, contentType: 'application/pdf' } },
        { text: `Analiza este documento PDF y devuelve su estructura exacta para ser convertida a un documento de Word (.docx).
        
        Debes ser extremadamente preciso con:
        1. FUENTES: Detecta si es Times New Roman, Arial, Calibri, etc.
        2. ESTILOS: Identifica qué palabras están en NEGRITA (bold) y cuáles SUBRAYADAS.
        3. ESTRUCTURA: Identifica párrafos, títulos y el espaciado entre ellos (Enters).
        4. ALINEACIÓN: Detecta si el texto está centrado o alineado a los lados.

        Ignora las imágenes, concéntrate en la fidelidad del texto y el formato.` }
      ],
      output: { schema: PdfToWordOutputSchema }
    });

    if (!output) throw new Error("La IA no pudo procesar el documento.");
    return output;
  }
);
