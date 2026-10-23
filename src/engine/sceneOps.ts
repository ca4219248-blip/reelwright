import type { Project, Scene } from '../lib/types'
import { hashString, uid } from '../lib/utils'
import { paletteForStyle } from './script'
import { buildCues } from './subtitles'
import { estimateSpeechSeconds } from '../lib/format'

/**
 * Pure scene operations. Every helper returns a new scenes array, and
 * `withScenes` rebuilds the subtitle track so cues never drift from the
 * narration they were generated from.
 */

export function makeScene(project: Project, index: number): Scene {
  const seed = hashString(`${project.id}|${index}|${Date.now()}`)
  const palette = paletteForStyle(project.style, seed)
  return {
    id: uid('scene'),
    title: `Scene ${index + 1}`,
    narration: '',
    visualPrompt: `${project.topic} — scene ${index + 1}`,
    camera: 'ken-burns',
    transition: index === 0 ? 'cut' : 'fade',
    duration: 20,
    overlay: '',
    visual: { kind: 'procedural', prompt: project.topic, seed, palette },
    audio: null,
  }
}

export function updateScene(scenes: Scene[], id: string, patch: Partial<Scene>): Scene[] {
  return scenes.map((s) => (s.id === id ? { ...s, ...patch } : s))
}

export function moveScene(scenes: Scene[], id: string, direction: -1 | 1): Scene[] {
  const index = scenes.findIndex((s) => s.id === id)
  if (index < 0) return scenes
  const target = index + direction
  if (target < 0 || target >= scenes.length) return scenes
  const next = scenes.slice()
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

export function duplicateScene(scenes: Scene[], id: string): Scene[] {
  const index = scenes.findIndex((s) => s.id === id)
  if (index < 0) return scenes
  const source = scenes[index]
  const copy: Scene = {
    ...structuredClone(source),
    id: uid('scene'),
    title: `${source.title} (copy)`,
    transition: 'fade',
  }
  const next = scenes.slice()
  next.splice(index + 1, 0, copy)
  return next
}

export function deleteScene(scenes: Scene[], id: string): Scene[] {
  if (scenes.length <= 1) return scenes
  return scenes.filter((s) => s.id !== id)
}

/** Sets each scene's duration to how long its narration actually takes to speak. */
export function fitDurationsToNarration(scenes: Scene[], language: Project['language']): Scene[] {
  return scenes.map((scene) => {
    if (!scene.narration.trim()) return scene
    const seconds = Math.max(4, Math.round(estimateSpeechSeconds(scene.narration, language) + 1.5))
    return { ...scene, duration: seconds }
  })
}

/** Applies a new scenes array and rebuilds the cue track in one step. */
export function withScenes(project: Project, scenes: Scene[]): Project {
  return {
    ...project,
    scenes,
    cues: buildCues(scenes, project.language),
    status: project.status === 'exported' ? 'storyboard-ready' : project.status,
  }
}

export function regenerateCues(project: Project): Project {
  return { ...project, cues: buildCues(project.scenes, project.language) }
}
