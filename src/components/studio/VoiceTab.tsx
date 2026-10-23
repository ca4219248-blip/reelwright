import { useEffect, useState } from 'react'
import { Mic, Play, Square, Trash2, Upload, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Select } from '@/components/ui/primitives'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/toast'
import { useAppStore } from '@/store/AppStore'
import {
  bcp47For,
  cancelSpeech,
  getVoices,
  speechSupported,
  speak,
  voicesForLanguage,
} from '@/engine/narration'
import { blobToDataUrl } from '@/engine/visuals'
import { updateScene, withScenes } from '@/engine/sceneOps'
import type { Project, Scene } from '@/lib/types'

/**
 * Voice tab. Narration previews through the device's own speech synthesis
 * (real audio, no key), and any scene can carry an uploaded narration track
 * which *is* included in the exported video.
 */
export function VoiceTab({ project, update }: { project: Project; update: (u: (p: Project) => Project) => void }) {
  const { settings } = useAppStore()
  const { push } = useToast()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    void getVoices().then(setVoices)
  }, [])

  const languageVoices = voicesForLanguage(voices, project.language)
  const selectedVoice =
    project.narration.voiceURI ?? settings.defaultVoiceURI ?? languageVoices[0]?.voiceURI ?? null

  const setNarration = (patch: Partial<Project['narration']>) =>
    update((p) => ({ ...p, narration: { ...p.narration, ...patch } }))

  const speakScene = (scene: Scene) => {
    cancelSpeech()
    setPlaying(true)
    void speak(scene.narration, {
      voiceURI: selectedVoice,
      lang: bcp47For(project.language),
      rate: project.narration.rate,
      pitch: project.narration.pitch,
      volume: project.narration.volume,
    }).then(() => setPlaying(false))
  }

  const speakAll = async () => {
    if (!speechSupported()) return
    setPlaying(true)
    for (const scene of project.scenes) {
      if (!scene.narration.trim()) continue
      // eslint-disable-next-line no-await-in-loop
      await speak(scene.narration, {
        voiceURI: selectedVoice,
        lang: bcp47For(project.language),
        rate: project.narration.rate,
        pitch: project.narration.pitch,
        volume: project.narration.volume,
      })
    }
    setPlaying(false)
  }

  const stop = () => {
    cancelSpeech()
    setPlaying(false)
  }

  const uploadAudio = async (scene: Scene, file: File) => {
    try {
      const dataUrl = await blobToDataUrl(file)
      update((p) => withScenes(p, updateScene(p.scenes, scene.id, { audio: { name: file.name, dataUrl, volume: 1 } })))
      push({ kind: 'success', title: 'Narration audio attached', description: file.name })
    } catch {
      push({ kind: 'error', title: 'Could not read that audio file' })
    }
  }

  const uploadedCount = project.scenes.filter((s) => s.audio).length

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="space-y-4">
        {project.scenes.map((scene, index) => (
          <div key={scene.id} className="panel p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">
                  Scene {String(index + 1).padStart(2, '0')} · {scene.duration}s
                </p>
                <h3 className="mt-1 truncate font-display text-sm font-semibold text-white">{scene.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => speakScene(scene)}
                  disabled={!scene.narration.trim() || !speechSupported()}
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  Preview
                </Button>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-slate-300 transition-colors hover:border-white/25 hover:text-white">
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  {scene.audio ? 'Replace audio' : 'Upload audio'}
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) void uploadAudio(scene, file)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            </div>

            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400">
              {scene.narration || <span className="italic text-slate-600">No narration for this scene.</span>}
            </p>

            {scene.audio && (
              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-4">
                <p className="flex items-center gap-2 text-xs text-teal-300">
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {scene.audio.name}
                </p>
                <div className="min-w-[10rem] flex-1">
                  <Slider
                    label="Scene audio level"
                    value={scene.audio.volume}
                    onChange={(v) =>
                      update((p) =>
                        withScenes(
                          p,
                          updateScene(p.scenes, scene.id, {
                            audio: scene.audio ? { ...scene.audio, volume: v } : null,
                          }),
                        ),
                      )
                    }
                    displayValue={`${Math.round(scene.audio.volume * 100)}%`}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-record-400 hover:bg-record-500/10"
                  onClick={() =>
                    update((p) => withScenes(p, updateScene(p.scenes, scene.id, { audio: null })))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Narration settings */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="gradient-border glass rounded-3xl p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <Mic className="h-4 w-4 text-gold-300" aria-hidden="true" />
            Narration voice
          </h2>

          {speechSupported() ? (
            <>
              <div className="mt-4 space-y-4">
                <Field
                  label="Voice"
                  hint={`${languageVoices.length} voices match ${project.language.toUpperCase()}. Voices come from your device.`}
                >
                  <Select
                    aria-label="Narration voice"
                    value={selectedVoice ?? ''}
                    onChange={(e) => setNarration({ voiceURI: e.target.value || null })}
                    options={[
                      { value: '', label: 'Automatic' },
                      ...languageVoices.map((v) => ({ value: v.voiceURI, label: `${v.name} — ${v.lang}` })),
                    ]}
                  />
                </Field>

                <Slider
                  label="Speed"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={project.narration.rate}
                  onChange={(v) => setNarration({ rate: v })}
                  displayValue={`${project.narration.rate.toFixed(2)}×`}
                />
                <Slider
                  label="Pitch"
                  min={0.5}
                  max={1.6}
                  step={0.05}
                  value={project.narration.pitch}
                  onChange={(v) => setNarration({ pitch: v })}
                  displayValue={project.narration.pitch.toFixed(2)}
                />
                <Slider
                  label="Volume"
                  min={0}
                  max={1}
                  step={0.05}
                  value={project.narration.volume}
                  onChange={(v) => setNarration({ volume: v })}
                  displayValue={`${Math.round(project.narration.volume * 100)}%`}
                />

                <div className="flex gap-2 pt-1">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={speakAll} disabled={playing}>
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    Play all
                  </Button>
                  <Button variant="ghost" size="sm" onClick={stop} disabled={!playing}>
                    <Square className="h-3.5 w-3.5" aria-hidden="true" />
                    Stop
                  </Button>
                </div>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                Preview uses your device’s speech voices. Browsers do not let a page capture that audio into a file,
                so to include narration in the exported video, upload an audio file for the scene — {uploadedCount} of{' '}
                {project.scenes.length} scenes currently have one.
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              This browser does not expose speech synthesis. Upload narration audio per scene instead — uploaded audio
              is mixed into the exported video.
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="font-display text-sm font-semibold text-white">Included in export</h3>
          <ul className="mt-3 space-y-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden="true" />
              Uploaded scene narration
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" aria-hidden="true" />
              Background music
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400/70" aria-hidden="true" />
              Device-voice preview is not captured
            </li>
          </ul>
        </div>
      </aside>
    </div>
  )
}
