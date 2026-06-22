'use client'
import { toast } from '@/lib/ui-store'

import { useState } from 'react'
import { ensureSocketConnected } from '@/lib/socket-client'
import { cachedPlayerId } from '@/lib/auth'
import type { BotLevel } from '@/types/shared'

const LEVELS: { id: BotLevel; label: string }[] = [
  { id: 'easy', label: 'FÁCIL' },
  { id: 'medium', label: 'MÉDIO' },
  { id: 'hard', label: 'DIFÍCIL' },
]

export function PracticeRoomDialog({
  hostName,
  onCreated,
  onClose,
}: {
  hostName: string
  onCreated: (roomId: string) => void
  onClose: () => void
}) {
  const [bots, setBots] = useState<1 | 2 | 3>(1)
  const [level, setLevel] = useState<BotLevel>('medium')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    setSubmitting(true)
    try {
      const socket = await ensureSocketConnected()
      const hostId = cachedPlayerId()
      if (!hostId) {
        toast.error('Sessão ainda não pronta — tenta de novo')
        setSubmitting(false)
        return
      }
      socket.emit(
        'room:create-practice',
        { hostId, hostName, bots, level },
        (res: { roomId?: string; error?: string }) => {
          setSubmitting(false)
          if (res?.error) {
            toast.error(`Erro: ${res.error}`)
            return
          }
          if (res?.roomId) onCreated(res.roomId)
        },
      )
    } catch (err) {
      setSubmitting(false)
      toast.error('Falha ao conectar')
      console.error('[create-practice]', err)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-float p-4"
      onClick={onClose}
    >
      <div
        className="bg-bate-cream rounded-2xl p-7 w-full max-w-md border-[4px] border-bate-ink shadow-hard-lg"
        onClick={e => e.stopPropagation()}
      >
        <h3 className="font-display text-2xl text-bate-red mb-6">TREINAR COM BOTS</h3>
        <p className="font-body text-sm text-bate-ink/70 mb-2">Quantos bots</p>
        <div className="flex gap-2 mb-5">
          {([1, 2, 3] as const).map(n => (
            <button
              key={n}
              onClick={() => setBots(n)}
              className={`flex-1 py-3 rounded-xl font-display border-[3px] border-bate-ink ${bots === n ? 'bg-bate-gold text-bate-ink shadow-hard-sm' : 'bg-bate-paper text-bate-ink/60'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="font-body text-sm text-bate-ink/70 mb-2">Dificuldade</p>
        <div className="flex gap-2 mb-6">
          {LEVELS.map(l => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`flex-1 py-3 rounded-xl font-display border-[3px] border-bate-ink text-sm ${level === l.id ? 'bg-bate-gold text-bate-ink shadow-hard-sm' : 'bg-bate-paper text-bate-ink/60'}`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-bate-paper border-[3px] border-bate-ink text-bate-ink font-display shadow-hard-sm hover:scale-[1.02] transition-transform"
          >
            CANCELAR
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-bate-red text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {submitting ? 'CRIANDO…' : 'JOGAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
