'use client'

import { AnimatePresence, motion } from 'framer-motion'
import type { RedactedState } from '@/types/shared'

export function TurnBanner({ state, isMyTurn, myId }: { state: RedactedState; isMyTurn: boolean; myId: string }) {
  let label: string
  if (state.phase === 'initial-peek') label = 'Memorize suas 2 cartas de baixo'
  else if (state.phase === 'effect-pending') {
    if (state.pendingEffect?.playerId === myId) {
      label =
        state.pendingEffect.type === 'peek-own' ? '👁️ Escolha uma das SUAS cartas' :
        state.pendingEffect.type === 'peek-other' ? '👁️ Escolha carta de OUTRO' :
        '🔄 Escolha uma das SUAS cartas'
    } else {
      const owner = state.players.find(p => p.id === state.pendingEffect?.playerId)
      label = `${owner?.name ?? 'Alguém'} está usando um poder...`
    }
  }
  else if (isMyTurn) label = 'SUA VEZ'
  else label = `Vez de ${state.players[state.turn]?.name ?? '...'}`

  const highlight = state.phase === 'initial-peek' || isMyTurn || state.pendingEffect?.playerId === myId

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={label}
          initial={{ y: -20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className={`px-6 py-2.5 rounded-full font-extrabold text-lg shadow-2xl backdrop-blur border ${
            highlight
              ? 'bg-cabo-accent text-white border-cabo-accent/40 shadow-[0_0_20px_rgba(255,107,53,0.6)]'
              : 'bg-cabo-surface/85 text-cabo-purple border-cabo-purple/40'
          }`}
        >
          {label}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
