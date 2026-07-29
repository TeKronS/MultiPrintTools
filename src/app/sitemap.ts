
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.multiprinttools.com/'
  const lastModified = new Date()

  const routes = [
    '',
    'poster',
    'resizer',
    'text-tools',
    'pdf-merge',
    'pdf-split',
    'pdf-to-img',
    'image-to-pdf',
    'pdf-to-word',
    'muralis',
    'sticker-sheet',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
}
