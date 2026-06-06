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
  const isPending = search.get('pending') === '1'
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
      const onVisible = () => {
        if (document.visibilityState !== 'visible') return
        if (!socket.connected) socket.connect()
        else doJoin()
      }
      document.addEventListener('visibilitychange', onVisible)
      window.addEventListener('focus', onVisible)
      const onExpired = ({ message }: { roomId: string; reason: string; message: string }) => {
        setRoom(null)
        toast.error(message)
        router.push('/')
      }
      socket.on('room:expired', onExpired)
      let lastActionTs = 0
      const onState = ({ state }: { state: import('@/types/shared').RedactedState }) => {
        const newest = state.log[state.log.length - 1]
        if (newest && newest.timestamp > lastActionTs) {
          lastActionTs = newest.timestamp
          if (newest.type === 'discard') playSound('card-discard')
          if (newest.type === 'snap') playSound('snap-success')
          if (newest.type === 'snap-fail') playSound('snap-fail')
          if (newest.type === 'bate') playSound('bate-called')
          if (newest.type === 'round-end') playSound('victory')
          if (newest.type === 'draw') playSound('card-flip')
        }
        setRoom(state)
      }
      socket.on('room:state', onState)
      cleanup = () => {
        socket.off('room:state', onState)
        socket.off('room:expired', onExpired)
        socket.off('connect', doJoin)
        document.removeEventListener('visibilitychange', onVisible)
        window.removeEventListener('focus', onVisible)
        setRoom(null)
      }
    })
    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [roomId, router, setRoom, isSpectator])

  useEffect(() => {
    if (!isPending) return
    if (!room) return
    const myId = getPlayerId()
    const alreadyPlayer = room.players.some(p => p.id === myId)
    if (alreadyPlayer) {
      const url = new URL(window.location.href)
      url.searchParams.delete('spectate')
      url.searchParams.delete('pending')
      router.replace(url.pathname + url.search)
      return
    }
    if (room.phase === 'waiting' || room.phase === 'round-end') {
      const name = getStoredName()
      ensureSocketConnected().then(socket => {
        socket.emit('room:join', { roomId, playerId: myId, playerName: name }, (res: { ok?: true; error?: string; queued?: boolean }) => {
          if (res?.error) {
            toast.error(`Erro entrando: ${res.error}`)
          }
        })
      })
    }
  }, [room, isPending, roomId, router])

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
          {isPending ? '⏳ AGUARDANDO PRÓXIMA RODADA' : '👁 ASSISTINDO'} • {(room.spectators?.length ?? 0)} {(room.spectators?.length ?? 0) === 1 ? 'olho' : 'olhos'} na mesa
        </div>
      )}
      {view}
    </>
  )
}
