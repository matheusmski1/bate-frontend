import './globals.css'
import type { Metadata } from 'next'
import { Fredoka, Bowlby_One, Caveat } from 'next/font/google'
import { ToastHost } from '@/components/ui/ToastHost'
import { ConfirmHost } from '@/components/ui/ConfirmHost'

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
  title: 'Batinho',
  description: 'Os Batinhos são malandros: memorizam, espiam, trocam e cortam. Menor placar leva. 2-4 jogadores, grátis.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${bowlby.variable} ${caveat.variable}`}>
      <body className="font-body antialiased">
        {children}
        <ToastHost />
        <ConfirmHost />
      </body>
    </html>
  )
}
