'use client'
import { toast } from '@/lib/ui-store'

import { useRouter } from 'next/navigation'
import { LogOut, Copy } from 'lucide-react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import { Avatar } from '@/components/lobby/Avatar'
import type { RedactedState } from '@/types/shared'

export function WaitingRoom({ state }: { state: RedactedState }) {
  const playerId = getPlayerId()
  const isHost = state.hostId === playerId
  const canStart = isHost && state.players.length >= 2
  const isPractice = state.players.some(p => p.isBot)
  const router = useRouter()

  async function copyInvite() {
    const url = `${location.origin}/room/${state.roomId}`
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) {
        await navigator.share({ title: 'Batinho', text: 'Bora jogar Batinho?', url })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Convite copiado!')
      }
    } catch {
      toast.error('Não rolou copiar — copia da barra de endereço')
    }
  }

  function leave() {
    getSocket().emit('room:leave', { roomId: state.roomId, playerId }, () => router.push('/'))
  }

  function start() {
    getSocket().emit('game:start', { roomId: state.roomId, playerId }, (res: { ok?: true; error?: string }) => {
      if (res.error) toast.error(`Erro: ${res.error}`)
    })
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <div className="relative bg-bate-paper rounded-3xl p-8 border-[4px] border-bate-ink shadow-hard-lg">
        <button
          type="button"
          onClick={leave}
          title="Sair da sala"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-red hover:text-bate-paper transition-colors"
        >
          <LogOut size={14} strokeWidth={3} />
        </button>
        <h1 className="font-display text-4xl text-bate-red mb-2">{state.name}</h1>
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <p className="text-bate-ink/70 font-body">
            Código: <span className="text-bate-ink font-mono font-bold">{state.roomId}</span>
          </p>
          {state.private && (
            <span className="font-display text-xs px-2 py-1 rounded-md bg-bate-ink text-bate-paper">🔒 PRIVADA</span>
          )}
          <button
            type="button"
            onClick={copyInvite}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-bate-gold border-[3px] border-bate-ink shadow-hard-sm font-display text-sm text-bate-ink hover:scale-105 transition-transform"
          >
            <Copy size={14} strokeWidth={3} /> COPIAR CONVITE
          </button>
        </div>
        <h2 className="font-display text-xl text-bate-ink mb-4">JOGADORES ({state.players.length}/{state.maxPlayers})</h2>
        <ul className="space-y-2 mb-8">
          {state.players.map(p => (
            <li key={p.id} className="bg-bate-cream rounded-lg px-4 py-3 flex justify-between items-center border-[2px] border-bate-ink shadow-hard-sm">
              <span className="font-display text-sm text-bate-ink flex items-center gap-2">
                <Avatar name={p.name} size={28} />
                {p.isBot ? '🤖 ' : ''}{p.name}{p.id === state.hostId && ' 👑'}
              </span>
              <span className={`font-display text-xs ${(p.connected || p.isBot) ? 'text-bate-green' : 'text-bate-red'}`}>
                {(p.connected || p.isBot) ? 'ONLINE' : 'OFFLINE'}
              </span>
            </li>
          ))}
        </ul>
        {!isPractice && (isHost ? (
          <button
            onClick={start}
            disabled={!canStart}
            className="w-full py-4 rounded-2xl bg-bate-gold text-bate-ink font-display text-lg border-[4px] border-bate-ink shadow-hard hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {canStart ? '▶ INICIAR PARTIDA' : 'AGUARDE MAIS JOGADORES…'}
          </button>
        ) : (
          <div className="text-center text-bate-ink/70 py-4 font-display">AGUARDANDO HOST INICIAR…</div>
        ))}
      </div>
    </main>
  )
}
