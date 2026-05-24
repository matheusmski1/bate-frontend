'use client'

export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-bate-cream">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 90% 70% at 50% 55%, rgba(74, 124, 79, 0.18) 0%, transparent 65%),
            repeating-linear-gradient(45deg, rgba(26, 14, 8, 0.025) 0px, rgba(26, 14, 8, 0.025) 1px, transparent 1px, transparent 6px)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  )
}
