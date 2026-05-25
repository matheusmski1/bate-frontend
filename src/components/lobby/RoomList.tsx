'use client'

import { Users } from 'lucide-react'
import type { RoomSummary } from '@/types/shared'

export function RoomList({ rooms, onJoin, onCreate, loaded = true }: { rooms: RoomSummary[]; onJoin: (id: string) => void; onCreate?: () => void; loaded?: boolean }) {
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
        const inGame = room.phase !== 'waiting'
        const disabled = isFull || inGame
        return (
          <li key={room.roomId} className="flex justify-between items-center bg-bate-paper rounded-xl px-5 py-4 border-[3px] border-bate-ink shadow-hard-sm">
            <div>
              <div className="font-display text-bate-ink text-lg">{room.name}</div>
              <div className="text-sm text-bate-ink/70 flex items-center gap-2 font-body">
                <Users size={14} /> {room.playerCount}/{room.maxPlayers}
                <span>•</span>
                <span className={inGame ? 'text-bate-red font-bold' : 'text-bate-green font-bold'}>
                  {inGame ? 'em jogo' : 'aguardando'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onJoin(room.roomId)}
              disabled={disabled}
              className="px-5 py-2 rounded-lg bg-bate-green text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-bate-ink/30"
            >
              {isFull ? 'CHEIA' : inGame ? 'EM JOGO' : 'ENTRAR'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
