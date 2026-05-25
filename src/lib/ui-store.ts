import { create } from 'zustand'

export type ToastKind = 'error' | 'success' | 'info'
type Toast = { id: number; text: string; kind: ToastKind }
type Pending = { id: number; question: string; resolve: (ok: boolean) => void } | null

type UIStore = {
  toasts: Toast[]
  pendingConfirm: Pending
  pushToast: (text: string, kind: ToastKind) => void
  dismissToast: (id: number) => void
  askConfirm: (question: string) => Promise<boolean>
  resolveConfirm: (ok: boolean) => void
}

let nextId = 1

export const useUIStore = create<UIStore>((set, get) => ({
  toasts: [],
  pendingConfirm: null,
  pushToast: (text, kind) => {
    const id = nextId++
    set(state => ({ toasts: [...state.toasts, { id, text, kind }] }))
    setTimeout(() => get().dismissToast(id), 3500)
  },
  dismissToast: id => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),
  askConfirm: question =>
    new Promise<boolean>(resolve => {
      set({ pendingConfirm: { id: nextId++, question, resolve } })
    }),
  resolveConfirm: ok => {
    const c = get().pendingConfirm
    if (c) {
      c.resolve(ok)
      set({ pendingConfirm: null })
    }
  },
}))

export const toast = {
  error: (text: string) => useUIStore.getState().pushToast(text, 'error'),
  success: (text: string) => useUIStore.getState().pushToast(text, 'success'),
  info: (text: string) => useUIStore.getState().pushToast(text, 'info'),
}

export function confirmAsync(question: string): Promise<boolean> {
  return useUIStore.getState().askConfirm(question)
}
