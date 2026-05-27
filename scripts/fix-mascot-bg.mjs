// scripts/fix-mascot-bg.mjs
// Aplica chroma-key flexível em webps de mascote que ficaram com fundo opaco.
// Diferente do optimize-mascots.mjs (que assume bg cinza-claro), esse:
//   1. Detecta a cor de fundo via mediana de pixels de borda
//   2. Faz flood-fill com tolerância RGB ajustável
//   3. Aplica feather em 2 passes pras bordas não ficarem dentadas
//
// Uso:
//   node scripts/fix-mascot-bg.mjs                           # processa lista padrão
//   node scripts/fix-mascot-bg.mjs <arquivo.webp> [tolerance=35]
//
// In-place: overwrite do arquivo. Git preserva o original.

import { readFile, writeFile, copyFile, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import sharp from 'sharp'

const DEFAULT_TOLERANCE = 35
const FEATHER_PASSES = 2
const QUALITY = 88
const ALPHA_QUALITY = 92

const DEFAULT_TARGETS = [
  'public/batinho/batinho-feliz.webp',
  'public/batinho/batinho-lupa.webp',
  'public/batinho/batinho-espiadinha.webp',
  'public/batinho/batinho-troca-de-cartas.webp',
  'public/batinho/batinho-assustado.webp',
  'public/batinho/batinho-tempo-acabando.webp',
  'public/batinho/batinho-bate.webp',
  'public/batinho/batinho-trofeu.webp',
  'public/batinho/batinho-confuso.webp',
  'public/batinho/batinho-chorando.webp',
  'public/batinho/batinho-desmaiado.webp',
]

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}

// Encontra trim bbox: menor retângulo que contém todos pixels opacos.
// Usado pra sampling de bg em inner mode.
function trimBbox(data, W, H) {
  let minX = W, minY = H, maxX = -1, maxY = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 200) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return null
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }
}

// Detecta cor do bg. Inner mode = bordas do canvas transparentes:
// samplear na borda do trim bbox (o retângulo opaco interno é o bg). Outer
// mode = bordas opacas: samplear na borda do canvas direto.
function detectBgColor(data, W, H) {
  const cornerAlphas = [
    data[3],
    data[(W - 1) * 4 + 3],
    data[(H - 1) * W * 4 + 3],
    data[((H - 1) * W + W - 1) * 4 + 3],
  ]
  const innerMode = cornerAlphas.every((a) => a < 50)

  const samples = { r: [], g: [], b: [] }
  const sampleAt = (x, y) => {
    if (x < 0 || x >= W || y < 0 || y >= H) return
    const i = (y * W + x) * 4
    if (data[i + 3] < 200) return
    samples.r.push(data[i])
    samples.g.push(data[i + 1])
    samples.b.push(data[i + 2])
  }

  if (innerMode) {
    // Cream-criteria: filtra TODOS pixels opacos do canvas que pareçam fundo
    // cream típico (lum>=210, baixa saturação, levemente quente ou neutro).
    // Mediana desses = bg color. Robusto contra outlines/sombras/skin.
    for (let i = 0; i < W * H; i++) {
      if (data[i * 4 + 3] < 200) continue
      const r = data[i * 4]
      const g = data[i * 4 + 1]
      const b = data[i * 4 + 2]
      const lum = (r + g + b) / 3
      const sat = Math.max(r, g, b) - Math.min(r, g, b)
      if (lum < 210 || sat > 70) continue
      if (r < b - 15) continue // descarta tons frios (azuis)
      samples.r.push(r)
      samples.g.push(g)
      samples.b.push(b)
    }
    if (samples.r.length < 100) {
      return { r: 0, g: 0, b: 0, mode: 'inner', error: 'no_cream_pixels' }
    }
    return {
      r: median(samples.r),
      g: median(samples.g),
      b: median(samples.b),
      mode: 'inner',
    }
  }

  const stepX = Math.max(1, Math.floor(W / 60))
  const stepY = Math.max(1, Math.floor(H / 60))
  for (let x = 0; x < W; x += stepX) {
    sampleAt(x, 0)
    sampleAt(x, H - 1)
  }
  for (let y = 0; y < H; y += stepY) {
    sampleAt(0, y)
    sampleAt(W - 1, y)
  }
  return { r: median(samples.r), g: median(samples.g), b: median(samples.b), mode: 'outer', bbox: null }
}

function colorDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2
  const dg = g1 - g2
  const db = b1 - b2
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

