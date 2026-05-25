'use client'
import { toast } from '@/lib/ui-store'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Plus, User } from 'lucide-react'
import { getSocket, ensureSocketConnected } from '@/lib/socket-client'
import { cachedPlayerId, ensureGuestSession } from '@/lib/auth'
import { getStoredName, setStoredName } from '@/lib/player-id'

function getPlayerId(): string {
  return cachedPlayerId() ?? ''
}
import { useGameStore } from '@/lib/store'
import { RoomList } from '@/components/lobby/RoomList'
import { CreateRoomDialog } from '@/components/lobby/CreateRoomDialog'
import { Hero } from '@/components/lobby/Hero'
import { CardFan } from '@/components/lobby/CardFan'
import { SuitBackground } from '@/components/lobby/SuitBackground'
import { QuickRules } from '@/components/lobby/QuickRules'
import { MuteToggle } from '@/components/lobby/MuteToggle'
import { SkinPicker } from '@/components/lobby/SkinPicker'
import { Tutorial, hasSeenTutorial } from '@/components/lobby/Tutorial'
import { Shirt, HelpCircle } from 'lucide-react'
import { Footer } from '@/components/lobby/Footer'

const QUICK_ROOM_NAMES = ['Mesa do Maizão', 'Batinho Rápido', 'Sala do Zé', 'Bate Express', 'Mesa relâmpago']

