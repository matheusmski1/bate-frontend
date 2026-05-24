'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Eye, Search, ArrowLeftRight, Award, Trophy } from 'lucide-react'
import { CARD_META, formatPoints } from '@/lib/card-meta'
import type { Rank } from '@/types/shared'

const ICONS = { Eye, Search, ArrowLeftRight, Award, Trophy } as const
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
                    const Icon = meta.iconName ? ICONS[meta.iconName] : null
                    const isNegative = meta.pointValue < 0
                    return (
                      <li key={rank} className="flex items-center gap-3">
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border-[2px] border-bate-ink ${isNegative ? 'bg-bate-gold' : 'bg-bate-teal text-bate-paper'}`}>
                          {Icon ? <Icon size={18} strokeWidth={2.5} /> : <span className="font-display text-xs">{rank}</span>}
                        </span>
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

              <a
                href="https://github.com/matheusmski1/bate-backend/blob/main/RULES.md"
                target="_blank"
                rel="noreferrer"
                className="block text-center text-bate-red hover:text-bate-red-deep underline text-xs font-body"
              >
                Ver regras completas →
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
