import type { AspectRatio, Project } from '../lib/types'
import { slugify } from '../lib/format'
import { buildAudioPlan, scheduleAudio } from './audio'
import { applyTransition, drawOverlay, drawSceneVisual, drawSubtitles } from './render'
import { cueAt } from './subtitles'
import { activeTransition, buildTimeline, locate } from './timeline'
import { loadImage } from './visuals'

/**
 * Video export.
 *
 * Frames are drawn to a canvas and captured in real time through
 * `canvas.captureStream()` + `MediaRecorder`, with any real audio the user has
 * supplied mixed in through Web Audio. This produces an actual downloadable
 * video file. Because capture is real-time, an export takes about as long as
 * the documentary itself — progress and cancellation are provided.
 *
 * MP4 is offered only when the browser's MediaRecorder genuinely supports it;
 * otherwise the export is WebM, and the UI says so rather than mislabelling it.
 */

export interface ExportOptions {
  project: Project
  resolution: '720p' | '1080p'
  fps?: number
  includeSubtitles: boolean
  onProgress?: (progress: number, stage: string) => void
  signal?: AbortSignal
}

export interface ExportResult {
  blob: Blob
  mimeType: string
  extension: string
  filename: string
  width: number
  height: number
  duration: number
  hasAudio: boolean
}

const CANDIDATE_TYPES: { mime: string; extension: string }[] = [
  { mime: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
  { mime: 'video/mp4', extension: 'mp4' },
  { mime: 'video/webm;codecs=vp9,opus', extension: 'webm' },
  { mime: 'video/webm;codecs=vp8,opus', extension: 'webm' },
  { mime: 'video/webm', extension: 'webm' },
]

export function recorderSupported(): boolean {
  return typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
}

export function pickRecorderMime(): { mime: string; extension: string } | null {
  if (!recorderSupported()) return null
  for (const candidate of CANDIDATE_TYPES) {
    try {
      if (MediaRecorder.isTypeSupported(candidate.mime)) return candidate
    } catch {
      // ignore and try the next candidate
    }
  }
  return null
}

function outputSize(aspect: AspectRatio, resolution: '720p' | '1080p'): { width: number; height: number } {
  const short = resolution === '1080p' ? 1080 : 720
  if (aspect === '9:16') return { width: short, height: Math.round((short * 16) / 9) }
  if (aspect === '1:1') return { width: short, height: short }
  return { width: Math.round((short * 16) / 9), height: short }
}

export async function exportVideo(options: ExportOptions): Promise<ExportResult> {
  const { project, resolution, includeSubtitles, onProgress, signal } = options
  const fps = options.fps ?? 30

  const chosen = pickRecorderMime()
  if (!chosen) {
    throw new Error('This browser cannot record video (MediaRecorder / captureStream unavailable).')
  }

  const timeline = buildTimeline(project.scenes)
  if (timeline.duration <= 0) throw new Error('There is nothing to export — the timeline is empty.')

  const { width, height } = outputSize(project.aspectRatio, resolution)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not create the rendering canvas.')

  const offscreen = document.createElement('canvas')
  offscreen.width = width
  offscreen.height = height
  const offCtx = offscreen.getContext('2d')

  onProgress?.(0.02, 'Preparing assets')

  // Preload every image-backed scene once.
  const images = new Map<string, HTMLImageElement>()
  for (const scene of project.scenes) {
    if (scene.visual.kind !== 'procedural' && scene.visual.dataUrl) {
      try {
        images.set(scene.id, await loadImage(scene.visual.dataUrl))
      } catch {
        images.set(scene.id, undefined as unknown as HTMLImageElement)
      }
    }
  }

  onProgress?.(0.05, 'Mixing audio')
  const audioCtx = new AudioContext()
  const plan = await buildAudioPlan(project, audioCtx)
  const audioDest = audioCtx.createMediaStreamDestination()
  const hasAudio = plan.hasAnyAudio

  const videoStream = canvas.captureStream(fps)
  const combined = new MediaStream()
  videoStream.getVideoTracks().forEach((t) => combined.addTrack(t))
  if (hasAudio) audioDest.stream.getAudioTracks().forEach((t) => combined.addTrack(t))

  const recorder = new MediaRecorder(combined, {
    mimeType: chosen.mime,
    videoBitsPerSecond: resolution === '1080p' ? 8_000_000 : 4_500_000,
  })

  const chunks: BlobPart[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const stopped = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve()
  })

  const renderAt = (time: number) => {
    const located = locate(timeline, time)
    if (!located) return
    const { slot, progress } = located
    const current = slot.scene

    ctx.clearRect(0, 0, width, height)
    drawSceneVisual(ctx, width, height, {
      scene: current,
      image: images.get(current.id) ?? null,
      progress,
    })

    const trans = activeTransition(timeline, time)
    if (trans && offCtx) {
      const prev = timeline.slots[trans.fromIndex].scene
      offCtx.clearRect(0, 0, width, height)
      drawSceneVisual(offCtx, width, height, {
        scene: prev,
        image: images.get(prev.id) ?? null,
        progress: 1,
      })
      applyTransition(ctx, offCtx, width, height, trans.kind, trans.t)
    }

    drawOverlay(ctx, width, height, current, progress)
    if (includeSubtitles) {
      drawSubtitles(ctx, width, height, cueAt(project.cues, time), project.subtitleStyle)
    }
  }

  // Prime the first frame before capture begins.
  renderAt(0)

  recorder.start(300)
  await audioCtx.resume()
  const startClock = audioCtx.currentTime + 0.15
  if (hasAudio) scheduleAudio(audioCtx, plan, audioDest, startClock)

  const startedAt = performance.now()
  let aborted = false

  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      aborted = true
    }
    signal?.addEventListener('abort', onAbort)

    const tick = () => {
      if (aborted) {
        signal?.removeEventListener('abort', onAbort)
        reject(new DOMException('Export cancelled', 'AbortError'))
        return
      }
      const elapsed = (performance.now() - startedAt) / 1000
      if (elapsed >= timeline.duration) {
        signal?.removeEventListener('abort', onAbort)
        resolve()
        return
      }
      renderAt(elapsed)
      onProgress?.(0.05 + (elapsed / timeline.duration) * 0.9, 'Rendering')
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }).catch((err) => {
    try {
      recorder.stop()
    } catch {
      /* already stopped */
    }
    audioCtx.close().catch(() => undefined)
    throw err
  })

  recorder.stop()
  await stopped
  onProgress?.(0.98, 'Finalising')
  audioCtx.close().catch(() => undefined)

  const blob = new Blob(chunks, { type: chosen.mime })
  if (blob.size === 0) {
    throw new Error('The recording produced no data. Please try again.')
  }

  const filename = `${slugify(project.name)}-${resolution}.${chosen.extension}`
  onProgress?.(1, 'Done')

  return {
    blob,
    mimeType: chosen.mime,
    extension: chosen.extension,
    filename,
    width,
    height,
    duration: timeline.duration,
    hasAudio,
  }
}
