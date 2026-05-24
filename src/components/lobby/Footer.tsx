'use client'

import { Code2 } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-16 text-center text-xs text-cabo-purple/60 space-y-2">
      <div className="flex justify-center items-center gap-4">
        <a
          href="https://github.com/matheusmski1/bate-backend/blob/main/RULES.md"
          target="_blank"
          rel="noreferrer"
          className="hover:text-cabo-gold transition-colors"
        >
          Regras completas
        </a>
        <span>•</span>
        <a
          href="https://github.com/matheusmski1/bate-frontend"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 hover:text-cabo-gold transition-colors"
        >
          <Code2 size={12} /> Código
        </a>
        <span>•</span>
        <a
          href="mailto:matheusmski1@gmail.com?subject=Bate%20-%20feedback"
          className="hover:text-cabo-gold transition-colors"
        >
          Feedback
        </a>
      </div>
      <div>Beta • feito com ☕ em SC</div>
    </footer>
  )
}
