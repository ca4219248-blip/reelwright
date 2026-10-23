import type { Project } from '../lib/types'
import { totalDuration } from '../lib/format'

/**
 * Audio graph for playback and export.
 *
 * Only real audio the user has supplied can be mixed — uploaded scene
 * narration and an uploaded music bed. Browser speech synthesis cannot be
 * captured into a MediaStream, so TTS narration is preview-only; this
 * limitation is surfaced in the UI rather than papered over.
 */

export interface SceneAudioClip {
  start: number
  buffer: AudioBuffer
  volume: number
}

export interface AudioPlan {
  music: {
    buffer: AudioBuffer
    volume: number
    fadeIn: number
    fadeOut: number
    duck: boolean
  } | null
  sceneClips: SceneAudioClip[]
  narrationWindows: { start: number; end: number }[]
  duration: number
  hasAnyAudio: boolean
}

export async function decodeDataUrl(ctx: AudioContext, dataUrl: string): Promise<AudioBuffer> {
  const res = await fetch(dataUrl)
  const arrayBuffer = await res.arrayBuffer()
  return await ctx.decodeAudioData(arrayBuffer)
}

export async function buildAudioPlan(project: Project, ctx: AudioContext): Promise<AudioPlan> {
  const duration = totalDuration(project.scenes)
  const sceneClips: SceneAudioClip[] = []
  const narrationWindows: { start: number; end: number }[] = []
  let cursor = 0

  for (const scene of project.scenes) {
    if (scene.audio?.dataUrl) {
      try {
        const buffer = await decodeDataUrl(ctx, scene.audio.dataUrl)
        sceneClips.push({ start: cursor, buffer, volume: scene.audio.volume })
        narrationWindows.push({ start: cursor, end: cursor + Math.min(buffer.duration, scene.duration) })
      } catch {
        // Skip unreadable audio rather than failing the whole export.
      }
    }
    cursor += scene.duration
  }

  let music: AudioPlan['music'] = null
  if (project.music?.dataUrl) {
    try {
      const buffer = await decodeDataUrl(ctx, project.music.dataUrl)
      music = {
        buffer,
        volume: project.music.volume,
        fadeIn: project.music.fadeIn,
        fadeOut: project.music.fadeOut,
        duck: project.music.duckUnderNarration,
      }
    } catch {
      music = null
    }
  }

  return {
    music,
    sceneClips,
    narrationWindows,
    duration,
    hasAnyAudio: sceneClips.length > 0 || music !== null,
  }
}

/**
 * Schedules the plan onto `destination`, starting at `startTime` on the
 * AudioContext clock. Music loops to fill the timeline and ducks under any
 * narration windows.
 */
export function scheduleAudio(
  ctx: AudioContext,
  plan: AudioPlan,
  destination: AudioNode,
  startTime: number,
): void {
  const master = ctx.createGain()
  master.gain.value = 1
  master.connect(destination)

  if (plan.music) {
    const { buffer, volume, fadeIn, fadeOut, duck } = plan.music
    const gain = ctx.createGain()
    gain.connect(master)

    const base = Math.max(0, Math.min(1, volume))
    const t0 = startTime
    const t1 = startTime + plan.duration
    const fi = Math.max(0, Math.min(fadeIn, plan.duration / 2))
    const fo = Math.max(0, Math.min(fadeOut, plan.duration / 2))

    gain.gain.setValueAtTime(fi > 0 ? 0 : base, t0)
    if (fi > 0) gain.gain.linearRampToValueAtTime(base, t0 + fi)

    if (duck && plan.narrationWindows.length) {
      for (const w of plan.narrationWindows) {
        const ws = Math.max(t0, startTime + w.start)
        const we = Math.min(t1, startTime + w.end)
        if (we <= ws) continue
        gain.gain.setTargetAtTime(base * 0.32, ws, 0.25)
        gain.gain.setTargetAtTime(base, we, 0.35)
      }
    }

    if (fo > 0) {
      gain.gain.setValueAtTime(base, Math.max(t0, t1 - fo))
      gain.gain.linearRampToValueAtTime(0, t1)
    }

    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.loop = buffer.duration < plan.duration
    source.connect(gain)
    source.start(t0)
    source.stop(t1 + 0.05)
  }

  for (const clip of plan.sceneClips) {
    const gain = ctx.createGain()
    gain.gain.value = Math.max(0, Math.min(1, clip.volume))
    gain.connect(master)
    const source = ctx.createBufferSource()
    source.buffer = clip.buffer
    source.connect(gain)
    source.start(startTime + clip.start)
  }
}
