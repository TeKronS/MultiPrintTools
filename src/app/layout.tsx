
import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  metadataBase: new URL('https://tekron-web-studio.vercel.app/'),
  title: {
    default: 'MultiPrintTools | Dividir Imagen para Imprimir y Automatización',
    template: '%s | MultiPrintTools'
  },
  description: 'La suite definitiva para automatizar tu flujo de trabajo en reprografía. Herramienta profesional para dividir imagen para imprimir en varias hojas, gestión de PDFs y optimización de imágenes.',
  keywords: [
    'dividir imagen para imprimir', 'dividir imagen en varias hojas', 'automatización de impresión', 
    'cuadrícula para poster gigante', 'reprografía profesional', 'dividir foto en hojas a4',
    'tiled printing automation', 'herramientas para imprentas', 'crear gigantografías rápido', 
    'unir pdf sin internet', 'poster maker professional', 'mosaico de fotos para pared'
  ],
  authors: [{ name: 'Tekron Web Studio' }],
  creator: 'Tekron Web Studio',
  publisher: 'Tekron Web Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/icono.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://tekron-web-studio.vercel.app/',
    siteName: 'MultiPrintTools',
    title: 'MultiPrintTools | Dividir Imagen para Imprimir Posters',
    description: 'La herramienta estrella para dividir imagen para imprimir de forma técnica y rápida. Optimiza tus trabajos con procesamiento local.',
    images: [
      {
        url: 'https://picsum.photos/seed/seo-preview/1200/630',
        width: 1200,
        height: 630,
        alt: 'MultiPrintTools - Dividir Imagen para Imprimir',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dividir Imagen para Imprimir | MultiPrintTools',
    description: 'Crea posters gigantes dividiendo fotos en varias hojas automáticamente con privacidad total.',
    images: ['https://picsum.photos/seed/seo-preview/1200/630'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
