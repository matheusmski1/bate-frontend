'use client'

import { useState } from 'react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'

export function CreateRoomDialog({ hostName, onCreated, onClose }: { hostName: string; onCreated: (roomId: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4)
  const [submitting, setSubmitting] = useState(false)

  function submit() {
    if (!name.trim()) return
    setSubmitting(true)
    getSocket().emit(
      'room:create',
      { name: name.trim(), hostId: getPlayerId(), hostName, maxPlayers },
      (res: { roomId?: string; error?: string }) => {
        setSubmitting(false)
        if (res.error) {
          alert(`Erro: ${res.error}`)
          return
        }
        if (res.roomId) onCreated(res.roomId)
      }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-cabo-surface rounded-2xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold mb-6">Criar sala</h3>
        <label className="block mb-2 text-sm font-bold text-cabo-purple">Nome da sala</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 mb-4 rounded-xl bg-cabo-bg text-white"
          maxLength={30}
        />
        <label className="block mb-2 text-sm font-bold text-cabo-purple">Máximo de jogadores</label>
        <div className="flex gap-2 mb-6">
          {([2, 3, 4] as const).map(n => (
            <button
              key={n}
              onClick={() => setMaxPlayers(n)}
              className={`flex-1 py-3 rounded-xl font-bold ${maxPlayers === n ? 'bg-cabo-accent' : 'bg-cabo-bg'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-cabo-bg font-bold">Cancelar</button>
          <button onClick={submit} disabled={submitting} className="flex-1 py-3 rounded-xl bg-cabo-success font-bold disabled:opacity-50">
            {submitting ? 'Criando…' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}
