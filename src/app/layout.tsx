
import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    default: 'MultiPrintTools | Herramientas Profesionales de Impresión y PDF',
    template: '%s | MultiPrintTools'
  },
  description: 'Toolkit digital gratuito para expertos en impresión. Divide imágenes para murales y pósters, combina y separa PDFs, cambia DPI de fotos y convierte documentos. Procesamiento 100% local, rápido y privado.',
  keywords: [
    'reprografía', 'artes gráficas', 'dividir imagen para imprimir', 'unir pdf online', 
    'cambiar dpi imagen', 'poster maker', 'gigantografías', 'pdf a word', 'mural grid generator',
    'tiled printing', 'impresión de gran formato', 'herramientas para imprentas', 'imprimir posters gigantes',
    'diseño gráfico', 'herramientas pdf gratis', 'gestión de documentos', 'diseño de murales', 'imprimir en casa',
    'herramientas de impresión', 'unir archivos pdf', 'separar hojas pdf', 'convertir imagen a pdf',
    'imprimir poster en varias hojas', 'dividir foto para pared', 'hojas carta', 'hojas oficio', 'hojas A4',
    'combinar pdf privado', 'extraer paginas pdf sin subir', 'convertir imagen a pdf alta calidad'
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
    title: 'MultiPrintTools | Suite Profesional de Reprografía',
    description: 'Herramientas locales para impresión y gestión de PDF. Privacidad total: tus archivos nunca salen de tu equipo.',
    images: [
      {
        url: 'https://picsum.photos/seed/seo-preview/1200/630',
        width: 1200,
        height: 630,
        alt: 'MultiPrintTools Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MultiPrintTools | Suite Profesional de Reprografía',
    description: 'Optimiza tus trabajos de impresión y PDF con procesamiento local y privado.',
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