async function fixBackground(inPath, tolerance) {
  const meta = await sharp(inPath).metadata()
  console.log(`\n${inPath}`)
  console.log(`  source: ${meta.width}x${meta.height} ch=${meta.channels} alpha=${meta.hasAlpha}`)

  const { data, info } = await sharp(inPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  const W = info.width
  const H = info.height

  const bg = detectBgColor(data, W, H)
  console.log(`  bg detected: rgb(${bg.r},${bg.g},${bg.b}) mode=${bg.mode} tolerance=${tolerance}`)

  // Mask: 1 = bg pixel candidato (cor dentro da tolerância E pixel opaco)
  const mask = new Uint8Array(W * H)
  for (let i = 0; i < W * H; i++) {
    const p = i * 4
    if (data[p + 3] < 50) continue // já transparente, ignora
    if (colorDistance(data[p], data[p + 1], data[p + 2], bg.r, bg.g, bg.b) < tolerance) {
      mask[i] = 1
    }
  }

  // Flood-fill: outer mode seed = borda do canvas. Inner mode seed = primeiro
  // pixel opaco encontrado scaneando do canvas pra dentro (= borda do retângulo
  // opaco interno).
  const finalAlpha = new Uint8Array(W * H).fill(255)
  for (let i = 0; i < W * H; i++) if (data[i * 4 + 3] < 50) finalAlpha[i] = 0

  const visited = new Uint8Array(W * H)
  const queue = []
  const enqueue = (idx) => {
    if (visited[idx] || !mask[idx]) return
    visited[idx] = 1
    queue.push(idx)
  }
  if (bg.mode === 'inner') {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (data[(y * W + x) * 4 + 3] > 200) { enqueue(y * W + x); break }
      }
      for (let x = W - 1; x >= 0; x--) {
        if (data[(y * W + x) * 4 + 3] > 200) { enqueue(y * W + x); break }
      }
    }
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        if (data[(y * W + x) * 4 + 3] > 200) { enqueue(y * W + x); break }
      }
      for (let y = H - 1; y >= 0; y--) {
        if (data[(y * W + x) * 4 + 3] > 200) { enqueue(y * W + x); break }
      }
    }
  } else {
    for (let x = 0; x < W; x++) {
      enqueue(x)
      enqueue((H - 1) * W + x)
    }
    for (let y = 0; y < H; y++) {
      enqueue(y * W)
      enqueue(y * W + W - 1)
    }
  }
  while (queue.length) {
    const idx = queue.shift()
    finalAlpha[idx] = 0
    const x = idx % W
    const y = (idx / W) | 0
    if (x > 0) enqueue(idx - 1)
    if (x < W - 1) enqueue(idx + 1)
    if (y > 0) enqueue(idx - W)
    if (y < H - 1) enqueue(idx + W)
  }

  // Feather: passa 2x suavizando bordas. Pixels opacos com >=2 vizinhos
  // transparentes ficam alpha=128 (semi-transparente).
  for (let pass = 0; pass < FEATHER_PASSES; pass++) {
    const prev = finalAlpha.slice()
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const idx = y * W + x
        if (prev[idx] !== 255) continue
        const n = [prev[idx - 1], prev[idx + 1], prev[idx - W], prev[idx + W]]
        const transparentNeighbors = n.filter((a) => a === 0).length
        if (transparentNeighbors >= 2) finalAlpha[idx] = 128
      }
    }
  }

  let removedCount = 0
  for (let i = 0; i < W * H; i++) {
    data[i * 4 + 3] = finalAlpha[i]
    if (finalAlpha[i] === 0) removedCount++
  }

  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: QUALITY, alphaQuality: ALPHA_QUALITY })
    .toFile(inPath + '.tmp')

  const beforeStat = await stat(inPath)
  const afterStat = await stat(inPath + '.tmp')
  await copyFile(inPath + '.tmp', inPath)
  await writeFile(inPath + '.tmp', '')
  const { unlink } = await import('node:fs/promises')
  await unlink(inPath + '.tmp')

  const removedPct = ((removedCount / (W * H)) * 100).toFixed(1)
  const sizeDelta = (((afterStat.size - beforeStat.size) / beforeStat.size) * 100).toFixed(0)
  console.log(`  removed ${removedPct}% bg pixels`)
  console.log(`  ${(beforeStat.size / 1024).toFixed(0)}KB -> ${(afterStat.size / 1024).toFixed(0)}KB (${sizeDelta >= 0 ? '+' : ''}${sizeDelta}%)`)
}

async function main() {
  const args = process.argv.slice(2)
  let targets
  let tolerance = DEFAULT_TOLERANCE

  if (args.length === 0) {
    targets = DEFAULT_TARGETS
  } else {
    targets = [args[0]]
    if (args[1]) tolerance = Number(args[1])
  }

  for (const target of targets) {
    const path = resolve(target)
    if (!existsSync(path)) {
      console.error(`skip (not found): ${target}`)
      continue
    }
    try {
      await fixBackground(path, tolerance)
    } catch (err) {
      console.error(`fail: ${target} —`, err.message)
    }
  }
}

main()
