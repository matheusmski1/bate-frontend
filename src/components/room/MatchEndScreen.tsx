'use client'

import { useRouter } from 'next/navigation'
import type { RedactedState } from '@/types/shared'

export function MatchEndScreen({ state }: { state: RedactedState }) {
  const router = useRouter()
  const sorted = [...state.players].sort((a, b) => a.score - b.score)
  const loser = sorted[sorted.length - 1]

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="bg-cabo-surface p-8 rounded-2xl max-w-md w-full text-center">
        <h2 className="text-4xl font-bold text-cabo-accent mb-2">Fim de partida</h2>
        <p className="text-cabo-purple mb-6">{loser?.name} chegou a 100 pontos</p>
        <ul className="space-y-2 mb-8">
          {sorted.map((p, i) => (
            <li key={p.id} className={`flex justify-between rounded-lg px-4 py-3 ${i === 0 ? 'bg-cabo-gold text-cabo-bg' : 'bg-cabo-bg'}`}>
              <span className="font-bold">{i + 1}. {p.name}</span>
              <span className="font-bold">{p.score}</span>
            </li>
          ))}
        </ul>
        <button onClick={() => router.push('/')} className="w-full py-3 rounded-xl bg-cabo-purple font-bold">
          Voltar pro lobby
        </button>
      </div>
    </main>
  )
}
