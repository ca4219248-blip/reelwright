/** mm:ss for UI display. */
export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

/** HH:MM:SS,mmm — the SRT timestamp format. */
export function formatSrtTime(seconds: number): string {
  const clamped = Math.max(0, seconds)
  const ms = Math.round((clamped - Math.floor(clamped)) * 1000)
  const total = Math.floor(clamped)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(
    ms,
  ).padStart(3, '0')}`
}

/** Human summary like "12 scenes · 4:30". */
export function summarise(totalScenes: number, totalSeconds: number): string {
  return `${totalScenes} ${totalScenes === 1 ? 'scene' : 'scenes'} · ${formatTime(totalSeconds)}`
}

export function totalDuration(scenes: { duration: number }[]): number {
  return scenes.reduce((sum, s) => sum + s.duration, 0)
}

/** Word count helper used to estimate narration length. */
export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

/**
 * Rough spoken duration for a block of narration. Uses ~150 words/min for
 * English and a slightly lower rate for Indic languages, which is close to a
 * natural documentary pace.
 */
export function estimateSpeechSeconds(text: string, language = 'en'): number {
  const wpm = language === 'en' ? 150 : 130
  return Math.max(1.5, (wordCount(text) / wpm) * 60)
}

export function download(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'documentary'
  )
}
