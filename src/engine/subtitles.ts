import { estimateSpeechSeconds, formatSrtTime } from '../lib/format'
import type { Cue, LanguageCode, Scene } from '../lib/types'
import { uid } from '../lib/utils'

/**
 * Subtitle generation. Cues are derived from each scene's narration and
 * distributed across that scene's duration in proportion to how long each
 * fragment takes to speak, so timing stays believable at any reading speed.
 */

const MAX_CHARS = 84

/** Splits narration into caption-sized fragments on sentence, then clause, then word boundaries. */
export function splitIntoChunks(text: string, maxChars = MAX_CHARS): string[] {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return []
  if (clean.length <= maxChars) return [clean]

  const sentences = clean.match(/[^.!?।]+[.!?।]?/g) ?? [clean]
  const chunks: string[] = []

  for (const sentence of sentences) {
    const s = sentence.trim()
    if (!s) continue
    if (s.length <= maxChars) {
      chunks.push(s)
      continue
    }
    // Break long sentences on commas / conjunctions, then on word count.
    const parts = s.split(/(?<=[,;:—])\s+/)
    for (const part of parts) {
      const p = part.trim()
      if (!p) continue
      if (p.length <= maxChars) {
        chunks.push(p)
        continue
      }
      const words = p.split(' ')
      let line = ''
      for (const w of words) {
        if ((line + ' ' + w).trim().length > maxChars) {
          if (line) chunks.push(line.trim())
          line = w
        } else {
          line = `${line} ${w}`.trim()
        }
      }
      if (line) chunks.push(line.trim())
    }
  }
  return chunks.length ? chunks : [clean]
}

/**
 * Builds a full subtitle track from the storyboard. Scene start times are the
 * running sum of durations; each fragment's slice is proportional to its
 * estimated speech time.
 */
export function buildCues(scenes: Scene[], language: LanguageCode): Cue[] {
  const cues: Cue[] = []
  let cursor = 0

  for (const scene of scenes) {
    const chunks = splitIntoChunks(scene.narration)
    const start = cursor
    const end = cursor + scene.duration
    cursor = end

    if (chunks.length === 0) continue

    const weights = chunks.map((c) => estimateSpeechSeconds(c, language))
    const total = weights.reduce((a, b) => a + b, 0) || 1
    let t = start
    chunks.forEach((chunk, i) => {
      const span = (weights[i] / total) * (end - start)
      const cueStart = t
      const cueEnd = i === chunks.length - 1 ? end : t + span
      cues.push({ id: uid('cue'), start: cueStart, end: cueEnd, text: chunk })
      t = cueEnd
    })
  }

  return cues
}

export function cuesToSrt(cues: Cue[]): string {
  return cues
    .slice()
    .sort((a, b) => a.start - b.start)
    .map((cue, i) => {
      const text = cue.text.trim()
      return `${i + 1}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(cue.end)}\n${text}\n`
    })
    .join('\n')
}

/** Returns the cue active at `time`, if any. */
export function cueAt(cues: Cue[], time: number): Cue | null {
  for (const cue of cues) {
    if (time >= cue.start && time < cue.end) return cue
  }
  return null
}
