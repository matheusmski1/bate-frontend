// scripts/optimize-mascot.mjs
// Usage: node scripts/optimize-mascot.mjs <input.png> <output.webp> [width=1024]
// Faz flood-fill de borda removendo pixels gray-ish (light 130-250, sat <25) e
// exporta WebP com alpha. Usado pra converter PNGs de batinhos que vêm com
// checkerboard baked no fundo.

import sharp from 'sharp'

const [, , input, output, widthArg] = process.argv
if (!input || !output) {
  console.error('Usage: node scripts/optimize-mascot.mjs <input.png> <output.webp> [width=1024]')
  process.exit(1)
}
const width = Number(widthArg) || 1024

const meta = await sharp(input).metadata()
console.log(`source: ${meta.width}x${meta.height} channels=${meta.channels} hasAlpha=${meta.hasAlpha}`)

const { data, info } = await sharp(input).resize({ width }).raw().toBuffer({ resolveWithObject: true })
const w = info.width
const h = info.height

const isBg = (r, g, b) => {
  const sat = Math.max(r, g, b) - Math.min(r, g, b)
  const light = (r + g + b) / 3
  return light > 130 && light < 250 && sat < 25
}

const mask = new Uint8Array(w * h)
const queue = []
const seed = (i) => {
  const r = data[i * 3]
  const g = data[i * 3 + 1]
  const b = data[i * 3 + 2]
  if (isBg(r, g, b) && !mask[i]) {
    mask[i] = 1
    queue.push(i)
  }
}

for (let x = 0; x < w; x++) {
  seed(x)
  seed((h - 1) * w + x)
}
for (let y = 0; y < h; y++) {
  seed(y * w)
  seed(y * w + w - 1)
}

while (queue.length) {
  const i = queue.shift()
  const x = i % w
  const y = (i - x) / w
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx
    const ny = y + dy
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
    const ni = ny * w + nx
    if (mask[ni]) continue
    const r = data[ni * 3]
    const g = data[ni * 3 + 1]
    const b = data[ni * 3 + 2]
    if (isBg(r, g, b)) {
      mask[ni] = 1
      queue.push(ni)
    }
  }
}

const out = Buffer.alloc(w * h * 4)
let bgCount = 0
for (let i = 0; i < w * h; i++) {
  out[i * 4] = data[i * 3]
  out[i * 4 + 1] = data[i * 3 + 1]
  out[i * 4 + 2] = data[i * 3 + 2]
  out[i * 4 + 3] = mask[i] ? 0 : 255
  if (mask[i]) bgCount++
}

await sharp(out, { raw: { width: w, height: h, channels: 4 } })
  .webp({ quality: 92, alphaQuality: 100, effort: 6 })
  .toFile(output)

const final = await sharp(output).metadata()
const pct = ((bgCount / (w * h)) * 100).toFixed(1)
console.log(`done → ${output} ${final.width}x${final.height} bgRemoved=${pct}%`)
