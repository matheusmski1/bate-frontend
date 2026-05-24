'use client'

import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import type { RedactedState } from '@/types/shared'

export function WaitingRoom({ state }: { state: RedactedState }) {
  const playerId = getPlayerId()
  const isHost = state.hostId === playerId
  const canStart = isHost && state.players.length >= 2

  function start() {
    getSocket().emit('game:start', { roomId: state.roomId, playerId }, (res: { ok?: true; error?: string }) => {
      if (res.error) alert(`Erro: ${res.error}`)
    })
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-2">{state.name}</h1>
      <p className="text-cabo-purple mb-8">Código: <span className="text-white font-mono">{state.roomId}</span></p>
      <h2 className="text-xl font-bold mb-4">Jogadores ({state.players.length}/{state.maxPlayers})</h2>
      <ul className="space-y-2 mb-8">
        {state.players.map(p => (
          <li key={p.id} className="bg-cabo-surface rounded-lg px-4 py-3 flex justify-between">
            <span>{p.name}{p.id === state.hostId && ' (host)'}</span>
            <span className={p.connected ? 'text-cabo-success' : 'text-cabo-danger'}>
              {p.connected ? 'online' : 'offline'}
            </span>
          </li>
        ))}
      </ul>
      {isHost ? (
        <button
          onClick={start}
          disabled={!canStart}
          className="w-full py-4 rounded-xl bg-cabo-accent font-bold text-lg disabled:opacity-40"
        >
          {canStart ? 'Iniciar partida' : 'Aguarde mais jogadores…'}
        </button>
      ) : (
        <div className="text-center text-cabo-purple py-4">Aguardando host iniciar…</div>
      )}
    </main>
  )
}
