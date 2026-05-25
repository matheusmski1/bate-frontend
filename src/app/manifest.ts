import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Batinho',
    short_name: 'Batinho',
    description: 'Memorize, espie, troque, corte. Menor placar leva.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f7e8c8',
    theme_color: '#e23744',
    lang: 'pt-BR',
    categories: ['games', 'entertainment'],
    icons: [
      { src: '/icon.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-large.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-large.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  }
}
