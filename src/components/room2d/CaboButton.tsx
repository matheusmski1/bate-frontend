'use client'

import { motion } from 'framer-motion'
import { getSocket } from '@/lib/socket-client'
import { getPlayerId } from '@/lib/player-id'
import type { RedactedState } from '@/types/shared'

export function CaboButton({ state, drawnExists }: { state: RedactedState; drawnExists: boolean }) {
  const myId = getPlayerId()
  const isMyTurn = state.players[state.turn]?.id === myId
  const inPlayPhase = state.phase === 'playing' || state.phase === 'cabo-called'

  if (!inPlayPhase) return null

  let disabledReason: string | null = null
  if (state.caboCallerId !== null) disabledReason = state.caboCallerId === myId ? 'Você já chamou BATE!' : 'Alguém já chamou BATE'
  else if (!isMyTurn) disabledReason = 'Espere sua vez'
  else if (drawnExists) disabledReason = 'Resolva a carta comprada primeiro'

  const enabled = disabledReason === null

  function call() {
    if (!enabled) return
    if (!confirm('Chamar BATE? Cada outro player joga mais 1 turno e vira as cartas.')) return
    getSocket().emit('game:cabo', { roomId: state.roomId, playerId: myId }, (res: { ok?: true; error?: string }) => {
      if (res?.error) alert(res.error)
    })
  }

  return (
    <motion.button
      type="button"
      onClick={call}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: enabled ? 1 : 0.45 }}
      whileHover={enabled ? { scale: 1.08 } : undefined}
      whileTap={enabled ? { scale: 0.95 } : undefined}
      className={`fixed top-2 right-2 sm:top-20 sm:right-6 z-40 px-3 py-1.5 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl font-display text-xs sm:text-base border-[3px] sm:border-[4px] border-bate-ink ${
        enabled
          ? 'bg-bate-red text-bate-paper cursor-pointer shadow-hard-lg'
          : 'bg-bate-paper text-bate-ink/60 cursor-not-allowed shadow-hard-sm'
      }`}
      title={disabledReason ?? 'Chamar BATE'}
      disabled={!enabled}
    >
      🎯 BATE!
      {disabledReason && (
        <span className="block text-[10px] font-normal mt-0.5 opacity-80">{disabledReason}</span>
      )}
    </motion.button>
  )
}
