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
 * (ex: card desmontou no meio da animação).
 */
export function getRect(selector: string): DOMRect | null {
  if (typeof document === 'undefined') return null
  const el = document.querySelector(selector)
  return el ? el.getBoundingClientRect() : null
}
