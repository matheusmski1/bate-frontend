import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Fredoka, Bowlby_One, Caveat } from 'next/font/google'
import { ToastHost } from '@/components/ui/ToastHost'
import { ConfirmHost } from '@/components/ui/ConfirmHost'
import { ServiceWorkerRegister } from '@/components/system/ServiceWorkerRegister'
import { MotionProvider } from '@/components/system/MotionProvider'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

const bowlby = Bowlby_One({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bowlby',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-caveat',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.batinho.com.br'),
  title: 'Batinho',
  description: 'Memorize, espie, troque, corte. Menor placar leva. Bate online, 2-4 jogadores, grátis.',
  applicationName: 'Batinho',
  appleWebApp: {
    capable: true,
    title: 'Batinho',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'Batinho',
    description: 'Bate online: memorize, espie, troque, corte. Menor placar leva.',
    url: 'https://www.batinho.com.br',
    siteName: 'Batinho',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Batinho — Bate online multiplayer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Batinho',
    description: 'Bate online: memorize, espie, troque, corte. Menor placar leva.',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#e23744',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${bowlby.variable} ${caveat.variable}`}>
      <body className="font-body antialiased">
        <MotionProvider>
          {children}
          <ToastHost />
          <ConfirmHost />
        </MotionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
