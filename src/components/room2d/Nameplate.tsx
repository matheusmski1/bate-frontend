'use client'

import { motion } from 'framer-motion'
import { Avatar } from '@/components/lobby/Avatar'
import { skinImage } from '@/lib/mascot'

type Props = {
  name: string
  score: number
  isCurrent: boolean
  connected?: boolean
  isHost?: boolean
  isLeader?: boolean
  isMe?: boolean
  skin?: string | null
  dataAttribute?: { key: string; value: string }
}

const ACTIVE_GLOW = '0 0 0 4px rgba(255, 184, 28, 0.55), 0 0 36px 12px rgba(255, 184, 28, 0.45), 6px 6px 0 #1a0e08'
const ACTIVE_GLOW_PEAK = '0 0 0 6px rgba(255, 184, 28, 0.85), 0 0 56px 20px rgba(255, 184, 28, 0.7), 7px 7px 0 #1a0e08'
const IDLE_SHADOW = '3px 3px 0 #1a0e08'

export function Nameplate({ name, score, isCurrent, connected = true, isHost = false, isLeader = false, isMe = false, skin = null, dataAttribute }: Props) {
  return (
    <motion.div
      {...(dataAttribute ? { [dataAttribute.key]: dataAttribute.value } : {})}
      animate={
        isCurrent
          ? { scale: [1, 1.08, 1], boxShadow: [ACTIVE_GLOW, ACTIVE_GLOW_PEAK, ACTIVE_GLOW] }
          : { scale: 1, boxShadow: IDLE_SHADOW }
      }
      transition={
        isCurrent
          ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.25 }
      }
      className={`relative inline-flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border-[3px] border-bate-ink ${
        isCurrent ? 'bg-bate-gold text-bate-ink' : 'bg-bate-paper text-bate-ink'
      } ${!connected ? 'opacity-60' : ''}`}
    >
      {skin ? (
        <img src={skinImage(skin)} alt="" className="w-9 h-9 rounded-full border-[2px] border-bate-ink bg-bate-cream object-cover select-none" draggable={false} />
      ) : (
        <Avatar name={name} size={28} />
      )}
      <div className="flex flex-col leading-tight pr-1">
        <div className="font-display text-sm flex items-center gap-1.5 whitespace-nowrap">
          {isLeader && <span title="Em primeiro" className="text-[14px]">🏆</span>}
          {name}
          {isHost && <span title="Host" className="text-[11px]">👑</span>}
          {!connected && <span className="w-1.5 h-1.5 rounded-full bg-bate-red-deep" title="Desconectado" />}
        </div>
        <div className="font-body text-[10px] uppercase tracking-wider text-bate-ink/70">
          {score} pts{isMe ? ' • você' : ''}
        </div>
      </div>
      {isCurrent && (
        <span className="absolute -top-1.5 -right-1.5 bg-bate-red text-bate-paper text-[8px] font-display px-1.5 py-0.5 rounded-full border-[2px] border-bate-ink shadow-hard-sm tracking-wider">
          VEZ
        </span>
      )}
    </motion.div>
  )
}
