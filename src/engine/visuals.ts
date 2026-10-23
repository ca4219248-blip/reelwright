import { mulberry32 } from '../lib/utils'

/**
 * Visual generation.
 *
 * Two honest paths:
 *  1. `drawProcedural` — deterministic, locally-generated cinematic artwork
 *     drawn on a canvas. Always available, no network, no keys.
 *  2. `fetchKeylessImage` — a real AI image from a keyless public endpoint.
 *     This genuinely generates an image, but depends on a third-party service,
 *     so callers must handle failure and fall back to procedural artwork.
 */

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const n = parseInt(full, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(a)
  const [r2, g2, b2] = hexToRgb(b)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const bl = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

// ---------------------------------------------------------------------------
// Procedural cinematic artwork
// ---------------------------------------------------------------------------

export function drawProcedural(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  seed: number,
  palette: string[],
): void {
  const rng = mulberry32(seed)
  const [dark, mid, accent, accent2] = [
    palette[0] ?? '#0A0A11',
    palette[1] ?? '#1B2A4A',
    palette[2] ?? '#F5A623',
    palette[3] ?? palette[2] ?? '#FFC24B',
  ]
  const mode = seed % 2

  ctx.save()
  ctx.clearRect(0, 0, width, height)

  // Sky / base gradient
  const sky = ctx.createLinearGradient(0, 0, width * 0.3, height)
  sky.addColorStop(0, mix(dark, mid, 0.35))
  sky.addColorStop(0.5, mid)
  sky.addColorStop(1, dark)
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  if (mode === 0) {
    // --- Landscape: light source + layered ridges ---
    const sunX = width * (0.18 + rng() * 0.64)
    const sunY = height * (0.26 + rng() * 0.24)
    const sunR = Math.min(width, height) * (0.05 + rng() * 0.05)

    const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR * 8)
    glow.addColorStop(0, rgba(accent, 0.95))
    glow.addColorStop(0.18, rgba(accent2, 0.5))
    glow.addColorStop(0.5, rgba(accent2, 0.14))
    glow.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, width, height)

    ctx.beginPath()
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2)
    ctx.fillStyle = rgba(accent2, 0.95)
    ctx.fill()

    const layers = 4
    for (let l = 0; l < layers; l += 1) {
      const baseY = height * (0.44 + l * 0.13)
      const amp = height * (0.11 - l * 0.018)
      const freq = 1 + rng() * 2.2
      const phase = rng() * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(0, height)
      for (let x = 0; x <= width; x += 6) {
        const y =
          baseY -
          Math.sin((x / width) * Math.PI * freq * 2 + phase) * amp -
          Math.sin((x / width) * Math.PI * freq * 5 + phase * 1.7) * amp * 0.35
        ctx.lineTo(x, y)
      }
      ctx.lineTo(width, height)
      ctx.closePath()
      const t = l / (layers - 1)
      ctx.globalAlpha = 0.5 + t * 0.5
      ctx.fillStyle = mix(mid, dark, 0.25 + t * 0.7)
      ctx.fill()
      ctx.globalAlpha = 1
    }
  } else {
    // --- Geometric: concentric arcs + light beams ---
    const cx = width * (0.3 + rng() * 0.4)
    const cy = height * (0.35 + rng() * 0.3)
    const rings = 6
    for (let i = rings; i > 0; i -= 1) {
      const r = (Math.min(width, height) * 0.5 * i) / rings
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = rgba(mix(mid, accent, i / rings), 0.1 + (1 - i / rings) * 0.16)
      ctx.fill()
    }

    ctx.globalCompositeOperation = 'screen'
    const beams = 5
    for (let i = 0; i < beams; i += 1) {
      const bx = width * (0.1 + rng() * 0.8)
      const bw = width * (0.02 + rng() * 0.06)
      const beam = ctx.createLinearGradient(bx, 0, bx + bw * 3, height)
      beam.addColorStop(0, rgba(accent2, 0.35))
      beam.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = beam
      ctx.fillRect(bx, 0, bw * 3, height)
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  // Vignette
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.25,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.78,
  )
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.62)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, width, height)

  ctx.restore()
}

/** Renders a procedural frame into an offscreen canvas and returns a data URL. */
export function proceduralThumbnail(
  seed: number,
  palette: string[],
  width = 480,
  height = 270,
): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  drawProcedural(ctx, width, height, seed, palette)
  return canvas.toDataURL('image/jpeg', 0.82)
}

// ---------------------------------------------------------------------------
// Keyless AI image generation
// ---------------------------------------------------------------------------

export interface KeylessImageOptions {
  model?: string
  width?: number
  height?: number
  seed?: number
  timeoutMs?: number
}

/**
 * Requests an AI-generated image from a keyless public endpoint and returns it
 * as a data URL. Throws on any failure so the caller can fall back to
 * procedural artwork — we never present a failed generation as a success.
 */
export async function fetchKeylessImage(
  prompt: string,
  options: KeylessImageOptions = {},
): Promise<string> {
  const { model = 'flux', width = 1280, height = 720, seed = 1, timeoutMs = 45000 } = options
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}&model=${encodeURIComponent(model)}&seed=${seed}&nologo=true`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, mode: 'cors' })
    if (!res.ok) throw new Error(`Image service responded ${res.status}`)
    const blob = await res.blob()
    if (!blob.type.startsWith('image/')) throw new Error('Image service returned a non-image response')
    return await blobToDataUrl(blob)
  } finally {
    clearTimeout(timer)
  }
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(blob)
  })
}

/** Loads a data URL / object URL into an HTMLImageElement for canvas drawing. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}
