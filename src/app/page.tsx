'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Zap } from 'lucide-react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId, getStoredName, setStoredName } from '@/lib/player-id'
import { useGameStore } from '@/lib/store'
import { RoomList } from '@/components/lobby/RoomList'
import { CreateRoomDialog } from '@/components/lobby/CreateRoomDialog'
import { Hero } from '@/components/lobby/Hero'
import { QuickRules } from '@/components/lobby/QuickRules'
import { Avatar } from '@/components/lobby/Avatar'
import { MuteToggle } from '@/components/lobby/MuteToggle'
import { Footer } from '@/components/lobby/Footer'

const QUICK_ROOM_NAMES = ['Mesa do Maizão', 'Cabo Rápido', 'Sala do Zé', 'Bate Express', 'Mesa relâmpago']

export default function Home() {
  const router = useRouter()
  const rooms = useGameStore(s => s.rooms)
  const setRooms = useGameStore(s => s.setRooms)
  const [name, setName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

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

  useEffect(() => {
    if (!getStoredName()) inputRef.current?.focus()
  }, [])

  function requireName(): boolean {
    if (!name.trim()) {
      inputRef.current?.focus()
      alert('Coloca um nome primeiro')
      return false
    }
    return true
  }

  function handleJoin(roomId: string) {
    if (!requireName()) return
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

  function openCreate() {
    if (!requireName()) return
    setShowCreate(true)
  }

  function handleQuickPlay() {
    if (!requireName()) return
    const available = rooms.find(r => r.phase === 'waiting' && r.playerCount < r.maxPlayers)
    if (available) {
      handleJoin(available.roomId)
      return
    }
    setStoredName(name)
    const randomName = QUICK_ROOM_NAMES[Math.floor(Math.random() * QUICK_ROOM_NAMES.length)]!
    getSocket().emit(
      'room:create',
      { name: randomName, hostId: getPlayerId(), hostName: name, maxPlayers: 4 },
      (res: { roomId?: string; error?: string }) => {
        if (res.error) {
          alert(`Erro: ${res.error}`)
          return
        }
        if (res.roomId) handleJoin(res.roomId)
      },
    )
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 sm:py-12 max-w-3xl mx-auto">
      <div className="fixed top-4 right-4 z-50">
        <MuteToggle />
      </div>

      <Hero />

      <div className="mb-6">
        <label className="block text-sm font-display text-bate-ink mb-2">SEU NOME</label>
        <div className="flex items-center gap-3">
          <Avatar name={name} size={52} />
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim()) openCreate()
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-bate-paper text-bate-ink text-lg border-[3px] border-bate-ink shadow-hard-sm font-body font-semibold focus:outline-none focus:bg-white transition-colors"
            placeholder="Como te chamam?"
            maxLength={20}
            autoComplete="off"
          />
        </div>
      </div>

      <QuickRules />

      <button
        type="button"
        onClick={handleQuickPlay}
        className="w-full mb-6 py-4 rounded-2xl bg-bate-red text-bate-paper border-[4px] border-bate-ink shadow-hard-lg font-display text-lg hover:scale-[1.02] active:scale-[0.99] transition-transform flex items-center justify-center gap-2"
      >
        <Zap size={20} fill="currentColor" /> JOGAR AGORA
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl text-bate-ink">SALAS ABERTAS</h2>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 rounded-xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm font-display text-bate-ink hover:scale-105 transition-transform flex items-center gap-2"
        >
          <Plus size={16} /> CRIAR
        </button>
      </div>

      <RoomList rooms={rooms} onJoin={handleJoin} onCreate={openCreate} />

      <Footer />

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
