export const MASCOT = {
  ouro: '/batinho/batinho-ouro.webp',
  prata: '/batinho/batinho-prata.webp',
  feliz: '/batinho/batinho-feliz.webp',
  trofeu: '/batinho/batinho-trofeu.webp',
  chorando: '/batinho/batinho-chorando.webp',
  bate: '/batinho/batinho-bate.webp',
  assustado: '/batinho/batinho-assustado.webp',
  confuso: '/batinho/batinho-confuso.webp',
  desmaiado: '/batinho/batinho-desmaiado.webp',
  lupa: '/batinho/batinho-lupa.webp',
  olhadinha: '/batinho/batinho-olhadinha.webp',
  espiadinha: '/batinho/batinho-espiadinha.webp',
  troca: '/batinho/batinho-troca-de-cartas.webp',
  tchau: '/batinho/batinho-tchau.webp',
  tempoAcabando: '/batinho/batinho-tempo-acabando.webp',
  zzzz: '/batinho/batinho-zzzz.webp',
} as const

export type MascotKey = keyof typeof MASCOT

const ARENA_MASCOT_STATES: Record<string, Set<MascotKey>> = {
  boteco: new Set<MascotKey>(['bate', 'lupa', 'feliz', 'chorando', 'trofeu', 'confuso', 'tempoAcabando']),
}

export function getMascot(state: MascotKey, arenaId: string = 'default'): string {
  const states = ARENA_MASCOT_STATES[arenaId]
  if (states?.has(state)) {
    const fileName = state === 'tempoAcabando' ? 'tempo-acabando' : state
    return `/arenas/${arenaId}/batinho/${fileName}.webp`
  }
  return MASCOT[state]
}
