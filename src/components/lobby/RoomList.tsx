'use client'

import type { RoomSummary } from '@/types/shared'

export function RoomList({ rooms, onJoin }: { rooms: RoomSummary[]; onJoin: (id: string) => void }) {
  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 text-cabo-purple">
        Nenhuma sala aberta. Cria a primeira!
      </div>
    )
  }
  return (
    <ul className="space-y-3">
      {rooms.map(room => (
        <li key={room.roomId} className="flex justify-between items-center bg-cabo-surface rounded-xl px-5 py-4">
          <div>
            <div className="font-bold text-lg">{room.name}</div>
            <div className="text-sm text-cabo-purple">
              {room.playerCount}/{room.maxPlayers} jogadores • {room.phase === 'waiting' ? 'aguardando' : 'em jogo'}
            </div>
          </div>
          <button
            onClick={() => onJoin(room.roomId)}
            disabled={room.playerCount >= room.maxPlayers || room.phase !== 'waiting'}
            className="px-5 py-2 rounded-lg bg-cabo-purple font-bold disabled:opacity-40"
          >
            Entrar
          </button>
        </li>
      ))}
    </ul>
  )
}
