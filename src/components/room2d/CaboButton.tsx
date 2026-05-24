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
      className={`fixed top-20 right-6 z-40 px-5 py-3 rounded-2xl font-extrabold text-base shadow-2xl ${
        enabled
          ? 'bg-gradient-to-br from-cabo-gold via-amber-400 to-amber-600 text-cabo-bg cursor-pointer shadow-[0_0_20px_rgba(255,210,63,0.6)]'
          : 'bg-cabo-surface text-cabo-purple cursor-not-allowed'
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
