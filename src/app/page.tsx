'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId, getStoredName, setStoredName } from '@/lib/player-id'
import { useGameStore } from '@/lib/store'
import { RoomList } from '@/components/lobby/RoomList'
import { CreateRoomDialog } from '@/components/lobby/CreateRoomDialog'

export default function Home() {
  const router = useRouter()
  const rooms = useGameStore(s => s.rooms)
  const setRooms = useGameStore(s => s.setRooms)
  const [name, setName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    setName(getStoredName())
    const socket = getSocket()
    socket.emit('lobby:subscribe')
    socket.on('lobby:update', ({ rooms }: { rooms: import('@/types/shared').RoomSummary[] }) => {
      setRooms(rooms)
    })
    return () => {
      socket.emit('lobby:unsubscribe')
      socket.off('lobby:update')
    }
  }, [setRooms])

  function handleJoin(roomId: string) {
    if (!name.trim()) {
      alert('Coloca um nome primeiro')
      return
    }
    setStoredName(name)
    const socket = getSocket()
    socket.emit('room:join', { roomId, playerId: getPlayerId(), playerName: name }, (res: { ok?: true; error?: string }) => {
      if (res.error) {
        alert(`Erro: ${res.error}`)
        return
      }
      router.push(`/room/${roomId}`)
    })
  }

  function handleCreated(roomId: string) {
    setShowCreate(false)
    handleJoin(roomId)
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <h1 className="text-5xl font-bold text-cabo-gold mb-8">Bate</h1>
      <div className="mb-6">
        <label className="block text-sm font-bold mb-2 text-cabo-purple">Seu nome</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-cabo-surface text-white text-lg"
          placeholder="Como te chamam?"
          maxLength={20}
        />
      </div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Salas abertas</h2>
        <button
          onClick={() => name.trim() ? setShowCreate(true) : alert('Coloca um nome primeiro')}
          className="px-6 py-3 rounded-xl bg-cabo-accent font-bold hover:opacity-90"
        >
          + Criar sala
        </button>
      </div>
      <RoomList rooms={rooms} onJoin={handleJoin} />
      {showCreate && (
        <CreateRoomDialog
          hostName={name}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </main>
  )
}
