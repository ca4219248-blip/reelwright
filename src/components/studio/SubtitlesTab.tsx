import { useMemo, useState } from 'react'
import { Download, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Switch } from '@/components/ui/primitives'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/toast'
import { buildCues, cuesToSrt } from '@/engine/subtitles'
import { download, formatSrtTime, slugify } from '@/lib/format'
import type { Cue, Project } from '@/lib/types'
import { uid } from '@/lib/utils'

const FONTS = ['Inter', 'Sora', 'Fraunces', 'JetBrains Mono', 'Georgia', 'Arial']

/**
 * Subtitles tab: generate captions from narration, edit text and timing,
 * style them, and export a real .srt file.
 */
export function SubtitlesTab({ project, update }: { project: Project; update: (u: (p: Project) => Project) => void }) {
  const { push } = useToast()
  const [preview, setPreview] = useState(false)

  const srt = useMemo(() => cuesToSrt(project.cues), [project.cues])

  const setCues = (cues: Cue[]) => update((p) => ({ ...p, cues }))

  const patchCue = (id: string, patch: Partial<Cue>) =>
    setCues(project.cues.map((c) => (c.id === id ? { ...c, ...patch } : c)))

  const regenerate = () => {
    const cues = buildCues(project.scenes, project.language)
    setCues(cues)
    push({ kind: 'success', title: 'Subtitles regenerated', description: `${cues.length} captions from narration.` })
  }

  const exportSrt = () => {
    if (!project.cues.length) {
      push({ kind: 'error', title: 'Nothing to export', description: 'Generate subtitles first.' })
      return
    }
    download(`${slugify(project.name)}.srt`, srt, 'application/x-subrip')
    push({ kind: 'success', title: 'Subtitle file downloaded', description: `${project.cues.length} cues as .srt` })
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            {project.cues.length} {project.cues.length === 1 ? 'caption' : 'captions'} generated from scene narration.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPreview((v) => !v)}>
              {preview ? 'Hide SRT' : 'Preview SRT'}
            </Button>
            <Button variant="secondary" size="sm" onClick={regenerate}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Regenerate
            </Button>
            <Button size="sm" onClick={exportSrt}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Export .srt
            </Button>
          </div>
        </div>

        {preview && (
          <pre className="max-h-72 overflow-auto rounded-2xl border border-white/10 bg-ink-900/80 p-4 font-mono text-xs leading-relaxed text-slate-300">
            {srt || 'No cues yet.'}
          </pre>
        )}

        {project.cues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
            <p className="text-sm text-slate-400">No captions yet.</p>
            <Button className="mt-4" size="sm" onClick={regenerate}>
              Generate from narration
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {project.cues.map((cue, index) => (
              <div key={cue.id} className="panel grid gap-3 p-3 sm:grid-cols-[3.5rem_6rem_6rem_minmax(0,1fr)_2.5rem] sm:items-center">
                <span className="font-mono text-xs text-slate-500">{String(index + 1).padStart(2, '0')}</span>
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  value={Number(cue.start.toFixed(2))}
                  onChange={(e) => patchCue(cue.id, { start: Math.max(0, Number(e.target.value) || 0) })}
                  aria-label={`Caption ${index + 1} start time`}
                />
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  value={Number(cue.end.toFixed(2))}
                  onChange={(e) => patchCue(cue.id, { end: Math.max(0, Number(e.target.value) || 0) })}
                  aria-label={`Caption ${index + 1} end time`}
                />
                <Input
                  value={cue.text}
                  onChange={(e) => patchCue(cue.id, { text: e.target.value })}
                  aria-label={`Caption ${index + 1} text`}
                />
                <button
                  type="button"
                  aria-label={`Delete caption ${index + 1}`}
                  onClick={() => setCues(project.cues.filter((c) => c.id !== cue.id))}
                  className="justify-self-end rounded-full p-2 text-slate-500 transition-colors hover:bg-record-500/10 hover:text-record-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const last = project.cues[project.cues.length - 1]
                const start = last ? last.end + 0.2 : 0
                setCues([...project.cues, { id: uid('cue'), start, end: start + 3, text: '' }])
              }}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add caption
            </Button>
          </div>
        )}
      </div>

      {/* Style rail */}
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="gradient-border glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold text-white">Caption style</h2>
          <div className="mt-4 space-y-4">
            <Field label="Font">
              <Select
                aria-label="Caption font"
                value={project.subtitleStyle.fontFamily}
                onChange={(e) => update((p) => ({ ...p, subtitleStyle: { ...p.subtitleStyle, fontFamily: e.target.value } }))}
                options={FONTS.map((f) => ({ value: f, label: f }))}
              />
            </Field>

            <Slider
              label="Size"
              min={0.6}
              max={1.8}
              step={0.05}
              value={project.subtitleStyle.scale}
              onChange={(v) => update((p) => ({ ...p, subtitleStyle: { ...p.subtitleStyle, scale: v } }))}
              displayValue={`${project.subtitleStyle.scale.toFixed(2)}×`}
            />

            <Field label="Position">
              <Select
                aria-label="Caption position"
                value={project.subtitleStyle.position}
                onChange={(e) =>
                  update((p) => ({
                    ...p,
                    subtitleStyle: { ...p.subtitleStyle, position: e.target.value as Project['subtitleStyle']['position'] },
                  }))
                }
                options={[
                  { value: 'top', label: 'Top' },
                  { value: 'center', label: 'Centre' },
                  { value: 'bottom', label: 'Bottom' },
                ]}
              />
            </Field>

            <div className="flex items-center gap-3">
              <label htmlFor="caption-color" className="text-sm font-medium text-slate-200">
                Colour
              </label>
              <input
                id="caption-color"
                type="color"
                value={project.subtitleStyle.color}
                onChange={(e) =>
                  update((p) => ({ ...p, subtitleStyle: { ...p.subtitleStyle, color: e.target.value } }))
                }
                className="h-9 w-14 cursor-pointer rounded-lg border border-white/10 bg-transparent"
              />
            </div>

            <Switch
              checked={project.subtitleStyle.background}
              onCheckedChange={(v) => update((p) => ({ ...p, subtitleStyle: { ...p.subtitleStyle, background: v } }))}
              label="Solid background box"
            />
            <Switch
              checked={project.subtitleStyle.bold}
              onCheckedChange={(v) => update((p) => ({ ...p, subtitleStyle: { ...p.subtitleStyle, bold: v } }))}
              label="Bold text"
            />
          </div>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Style changes apply to the preview player and the exported video. The .srt file carries text and timing
            only.
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="font-display text-sm font-semibold text-white">SRT timing</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            First cue starts at {formatSrtTime(project.cues[0]?.start ?? 0)}. Timestamps use the standard
            HH:MM:SS,mmm format.
          </p>
        </div>
      </aside>
    </div>
  )
}
