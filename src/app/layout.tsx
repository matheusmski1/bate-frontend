import './globals.css'
import type { Metadata } from 'next'
import { Fredoka, Bowlby_One, Caveat } from 'next/font/google'

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
  title: 'Bate — Cabo brasileiro multiplayer',
  description: 'Cabo brasileiro online: rápido, gratuito, 2-4 jogadores.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${bowlby.variable} ${caveat.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  )
}
