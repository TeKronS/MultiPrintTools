import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.multiprinttools.com'),
  title: {
    default: 'MultiPrintTools | Dividir Imagen para Imprimir en Varias Hojas',
    template: '%s | MultiPrintTools'
  },
  description: 'Herramientas profesionales para imprimir posters gigantes. Dividir imagen para imprimir en múltiples hojas (A4, Carta, Rollo) con solapes técnicos y procesamiento local privado.',
  keywords: [
    'dividir imagen para imprimir en múltiples hojas', 'imprimir poster en varias hojas', 
    'split image for poster printing', 'crear poster gigante', 'tiled printing automation',
    'dividir fotos para imprimir', 'poster grid maker', 'reprografía profesional',
    'imprimir gigantografías casa', 'mosaico de fotos para pared'
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
    apple: '/icono.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MultiPrintTools',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://www.multiprinttools.com',
    siteName: 'MultiPrintTools',
    title: 'MultiPrintTools | Dividir Imagen para Imprimir',
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
    title: 'Dividir Imagen para Imprimir | MultiPrintTools',
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
        <meta name="theme-color" content="#166534" />
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
