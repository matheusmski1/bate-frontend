import { readdir, unlink } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import sharp from 'sharp'

const DIR = 'public/batinho'
const MAX_WIDTH = 720
const QUALITY = 86

const files = await readdir(DIR)
const pngs = files.filter(f => extname(f).toLowerCase() === '.png')

if (pngs.length === 0) {
  console.error('No PNGs found in', DIR)
  process.exit(1)
}

let totalRaw = 0
let totalOut = 0

for (const file of pngs) {
  const stem = basename(file, '.png')
  const inPath = join(DIR, file)
  const outPath = join(DIR, `${stem}.webp`)
  const meta = await sharp(inPath).metadata()
  const targetWidth = Math.min(MAX_WIDTH, meta.width ?? MAX_WIDTH)
  const result = await sharp(inPath)
    .resize({ width: targetWidth, withoutEnlargement: true })
    .webp({ quality: QUALITY, alphaQuality: 90 })
    .toFile(outPath)
  const rawSize = meta.size ?? 0
  totalRaw += rawSize
  totalOut += result.size
  const ratio = rawSize > 0 ? ((1 - result.size / rawSize) * 100).toFixed(0) : '?'
  console.log(`${file} -> ${stem}.webp  ${(result.size / 1024).toFixed(0)}KB (-${ratio}%)`)
  await unlink(inPath)
}

console.log(`\nTotal: ${(totalRaw / 1024 / 1024).toFixed(1)}MB -> ${(totalOut / 1024).toFixed(0)}KB`)
