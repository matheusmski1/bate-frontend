'use client'
import { toast } from '@/lib/ui-store'

import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import { skinImage } from '@/lib/mascot'
import type { RedactedState } from '@/types/shared'

export function WaitingRoom({ state }: { state: RedactedState }) {
  const playerId = getPlayerId()
  const isHost = state.hostId === playerId
  const canStart = isHost && state.players.length >= 2

  function start() {
    getSocket().emit('game:start', { roomId: state.roomId, playerId }, (res: { ok?: true; error?: string }) => {
      if (res.error) toast.error(`Erro: ${res.error}`)
    })
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <div className="bg-bate-paper rounded-3xl p-8 border-[4px] border-bate-ink shadow-hard-lg">
        <h1 className="font-display text-4xl text-bate-red mb-2">{state.name}</h1>
        <p className="text-bate-ink/70 mb-8 font-body">
          Código: <span className="text-bate-ink font-mono font-bold">{state.roomId}</span>
        </p>
        <h2 className="font-display text-xl text-bate-ink mb-4">JOGADORES ({state.players.length}/{state.maxPlayers})</h2>
        <ul className="space-y-2 mb-8">
          {state.players.map(p => (
            <li key={p.id} className="bg-bate-cream rounded-lg px-4 py-3 flex justify-between items-center border-[2px] border-bate-ink shadow-hard-sm">
              <span className="font-display text-sm text-bate-ink flex items-center gap-2">
                <img src={skinImage(p.skin)} alt="" className="w-7 h-7 rounded-full border-[2px] border-bate-ink bg-bate-paper object-cover" draggable={false} />
                {p.name}{p.id === state.hostId && ' 👑'}
              </span>
              <span className={`font-display text-xs ${p.connected ? 'text-bate-green' : 'text-bate-red'}`}>
                {p.connected ? 'ONLINE' : 'OFFLINE'}
              </span>
            </li>
          ))}
        </ul>
        {isHost ? (
          <button
            onClick={start}
            disabled={!canStart}
            className="w-full py-4 rounded-2xl bg-bate-gold text-bate-ink font-display text-lg border-[4px] border-bate-ink shadow-hard hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {canStart ? '▶ INICIAR PARTIDA' : 'AGUARDE MAIS JOGADORES…'}
          </button>
        ) : (
          <div className="text-center text-bate-ink/70 py-4 font-display">AGUARDANDO HOST INICIAR…</div>
        )}
      </div>
    </main>
  )
}
