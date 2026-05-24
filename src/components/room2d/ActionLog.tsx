'use client'

import { useState } from 'react'
import type { GameAction, RedactedState, Rank } from '@/types/shared'
import { CARD_META } from '@/lib/card-meta'

function labelFor(rank: string | undefined): string {
  if (!rank) return ''
  const meta = CARD_META[rank as Rank]
  return meta?.displayName ?? rank
}

function describe(action: GameAction, state: RedactedState): string {
  const actor = state.players.find(p => p.id === action.actorId)?.name ?? 'alguém'
  if (action.type === 'draw') return `${actor} comprou`
  if (action.type === 'discard') {
    const rank = (action.payload as { rank?: string } | undefined)?.rank
    return `${actor} descartou ${labelFor(rank)}`
  }
  if (action.type === 'snap') {
    const rank = (action.payload as { rank?: string } | undefined)?.rank
    return `${actor} cortou ${labelFor(rank)}`
  }
  if (action.type === 'snap-fail') return `${actor} errou o snap (+1 carta)`
  if (action.type === 'peek') return `${actor} espiou uma carta`
  if (action.type === 'swap') return `${actor} trocou cartas`
  if (action.type === 'cabo') return `${actor} chamou BATE!`
  if (action.type === 'round-end') return 'Fim da rodada'
  if (action.type === 'join') return `${actor} entrou`
  if (action.type === 'leave') return `${actor} saiu`
  return ''
}

const COLORS: Partial<Record<GameAction['type'], string>> = {
  snap: 'text-bate-red',
  'snap-fail': 'text-bate-red',
  cabo: 'text-bate-red font-bold',
  'round-end': 'text-bate-green font-bold',
}

export function ActionLog({ state }: { state: RedactedState }) {
  const [open, setOpen] = useState(false)
  const recent = [...state.log].reverse().slice(0, 30)
  const count = state.log.length

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed top-4 right-4 z-50 w-12 h-12 rounded-full bg-bate-paper/90 backdrop-blur text-bate-red text-xl shadow-2xl hover:scale-110 transition-transform border border-bate-ink/40 flex items-center justify-center"
        title="Histórico"
      >
        {open ? '✕' : '📜'}
        {!open && count > 0 && (
          <span className="absolute -top-1 -right-1 bg-bate-red text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      <div
        className={`fixed top-0 right-0 h-screen w-72 bg-bate-paper/95 backdrop-blur z-40 shadow-2xl overflow-y-auto p-4 pt-20 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <h4 className="font-bold mb-3 text-bate-ink text-sm uppercase">Histórico</h4>
        {recent.length === 0 ? (
          <p className="text-bate-ink/60 text-sm">Nada ainda…</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {recent.map((a, i) => (
              <li key={i} className={COLORS[a.type] ?? 'text-white'}>
                {describe(a, state)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
