import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react'
import type { AspectRatio, Project } from '@/lib/types'
import { formatTime } from '@/lib/format'
import { buildTimeline, locate, activeTransition } from '@/engine/timeline'
import { applyTransition, drawOverlay, drawSceneVisual, drawSubtitles } from '@/engine/render'
import { cueAt } from '@/engine/subtitles'
import { loadImage } from '@/engine/visuals'
import { bcp47For, cancelSpeech, speechSupported, speak } from '@/engine/narration'
import { cn } from '@/lib/utils'

function canvasSize(aspect: AspectRatio): { width: number; height: number } {
  if (aspect === '9:16') return { width: 540, height: 960 }
  if (aspect === '1:1') return { width: 720, height: 720 }
  return { width: 960, height: 540 }
}

/**
 * The preview player. It draws through the exact same renderer the exporter
 * uses, so the preview and the rendered file cannot drift apart.
 */
export function PreviewPlayer({
  project,
  className,
  onTimeChange,
  onActiveSceneChange,
  showControls = true,
}: {
  project: Project
  className?: string
  onTimeChange?: (time: number) => void
  onActiveSceneChange?: (index: number) => void
  showControls?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const offRef = useRef<HTMLCanvasElement | null>(null)
  const imagesRef = useRef(new Map<string, HTMLImageElement>())
  const timeRef = useRef(0)
  const spokenSceneRef = useRef(-1)
  const lastReportRef = useRef(0)

  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [imagesVersion, setImagesVersion] = useState(0)

  const timeline = useMemo(() => buildTimeline(project.scenes), [project.scenes])
  const { width, height } = canvasSize(project.aspectRatio)

  const projectRef = useRef(project)
  projectRef.current = project
  const timelineRef = useRef(timeline)
  timelineRef.current = timeline

  const imageSignature = useMemo(
    () => project.scenes.map((s) => `${s.id}:${s.visual.dataUrl ? s.visual.dataUrl.length : 0}`).join('|'),
    [project.scenes],
  )

  // Preload image-backed scenes.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const map = new Map<string, HTMLImageElement>()
      for (const scene of project.scenes) {
        if (scene.visual.dataUrl) {
          try {
            map.set(scene.id, await loadImage(scene.visual.dataUrl))
          } catch {
            /* falls back to procedural artwork */
          }
        }
      }
      if (!cancelled) {
        imagesRef.current = map
        setImagesVersion((v) => v + 1)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [imageSignature, project.scenes])

  const draw = useCallback((t: number) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const tl = timelineRef.current
    const p = projectRef.current

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const located = locate(tl, t)
    if (!located) return

    const current = located.slot.scene
    drawSceneVisual(ctx, canvas.width, canvas.height, {
      scene: current,
      image: imagesRef.current.get(current.id) ?? null,
      progress: located.progress,
    })

    const trans = activeTransition(tl, t)
    const off = offRef.current
    const offCtx = off?.getContext('2d')
    if (trans && off && offCtx) {
      const prev = tl.slots[trans.fromIndex].scene
      offCtx.clearRect(0, 0, off.width, off.height)
      drawSceneVisual(offCtx, off.width, off.height, {
        scene: prev,
        image: imagesRef.current.get(prev.id) ?? null,
        progress: 1,
      })
      applyTransition(ctx, offCtx, canvas.width, canvas.height, trans.kind, trans.t)
    }

    drawOverlay(ctx, canvas.width, canvas.height, current, located.progress)
    drawSubtitles(ctx, canvas.width, canvas.height, cueAt(p.cues, t), p.subtitleStyle)
  }, [])

  // Redraw whenever the frame should change while paused.
  useEffect(() => {
    if (playing) return
    draw(time)
  }, [playing, time, draw, imagesVersion, project.subtitleStyle, project.cues, project.aspectRatio])

  const stop = useCallback(() => {
    setPlaying(false)
    cancelSpeech()
    spokenSceneRef.current = -1
  }, [])

  // Playback clock.
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(0.25, (now - last) / 1000)
      last = now
      const tl = timelineRef.current
      let t = timeRef.current + dt

      if (t >= tl.duration) {
        timeRef.current = tl.duration
        setTime(tl.duration)
        onTimeChange?.(tl.duration)
        stop()
        return
      }

      timeRef.current = t
      setTime(t)
      draw(t)

      if (now - lastReportRef.current > 100) {
        lastReportRef.current = now
        onTimeChange?.(t)
      }

      const located = locate(tl, t)
      if (located && located.slot.index !== spokenSceneRef.current) {
        spokenSceneRef.current = located.slot.index
        onActiveSceneChange?.(located.slot.index)
        const scene = located.slot.scene
        if (scene.narration.trim() && !scene.audio) {
          void speak(scene.narration, {
            voiceURI: projectRef.current.narration.voiceURI,
            lang: bcp47For(projectRef.current.language),
            rate: projectRef.current.narration.rate,
            pitch: projectRef.current.narration.pitch,
            volume: projectRef.current.narration.volume,
          })
        }
      }

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [playing, draw, onTimeChange, onActiveSceneChange, stop])

  // Always stop speech if the component unmounts mid-playback.
  useEffect(() => () => cancelSpeech(), [])

  const seek = (next: number) => {
    const clamped = Math.max(0, Math.min(next, timeline.duration))
    timeRef.current = clamped
    setTime(clamped)
    spokenSceneRef.current = -1
    onTimeChange?.(clamped)
    cancelSpeech()
    draw(clamped)
  }

  const toggle = () => {
    if (playing) {
      stop()
      return
    }
    if (timeRef.current >= timeline.duration - 0.05) seek(0)
    setPlaying(true)
  }

  const activeIndex = locate(timeline, time)?.slot.index ?? 0

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-black">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="block h-auto w-full"
          aria-label="Documentary preview"
        />
        <canvas ref={offRef} width={width} height={height} className="hidden" aria-hidden="true" />
        {!project.scenes.length && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
            No scenes yet
          </div>
        )}
      </div>

      {showControls && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause preview' : 'Play preview'}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-gradient text-ink-950 shadow-glow-sm transition-transform hover:scale-105 active:scale-95"
          >
            {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
          </button>

          <button
            type="button"
            onClick={() => seek(0)}
            aria-label="Restart preview"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition-colors hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <input
            type="range"
            min={0}
            max={Math.max(0.1, timeline.duration)}
            step={0.05}
            value={time}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek preview"
            className="flex-1"
          />

          <span className="w-20 shrink-0 text-right font-mono text-xs text-slate-400">
            {formatTime(time)} / {formatTime(timeline.duration)}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
          {speechSupported()
            ? 'Voiceover previews with your device voices'
            : 'Speech synthesis unavailable in this browser'}
        </span>
        <span>
          Scene {Math.min(activeIndex + 1, project.scenes.length)} of {project.scenes.length}
        </span>
      </div>
    </div>
  )
}
