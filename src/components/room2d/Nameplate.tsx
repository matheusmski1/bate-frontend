'use client'

import { motion } from 'framer-motion'
import { Avatar } from '@/components/lobby/Avatar'

type Props = {
  name: string
  score: number
  isCurrent: boolean
  connected?: boolean
  isHost?: boolean
  isMe?: boolean
}

export function Nameplate({ name, score, isCurrent, connected = true, isHost = false, isMe = false }: Props) {
  return (
    <motion.div
      animate={
        isCurrent
          ? { scale: [1, 1.05, 1], boxShadow: ['5px 5px 0 #1a0e08', '7px 7px 0 #1a0e08', '5px 5px 0 #1a0e08'] }
          : { scale: 1, boxShadow: '3px 3px 0 #1a0e08' }
      }
      transition={
        isCurrent
          ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.25 }
      }
      className={`inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border-[3px] border-bate-ink ${
        isCurrent ? 'bg-bate-gold text-bate-ink' : 'bg-bate-paper text-bate-ink'
      } ${!connected ? 'opacity-60' : ''}`}
    >
      <Avatar name={name} size={28} />
      <div className="flex flex-col leading-tight pr-1">
        <div className="font-display text-sm flex items-center gap-1.5 whitespace-nowrap">
          {name}
          {isHost && <span title="Host" className="text-[11px]">👑</span>}
          {!connected && <span className="w-1.5 h-1.5 rounded-full bg-bate-red-deep" title="Desconectado" />}
        </div>
        <div className="font-body text-[10px] uppercase tracking-wider text-bate-ink/70">
          {score} pts{isMe ? ' • você' : ''}
        </div>
      </div>
    </motion.div>
  )
}
