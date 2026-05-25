type SoundKey = 'card-flip' | 'card-discard' | 'snap-success' | 'snap-fail' | 'turn-yours' | 'bate-called' | 'victory' | 'draw' | 'card-fly' | 'emote-pop'

const VOLUME_KEY = 'bate:volume'
const LEGACY_VOLUME_KEY = 'cabo:volume'
let ctx: AudioContext | null = null

function migrateLegacyVolume(): void {
  if (typeof window === 'undefined') return
  const legacy = window.localStorage.getItem(LEGACY_VOLUME_KEY)
  if (!legacy) return
  if (!window.localStorage.getItem(VOLUME_KEY)) {
    window.localStorage.setItem(VOLUME_KEY, legacy)
  }
  window.localStorage.removeItem(LEGACY_VOLUME_KEY)
}

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function getVolume(): number {
  if (typeof window === 'undefined') return 0.5
  migrateLegacyVolume()
  const stored = window.localStorage.getItem(VOLUME_KEY)
  return stored ? Number(stored) : 0.5
}

export function setVolume(v: number): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(VOLUME_KEY, String(v))
}

export function getVolumeNow(): number {
  return getVolume()
}

function masterGain(ac: AudioContext): GainNode {
  const g = ac.createGain()
  g.gain.value = getVolume()
  g.connect(ac.destination)
  return g
}

function noiseBuffer(ac: AudioContext, durationSec: number, decay: number): AudioBuffer {
  const length = Math.floor(ac.sampleRate * durationSec)
  const buf = ac.createBuffer(1, length, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * decay))
  }
  return buf
}

function playCardFlip(ac: AudioContext, master: GainNode) {
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac, 0.12, 0.04)
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 1800
  filter.Q.value = 1.2
  const g = ac.createGain()
  g.gain.value = 0.6
  src.connect(filter).connect(g).connect(master)
  src.start()
  src.stop(ac.currentTime + 0.15)
}

function playCardDiscard(ac: AudioContext, master: GainNode) {
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac, 0.2, 0.05)
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 2400
  const g = ac.createGain()
  g.gain.setValueAtTime(0.7, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.01, ac.currentTime + 0.22)
  src.connect(filter).connect(g).connect(master)
  src.start()
  src.stop(ac.currentTime + 0.24)
}

function playSnapSuccess(ac: AudioContext, master: GainNode) {
  const t = ac.currentTime
  const osc = ac.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(880, t)
  osc.frequency.exponentialRampToValueAtTime(220, t + 0.12)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.35, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + 0.2)
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac, 0.08, 0.02)
  const ng = ac.createGain()
  ng.gain.value = 0.3
  src.connect(ng).connect(master)
  src.start(t)
}

function playSnapFail(ac: AudioContext, master: GainNode) {
  const t = ac.currentTime
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(180, t)
  osc.frequency.linearRampToValueAtTime(90, t + 0.25)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.35, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + 0.32)
}

function playTurnYours(ac: AudioContext, master: GainNode) {
  const t = ac.currentTime
  const notes = [523.25, 659.25]
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = freq
    const g = ac.createGain()
    g.gain.setValueAtTime(0, t + i * 0.07)
    g.gain.linearRampToValueAtTime(0.2, t + i * 0.07 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.18)
    osc.connect(g).connect(master)
    osc.start(t + i * 0.07)
    osc.stop(t + i * 0.07 + 0.2)
  })
}

function playBateCalled(ac: AudioContext, master: GainNode) {
  const t = ac.currentTime
  const notes = [392, 523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const g = ac.createGain()
    const start = t + i * 0.09
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(0.25, start + 0.02)
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.32)
    osc.connect(g).connect(master)
    osc.start(start)
    osc.stop(start + 0.34)
  })
}

function playVictory(ac: AudioContext, master: GainNode) {
  const t = ac.currentTime
  const chord = [523.25, 659.25, 783.99, 1046.5]
  chord.forEach(freq => {
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const g = ac.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.18, t + 0.05)
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.9)
    osc.connect(g).connect(master)
    osc.start(t)
    osc.stop(t + 1)
  })
}

function playCardFly(ac: AudioContext, master: GainNode) {
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac, 0.32, 0.12)
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(700, ac.currentTime)
  filter.frequency.exponentialRampToValueAtTime(2400, ac.currentTime + 0.28)
  filter.Q.value = 1.6
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0, ac.currentTime)
  g.gain.linearRampToValueAtTime(0.35, ac.currentTime + 0.08)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.32)
  src.connect(filter).connect(g).connect(master)
  src.start()
  src.stop(ac.currentTime + 0.34)
}

function playEmotePop(ac: AudioContext, master: GainNode) {
  const t = ac.currentTime
  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(520, t)
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.08)
  osc.frequency.exponentialRampToValueAtTime(660, t + 0.16)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0, t)
  g.gain.linearRampToValueAtTime(0.22, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + 0.22)
}

function playDraw(ac: AudioContext, master: GainNode) {
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac, 0.1, 0.03)
  const filter = ac.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 3000
  const g = ac.createGain()
  g.gain.value = 0.35
  src.connect(filter).connect(g).connect(master)
  src.start()
  src.stop(ac.currentTime + 0.12)
}

export function playSound(key: SoundKey): void {
  const ac = getCtx()
  if (!ac) return
  const master = masterGain(ac)
  switch (key) {
    case 'card-flip': return playCardFlip(ac, master)
    case 'draw': return playDraw(ac, master)
    case 'card-fly': return playCardFly(ac, master)
    case 'emote-pop': return playEmotePop(ac, master)
    case 'card-discard': return playCardDiscard(ac, master)
    case 'snap-success': return playSnapSuccess(ac, master)
    case 'snap-fail': return playSnapFail(ac, master)
    case 'turn-yours': return playTurnYours(ac, master)
    case 'bate-called': return playBateCalled(ac, master)
    case 'victory': return playVictory(ac, master)
  }
}
