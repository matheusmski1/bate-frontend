'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId, getStoredName } from '@/lib/player-id'
import { useGameStore } from '@/lib/store'
import { playSound } from '@/lib/sounds'
import { WaitingRoom } from '@/components/room/WaitingRoom'
import { RoundEndScreen } from '@/components/room/RoundEndScreen'
import { MatchEndScreen } from '@/components/room/MatchEndScreen'
import { GameArea } from '@/components/room2d/GameArea'

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const router = useRouter()
  const { roomId } = use(params)
  const room = useGameStore(s => s.room)
  const setRoom = useGameStore(s => s.setRoom)

  useEffect(() => {
    const socket = getSocket()
    const name = getStoredName()
    if (!name) {
      router.push('/')
      return
    }
    const doJoin = () => {
      socket.emit('room:join', { roomId, playerId: getPlayerId(), playerName: name }, (res: { ok?: true; error?: string }) => {
        if (res.error) {
          alert(`Erro entrando: ${res.error}`)
          router.push('/')
        }
      })
    }
    doJoin()
    socket.on('connect', doJoin)
    socket.on('room:expired', ({ message }: { roomId: string; reason: string; message: string }) => {
      setRoom(null)
      alert(message)
      router.push('/')
    })
    let prevLogLength = 0
    socket.on('room:state', ({ state }: { state: import('@/types/shared').RedactedState }) => {
      if (state.log.length > prevLogLength) {
        const newest = state.log[state.log.length - 1]
        if (newest) {
          if (newest.type === 'discard') playSound('card-discard')
          if (newest.type === 'snap') playSound('snap-success')
          if (newest.type === 'snap-fail') playSound('snap-fail')
          if (newest.type === 'cabo') playSound('cabo-called')
          if (newest.type === 'round-end') playSound('victory')
          if (newest.type === 'draw') playSound('card-flip')
        }
        prevLogLength = state.log.length
      }
      setRoom(state)
    })
    return () => {
      socket.off('room:state')
      socket.off('room:expired')
      socket.off('connect', doJoin)
      setRoom(null)
    }
  }, [roomId, router, setRoom])

  if (!room) {
    return <main className="min-h-screen flex items-center justify-center text-bate-ink font-display text-xl">CARREGANDO SALA…</main>
  }

  if (room.phase === 'waiting') return <WaitingRoom state={room} />
  if (room.phase === 'round-end') return <RoundEndScreen state={room} />
  if (room.phase === 'match-end') return <MatchEndScreen state={room} />
  return <GameArea state={room} />
}
