'use client'

import { ARENA_DECORATIONS } from '@/lib/arena-decorations'

export function ArenaDecorationsLayer({ arenaId = 'default' }: { arenaId?: string }) {
  const decorations = ARENA_DECORATIONS[arenaId] ?? []
  if (decorations.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none -z-[5] overflow-hidden" aria-hidden>
      {decorations.map((d, i) => (
        <img
          key={`${d.asset}-${i}`}
          src={`/arenas/${arenaId}/decorations/${d.asset}.webp`}
          alt=""
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
          className={`absolute select-none deco-anim-${d.animation}`}
          style={{
            ...d.position,
            width: d.size.width,
            height: d.size.height,
            willChange: d.animation === 'none' ? 'auto' : 'transform, filter',
          }}
        />
      ))}
    </div>
  )
}
