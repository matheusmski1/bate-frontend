'use client'

export function BackgroundBoteco() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" style={{ backgroundColor: '#5a3a1f' }}>
      {/* parede de tijolinho */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 22px),
            repeating-linear-gradient(90deg, rgba(0,0,0,0.18) 0 2px, transparent 2px 40px)
          `,
        }}
      />

      {/* luz quente da janela à direita */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 40% 50% at 95% 30%, rgba(255,184,28,0.35) 0%, transparent 70%)',
        }}
      />

      {/* chão de madeira escura na base */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '30%',
          background: 'linear-gradient(180deg, transparent 0%, #2d1810 40%, #1a0e08 100%)',
        }}
      />

      {/* neon hero (asset opcional — se não existir, dica visual fica no background) */}
      <img
        src="/arenas/boteco/neon-bar-do-batinho.webp"
        alt=""
        aria-hidden
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        className="absolute top-6 left-6 w-48 opacity-90 pointer-events-none select-none"
        style={{ filter: 'drop-shadow(0 0 12px rgba(255,184,28,0.6))' }}
      />
    </div>
  )
}
