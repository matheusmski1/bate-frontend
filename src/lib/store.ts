import { create } from 'zustand'
import type { RedactedState, RoomSummary } from '@/types/shared'

type Store = {
  rooms: RoomSummary[]
  room: RedactedState | null
  lastDrawnCardId: string | null
  setRooms: (rooms: RoomSummary[]) => void
  setRoom: (state: RedactedState | null) => void
  setLastDrawnCard: (id: string | null) => void
}

export const useGameStore = create<Store>(set => ({
  rooms: [],
  room: null,
  lastDrawnCardId: null,
  setRooms: rooms => set({ rooms }),
  setRoom: room => set({ room }),
  setLastDrawnCard: id => set({ lastDrawnCardId: id }),
}))