export default function Home() {
  const router = useRouter()
  const rooms = useGameStore(s => s.rooms)
  const setRooms = useGameStore(s => s.setRooms)
  const [name, setName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showSkins, setShowSkins] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [roomsLoaded, setRoomsLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setName(getStoredName())
    let cancelled = false
    let cleanup: (() => void) | null = null
    ensureSocketConnected().then(socket => {
      if (cancelled) return
      socket.emit('lobby:subscribe')
      const onUpdate = ({ rooms }: { rooms: import('@/types/shared').RoomSummary[] }) => {
        setRooms(rooms)
        setRoomsLoaded(true)
      }
      socket.on('lobby:update', onUpdate)
      cleanup = () => {
        socket.emit('lobby:unsubscribe')
        socket.off('lobby:update', onUpdate)
      }
    })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [setRooms])

  useEffect(() => {
    if (!getStoredName()) inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!hasSeenTutorial()) setShowTutorial(true)
  }, [])

  function requireName(): boolean {
    if (!name.trim()) {
      inputRef.current?.focus()
      toast.error('Coloca um apelido primeiro')
      return false
    }
    return true
  }

  async function handleJoin(roomId: string) {
    if (!requireName()) return
    setStoredName(name)
    try {
      const socket = await ensureSocketConnected()
      const playerId = getPlayerId()
      if (!playerId) { toast.error('Sessão ainda não pronta — tenta de novo'); return }
      if (!socket.connected) {
        console.warn('[lobby] socket not connected yet, waiting…')
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('socket connect timeout')), 5000)
          socket.once('connect', () => { clearTimeout(t); resolve() })
          socket.once('connect_error', err => { clearTimeout(t); reject(err) })
        })
      }
      socket.emit('room:join', { roomId, playerId, playerName: name }, (res: { ok?: true; error?: string }) => {
        if (res?.error) { toast.error(`Erro: ${res.error}`); return }
        router.push(`/room/${roomId}`)
      })
    } catch (err) {
      console.error('[lobby] handleJoin failed', err)
      toast.error(`Falha: ${err instanceof Error ? err.message : 'UNKNOWN'}`)
    }
  }

  function handleCreated(roomId: string) {
    setShowCreate(false)
    handleJoin(roomId)
  }

  async function handleSpectate(roomId: string) {
    try {
      const socket = await ensureSocketConnected()
      const playerId = getPlayerId()
      if (!playerId) { toast.error('Sessão ainda não pronta'); return }
      if (!socket.connected) {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('socket connect timeout')), 5000)
          socket.once('connect', () => { clearTimeout(t); resolve() })
          socket.once('connect_error', err => { clearTimeout(t); reject(err) })
        })
      }
      socket.emit('room:spectate', { roomId, playerId }, (res: { ok?: true; error?: string }) => {
        if (res?.error) { toast.error(`Erro: ${res.error}`); return }
        router.push(`/room/${roomId}?spectate=1`)
      })
    } catch (err) {
      console.error('[lobby] handleSpectate failed', err)
      toast.error(`Falha: ${err instanceof Error ? err.message : 'UNKNOWN'}`)
    }
  }

  function openCreate() {
    if (!requireName()) return
    setShowCreate(true)
  }

  async function handleQuickPlay() {
    if (!requireName()) return
    const available = rooms.find(r => r.phase === 'waiting' && r.playerCount < r.maxPlayers)
    if (available) {
      handleJoin(available.roomId)
      return
    }
    setStoredName(name)
    try {
      const socket = await ensureSocketConnected()
      const playerId = getPlayerId()
      if (!playerId) { toast.error('Sessão ainda não pronta — tenta de novo'); return }
      if (!socket.connected) {
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error('socket connect timeout')), 5000)
          socket.once('connect', () => { clearTimeout(t); resolve() })
          socket.once('connect_error', err => { clearTimeout(t); reject(err) })
        })
      }
      const randomName = QUICK_ROOM_NAMES[Math.floor(Math.random() * QUICK_ROOM_NAMES.length)]!
      socket.emit(
        'room:create',
        { name: randomName, hostId: playerId, hostName: name, maxPlayers: 4 },
        (res: { roomId?: string; error?: string }) => {
          if (res?.error) { toast.error(`Erro: ${res.error}`); return }
          if (res?.roomId) handleJoin(res.roomId)
        },
      )
    } catch (err) {
      console.error('[lobby] handleQuickPlay failed', err)
      toast.error(`Falha: ${err instanceof Error ? err.message : 'UNKNOWN'}`)
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden flex flex-col items-center text-bate-ink selection:bg-bate-red selection:text-bate-paper">
      <SuitBackground />

      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowTutorial(true)}
          title="Como jogar"
          className="w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
        >
          <HelpCircle size={16} strokeWidth={3} />
        </button>
        <button
          type="button"
          onClick={() => setShowSkins(true)}
          title="Skins"
          className="w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
        >
          <Shirt size={16} strokeWidth={3} />
        </button>
        <MuteToggle />
      </div>

      <Hero />
      <CardFan />

      <section className="relative z-40 w-full max-w-md px-4 -mt-2 mb-10">
        <div className="bg-bate-paper border-[4px] border-bate-ink shadow-hard-lg rounded-2xl p-6 md:p-8" style={{ transform: 'rotate(-1deg)' }}>
          <div className="flex flex-col gap-5">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && name.trim()) handleQuickPlay()
                }}
                placeholder="Seu apelido aqui..."
                maxLength={20}
                autoComplete="off"
                className="w-full bg-bate-cream border-[4px] border-bate-ink shadow-hard-sm rounded-xl h-16 px-5 font-body font-bold text-xl placeholder-bate-ink/40 focus:outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0_#1a0e08] transition-all duration-200 pr-12"
              />
              <User size={22} className="absolute right-5 top-1/2 -translate-y-1/2 text-bate-ink opacity-30" />
            </div>

            <button
              type="button"
              onClick={handleQuickPlay}
              className="relative bg-bate-gold border-[4px] border-bate-ink shadow-hard-sm rounded-xl h-16 flex items-center justify-center gap-2 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-all duration-200"
            >
              <Play size={22} fill="currentColor" className="text-bate-ink" />
              <span className="font-display text-xl md:text-2xl uppercase tracking-wide text-bate-ink pt-1">
                Entrar na Sala
              </span>
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-40 w-full max-w-md px-4 pb-20 space-y-6">
        <QuickRules />

        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-display text-xl text-bate-ink">SALAS ABERTAS</h2>
            <button
              type="button"
              onClick={openCreate}
              className="px-4 py-2 rounded-xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm font-display text-sm text-bate-ink hover:scale-105 transition-transform flex items-center gap-2"
            >
              <Plus size={14} /> CRIAR
            </button>
          </div>
          <RoomList rooms={rooms} onJoin={handleJoin} onSpectate={handleSpectate} onCreate={openCreate} loaded={roomsLoaded} />
        </div>

        <Footer />
      </section>

      {showCreate && (
        <CreateRoomDialog
          hostName={name}
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}

      <SkinPicker open={showSkins} onClose={() => setShowSkins(false)} />
      <Tutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
    </main>
  )
}
