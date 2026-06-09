import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  metadataBase: new URL('https://tekron-web-studio.vercel.app/'),
  title: {
    default: 'MultiPrintTools | Cuadrícula para Poster y Automatización de Impresión',
    template: '%s | MultiPrintTools'
  },
  description: 'La suite definitiva para automatizar tu flujo de trabajo en reprografía. Generador automático de cuadrículas para posters gigantes, gestión de PDFs y optimización de imágenes 100% local y privada.',
  keywords: [
    'automatización de impresión', 'cuadrícula para poster gigante', 'reprografía profesional', 
    'dividir imagen para imprimir automático', 'tiled printing automation', 'herramientas para imprentas',
    'crear gigantografías rápido', 'unir pdf sin internet', 'poster maker professional',
    'gestión de documentos automatizada', 'diseño de murales técnicos', 'imprimir poster varias hojas',
    'reprographics workflow', 'software de impresión local', 'privacidad en documentos'
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
    title: 'MultiPrintTools | Automatización de Reprografía y Posters',
    description: 'Optimiza y automatiza tus trabajos de impresión con procesamiento local. La herramienta estrella para crear posters gigantes de forma técnica y rápida.',
    images: [
      {
        url: 'https://picsum.photos/seed/seo-preview/1200/630',
        width: 1200,
        height: 630,
        alt: 'MultiPrintTools - Cuadrícula para Poster y Automatización',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MultiPrintTools | Suite de Automatización de Impresión',
    description: 'Crea posters gigantes automáticamente y gestiona tus archivos PDF con privacidad total.',
    images: ['https://picsum.photos/seed/seo-preview/1200/630'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
