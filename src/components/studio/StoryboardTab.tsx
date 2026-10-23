import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Image as ImageIcon,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Timer,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Field, Input, Select, Textarea } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { SceneThumb } from '@/components/studio/SceneThumb'
import {
  deleteScene,
  duplicateScene,
  fitDurationsToNarration,
  makeScene,
  moveScene,
  updateScene,
  withScenes,
} from '@/engine/sceneOps'
import { blobToDataUrl, fetchKeylessImage } from '@/engine/visuals'
import { CAMERA_MOVES, TRANSITIONS, type AppSettings, type Project, type Scene } from '@/lib/types'
import { hashString } from '@/lib/utils'

/**
 * Storyboard tab: edit narration, prompts, timing and camera for every scene,
 * reorder, add, duplicate and delete scenes, and produce visuals.
 */
export function StoryboardTab({
  project,
  update,
  settings,
}: {
  project: Project
  update: (updater: (p: Project) => Project) => void
  settings: AppSettings
}) {
  const { push } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkRunning, setBulkRunning] = useState(false)

  const setScenes = (scenes: Scene[]) => update((p) => withScenes(p, scenes))

  const patchScene = (id: string, patch: Partial<Scene>) =>
    setScenes(updateScene(project.scenes, id, patch))

  const generateVisual = async (scene: Scene) => {
    if (settings.imageProvider !== 'keyless-ai') {
      // New procedural composition, drawn locally.
      setScenes(
        updateScene(project.scenes, scene.id, {
          visual: {
            ...scene.visual,
            kind: 'procedural',
            dataUrl: undefined,
            seed: hashString(`${scene.id}|${Date.now()}`),
          },
        }),
      )
      return
    }

    setBusyId(scene.id)
    try {
      const dataUrl = await fetchKeylessImage(scene.visualPrompt || project.topic, {
        model: settings.keylessImageModel,
        seed: scene.visual.seed % 100000,
      })
      setScenes(
        updateScene(project.scenes, scene.id, {
          visual: { ...scene.visual, kind: 'ai', dataUrl, prompt: scene.visualPrompt },
        }),
      )
      push({ kind: 'success', title: 'AI image generated', description: scene.title })
    } catch (err) {
      push({
        kind: 'error',
        title: 'AI image request failed',
        description: `${err instanceof Error ? err.message : 'Unknown error'} — the scene keeps its procedural artwork.`,
      })
    } finally {
      setBusyId(null)
    }
  }

  const generateAll = async () => {
    setBulkRunning(true)
    for (const scene of project.scenes) {
      if (settings.imageProvider !== 'keyless-ai') break
      // eslint-disable-next-line no-await-in-loop
      await generateVisual(scene)
    }
    setBulkRunning(false)
    push({ kind: 'info', title: 'Visual generation finished' })
  }

  const uploadImage = async (scene: Scene, file: File) => {
    try {
      const dataUrl = await blobToDataUrl(file)
      setScenes(
        updateScene(project.scenes, scene.id, {
          visual: { ...scene.visual, kind: 'upload', dataUrl, prompt: scene.visualPrompt },
        }),
      )
      push({ kind: 'success', title: 'Image attached', description: file.name })
    } catch {
      push({ kind: 'error', title: 'Could not read that image' })
    }
  }

  const total = project.scenes.reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Badge>{project.scenes.length} scenes</Badge>
          <Badge>{Math.round(total)}s total</Badge>
          <Badge>{project.title || 'Untitled'}</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setScenes(fitDurationsToNarration(project.scenes, project.language))}
          >
            <Timer className="h-4 w-4" aria-hidden="true" />
            Fit durations to narration
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={generateAll}
            disabled={bulkRunning || settings.imageProvider !== 'keyless-ai'}
            title={
              settings.imageProvider === 'keyless-ai'
                ? 'Generate an AI image for every scene'
                : 'Switch the image source to the keyless AI service in Settings'
            }
          >
            {bulkRunning ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            Generate all visuals
          </Button>
          <Button size="sm" onClick={() => setScenes([...project.scenes, makeScene(project, project.scenes.length)])}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add scene
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {project.scenes.map((scene, index) => (
          <div key={scene.id} className="gradient-border glass rounded-3xl p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]">
              {/* Visual */}
              <div className="space-y-2.5">
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-ink-900">
                  <SceneThumb scene={scene} />
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/65 px-2 py-0.5 font-mono text-[11px] text-white">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="absolute right-2.5 top-2.5 rounded-full bg-black/65 px-2 py-0.5 font-mono text-[11px] text-white">
                    {scene.duration}s
                  </span>
                  {busyId === scene.id && (
                    <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                      <Loader2 className="h-5 w-5 animate-spin text-gold-300" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => generateVisual(scene)} disabled={busyId === scene.id}>
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {settings.imageProvider === 'keyless-ai' ? 'AI image' : 'Reshuffle'}
                  </Button>
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 text-sm text-slate-300 transition-colors hover:border-white/25 hover:text-white">
                    <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) void uploadImage(scene, file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                </div>

                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {scene.visual.kind === 'procedural'
                    ? 'Procedural artwork (offline)'
                    : scene.visual.kind === 'ai'
                      ? 'AI-generated image'
                      : 'Uploaded image'}
                </p>
              </div>

              {/* Fields */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
                  <Field label="Scene title">
                    <Input value={scene.title} onChange={(e) => patchScene(scene.id, { title: e.target.value })} />
                  </Field>
                  <Field label="Duration">
                    <Input
                      data-testid="scene-duration"
                      type="number"
                      min={2}
                      max={600}
                      value={scene.duration}
                      onChange={(e) => patchScene(scene.id, { duration: Math.max(2, Number(e.target.value) || 2) })}
                    />
                  </Field>
                </div>

                <Field label="Narration" hint="Spoken aloud in the preview and used to generate subtitles.">
                  <Textarea
                    value={scene.narration}
                    onChange={(e) => patchScene(scene.id, { narration: e.target.value })}
                    className="min-h-[5rem]"
                  />
                </Field>

                <Field label="Visual prompt" hint="Sent to the keyless image service when AI visuals are enabled.">
                  <Textarea
                    value={scene.visualPrompt}
                    onChange={(e) => patchScene(scene.id, { visualPrompt: e.target.value })}
                    className="min-h-[3.5rem]"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Camera">
                    <Select
                      value={scene.camera}
                      onChange={(e) => patchScene(scene.id, { camera: e.target.value as Scene['camera'] })}
                      options={CAMERA_MOVES.map((c) => ({ value: c.id, label: c.label }))}
                    />
                  </Field>
                  <Field label="Transition in">
                    <Select
                      value={scene.transition}
                      disabled={index === 0}
                      onChange={(e) => patchScene(scene.id, { transition: e.target.value as Scene['transition'] })}
                      options={TRANSITIONS.map((t) => ({ value: t.id, label: t.label }))}
                    />
                  </Field>
                  <Field label="Text overlay">
                    <Input
                      value={scene.overlay}
                      placeholder="Optional"
                      onChange={(e) => patchScene(scene.id, { overlay: e.target.value })}
                    />
                  </Field>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScenes(moveScene(project.scenes, scene.id, -1))}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    Move up
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setScenes(moveScene(project.scenes, scene.id, 1))}
                    disabled={index === project.scenes.length - 1}
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    Move down
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setScenes(duplicateScene(project.scenes, scene.id))}>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-record-400 hover:bg-record-500/10 hover:text-record-400"
                    onClick={() => setScenes(deleteScene(project.scenes, scene.id))}
                    disabled={project.scenes.length <= 1}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
