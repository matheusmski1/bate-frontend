'use client'

import { Spade, Heart, Diamond, Club } from 'lucide-react'

export function BackgroundDefault() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-bate-cream">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255, 184, 28, 0.18) 0%, rgba(74, 124, 79, 0.10) 45%, transparent 75%),
            repeating-linear-gradient(45deg, rgba(26, 14, 8, 0.025) 0px, rgba(26, 14, 8, 0.025) 1px, transparent 1px, transparent 6px)
          `,
        }}
      />

      <div className="absolute inset-0 pointer-events-none opacity-[0.06] text-bate-ink">
        <Spade size={420} strokeWidth={1.2} className="absolute -top-16 -left-10" style={{ transform: 'rotate(-22deg)' }} />
        <Heart size={360} strokeWidth={1.2} className="absolute top-1/3 -right-16" style={{ transform: 'rotate(14deg)' }} />
        <Diamond size={360} strokeWidth={1.2} className="absolute -bottom-12 -left-16" style={{ transform: 'rotate(-10deg)' }} />
        <Club size={420} strokeWidth={1.2} className="absolute -bottom-20 -right-10" style={{ transform: 'rotate(28deg)' }} />
      </div>

      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  )
}
