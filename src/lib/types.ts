export type LanguageCode = 'en' | 'hi' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'ar'

export interface LanguageOption {
  code: LanguageCode
  label: string
  native: string
  bcp47: string
  rtl?: boolean
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English', bcp47: 'en-US' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', bcp47: 'hi-IN' },
  { code: 'es', label: 'Spanish', native: 'Español', bcp47: 'es-ES' },
  { code: 'fr', label: 'French', native: 'Français', bcp47: 'fr-FR' },
  { code: 'de', label: 'German', native: 'Deutsch', bcp47: 'de-DE' },
  { code: 'pt', label: 'Portuguese', native: 'Português', bcp47: 'pt-BR' },
  { code: 'ja', label: 'Japanese', native: '日本語', bcp47: 'ja-JP' },
  { code: 'ar', label: 'Arabic', native: 'العربية', bcp47: 'ar-SA', rtl: true },
]

export type DocStyle =
  | 'cinematic'
  | 'historical'
  | 'educational'
  | 'scientific'
  | 'investigative'
  | 'nature'

export interface StyleOption {
  id: DocStyle
  label: string
  blurb: string
}

export const DOC_STYLES: StyleOption[] = [
  { id: 'cinematic', label: 'Cinematic', blurb: 'Sweeping, atmospheric, emotive' },
  { id: 'historical', label: 'Historical', blurb: 'Chronological, archival, measured' },
  { id: 'educational', label: 'Educational', blurb: 'Clear, structured, explanatory' },
  { id: 'scientific', label: 'Scientific', blurb: 'Evidence-led, precise, analytical' },
  { id: 'investigative', label: 'Investigative', blurb: 'Tension, questions, revelation' },
  { id: 'nature', label: 'Nature', blurb: 'Observational, patient, immersive' },
]

export type AspectRatio = '16:9' | '9:16' | '1:1'

export const ASPECT_RATIOS: { id: AspectRatio; label: string; w: number; h: number }[] = [
  { id: '16:9', label: 'Landscape', w: 16, h: 9 },
  { id: '9:16', label: 'Vertical', w: 9, h: 16 },
  { id: '1:1', label: 'Square', w: 1, h: 1 },
]

export type DurationMinutes = 1 | 3 | 5 | 10 | 15 | 30
export const DURATIONS: DurationMinutes[] = [1, 3, 5, 10, 15, 30]

export type CameraMove = 'static' | 'pan-left' | 'pan-right' | 'zoom-in' | 'zoom-out' | 'ken-burns'

export const CAMERA_MOVES: { id: CameraMove; label: string }[] = [
  { id: 'static', label: 'Static' },
  { id: 'pan-left', label: 'Pan left' },
  { id: 'pan-right', label: 'Pan right' },
  { id: 'zoom-in', label: 'Zoom in' },
  { id: 'zoom-out', label: 'Zoom out' },
  { id: 'ken-burns', label: 'Ken Burns' },
]

export type Transition = 'cut' | 'fade' | 'dissolve' | 'slide-left' | 'slide-right' | 'zoom'

export const TRANSITIONS: { id: Transition; label: string }[] = [
  { id: 'cut', label: 'Cut' },
  { id: 'fade', label: 'Fade' },
  { id: 'dissolve', label: 'Dissolve' },
  { id: 'slide-left', label: 'Slide left' },
  { id: 'slide-right', label: 'Slide right' },
  { id: 'zoom', label: 'Zoom' },
]

export type VisualKind = 'procedural' | 'ai' | 'upload'

export interface SceneVisual {
  kind: VisualKind
  /** Prompt used for generation, or a description of the uploaded asset. */
  prompt: string
  /** Persisted image (uploaded file, or a downloaded AI image) as a data URL. */
  dataUrl?: string
  /** Stable seed driving the procedural fallback. */
  seed: number
  /** Two-to-three hex colours driving the procedural gradient. */
  palette: string[]
}

export interface SceneAudio {
  name: string
  dataUrl: string
  volume: number
}

export interface Scene {
  id: string
  title: string
  /** Spoken narration for this scene. */
  narration: string
  /** Visual prompt used for storyboard generation. */
  visualPrompt: string
  camera: CameraMove
  /** Transition into this scene (ignored for the first scene). */
  transition: Transition
  /** Duration in seconds. */
  duration: number
  /** Optional on-screen text overlay. */
  overlay: string
  visual: SceneVisual
  /** Optional user-uploaded narration audio for this scene. */
  audio: SceneAudio | null
}

export interface SubtitleStyle {
  fontFamily: string
  /** Relative size, 0.6–1.6, scaled against the output height at render time. */
  scale: number
  color: string
  background: boolean
  position: 'top' | 'center' | 'bottom'
  bold: boolean
}

export interface Cue {
  id: string
  start: number
  end: number
  text: string
}

export interface MusicTrack {
  name: string
  dataUrl: string
  volume: number
  fadeIn: number
  fadeOut: number
  duckUnderNarration: boolean
}

export interface NarrationSettings {
  voiceURI: string | null
  rate: number
  pitch: number
  volume: number
}

export type ProjectStatus = 'draft' | 'script-ready' | 'storyboard-ready' | 'narrated' | 'exported'

export interface Project {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  /** Brief */
  topic: string
  language: LanguageCode
  style: DocStyle
  aspectRatio: AspectRatio
  targetDuration: DurationMinutes
  /** Generated script */
  title: string
  logline: string
  synopsis: string
  scenes: Scene[]
  /** Subtitle track */
  cues: Cue[]
  subtitleStyle: SubtitleStyle
  /** Audio */
  music: MusicTrack | null
  narration: NarrationSettings
  /** Meta */
  status: ProjectStatus
  generator: 'offline'
  exportedAt?: number
  lastExportName?: string
}

export interface AppSettings {
  /** How scene visuals are produced. */
  imageProvider: 'procedural' | 'keyless-ai'
  /** Model name for the keyless image service. */
  keylessImageModel: string
  /** Default narration voice. */
  defaultVoiceURI: string | null
}

export const DEFAULT_SETTINGS: AppSettings = {
  imageProvider: 'procedural',
  keylessImageModel: 'flux',
  defaultVoiceURI: null,
}

export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontFamily: 'Inter',
  scale: 1,
  color: '#FFFFFF',
  background: true,
  position: 'bottom',
  bold: true,
}
