'use client'

import { Users, Eye } from 'lucide-react'
import type { RoomSummary } from '@/types/shared'

export function RoomList({ rooms, onJoin, onSpectate, onCreate, loaded = true }: { rooms: RoomSummary[]; onJoin: (id: string) => void; onSpectate?: (id: string) => void; onCreate?: () => void; loaded?: boolean }) {
  if (!loaded) {
    return (
      <div className="text-center py-12 bg-bate-paper rounded-2xl border-[3px] border-dashed border-bate-ink/30 shadow-hard">
        <div className="inline-flex gap-1 mb-3">
          <span className="w-2 h-2 rounded-full bg-bate-ink/50 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-bate-ink/50 animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-bate-ink/50 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
        <p className="font-display text-bate-ink/60 text-sm">CARREGANDO SALAS…</p>
      </div>
    )
  }
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 bg-bate-paper rounded-2xl border-[3px] border-dashed border-bate-ink/40 shadow-hard">
        <div className="text-5xl mb-3">🃏</div>
        <p className="font-display text-bate-ink mb-1">NENHUMA SALA ABERTA</p>
        <p className="text-bate-ink/60 text-sm mb-5 font-body">Seja o primeiro a abrir uma mesa!</p>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="px-5 py-3 rounded-xl bg-bate-gold border-[3px] border-bate-ink shadow-hard-sm font-display text-bate-ink hover:scale-105 transition-transform"
          >
            + CRIAR A PRIMEIRA SALA
          </button>
        )}
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {rooms.map(room => {
        const isFull = room.playerCount >= room.maxPlayers
        const canJoin = (room.phase === 'waiting' || room.phase === 'round-end') && !isFull
        const inActiveGame = room.phase === 'playing' || room.phase === 'bate-called' || room.phase === 'effect-pending' || room.phase === 'initial-peek'
        const spectators = room.spectatorCount ?? 0
        return (
          <li key={room.roomId} className="flex justify-between items-center bg-bate-paper rounded-xl px-5 py-4 border-[3px] border-bate-ink shadow-hard-sm">
            <div>
              <div className="font-display text-bate-ink text-lg">{room.name}</div>
              <div className="text-sm text-bate-ink/70 flex items-center gap-2 font-body">
                <Users size={14} /> {room.playerCount}/{room.maxPlayers}
                {spectators > 0 && (
                  <>
                    <span>•</span>
                    <Eye size={14} /> {spectators}
                  </>
                )}
                <span>•</span>
                <span className={inActiveGame ? 'text-bate-red font-bold' : room.phase === 'round-end' ? 'text-bate-gold font-bold' : 'text-bate-green font-bold'}>
                  {inActiveGame ? 'em jogo' : room.phase === 'round-end' ? 'entre rodadas' : 'aguardando'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {canJoin && (
                <button
                  onClick={() => onJoin(room.roomId)}
                  className="px-4 py-2 rounded-lg bg-bate-green text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-105 transition-transform"
                >
                  ENTRAR
                </button>
              )}
              {inActiveGame && !isFull && (
                <button
                  onClick={() => onJoin(room.roomId)}
                  title="Você entra como espectador agora e vira jogador na próxima rodada"
                  className="px-4 py-2 rounded-lg bg-bate-green text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-105 transition-transform"
                >
                  ENTRAR (PRÓX.)
                </button>
              )}
              {inActiveGame && onSpectate && (
                <button
                  onClick={() => onSpectate(room.roomId)}
                  title="Assistir partida"
                  className="px-4 py-2 rounded-lg bg-bate-paper text-bate-ink border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-105 transition-transform flex items-center gap-1.5"
                >
                  <Eye size={14} strokeWidth={3} /> ASSISTIR
                </button>
              )}
              {isFull && !inActiveGame && (
                <span className="px-4 py-2 rounded-lg bg-bate-ink/20 text-bate-ink/60 border-[3px] border-bate-ink/40 font-display">CHEIA</span>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
