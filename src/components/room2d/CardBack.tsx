'use client'

export function CardBack() {
  return (
    <div
      className="absolute inset-0 rounded-xl overflow-hidden"
      style={{ backgroundColor: '#c8102e', containerType: 'size' }}
    >
      <div className="absolute inset-[3cqw] rounded-lg border-[2cqw] border-cabo-cream" />
      <div className="absolute inset-[7cqw] rounded-md border border-cabo-cream/40" />
      <div
        className="absolute inset-[8cqw] rounded-md opacity-30"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent 0 6cqw, rgba(253,246,227,0.25) 6cqw 6.5cqw), repeating-linear-gradient(-45deg, transparent 0 6cqw, rgba(253,246,227,0.25) 6cqw 6.5cqw)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cabo-cream flex items-center justify-center shadow-lg"
        style={{ width: '58cqw', height: '58cqw' }}
      >
        <span
          className="font-extrabold tracking-tight"
          style={{ color: '#c8102e', fontSize: '20cqw' }}
        >
          BATE
        </span>
      </div>
    </div>
  )
}
