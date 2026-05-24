'use client'

export function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 90% 75% at 50% 60%, #1b3050 0%, #0d1b2a 55%, #050a14 100%)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
        style={{
          width: '90vw',
          height: '60vh',
          background:
            'radial-gradient(ellipse, rgba(29,77,53,0.55) 0%, rgba(13,27,42,0) 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='240' height='240' filter='url(%23n)'/></svg>\")",
        }}
      />
      <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 200px rgba(0,0,0,0.7)' }} />
    </div>
  )
}
