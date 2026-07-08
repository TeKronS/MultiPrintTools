import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MultiPrintTools',
    short_name: 'MultiPrint',
    description: 'Suite profesional de herramientas para impresión y gestión de PDF.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#166534',
    icons: [
      {
        src: '/icono.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icono.png',
        sizes: 'any',
        type: 'image/png',
        purpose: 'any'
      },
    ],
  }
}
