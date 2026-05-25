'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import { useGameStore } from '@/lib/store'

export function LeaveButton({ roomId, inGame }: { roomId: string; inGame: boolean }) {
  const router = useRouter()
  const setRoom = useGameStore(s => s.setRoom)

  function leave() {
    if (inGame && !confirm('Sair da partida? Os outros jogadores vão continuar sem você.')) return
    getSocket().emit('room:leave', { roomId, playerId: getPlayerId() }, () => {
      setRoom(null)
      router.push('/')
    })
  }

  return (
    <button
      type="button"
      onClick={leave}
      title="Sair da sala"
      className="fixed top-2 right-12 sm:top-2 sm:right-16 z-50 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-bate-paper border-[2px] sm:border-[3px] border-bate-ink shadow-hard-sm flex items-center justify-center text-bate-ink hover:bg-bate-red hover:text-bate-paper transition-colors"
    >
      <LogOut size={14} strokeWidth={3} />
    </button>
  )
}
