
import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.multiprinttools.com'),
  title: {
    default: 'MultiPrintTools | Suite Digital de Impresión e Independencia Técnica',
    template: '%s | MultiPrintTools'
  },
  description: 'Herramientas digitales para expertos en impresión y oficinas. Automatiza cuadrículas para pósters y gestión de PDF con procesamiento local y privacidad garantizada.',
  keywords: [
    'split image for poster printing', 'tiled printing automation', 'dividir imagen para imprimir', 
    'dividir imagen en varias hojas', 'reprography automation', 'poster grid maker',
    'cuadrícula para poster gigante', 'reprografía profesional', 'dividir foto en hojas a4',
    'herramientas para imprentas', 'crear gigantografías rápido', 'unir pdf sin internet', 
    'poster maker professional', 'mosaico de fotos para pared'
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
    url: 'https://www.multiprinttools.com',
    siteName: 'MultiPrintTools',
    title: 'MultiPrintTools | Split Image for Poster Printing',
    description: 'La suite definitiva para automatizar tareas de impresión. Crea cuadrículas técnicas para posters gigantes con total privacidad.',
    images: [
      {
        url: '/icono.png',
        width: 512,
        height: 512,
        alt: 'MultiPrintTools Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Split Image for Poster Printing | MultiPrintTools',
    description: 'Divide fotos en múltiples hojas automáticamente con procesamiento local y privacidad total.',
    images: ['/icono.png'],
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
