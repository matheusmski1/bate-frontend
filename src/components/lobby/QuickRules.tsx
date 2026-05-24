'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { CARD_META, formatPoints } from '@/lib/card-meta'
import type { Rank } from '@/types/shared'

const SPECIAL_RANKS: Rank[] = ['10', 'J', 'Q', 'K', 'JOKER']

export function QuickRules() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border-[3px] border-bate-ink bg-bate-paper overflow-hidden mb-8 shadow-hard">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex justify-between items-center px-5 py-4 text-left hover:bg-bate-cream transition-colors"
      >
        <span className="font-display text-bate-ink flex items-center gap-2">
          📖 COMO JOGAR?
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-bate-ink" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 text-sm text-bate-ink border-t-[3px] border-bate-ink/20 pt-4">
              <section>
                <h4 className="font-display text-bate-red mb-2">🎯 OBJETIVO</h4>
                <p>
                  Ter a <strong>menor pontuação</strong> ao chamar BATE. Cartas valem o número impresso; <span className="font-bold text-bate-red">PRATA vale −3</span> e <span className="font-bold text-bate-red">OURO vale −6</span>.
                </p>
              </section>

              <section>
                <h4 className="font-display text-bate-red mb-2">🃏 CARTAS ESPECIAIS</h4>
                <ul className="space-y-2">
                  {SPECIAL_RANKS.map(rank => {
                    const meta = CARD_META[rank]
                    const isNegative = meta.pointValue < 0
                    return (
                      <li key={rank} className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded-md overflow-hidden border-[2px] border-bate-ink shadow-hard-sm flex-shrink-0 bg-bate-paper">
                          <img
                            src={meta.image}
                            alt={meta.displayName ?? rank}
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-display text-sm">
                            {meta.displayName} <span className={`font-body text-xs ml-1 ${isNegative ? 'text-bate-red font-bold' : 'text-bate-ink/60'}`}>({formatPoints(meta.pointValue)} pts)</span>
                          </div>
                          <div className="text-xs text-bate-ink/60">{meta.abilityText}</div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>

              <section>
                <h4 className="font-display text-bate-red mb-2">🔄 SEU TURNO</h4>
                <ol className="space-y-1 list-decimal list-inside text-bate-ink/80">
                  <li><strong>Compra</strong> uma carta do baralho</li>
                  <li><strong>Decide</strong>: descartar (usando o efeito se for especial) ou trocar com uma das suas 4</li>
                  <li><strong>Ou</strong> chama BATE se achar que tá com menos pontos</li>
                </ol>
                <p className="text-xs text-bate-ink/60 mt-2">Depois de chamar BATE, cada adversário tem 1 último turno antes da contagem.</p>
              </section>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
