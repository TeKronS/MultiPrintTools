
import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    default: 'MultiPrintTools | Herramientas Profesionales de Reprografía',
    template: '%s | MultiPrintTools'
  },
  description: 'Toolkit digital para expertos en impresión. Divide imágenes para murales, combina PDFs, cambia DPI de imágenes y convierte documentos. Procesamiento 100% local y privado.',
  keywords: [
    'reprografía', 'artes gráficas', 'dividir imagen para imprimir', 'unir pdf online', 
    'cambiar dpi imagen', 'poster maker', 'gigantografías', 'pdf a word', 'mural grid generator',
    'tiled printing', 'impresión de gran formato', 'herramientas para imprentas'
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
