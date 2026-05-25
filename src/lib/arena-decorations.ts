export type DecorationAnimation = 'sway-slow' | 'sway-fast' | 'pulse' | 'none'

export type ArenaDecoration = {
  asset: string
  position: { left?: string; right?: string; top?: string; bottom?: string }
  size: { width: number; height: number }
  animation: DecorationAnimation
}

export const ARENA_DECORATIONS: Record<string, ArenaDecoration[]> = {
  default: [],
  boteco: [
    { asset: 'copo-chope',    position: { right: '24px', bottom: '120px' },         size: { width: 80, height: 100 }, animation: 'sway-slow' },
    { asset: 'amendoim',      position: { left: '20px',  bottom: '110px' },         size: { width: 70, height: 50  }, animation: 'none' },
    { asset: 'pendente-luz',  position: { left: 'calc(50% - 30px)', top: '40px' },  size: { width: 60, height: 80  }, animation: 'pulse' },
  ],
}
