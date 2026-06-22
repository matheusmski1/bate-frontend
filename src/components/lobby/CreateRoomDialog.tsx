'use client'
import { toast } from '@/lib/ui-store'

import { useState } from 'react'
import { ensureSocketConnected } from '@/lib/socket-client'
import { cachedPlayerId } from '@/lib/auth'

type TurnLimit = 30 | 60 | 90 | 120 | null

export function CreateRoomDialog({ hostName, onCreated, onClose }: { hostName: string; onCreated: (roomId: string) => void; onClose: () => void }) {
  const [name, setName] = useState('')
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4)
  const [turnTimeLimitSec, setTurnTimeLimit] = useState<TurnLimit>(60)
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const socket = await ensureSocketConnected()
      const hostId = cachedPlayerId()
      if (!hostId) { toast.error('Sessão ainda não pronta — tenta de novo'); setSubmitting(false); return }
      socket.emit(
        'room:create',
        { name: name.trim(), hostId, hostName, maxPlayers, turnTimeLimitSec, private: isPrivate },
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
      console.error('[create-room]', err)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-float p-4" onClick={onClose}>
      <div className="bg-bate-cream rounded-2xl p-7 w-full max-w-md border-[4px] border-bate-ink shadow-hard-lg" onClick={e => e.stopPropagation()}>
        <h3 className="font-display text-2xl text-bate-red mb-6">CRIAR SALA</h3>
        <label className="block mb-2 text-sm font-display text-bate-ink">NOME DA SALA</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-4 py-3 mb-4 rounded-xl bg-bate-paper text-bate-ink border-[3px] border-bate-ink shadow-hard-sm font-body font-semibold focus:outline-none focus:bg-white"
          maxLength={30}
          autoFocus
        />
        <label className="block mb-2 text-sm font-display text-bate-ink">MÁXIMO DE JOGADORES</label>
        <div className="flex gap-2 mb-5">
          {([2, 3, 4] as const).map(n => (
            <button
              key={n}
              onClick={() => setMaxPlayers(n)}
              className={`flex-1 py-3 rounded-xl font-display border-[3px] border-bate-ink ${maxPlayers === n ? 'bg-bate-gold text-bate-ink shadow-hard-sm' : 'bg-bate-paper text-bate-ink/60'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <label className="block mb-2 text-sm font-display text-bate-ink">TEMPO POR TURNO</label>
        <div className="grid grid-cols-5 gap-1.5 mb-6">
          {([30, 60, 90, 120, null] as const).map(t => (
            <button
              key={t ?? 'off'}
              onClick={() => setTurnTimeLimit(t)}
              className={`py-2.5 rounded-lg font-display text-xs border-[2px] border-bate-ink ${turnTimeLimitSec === t ? 'bg-bate-gold text-bate-ink shadow-hard-sm' : 'bg-bate-paper text-bate-ink/60'}`}
            >
              {t === null ? '∞' : `${t}s`}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIsPrivate(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 mb-6 rounded-xl bg-bate-paper border-[3px] border-bate-ink shadow-hard-sm"
        >
          <span className="font-display text-sm text-bate-ink">{isPrivate ? '🔒 SALA PRIVADA' : '🌐 SALA PÚBLICA'}</span>
          <span className={`w-11 h-6 rounded-full border-[2px] border-bate-ink flex items-center px-0.5 transition-colors ${isPrivate ? 'bg-bate-gold justify-end' : 'bg-bate-cream justify-start'}`}>
            <span className="w-4 h-4 rounded-full bg-bate-ink" />
          </span>
        </button>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-bate-paper border-[3px] border-bate-ink text-bate-ink font-display shadow-hard-sm hover:scale-[1.02] transition-transform"
          >
            CANCELAR
          </button>
          <button
            onClick={submit}
            disabled={submitting || !name.trim()}
            className="flex-1 py-3 rounded-xl bg-bate-red text-bate-paper border-[3px] border-bate-ink font-display shadow-hard-sm hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {submitting ? 'CRIANDO…' : 'CRIAR'}
          </button>
        </div>
      </div>
    </div>
  )
}
