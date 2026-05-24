import { readdir } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import sharp from 'sharp'

const RAW_DIR = 'public/cards/raw'
const OUT_DIR = 'public/cards'
const WIDTH = 320
const HEIGHT = 448
const QUALITY = 85

const NAME_MAP = {
  'batinho-as': 'batinho-as',
  'batinho-2': 'batinho-2',
  'batinho-3': 'batinho-3',
  'batinho-4': 'batinho-4',
  'batinho-5': 'batinho-5',
  'batinho-6': 'batinho-6',
  'batinho-7': 'batinho-7',
  'batinho-8': 'batinho-8',
  'batinho-9': 'batinho-9',
  'batinho-olhadinha': 'batinho-olhadinha',
  'batinho-espiadinha': 'batinho-espiadinha',
  'batinho-troca': 'batinho-troca',
  'batinho-k-3': 'batinho-k',
  'batinho-joker': 'batinho-joker',
  'bate-verso-de-carta': 'back',
}

const files = await readdir(RAW_DIR)
const pngs = files.filter(f => extname(f).toLowerCase() === '.png')

if (pngs.length === 0) {
  console.error('No PNGs found in', RAW_DIR)
  process.exit(1)
}

let totalRaw = 0
let totalOut = 0

for (const file of pngs) {
  const stem = basename(file, '.png')
  const outName = NAME_MAP[stem]
  if (!outName) {
    console.warn(`Skipping unmapped file: ${file}`)
    continue
  }
  const inPath = join(RAW_DIR, file)
  const outPath = join(OUT_DIR, `${outName}.webp`)
  const result = await sharp(inPath)
    .resize(WIDTH, HEIGHT, { fit: 'cover' })
    .webp({ quality: QUALITY })
    .toFile(outPath)
  const rawSize = (await sharp(inPath).metadata()).size ?? 0
  totalRaw += rawSize
  totalOut += result.size
  const ratio = rawSize > 0 ? ((1 - result.size / rawSize) * 100).toFixed(0) : '?'
  console.log(`${file} -> ${outName}.webp  ${(result.size / 1024).toFixed(0)}KB (-${ratio}%)`)
}

console.log(`\nTotal: ${(totalRaw / 1024 / 1024).toFixed(1)}MB -> ${(totalOut / 1024).toFixed(0)}KB`)
