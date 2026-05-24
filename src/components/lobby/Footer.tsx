'use client'

export function Footer() {
  return (
    <footer className="mt-12 text-center text-xs text-bate-ink/60 font-body space-y-1">
      <div>feito com ☕ e 🐱</div>
      <div>
        por{' '}
        <a
          href="https://www.linkedin.com/in/dev-matheus-dos-santos/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-bate-ink/80 hover:text-bate-red underline underline-offset-2 transition-colors"
        >
          Matheus dos Santos
        </a>
      </div>
    </footer>
  )
}
