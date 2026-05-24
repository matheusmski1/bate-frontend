'use client'

import { motion } from 'framer-motion'

export function InitialPeekConfirm({ confirmed, onConfirm }: { confirmed: boolean; onConfirm: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={confirmed ? undefined : onConfirm}
      disabled={confirmed}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!confirmed ? { scale: 1.06 } : undefined}
      whileTap={!confirmed ? { scale: 0.96 } : undefined}
      className={`fixed bottom-10 right-10 z-40 px-7 py-4 rounded-2xl font-extrabold text-lg shadow-2xl transition-colors ${
        confirmed
          ? 'bg-cabo-surface text-cabo-purple cursor-default'
          : 'bg-gradient-to-br from-cabo-success via-emerald-400 to-emerald-600 text-white shadow-[0_0_24px_rgba(6,214,160,0.6)]'
      }`}
    >
      {confirmed ? '⏳ Aguardando outros...' : '✓ Já memorizei'}
    </motion.button>
  )
}
