'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Check, Lock } from 'lucide-react'
import { listSkins, equipSkin, type SkinView } from '@/lib/skins-api'
import { toast } from '@/lib/ui-store'

export function SkinPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [skins, setSkins] = useState<SkinView[] | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    listSkins().then(setSkins).catch(err => {
      console.error('[skins] list failed', err)
      toast.error('Não consegui carregar as skins')
    })
  }, [open])

  async function pick(skin: SkinView) {
    if (!skin.owned) {
      toast.info(skin.unlockType === 'paid' ? `${skin.name} custa ${skin.priceCoins} moedas` : `${skin.name} ainda bloqueado`)
      return
    }
    if (skin.equipped) return
    setBusy(skin.id)
    const result = await equipSkin(skin.id)
    setBusy(null)
    if (!result.ok) {
      toast.error(result.error)
      return
    }
    setSkins(prev => prev?.map(s => ({ ...s, equipped: s.id === skin.id && s.owned })) ?? prev)
    toast.success(`Skin ${skin.name} equipada`)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 24 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            onClick={e => e.stopPropagation()}
            className="bg-bate-paper rounded-3xl p-5 sm:p-6 max-w-2xl w-full border-[4px] border-bate-ink shadow-hard-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl sm:text-3xl text-bate-ink">SKINS</h2>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-bate-paper border-[2px] border-bate-ink shadow-hard-sm flex items-center justify-center hover:bg-bate-cream"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
            {!skins ? (
              <div className="py-10 text-center font-display text-bate-ink/60">Carregando…</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {skins.map(skin => {
                  const dim = !skin.owned
                  return (
                    <button
                      key={skin.id}
                      type="button"
                      onClick={() => pick(skin)}
                      disabled={busy === skin.id}
                      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-[3px] transition-all ${
                        skin.equipped
                          ? 'bg-bate-gold border-bate-ink shadow-hard'
                          : 'bg-bate-cream border-bate-ink shadow-hard-sm hover:-translate-y-0.5 hover:shadow-hard'
                      } ${dim ? 'opacity-60' : ''} ${busy === skin.id ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center">
                        <img
                          src={skin.imagePath}
                          alt={skin.name}
                          className="max-w-full max-h-full object-contain select-none"
                          draggable={false}
                        />
                        {dim && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Lock size={28} className="text-bate-ink opacity-70" />
                          </div>
                        )}
                        {skin.equipped && (
                          <span className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-bate-green text-bate-paper border-[2px] border-bate-ink flex items-center justify-center shadow-hard-sm">
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </div>
                      <div className="font-display text-[11px] sm:text-xs text-bate-ink text-center leading-tight">{skin.name}</div>
                      {skin.unlockType === 'paid' && !skin.owned && (
                        <div className="font-body text-[10px] text-bate-red-deep">🪙 {skin.priceCoins}</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
