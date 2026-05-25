'use client'
import { toast } from '@/lib/ui-store'

import { useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ensureSocketConnected } from '@/lib/socket-client'
import { cachedPlayerId } from '@/lib/auth'
import { getStoredName } from '@/lib/player-id'

function getPlayerId(): string {
  return cachedPlayerId() ?? ''
}
import { useGameStore } from '@/lib/store'
import { playSound } from '@/lib/sounds'
import { WaitingRoom } from '@/components/room/WaitingRoom'
import { RoundEndScreen } from '@/components/room/RoundEndScreen'
import { MatchEndScreen } from '@/components/room/MatchEndScreen'
import { GameArea } from '@/components/room2d/GameArea'

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter()
  const search = useSearchParams()
  const isSpectator = search.get('spectate') === '1'
  const { roomId } = use(params)
  const room = useGameStore(s => s.room)
  const setRoom = useGameStore(s => s.setRoom)
  const myId = getPlayerId()
  const amISpectator = isSpectator || (room?.spectators ?? []).some(s => s.id === myId)

  useEffect(() => {
    const name = getStoredName()
    if (!name) {
      router.push('/')
      return
    }
    let cancelled = false
    let cleanup: (() => void) | null = null
    ensureSocketConnected().then(socket => {
      if (cancelled) return
      const doJoin = () => {
        if (isSpectator) {
          socket.emit('room:spectate', { roomId, playerId: getPlayerId() }, (res: { ok?: true; error?: string }) => {
            if (res?.error) {
              toast.error(`Erro assistindo: ${res.error}`)
              router.push('/')
            }
          })
        } else {
          socket.emit('room:join', { roomId, playerId: getPlayerId(), playerName: name }, (res: { ok?: true; error?: string }) => {
            if (res?.error) {
              toast.error(`Erro entrando: ${res.error}`)
              router.push('/')
            }
          })
        }
      }
      doJoin()
      socket.on('connect', doJoin)
      const onExpired = ({ message }: { roomId: string; reason: string; message: string }) => {
        setRoom(null)
        toast.error(message)
        router.push('/')
      }
      socket.on('room:expired', onExpired)
      let prevLogLength = 0
      const onState = ({ state }: { state: import('@/types/shared').RedactedState }) => {
        if (state.log.length > prevLogLength) {
          const newest = state.log[state.log.length - 1]
          if (newest) {
            if (newest.type === 'discard') playSound('card-discard')
            if (newest.type === 'snap') playSound('snap-success')
            if (newest.type === 'snap-fail') playSound('snap-fail')
            if (newest.type === 'bate') playSound('bate-called')
            if (newest.type === 'round-end') playSound('victory')
            if (newest.type === 'draw') playSound('card-flip')
          }
          prevLogLength = state.log.length
        }
        setRoom(state)
      }
      socket.on('room:state', onState)
      cleanup = () => {
        socket.off('room:state', onState)
        socket.off('room:expired', onExpired)
        socket.off('connect', doJoin)
        setRoom(null)
      }
    })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [roomId, router, setRoom, isSpectator])

  if (!room) {
    return <main className="min-h-screen flex items-center justify-center text-bate-ink font-display text-xl">CARREGANDO SALA…</main>
  }

  const view = (() => {
    if (room.phase === 'waiting') return <WaitingRoom state={room} />
    if (room.phase === 'round-end') return <RoundEndScreen state={room} />
    if (room.phase === 'match-end') return <MatchEndScreen state={room} />
    return <GameArea state={room} />
  })()

  return (
    <>
      {amISpectator && (
        <div className="fixed top-0 left-0 right-0 z-[55] bg-bate-ink text-bate-paper text-center py-1.5 text-[11px] sm:text-xs font-display tracking-wider shadow-hard-sm">
          👁 ASSISTINDO • {(room.spectators?.length ?? 0)} {(room.spectators?.length ?? 0) === 1 ? 'olho' : 'olhos'} na mesa
        </div>
      )}
      {view}
    </>
  )
}
