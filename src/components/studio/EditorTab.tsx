import { useMemo, useState } from 'react'
import { Music, Trash2, Upload, ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Switch } from '@/components/ui/primitives'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/toast'
import { PreviewPlayer } from '@/components/studio/PreviewPlayer'
import { buildTimeline } from '@/engine/timeline'
import { updateScene, withScenes } from '@/engine/sceneOps'
import { blobToDataUrl } from '@/engine/visuals'
import { CAMERA_MOVES, TRANSITIONS, type Project, type Scene } from '@/lib/types'
import { formatTime } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * Editor tab: preview player, a zoomable multi-scene timeline with trimming
 * and reordering, per-scene properties, and the background music bed.
 */
export function EditorTab({ project, update }: { project: Project; update: (u: (p: Project) => Project) => void }) {
  const { push } = useToast()
  const timeline = useMemo(() => buildTimeline(project.scenes), [project.scenes])
  const [pxPerSec, setPxPerSec] = useState(9)
  const [selectedId, setSelectedId] = useState<string | null>(project.scenes[0]?.id ?? null)
  const [time, setTime] = useState(0)

  const selected = project.scenes.find((s) => s.id === selectedId) ?? project.scenes[0] ?? null

  const patchScene = (id: string, patch: Partial<Scene>) =>
    update((p) => withScenes(p, updateScene(p.scenes, id, patch)))

  const reorder = (id: string, direction: -1 | 1) =>
    update((p) => {
      const index = p.scenes.findIndex((s) => s.id === id)
      const target = index + direction
      if (index < 0 || target < 0 || target >= p.scenes.length) return p
      const next = p.scenes.slice()
      ;[next[index], next[target]] = [next[target], next[index]]
      return withScenes(p, next)
    })

  const uploadMusic = async (file: File) => {
    try {
      const dataUrl = await blobToDataUrl(file)
      update((p) => ({
        ...p,
        music: { name: file.name, dataUrl, volume: 0.5, fadeIn: 1.5, fadeOut: 2, duckUnderNarration: true },
      }))
      push({ kind: 'success', title: 'Music added', description: file.name })
    } catch {
      push({ kind: 'error', title: 'Could not read that audio file' })
    }
  }

  const totalWidth = Math.max(timeline.duration * pxPerSec, 320)

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
      <div className="space-y-5">
        <PreviewPlayer
          project={project}
          onTimeChange={setTime}
          onActiveSceneChange={(i) => setSelectedId(project.scenes[i]?.id ?? null)}
        />

        {/* Timeline */}
        <div className="panel p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-sm font-semibold text-white">Timeline</h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-slate-500">
                {formatTime(time)} / {formatTime(timeline.duration)}
              </span>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setPxPerSec((v) => Math.max(3, v - 2))}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setPxPerSec((v) => Math.min(40, v + 2))}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto pb-2">
            <div className="relative h-24" style={{ width: totalWidth }}>
              {timeline.slots.map((slot) => {
                const isActive = slot.scene.id === selected?.id
                const start = slot.start * pxPerSec
                const width = Math.max(28, slot.scene.duration * pxPerSec - 3)
                return (
                  <button
                    key={slot.scene.id}
                    type="button"
                    onClick={() => setSelectedId(slot.scene.id)}
                    aria-label={`Select ${slot.scene.title}`}
                    aria-pressed={isActive}
                    className={cn(
                      'absolute top-0 h-20 overflow-hidden rounded-lg border px-2 py-1.5 text-left transition-colors',
                      isActive
                        ? 'border-gold-400/70 bg-gold-500/15'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/25',
                    )}
                    style={{ left: start, width }}
                  >
                    <span className="block font-mono text-[10px] text-slate-400">
                      {String(slot.index + 1).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-200">{slot.scene.title}</span>
                    <span className="mt-0.5 block font-mono text-[10px] text-slate-500">{slot.scene.duration}s</span>
                  </button>
                )
              })}

              {/* Playhead */}
              <div
                className="pointer-events-none absolute bottom-0 top-0 w-px bg-gold-400"
                style={{ left: Math.min(time * pxPerSec, totalWidth) }}
                aria-hidden="true"
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            {project.scenes.length} scenes · drag-free reordering with the arrows in the scene panel
          </p>
        </div>

        {/* Selected scene */}
        {selected && (
          <div className="gradient-border glass rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-sm font-semibold text-white">Scene properties</h2>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reorder(selected.id, -1)}
                  disabled={project.scenes[0]?.id === selected.id}
                >
                  Move earlier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => reorder(selected.id, 1)}
                  disabled={project.scenes[project.scenes.length - 1]?.id === selected.id}
                >
                  Move later
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Duration (seconds)">
                <Input
                  type="number"
                  min={2}
                  max={600}
                  value={selected.duration}
                  onChange={(e) => patchScene(selected.id, { duration: Math.max(2, Number(e.target.value) || 2) })}
                />
              </Field>
              <Field label="Camera move">
                <Select
                  value={selected.camera}
                  onChange={(e) => patchScene(selected.id, { camera: e.target.value as Scene['camera'] })}
                  options={CAMERA_MOVES.map((c) => ({ value: c.id, label: c.label }))}
                />
              </Field>
              <Field label="Transition in">
                <Select
                  value={selected.transition}
                  onChange={(e) => patchScene(selected.id, { transition: e.target.value as Scene['transition'] })}
                  options={TRANSITIONS.map((t) => ({ value: t.id, label: t.label }))}
                />
              </Field>
              <Field label="Text overlay">
                <Input value={selected.overlay} onChange={(e) => patchScene(selected.id, { overlay: e.target.value })} />
              </Field>
            </div>

            <div className="mt-4">
              <Slider
                label="Trim duration"
                min={2}
                max={Math.max(60, selected.duration)}
                step={1}
                value={selected.duration}
                onChange={(v) => patchScene(selected.id, { duration: v })}
                displayValue={`${selected.duration}s`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Right rail: music */}
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="gradient-border glass rounded-3xl p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
            <Music className="h-4 w-4 text-gold-300" aria-hidden="true" />
            Background music
          </h2>

          {project.music ? (
            <div className="mt-4 space-y-4">
              <p className="truncate text-xs text-teal-300">{project.music.name}</p>

              <Slider
                label="Music level"
                value={project.music.volume}
                onChange={(v) => update((p) => (p.music ? { ...p, music: { ...p.music, volume: v } } : p))}
                displayValue={`${Math.round(project.music.volume * 100)}%`}
              />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fade in (s)">
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={project.music.fadeIn}
                    onChange={(e) =>
                      update((p) =>
                        p.music ? { ...p, music: { ...p.music, fadeIn: Math.max(0, Number(e.target.value) || 0) } } : p,
                      )
                    }
                  />
                </Field>
                <Field label="Fade out (s)">
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    step={0.5}
                    value={project.music.fadeOut}
                    onChange={(e) =>
                      update((p) =>
                        p.music ? { ...p, music: { ...p.music, fadeOut: Math.max(0, Number(e.target.value) || 0) } } : p,
                      )
                    }
                  />
                </Field>
              </div>

              <Switch
                checked={project.music.duckUnderNarration}
                onCheckedChange={(v) => update((p) => (p.music ? { ...p, music: { ...p.music, duckUnderNarration: v } } : p))}
                label="Duck music under narration"
              />

              <Button
                variant="ghost"
                size="sm"
                className="text-record-400 hover:bg-record-500/10"
                onClick={() => update((p) => ({ ...p, music: null }))}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Remove music
              </Button>
            </div>
          ) : (
            <>
              <p className="mt-3 text-xs leading-relaxed text-slate-500">
                Add a royalty-free track to score the film. It loops to fill the timeline and can duck automatically
                beneath narration.
              </p>
              <label className="mt-4 inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border border-white/15 px-5 text-sm text-slate-200 transition-colors hover:border-gold-400/60 hover:text-white">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload audio
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) void uploadMusic(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="font-display text-sm font-semibold text-white">Export includes</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Scene visuals, transitions, camera moves, text overlays, uploaded narration, music (with ducking), and
            subtitles if enabled on the Export tab.
          </p>
        </div>
      </aside>
    </div>
  )
}
