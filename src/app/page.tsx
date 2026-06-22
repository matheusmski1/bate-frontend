'use client'
import { toast } from '@/lib/ui-store'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
import { PracticeRoomDialog } from '@/components/lobby/PracticeRoomDialog'
import { Hero } from '@/components/lobby/Hero'
import { CardFan } from '@/components/lobby/CardFan'
import { SuitBackground } from '@/components/lobby/SuitBackground'
import { QuickRules } from '@/components/lobby/QuickRules'
import { MuteToggle } from '@/components/lobby/MuteToggle'
import { DeckPicker } from '@/components/lobby/DeckPicker'
import { ArenaPicker } from '@/components/lobby/ArenaPicker'
import { Tutorial, hasSeenTutorial } from '@/components/lobby/Tutorial'
import { HelpCircle, Layers, Tent, Sparkles } from 'lucide-react'
import { Footer } from '@/components/lobby/Footer'
import { Changelog } from '@/components/lobby/Changelog'
import { useUnreadChangelog } from '@/lib/changelog-state'

const QUICK_ROOM_NAMES = ['Mesa do Maizão', 'Batinho Rápido', 'Sala do Zé', 'Bate Express', 'Mesa relâmpago']

function LobbyContent() {
  const router = useRouter()
  const rooms = useGameStore(s => s.rooms)
  const setRooms = useGameStore(s => s.setRooms)
  const [name, setName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [showPractice, setShowPractice] = useState(false)
  const [showDecks, setShowDecks] = useState(false)
  const [showArenas, setShowArenas] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showChangelog, setShowChangelog] = useState(false)
  const { hasUnread: hasUnreadChangelog, markAsSeen: markChangelogSeen } = useUnreadChangelog()
  const [roomsLoaded, setRoomsLoaded] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const search = useSearchParams()
  const joinParam = search.get('join')?.toUpperCase() ?? ''
  const joinSpectate = search.get('spectate') === '1'
  const [code, setCode] = useState('')
  const autoJoinRef = useRef(false)

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

  useEffect(() => {
    if (!joinParam || autoJoinRef.current) return
    if (joinSpectate) { autoJoinRef.current = true; handleSpectate(joinParam); return }
    if (!getStoredName()) { inputRef.current?.focus(); return }
    if (!name.trim()) return
    autoJoinRef.current = true
    handleJoin(joinParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinParam, joinSpectate, name])

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
      socket.emit('room:join', { roomId, playerId, playerName: name }, (res: { ok?: true; error?: string; queued?: boolean }) => {
        if (res?.error) {
          const friendly: Record<string, string> = {
            ROOM_NOT_FOUND: 'Essa mesa não existe ou já fechou',
            ROOM_FULL: 'Mesa lotada, parça',
          }
          toast.error(friendly[res.error] ?? `Erro: ${res.error}`)
          return
        }
        if (res?.queued) {
          toast.info('Você entra na próxima rodada — assistindo enquanto isso')
          router.push(`/room/${roomId}?spectate=1&pending=1`)
          return
        }
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

  function openPractice() {
    if (!requireName()) return
    setShowPractice(true)
  }

  function handlePracticeCreated(roomId: string) {
    setShowPractice(false)
    handleJoin(roomId)
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

      <div className="fixed top-4 right-4 z-float flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowChangelog(true)}
          title="Novidades"
          className="relative w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
        >
          <Sparkles size={16} strokeWidth={3} />
          {hasUnreadChangelog && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-bate-red border-2 border-bate-ink"
            />
          )}
        </button>
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
          onClick={() => setShowDecks(true)}
          title="Baralhos"
          className="w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
        >
          <Layers size={16} strokeWidth={3} />
        </button>
        <button
          type="button"
          onClick={() => setShowArenas(true)}
          title="Arenas"
          className="w-10 h-10 rounded-full bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-gold transition-colors"
        >
          <Tent size={16} strokeWidth={3} />
        </button>
        <MuteToggle />
      </div>

      <Hero />
      <CardFan />

      <section className="relative z-hud w-full max-w-md px-4 -mt-2 mb-10">
        <div className="bg-bate-paper border-[4px] border-bate-ink shadow-hard-lg rounded-2xl p-6 md:p-8" style={{ transform: 'rotate(-1deg)' }}>
          <div className="flex flex-col gap-5">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => {
                  if (e.key !== 'Enter' || !name.trim()) return
                  if (joinParam) { autoJoinRef.current = true; setStoredName(name); handleJoin(joinParam) }
                  else handleQuickPlay()
                }}
                placeholder="Seu apelido aqui..."
                maxLength={20}
                autoComplete="off"
                className="w-full bg-bate-cream border-[4px] border-bate-ink shadow-hard-sm rounded-xl h-16 px-5 font-body font-bold text-xl placeholder-bate-ink/40 focus:outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[2px_2px_0_#1a0e08] transition-[transform,box-shadow] duration-200 pr-12"
              />
              <User size={22} className="absolute right-5 top-1/2 -translate-y-1/2 text-bate-ink opacity-30" />
            </div>

            <button
              type="button"
              onClick={handleQuickPlay}
              className="relative bg-bate-gold border-[4px] border-bate-ink shadow-hard-sm rounded-xl h-16 flex items-center justify-center gap-2 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-hard active:translate-y-[4px] active:translate-x-[4px] active:shadow-none transition-[transform,box-shadow] duration-200"
            >
              <Play size={22} fill="currentColor" className="text-bate-ink" />
              <span className="font-display text-xl md:text-2xl uppercase tracking-wide text-bate-ink pt-1">
                Entrar na Sala
              </span>
            </button>

            {joinParam ? (
              <p className="text-center font-display text-sm text-bate-ink/70">
                Convite pra sala <span className="font-mono text-bate-ink">{joinParam}</span> — bota teu apelido pra entrar
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === 'Enter' && code.trim()) handleJoin(code.trim()) }}
                  placeholder="TENHO UM CÓDIGO"
                  maxLength={12}
                  autoComplete="off"
                  className="flex-1 bg-bate-cream border-[3px] border-bate-ink shadow-hard-sm rounded-xl h-12 px-4 font-mono font-bold tracking-widest placeholder-bate-ink/40 focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={() => { if (code.trim()) handleJoin(code.trim()) }}
                  className="px-4 h-12 rounded-xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm font-display text-sm text-bate-ink hover:bg-bate-gold transition-colors"
                >
                  ENTRAR
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={openPractice}
              className="w-full py-3 rounded-xl bg-bate-green text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-[1.02] transition-transform"
            >
              🤖 TREINAR COM BOTS
            </button>
          </div>
        </div>
      </section>

      <section className="relative z-hud w-full max-w-md px-4 pb-20 space-y-6">
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

      {showPractice && (
        <PracticeRoomDialog
          hostName={name}
          onCreated={handlePracticeCreated}
          onClose={() => setShowPractice(false)}
        />
      )}

      <DeckPicker open={showDecks} onClose={() => setShowDecks(false)} />
      <ArenaPicker open={showArenas} onClose={() => setShowArenas(false)} />
      <Tutorial open={showTutorial} onClose={() => setShowTutorial(false)} />
      <Changelog
        open={showChangelog}
        onClose={() => setShowChangelog(false)}
        onOpen={markChangelogSeen}
      />
    </main>
  )
}

export default function Home() {
  return (
    <Suspense>
      <LobbyContent />
    </Suspense>
  )
}
