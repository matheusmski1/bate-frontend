'use client'

import { useRouter } from 'next/navigation'
import type { RedactedState } from '@/types/shared'
import { getMascot } from '@/lib/mascot'
import { getPlayerId } from '@/lib/player-id'

export function MatchEndScreen({ state }: { state: RedactedState }) {
  const router = useRouter()
  const myId = getPlayerId()
  const arenaId = state.players.find(p => p.id === myId)?.arena ?? 'default'
  const sorted = [...state.players].sort((a, b) => a.score - b.score)
  const loser = sorted[sorted.length - 1]
  const winner = sorted[0]

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-bate-paper p-8 rounded-3xl max-w-md w-full text-center border-[4px] border-bate-ink shadow-hard-lg">
        <img
          src={getMascot('trofeu', arenaId)}
          alt=""
          aria-hidden
          className="w-32 sm:w-40 mx-auto mb-2 select-none"
          style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,0.4))' }}
        />
        <h2
          className="font-display text-5xl text-bate-red mb-2"
          style={{
            WebkitTextStroke: '2px #1a0e08',
            textShadow: '4px 4px 0 #1a0e08, 4px 4px 0 #ffb81c, 6px 6px 0 #1a0e08',
          }}
        >
          FIM DE PARTIDA
        </h2>
        <p className="font-display text-bate-ink mb-6 text-sm">🏆 {winner?.name} venceu — {loser?.name} chegou a 100 pontos</p>
        <ul className="space-y-2 mb-8">
          {sorted.map((p, i) => (
            <li
              key={p.id}
              className={`flex justify-between rounded-xl px-4 py-3 border-[3px] border-bate-ink shadow-hard-sm ${i === 0 ? 'bg-bate-gold text-bate-ink' : 'bg-bate-cream text-bate-ink'}`}
            >
              <span className="font-display text-sm">{i === 0 ? '🏆' : `${i + 1}º`} {p.name}</span>
              <span className="font-display">{p.score}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-2xl bg-bate-red text-bate-paper border-[4px] border-bate-ink font-display shadow-hard hover:scale-[1.02] transition-transform"
        >
          VOLTAR PRO LOBBY
        </button>
      </div>
    </main>
  )
}
