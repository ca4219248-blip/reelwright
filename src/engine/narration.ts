import type { LanguageCode } from '../lib/types'
import { LANGUAGES } from '../lib/types'

/**
 * Narration via the browser's built-in SpeechSynthesis API. This produces real
 * audible speech using voices installed on the user's device — no API key and
 * no network call. Cloud TTS voices would require a provider key and are
 * therefore not offered here.
 */

export function speechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function bcp47For(language: LanguageCode): string {
  return LANGUAGES.find((l) => l.code === language)?.bcp47 ?? 'en-US'
}

/** Voices populate asynchronously in most browsers. */
export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!speechSupported()) {
      resolve([])
      return
    }
    const existing = window.speechSynthesis.getVoices()
    if (existing.length > 0) {
      resolve(existing)
      return
    }
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      resolve(window.speechSynthesis.getVoices())
    }
    window.speechSynthesis.onvoiceschanged = finish
    setTimeout(finish, 1200)
  })
}

/**
 * Voices matching a language, falling back to a language-prefix match and then
 * to every available voice so the user always has something selectable.
 */
export function voicesForLanguage(voices: SpeechSynthesisVoice[], language: LanguageCode): SpeechSynthesisVoice[] {
  const bcp47 = bcp47For(language)
  const prefix = bcp47.split('-')[0]
  const exact = voices.filter((v) => v.lang.replace('_', '-').toLowerCase() === bcp47.toLowerCase())
  if (exact.length) return exact
  const byPrefix = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith(prefix))
  if (byPrefix.length) return byPrefix
  return voices
}

let currentUtterance: SpeechSynthesisUtterance | null = null

export interface SpeakOptions {
  voiceURI?: string | null
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

export function cancelSpeech(): void {
  if (!speechSupported()) return
  currentUtterance = null
  window.speechSynthesis.cancel()
}

/** Speaks `text` and resolves when the utterance finishes (or is cancelled). */
export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!speechSupported() || !text.trim()) {
      resolve()
      return
    }
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options.rate ?? 1
    utterance.pitch = options.pitch ?? 1
    utterance.volume = options.volume ?? 1
    if (options.lang) utterance.lang = options.lang

    if (options.voiceURI) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === options.voiceURI)
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang
      }
    }

    const done = () => {
      if (currentUtterance === utterance) currentUtterance = null
      resolve()
    }
    utterance.onend = done
    utterance.onerror = done

    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
  })
}

export function isSpeaking(): boolean {
  return speechSupported() && window.speechSynthesis.speaking
}
