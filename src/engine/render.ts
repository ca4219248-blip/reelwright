import type { CameraMove, Cue, Scene, SubtitleStyle, Transition } from '../lib/types'
import { drawProcedural } from './visuals'

/**
 * Canvas frame renderer. Every exported pixel and every preview frame goes
 * through these functions, so preview and export are always the same image.
 */

interface Transform {
  scale: number
  dx: number
  dy: number
}

/** Camera move as a function of progress through the scene (0 → 1). */
export function cameraTransform(camera: CameraMove, progress: number): Transform {
  const p = Math.min(1, Math.max(0, progress))
  const eased = p * p * (3 - 2 * p)
  switch (camera) {
    case 'zoom-in':
      return { scale: 1.02 + eased * 0.16, dx: 0, dy: 0 }
    case 'zoom-out':
      return { scale: 1.18 - eased * 0.16, dx: 0, dy: 0 }
    case 'pan-left':
      return { scale: 1.16, dx: (0.5 - eased) * 0.1, dy: 0 }
    case 'pan-right':
      return { scale: 1.16, dx: (eased - 0.5) * 0.1, dy: 0 }
    case 'ken-burns':
      return { scale: 1.06 + eased * 0.1, dx: (eased - 0.5) * 0.05, dy: (0.5 - eased) * 0.04 }
    case 'static':
    default:
      return { scale: 1.02, dx: 0, dy: 0 }
  }
}

/** Draws an image so it covers the frame, applying the camera transform. */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  t: Transform,
): void {
  const scale = t.scale
  const coverScale = Math.max(width / img.width, height / img.height) * scale
  const w = img.width * coverScale
  const h = img.height * coverScale
  const x = (width - w) / 2 + t.dx * width
  const y = (height - h) / 2 + t.dy * height
  ctx.drawImage(img, x, y, w, h)
}

export interface SceneFrame {
  scene: Scene
  image: HTMLImageElement | null
  progress: number
}

/** Draws one scene's visual layer (no subtitles) filling the canvas. */
export function drawSceneVisual(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frame: SceneFrame,
): void {
  const { scene, image, progress } = frame
  const t = cameraTransform(scene.camera, progress)

  ctx.save()
  if (image) {
    drawCover(ctx, image, width, height, t)
  } else {
    // Procedural artwork is drawn directly, then nudged by the camera transform.
    ctx.translate(width / 2, height / 2)
    ctx.scale(t.scale, t.scale)
    ctx.translate(-width / 2 + t.dx * width, -height / 2 + t.dy * height)
    drawProcedural(ctx, width, height, scene.visual.seed, scene.visual.palette)
  }
  ctx.restore()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  if (line) lines.push(line)
  return lines
}

/** Draws the scene's on-screen text overlay with fade in/out. */
export function drawOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Scene,
  progress: number,
): void {
  if (!scene.overlay.trim()) return
  const fade = 0.12
  let alpha = 1
  if (progress < fade) alpha = progress / fade
  else if (progress > 1 - fade) alpha = (1 - progress) / fade
  alpha = Math.min(1, Math.max(0, alpha))
  if (alpha <= 0.01) return

  const fontSize = Math.round(height * 0.052)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = `700 ${fontSize}px Fraunces, Georgia, serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const maxWidth = width * 0.72
  const lines = wrapText(ctx, scene.overlay, maxWidth)
  const lineHeight = fontSize * 1.18
  const baseY = height * 0.82 - (lines.length - 1) * lineHeight

  const gradient = ctx.createLinearGradient(0, baseY - fontSize, width * 0.6, baseY)
  gradient.addColorStop(0, '#FFE6AC')
  gradient.addColorStop(1, '#FFFFFF')

  lines.forEach((line, i) => {
    const y = baseY + i * lineHeight
    ctx.lineWidth = fontSize * 0.16
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'
    ctx.strokeText(line, width * 0.08, y)
    ctx.fillStyle = gradient
    ctx.fillText(line, width * 0.08, y)
  })
  ctx.restore()
}

/** Draws a subtitle cue according to the project's subtitle style. */
export function drawSubtitles(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cue: Cue | null,
  style: SubtitleStyle,
): void {
  if (!cue || !cue.text.trim()) return

  const fontSize = Math.round(height * 0.042 * style.scale)
  ctx.save()
  ctx.font = `${style.bold ? '700' : '500'} ${fontSize}px ${style.fontFamily}, Inter, system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxWidth = width * 0.8
  const lines = wrapText(ctx, cue.text, maxWidth)
  const lineHeight = fontSize * 1.3
  const blockHeight = lines.length * lineHeight

  const yCenter =
    style.position === 'top' ? height * 0.14 : style.position === 'center' ? height * 0.5 : height * 0.87
  const startY = yCenter - blockHeight / 2 + lineHeight / 2

  if (style.background) {
    const padX = fontSize * 0.7
    const padY = fontSize * 0.42
    let widest = 0
    lines.forEach((l) => {
      widest = Math.max(widest, ctx.measureText(l).width)
    })
    const boxW = Math.min(maxWidth, widest) + padX * 2
    const boxH = blockHeight + padY * 2
    const boxX = (width - boxW) / 2
    const boxY = startY - lineHeight / 2 - padY
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    const r = fontSize * 0.35
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, boxW, boxH, r)
    ctx.fill()
  }

  lines.forEach((line, i) => {
    const y = startY + i * lineHeight
    if (!style.background) {
      ctx.lineWidth = fontSize * 0.2
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'
      ctx.strokeText(line, width / 2, y)
    }
    ctx.fillStyle = style.color
    ctx.fillText(line, width / 2, y)
  })
  ctx.restore()
}

/**
 * Composites a transition from the outgoing frame (already drawn into
 * `offCtx`) onto the incoming frame currently on `ctx`.
 */
export function applyTransition(
  ctx: CanvasRenderingContext2D,
  offCtx: CanvasRenderingContext2D,
  width: number,
  height: number,
  kind: Transition,
  t: number,
): void {
  const p = Math.min(1, Math.max(0, t))
  ctx.save()
  switch (kind) {
    case 'cut':
      break
    case 'fade': {
      ctx.globalAlpha = 1 - p
      ctx.drawImage(offCtx.canvas, 0, 0, width, height)
      break
    }
    case 'dissolve': {
      // Cross-dissolve with a soft luminance ramp.
      ctx.globalAlpha = 1 - p * p
      ctx.drawImage(offCtx.canvas, 0, 0, width, height)
      break
    }
    case 'slide-left': {
      ctx.drawImage(offCtx.canvas, -p * width, 0, width, height)
      break
    }
    case 'slide-right': {
      ctx.drawImage(offCtx.canvas, p * width, 0, width, height)
      break
    }
    case 'zoom': {
      const scale = 1 + p * 0.35
      const w = width * scale
      const h = height * scale
      ctx.globalAlpha = 1 - p
      ctx.drawImage(offCtx.canvas, (width - w) / 2, (height - h) / 2, w, h)
      break
    }
    default:
      break
  }
  ctx.restore()
}
