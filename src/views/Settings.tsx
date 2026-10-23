import { useEffect, useState } from 'react'
import { Database, HardDrive, Info, Trash2, Volume2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Card, Field, Select } from '@/components/ui/primitives'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { useAppStore } from '@/store/AppStore'
import { getVoices, speechSupported } from '@/engine/narration'

export function Settings({ navigate }: { navigate: (to: string) => void }) {
  const { settings, updateSettings, projects, deleteProject } = useAppStore()
  const { push } = useToast()
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    void getVoices().then(setVoices)
  }, [])

  const storageEstimate = projects.reduce((sum, p) => {
    let bytes = JSON.stringify({ ...p, scenes: [], cues: [] }).length
    for (const scene of p.scenes) {
      bytes += scene.narration.length + scene.visualPrompt.length
      if (scene.visual.dataUrl) bytes += scene.visual.dataUrl.length
      if (scene.audio?.dataUrl) bytes += scene.audio.dataUrl.length
    }
    if (p.music?.dataUrl) bytes += p.music.dataUrl.length
    return sum + bytes
  }, 0)

  return (
    <AppShell navigate={navigate} active="settings">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Settings</h1>
        <p className="mt-1.5 text-sm text-slate-400">Preferences apply to new work and are stored on this device.</p>

        <div className="mt-8 space-y-5">
          <Card className="p-6 sm:p-7">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <HardDrive className="h-5 w-5 text-gold-300" aria-hidden="true" />
              Scene visuals
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Procedural artwork is generated locally and always available. The keyless AI option requests a real
              generated image from a public service — if that request fails, the scene keeps its procedural artwork
              and the studio tells you.
            </p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field label="Image source">
                <Select
                  aria-label="Image source"
                  value={settings.imageProvider}
                  onChange={(e) =>
                    updateSettings({ imageProvider: e.target.value as 'procedural' | 'keyless-ai' })
                  }
                  options={[
                    { value: 'procedural', label: 'Procedural artwork (offline)' },
                    { value: 'keyless-ai', label: 'Keyless AI service' },
                  ]}
                />
              </Field>
              <Field label="Model" hint="Only used when the keyless AI service is selected.">
                <Select
                  aria-label="Keyless image model"
                  value={settings.keylessImageModel}
                  disabled={settings.imageProvider !== 'keyless-ai'}
                  onChange={(e) => updateSettings({ keylessImageModel: e.target.value })}
                  options={[
                    { value: 'flux', label: 'flux' },
                    { value: 'turbo', label: 'turbo' },
                  ]}
                />
              </Field>
            </div>
          </Card>

          <Card className="p-6 sm:p-7">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <Volume2 className="h-5 w-5 text-gold-300" aria-hidden="true" />
              Narration voice
            </h2>
            {speechSupported() ? (
              <>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  Reelwright uses your device’s built-in speech voices. {voices.length} voices are available here.
                </p>
                <div className="mt-5">
                  <Field label="Default voice">
                    <Select
                      aria-label="Default narration voice"
                      value={settings.defaultVoiceURI ?? ''}
                      onChange={(e) => updateSettings({ defaultVoiceURI: e.target.value || null })}
                      options={[
                        { value: '', label: 'Automatic (match project language)' },
                        ...voices.map((v) => ({ value: v.voiceURI, label: `${v.name} — ${v.lang}` })),
                      ]}
                    />
                  </Field>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                This browser does not expose the speech synthesis API, so voiceover preview is unavailable. You can
                still upload your own narration audio per scene.
              </p>
            )}
          </Card>

          <Card className="p-6 sm:p-7">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
              <Database className="h-5 w-5 text-gold-300" aria-hidden="true" />
              Storage
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'} · about{' '}
              {(storageEstimate / 1024 / 1024).toFixed(2)} MB of project data. Everything is stored locally in your
              browser’s IndexedDB — nothing is uploaded.
            </p>
            <Button variant="danger" className="mt-5" onClick={() => setConfirmClear(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete all projects
            </Button>
          </Card>

          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-slate-500">
              Reelwright has no backend. Scripts come from a local rule-based engine, narration from your device’s
              speech voices, and video from your browser’s own media pipeline. No API keys are stored or requested.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent
          title="Delete every project?"
          description="All documentaries, scenes, media and settings stored on this device will be permanently removed."
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmClear(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  projects.forEach((p) => deleteProject(p.id))
                  setConfirmClear(false)
                  push({ kind: 'info', title: 'All projects deleted' })
                }}
              >
                Delete everything
              </Button>
            </>
          }
        />
      </Dialog>
    </AppShell>
  )
}
