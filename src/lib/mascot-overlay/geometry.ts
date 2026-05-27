// src/lib/mascot-overlay/geometry.ts
// Helpers de medição e dimensionamento usados pelo controller.

import { ASPECTS } from './assets'

export type Box = { width: number; height: number }

/**
 * Calcula a bounding box (wrapper) que acomoda TODOS os assets passados,
 * respeitando o aspect mais "alto" (menor ratio). Image dentro usa
 * object-fit:contain — sprite mais wide aparece menor que a box, sem distorção.
 */
export function boxFor(width: number, assets: string[]): Box {
  const ratios = assets.map((a) => ASPECTS[a] ?? 720 / 402)
  const minAspect = Math.min(...ratios)
  return { width, height: Math.round(width / minAspect) }
}

/**
 * Lookup DOM rect via atributo data-*. Retorna null se elemento não existe
 * (ex: card desmontou no meio da animação) OU se todos os matches estão
 * escondidos (rect 0x0). Esse último caso acontece porque OpponentArea
 * renderiza branches mobile E desktop simultaneamente (Tailwind sm:hidden),
 * e o primeiro match em DOM order pode ser o branch hidden — querySelectorAll
 * + filtro de rect > 0 garante que a animação acerta o elemento visível.
 */
export function getRect(selector: string): DOMRect | null {
  if (typeof document === 'undefined') return null
  const els = document.querySelectorAll(selector)
  for (const el of els) {
    const r = el.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) return r
  }
  return null
}
