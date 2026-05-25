import { readdir, unlink, stat } from 'node:fs/promises'
import { join, basename, extname } from 'node:path'
import sharp from 'sharp'

const DIR = 'public/batinho'
const MAX_WIDTH = 720
const QUALITY = 88

const BG_THRESHOLD_GRAY = 170
const BG_TOLERANCE = 30
const FEATHER_PASSES = 2

function isBgPixel(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min < BG_TOLERANCE && r > BG_THRESHOLD_GRAY && g > BG_THRESHOLD_GRAY && b > BG_THRESHOLD_GRAY
}

async function chromaKey(inPath, outPath, targetWidth) {
  const { data, info } = await sharp(inPath)
    .resize({ width: targetWidth, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const { width, height } = info

  const alphaMap = new Uint8Array(width * height)
  for (let i = 0; i < alphaMap.length; i++) {
    const p = i * 4
    alphaMap[i] = isBgPixel(data[p], data[p + 1], data[p + 2]) ? 0 : 255
  }

  const visited = new Uint8Array(width * height)
  const queue = []
  const pushIfBg = idx => {
    if (visited[idx] || alphaMap[idx] !== 0) return
    visited[idx] = 1
    queue.push(idx)
  }
  for (let x = 0; x < width; x++) {
    pushIfBg(x)
    pushIfBg((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    pushIfBg(y * width)
    pushIfBg(y * width + (width - 1))
  }
  const finalAlpha = new Uint8Array(width * height).fill(255)
  while (queue.length) {
    const idx = queue.shift()
    finalAlpha[idx] = 0
    const x = idx % width
    const y = (idx / width) | 0
    if (x > 0) pushIfBg(idx - 1)
    if (x < width - 1) pushIfBg(idx + 1)
    if (y > 0) pushIfBg(idx - width)
    if (y < height - 1) pushIfBg(idx + width)
  }

  for (let pass = 0; pass < FEATHER_PASSES; pass++) {
    const prev = finalAlpha.slice()
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        if (prev[idx] !== 255) continue
        const neighbors = [prev[idx - 1], prev[idx + 1], prev[idx - width], prev[idx + width]]
        const transparentNeighbors = neighbors.filter(a => a === 0).length
        if (transparentNeighbors >= 2) finalAlpha[idx] = 128
      }
    }
  }

  for (let i = 0; i < width * height; i++) {
    data[i * 4 + 3] = finalAlpha[i]
  }

  await sharp(data, { raw: { width, height, channels: 4 } })
    .webp({ quality: QUALITY, alphaQuality: 92 })
    .toFile(outPath)
  const outStat = await stat(outPath)
  return outStat.size
}

const files = await readdir(DIR)
const pngs = files.filter(f => extname(f).toLowerCase() === '.png')

if (pngs.length === 0) {
  console.log('Nenhum PNG no diretório. Saindo.')
  process.exit(0)
}

let totalRaw = 0
let totalOut = 0

for (const file of pngs) {
  const stem = basename(file, '.png')
  const inPath = join(DIR, file)
  const outPath = join(DIR, `${stem}.webp`)
  const meta = await sharp(inPath).metadata()
  const targetWidth = Math.min(MAX_WIDTH, meta.width ?? MAX_WIDTH)
  const rawStat = await stat(inPath)
  const outSize = await chromaKey(inPath, outPath, targetWidth)
  totalRaw += rawStat.size
  totalOut += outSize
  const ratio = ((1 - outSize / rawStat.size) * 100).toFixed(0)
  console.log(`${file} -> ${stem}.webp  ${(outSize / 1024).toFixed(0)}KB (-${ratio}%)`)
  await unlink(inPath)
}

console.log(`\nTotal: ${(totalRaw / 1024 / 1024).toFixed(1)}MB -> ${(totalOut / 1024).toFixed(0)}KB`)
