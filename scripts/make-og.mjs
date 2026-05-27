import sharp from 'sharp'

const SRC = '/Users/matheusdev/projects/bate-frontend/public/batinho/batinho-trofeu.webp'
const OUT = '/Users/matheusdev/projects/bate-frontend/public/og-image.png'

const W = 1200
const H = 630
const BG = { r: 0xff, g: 0xf5, b: 0xd1, alpha: 1 }
const MASCOT_HEIGHT = 580

const mascot = await sharp(SRC)
  .resize({ height: MASCOT_HEIGHT, fit: 'inside', withoutEnlargement: false })
  .toBuffer()

const meta = await sharp(mascot).metadata()
const mascotW = meta.width ?? MASCOT_HEIGHT
const mascotH = meta.height ?? MASCOT_HEIGHT

const left = Math.round((W - mascotW) / 2)
const top = Math.round((H - mascotH) / 2)

await sharp({
  create: { width: W, height: H, channels: 4, background: BG },
})
  .composite([{ input: mascot, left, top }])
  .png({ compressionLevel: 9, quality: 90 })
  .toFile(OUT)

const out = await sharp(OUT).metadata()
console.log(`wrote ${OUT} (${out.width}x${out.height})`)
