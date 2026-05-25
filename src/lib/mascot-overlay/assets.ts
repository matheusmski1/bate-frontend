// Paths e aspect ratios dos sprites de mascote usados nas animações.
// Aspect = width / height da WebP. Usado por boxFor() pra calcular bounding box
// do wrapper sem distorcer quando img muda de src no meio da timeline.

export const FELIZ = '/batinho/batinho-feliz.webp'
export const LUPA = '/batinho/batinho-lupa.webp'
export const ESPIADINHA = '/batinho/batinho-espiadinha.webp'
export const TROCA = '/batinho/batinho-troca-de-cartas.webp'
export const ASSUSTADO = '/batinho/batinho-assustado.webp'
export const TEMPO = '/batinho/batinho-tempo-acabando.webp'

export const ASPECTS: Record<string, number> = {
  [FELIZ]: 720 / 402,
  [LUPA]: 720 / 402,
  [ESPIADINHA]: 1024 / 572,
  [TROCA]: 1024 / 572,
  [ASSUSTADO]: 720 / 402,
  [TEMPO]: 720 / 402,
}
