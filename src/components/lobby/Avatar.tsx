'use client'

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h << 5) - h + name.charCodeAt(i)
  return Math.abs(h)
}

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const trimmed = name.trim()
  const initials = trimmed
    ? trimmed.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase()).join('')
    : '?'
  const hue = trimmed ? hashName(trimmed) % 360 : null
  return (
    <div
      className="rounded-full flex items-center justify-center font-extrabold text-white shadow-lg shrink-0"
      style={{
        width: size,
        height: size,
        background: hue !== null ? `linear-gradient(135deg, hsl(${hue}, 70%, 55%), hsl(${(hue + 40) % 360}, 70%, 45%))` : 'rgba(168, 142, 250, 0.2)',
        fontSize: size * 0.4,
      }}
    >
      {initials}
    </div>
  )
}
