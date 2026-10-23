import type { Scene, Transition } from '../lib/types'

/**
 * Shared timeline maths used by the preview player and the exporter, so what
 * you preview is exactly what you export.
 */

export interface TimelineSlot {
  scene: Scene
  index: number
  start: number
  end: number
}

export interface Timeline {
  slots: TimelineSlot[]
  duration: number
}

/** Transition length in seconds, clamped per-scene for very short scenes. */
export const TRANSITION_SECONDS = 0.7

export function buildTimeline(scenes: Scene[]): Timeline {
  let cursor = 0
  const slots = scenes.map((scene, index) => {
    const start = cursor
    cursor += scene.duration
    return { scene, index, start, end: cursor }
  })
  return { slots, duration: cursor }
}

export interface Located {
  slot: TimelineSlot
  progress: number
  localTime: number
}

export function locate(timeline: Timeline, time: number): Located | null {
  if (!timeline.slots.length) return null
  const t = Math.max(0, Math.min(time, timeline.duration - 0.0001))
  const slot = timeline.slots.find((s) => t >= s.start && t < s.end) ?? timeline.slots[timeline.slots.length - 1]
  const localTime = t - slot.start
  const progress = slot.scene.duration > 0 ? Math.min(1, Math.max(0, localTime / slot.scene.duration)) : 0
  return { slot, progress, localTime }
}

export interface ActiveTransition {
  kind: Transition
  /** 0 → 1 across the transition. */
  t: number
  fromIndex: number
  toIndex: number
}

/** Returns the transition currently in progress, if any. */
export function activeTransition(timeline: Timeline, time: number): ActiveTransition | null {
  const located = locate(timeline, time)
  if (!located || located.slot.index === 0) return null
  const duration = Math.min(TRANSITION_SECONDS, located.slot.scene.duration * 0.4)
  if (located.localTime >= duration) return null
  return {
    kind: located.slot.scene.transition,
    t: duration > 0 ? located.localTime / duration : 1,
    fromIndex: located.slot.index - 1,
    toIndex: located.slot.index,
  }
}
