import './globals.css'
import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Bate — Multiplayer',
  description: 'Multiplayer Bate card game',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={fredoka.variable}>
      <body className="font-display antialiased">{children}</body>
    </html>
  )
}
