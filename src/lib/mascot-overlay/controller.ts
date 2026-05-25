// src/lib/mascot-overlay/controller.ts
// Primitivas de animação de mascote. Cada primitiva é uma função pura que
// monta um elemento DOM no overlay, roda anime.js timeline, e limpa.
// Retorna { cancel } pra interrupção externa.

import { createTimeline } from 'animejs'
import type { Box } from './geometry'

type Handle = { cancel: () => void }

const NOOP: Handle = { cancel: () => {} }

function reducedMotionPreferred(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function makeMascot(src: string, x: number, y: number, box: Box): { wrap: HTMLDivElement; img: HTMLImageElement } {
  const wrap = document.createElement('div')
  wrap.style.position = 'fixed'
  wrap.style.left = `${x}px`
  wrap.style.top = `${y}px`
  wrap.style.width = `${box.width}px`
  wrap.style.height = `${box.height}px`
  wrap.style.pointerEvents = 'none'
  wrap.style.zIndex = '60'
  wrap.style.willChange = 'transform, opacity'
  wrap.style.transformOrigin = 'center'
  wrap.style.opacity = '0'

  const img = document.createElement('img')
  img.src = src
  img.alt = ''
  img.style.width = '100%'
  img.style.height = '100%'
  img.style.objectFit = 'contain'
  img.style.objectPosition = 'center bottom'
  img.style.filter = 'drop-shadow(0 6px 12px rgba(0,0,0,0.35))'

  wrap.appendChild(img)
  return { wrap, img }
}

export type Controller = {
  runFlight(opts: FlightOpts): Handle
  runSwapDelivery(opts: SwapOpts): Handle
  popOnCard(opts: PopOpts): Handle
  attachLoop(opts: AttachOpts): Handle
}

export type FlightOpts = {
  overlay: HTMLElement
  fromRect: DOMRect | null
  toRect: DOMRect | null
  travelAsset: string
  arrivalAsset: string
  box: Box
  onArrived?: () => void
  onComplete?: () => void
}

export type SwapOpts = {
  overlay: HTMLElement
  fromRect: DOMRect | null
  midRect: DOMRect | null
  toRect: DOMRect | null
  travelAsset: string
  carryAsset: string
  box: Box
  onSwapped?: () => void
  onComplete?: () => void
}

export type PopOpts = {
  overlay: HTMLElement
  targetRect: DOMRect | null
  asset: string
  variant: 'success' | 'shake'
  box: Box
  onComplete?: () => void
}

export type AttachOpts = {
  overlay: HTMLElement
  anchorRect: DOMRect | null
  asset: string
  box: Box
  position?: 'top-right' | 'top-center'
}

let runningCount = 0

export function createController(): Controller {
  return {
    runFlight(opts) {
      if (runningCount > 0) {
        opts.onArrived?.()
        opts.onComplete?.()
        return NOOP
      }
      if (!opts.fromRect || !opts.toRect) {
        opts.onArrived?.()
        opts.onComplete?.()
        return NOOP
      }
      if (reducedMotionPreferred()) {
        setTimeout(() => opts.onArrived?.(), 50)
        setTimeout(() => opts.onComplete?.(), 100)
        return NOOP
      }

      runningCount++
      const { fromRect, toRect, box, travelAsset, arrivalAsset, overlay } = opts
      const fromX = fromRect.left + fromRect.width / 2 - box.width / 2
      const fromY = fromRect.top + fromRect.height / 2 - box.height / 2
      const toX = toRect.left + toRect.width / 2 - box.width / 2
      const toY = toRect.top - box.height * 0.85
      const dx = toX - fromX
      const dy = toY - fromY
      const midY = -Math.abs(dx) * 0.18 - 30

      const { wrap, img } = makeMascot(travelAsset, fromX, fromY, box)
      overlay.appendChild(wrap)

      let cancelled = false
      const cleanup = () => {
        try {
          overlay.removeChild(wrap)
        } catch {
          // already removed
        }
        runningCount = Math.max(0, runningCount - 1)
      }

      try {
        const tl = createTimeline({
          defaults: { ease: 'outQuad' },
          onComplete: () => {
            if (cancelled) return
            cleanup()
            opts.onComplete?.()
          },
        })
        tl.add(wrap, { opacity: [0, 1], scale: [0, 1], rotate: [-18, 0], duration: 220, ease: 'outBack' })
        tl.add(wrap, {
          translateX: [0, dx * 0.5, dx],
          translateY: [0, midY + dy * 0.5, dy],
          rotate: [0, 6, 0],
          duration: 580,
          ease: 'inOutQuad',
        })
        tl.call(() => {
          img.src = arrivalAsset
        })
        tl.add(wrap, {
          translateX: dx,
          translateY: [dy, dy - 14, dy],
          scale: [1, 1.22, 1.08],
          rotate: [0, -14, 6],
          duration: 280,
          ease: 'outBack',
          onComplete: () => {
            if (!cancelled) opts.onArrived?.()
          },
        })
        tl.add(wrap, {
          translateX: [dx, dx + 4, dx - 3, dx],
          translateY: dy,
          scale: 1.08,
          rotate: [6, -3, 3, 0],
          duration: 260,
          ease: 'inOutSine',
        })
        tl.add(wrap, {
          translateX: dx,
          translateY: dy,
          scale: [1.08, 0],
          opacity: [1, 0],
          rotate: [0, -15],
          duration: 280,
          ease: 'inQuad',
        })

        return {
          cancel: () => {
            if (cancelled) return
            cancelled = true
            try {
              tl.pause()
            } catch {
              // ignore
            }
            cleanup()
          },
        }
      } catch {
        cleanup()
        opts.onArrived?.()
        opts.onComplete?.()
        return NOOP
      }
    },

    runSwapDelivery(opts) {
      if (runningCount > 0) {
        opts.onSwapped?.()
        opts.onComplete?.()
        return NOOP
      }
      if (!opts.fromRect || !opts.midRect || !opts.toRect) {
        opts.onSwapped?.()
        opts.onComplete?.()
        return NOOP
      }
      if (reducedMotionPreferred()) {
        setTimeout(() => opts.onSwapped?.(), 50)
        setTimeout(() => opts.onComplete?.(), 100)
        return NOOP
      }

      runningCount++
      const { fromRect, midRect, toRect, box, travelAsset, carryAsset, overlay } = opts
      const fromX = fromRect.left + fromRect.width / 2 - box.width / 2
      const fromY = fromRect.top + fromRect.height / 2 - box.height / 2
      const mineX = midRect.left + midRect.width / 2 - box.width / 2
      const mineY = midRect.top - box.height * 0.85
      const oppX = toRect.left + toRect.width / 2 - box.width / 2
      const oppY = toRect.top - box.height * 0.85

      const dxA = mineX - fromX
      const dyA = mineY - fromY
      const dxB = oppX - fromX
      const dyB = oppY - fromY
      const midYA = -Math.abs(dxA) * 0.16 - 20
      const midYB = -Math.abs(dxB - dxA) * 0.16 - 20

      const { wrap, img } = makeMascot(travelAsset, fromX, fromY, box)
      overlay.appendChild(wrap)

      let cancelled = false
      const cleanup = () => {
        try {
          overlay.removeChild(wrap)
        } catch {
          // ignore
        }
        runningCount = Math.max(0, runningCount - 1)
      }

      try {
        const tl = createTimeline({
          defaults: { ease: 'outQuad' },
          onComplete: () => {
            if (cancelled) return
            cleanup()
            opts.onComplete?.()
          },
        })
        tl.add(wrap, { opacity: [0, 1], scale: [0, 1], rotate: [-18, 0], duration: 220, ease: 'outBack' })
        tl.add(wrap, {
          translateX: [0, dxA * 0.5, dxA],
          translateY: [0, midYA + dyA * 0.5, dyA],
          rotate: [0, 5, 0],
          duration: 480,
          ease: 'inOutQuad',
        })
        tl.call(() => {
          img.src = carryAsset
        })
        tl.add(wrap, {
          translateX: dxA,
          translateY: [dyA, dyA - 10, dyA],
          scale: [1, 1.15, 1.05],
          rotate: [0, -8, 0],
          duration: 260,
          ease: 'outBack',
        })
        tl.add(wrap, {
          translateX: [dxA, (dxA + dxB) / 2, dxB],
          translateY: [dyA, dyA + midYB, dyB],
          rotate: [0, 4, 0],
          duration: 560,
          ease: 'inOutQuad',
        })
        tl.add(wrap, {
          translateX: dxB,
          translateY: [dyB, dyB - 8, dyB],
          scale: [1.05, 1.18, 1.05],
          rotate: [0, 8, 0],
          duration: 240,
          ease: 'outBack',
          onComplete: () => {
            if (!cancelled) opts.onSwapped?.()
          },
        })
        tl.add(wrap, {
          translateX: dxB,
          translateY: dyB,
          scale: [1.05, 0],
          opacity: [1, 0],
          rotate: [0, 15],
          duration: 260,
          ease: 'inQuad',
        })

        return {
          cancel: () => {
            if (cancelled) return
            cancelled = true
            try {
              tl.pause()
            } catch {
              // ignore
            }
            cleanup()
          },
        }
      } catch {
        cleanup()
        opts.onSwapped?.()
        opts.onComplete?.()
        return NOOP
      }
    },

    popOnCard(opts) {
      if (runningCount > 0) {
        opts.onComplete?.()
        return NOOP
      }
      if (!opts.targetRect) {
        opts.onComplete?.()
        return NOOP
      }
      if (reducedMotionPreferred()) {
        setTimeout(() => opts.onComplete?.(), 100)
        return NOOP
      }

      runningCount++
      const { targetRect, box, asset, variant, overlay } = opts
      const x = targetRect.left + targetRect.width / 2 - box.width / 2
      const y = targetRect.top - box.height * 0.65

      const { wrap } = makeMascot(asset, x, y, box)
      overlay.appendChild(wrap)

      let cancelled = false
      const cleanup = () => {
        try {
          overlay.removeChild(wrap)
        } catch {
          // ignore
        }
        runningCount = Math.max(0, runningCount - 1)
      }

      try {
        const tl = createTimeline({
          defaults: { ease: 'outQuad' },
          onComplete: () => {
            if (cancelled) return
            cleanup()
            opts.onComplete?.()
          },
        })
        tl.add(wrap, {
          opacity: [0, 1],
          scale: [0, 1.25, 1.05],
          rotate: variant === 'shake' ? [-12, 8, -4] : [-18, 8, 0],
          duration: 320,
          ease: 'outBack',
        })
        if (variant === 'shake') {
          tl.add(wrap, {
            translateX: [0, -8, 7, -5, 4, 0],
            translateY: [0, 2, -2, 1, 0],
            rotate: [-4, 5, -3, 2, 0],
            duration: 420,
            ease: 'inOutSine',
          })
        } else {
          tl.add(wrap, {
            scale: [1.05, 1.12, 1.05],
            rotate: [0, 4, -3, 0],
            duration: 380,
            ease: 'inOutSine',
          })
        }
        tl.add(wrap, { scale: 1.05, duration: 250 })
        tl.add(wrap, {
          scale: [1.05, 0],
          opacity: [1, 0],
          translateY: [0, -10],
          duration: 240,
          ease: 'inQuad',
        })

        return {
          cancel: () => {
            if (cancelled) return
            cancelled = true
            try {
              tl.pause()
            } catch {
              // ignore
            }
            cleanup()
          },
        }
      } catch {
        cleanup()
        opts.onComplete?.()
        return NOOP
      }
    },

    attachLoop(opts) {
      if (!opts.anchorRect) return NOOP
      if (reducedMotionPreferred()) return NOOP

      const { anchorRect, asset, box, overlay } = opts
      const pos = opts.position ?? 'top-right'
      const x =
        pos === 'top-right'
          ? anchorRect.right - box.width * 0.3
          : anchorRect.left + anchorRect.width / 2 - box.width / 2
      const y = anchorRect.top - box.height * 0.6

      const { wrap } = makeMascot(asset, x, y, box)
      overlay.appendChild(wrap)

      let loop: { pause: () => void } | null = null
      let cancelled = false

      try {
        const entry = createTimeline({
          onComplete: () => {
            if (cancelled) return
            loop = createTimeline({ loop: true, defaults: { ease: 'inOutSine' } })
            ;(loop as ReturnType<typeof createTimeline>).add(wrap, {
              translateY: [0, -10, 0],
              rotate: [-6, 6, -6],
              duration: 1200,
            })
          },
        })
        entry.add(wrap, {
          opacity: [0, 1],
          scale: [0, 1.1, 1],
          rotate: [-30, 8, 0],
          duration: 360,
          ease: 'outBack',
        })

        return {
          cancel: () => {
            if (cancelled) return
            cancelled = true
            try {
              entry.pause()
            } catch {
              // ignore
            }
            try {
              loop?.pause()
            } catch {
              // ignore
            }
            try {
              overlay.removeChild(wrap)
            } catch {
              // ignore
            }
          },
        }
      } catch {
        try {
          overlay.removeChild(wrap)
        } catch {
          // ignore
        }
        return NOOP
      }
    },
  }
}
