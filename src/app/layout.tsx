
import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  metadataBase: new URL('https://tekron-web-studio.vercel.app/'),
  title: {
    default: 'MultiPrintTools | Split Image for Poster Printing & Automation',
    template: '%s | MultiPrintTools'
  },
  description: 'Ultimate suite to split image for poster printing and automate reprography workflows. Professional tools for tiled printing, PDF management, and image optimization.',
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
    url: 'https://tekron-web-studio.vercel.app/',
    siteName: 'MultiPrintTools',
    title: 'MultiPrintTools | Split Image for Poster Printing',
    description: 'The flagship tool to split images for printing technical posters. Optimize your workflow with local processing.',
    images: [
      {
        url: 'https://picsum.photos/seed/seo-preview/1200/630',
        width: 1200,
        height: 630,
        alt: 'MultiPrintTools - Split Image for Poster Printing',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Split Image for Poster Printing | MultiPrintTools',
    description: 'Create giant posters by splitting photos into multiple sheets automatically with total privacy.',
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
