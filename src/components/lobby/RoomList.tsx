'use client'

import { Users } from 'lucide-react'
import type { RoomSummary } from '@/types/shared'

export function RoomList({ rooms, onJoin, onCreate }: { rooms: RoomSummary[]; onJoin: (id: string) => void; onCreate?: () => void }) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 bg-cabo-surface/40 rounded-2xl border-2 border-dashed border-cabo-purple/30">
        <div className="text-5xl mb-3 opacity-60">🃏</div>
        <p className="text-cabo-purple font-bold mb-1">Nenhuma sala aberta</p>
        <p className="text-cabo-purple/60 text-sm mb-5">Seja o primeiro a abrir uma mesa!</p>
        {onCreate && (
          <button
            type="button"
            onClick={onCreate}
            className="px-5 py-2 rounded-xl bg-cabo-accent font-bold hover:opacity-90"
          >
            + Criar a primeira sala
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
          <li key={room.roomId} className="flex justify-between items-center bg-cabo-surface rounded-xl px-5 py-4 border border-cabo-purple/20">
            <div>
              <div className="font-bold text-lg">{room.name}</div>
              <div className="text-sm text-cabo-purple flex items-center gap-2">
                <Users size={14} /> {room.playerCount}/{room.maxPlayers}
                <span>•</span>
                <span className={inGame ? 'text-cabo-accent' : 'text-cabo-success'}>
                  {inGame ? 'em jogo' : 'aguardando'}
                </span>
              </div>
            </div>
            <button
              onClick={() => onJoin(room.roomId)}
              disabled={disabled}
              className="px-5 py-2 rounded-lg bg-cabo-purple font-bold hover:bg-cabo-purple/80 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isFull ? 'Cheia' : inGame ? 'Em jogo' : 'Entrar'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
