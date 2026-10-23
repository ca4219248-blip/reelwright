import { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Download, Film, Info, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, Field, Progress, Select, Switch } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { exportVideo, pickRecorderMime, recorderSupported, type ExportResult } from '@/engine/exporter'
import { buildTimeline } from '@/engine/timeline'
import { downloadBlob, formatTime } from '@/lib/format'
import type { Project } from '@/lib/types'

/**
 * Export tab. Renders the timeline to a real video file in the browser and
 * reports honestly what the browser could and could not include.
 */
export function ExportTab({ project, update }: { project: Project; update: (u: (p: Project) => Project) => void }) {
  const { push } = useToast()
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p')
  const [includeSubtitles, setIncludeSubtitles] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExportResult | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const timeline = useMemo(() => buildTimeline(project.scenes), [project.scenes])
  const mime = useMemo(() => pickRecorderMime(), [])
  const supported = recorderSupported()

  useEffect(() => {
    if (!result) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(result.blob)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [result])

  useEffect(() => () => abortRef.current?.abort(), [])

  const start = async () => {
    setError(null)
    setResult(null)
    setRendering(true)
    setProgress(0)
    setStage('Starting')
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const exported = await exportVideo({
        project,
        resolution,
        includeSubtitles,
        signal: controller.signal,
        onProgress: (p, s) => {
          setProgress(p * 100)
          setStage(s)
        },
      })
      setResult(exported)
      update((p) => ({ ...p, status: 'exported', exportedAt: Date.now(), lastExportName: exported.filename }))
      push({
        kind: 'success',
        title: 'Video rendered',
        description: `${exported.filename} · ${(exported.blob.size / 1024 / 1024).toFixed(1)} MB`,
      })
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        push({ kind: 'info', title: 'Export cancelled' })
      } else {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(message)
        push({ kind: 'error', title: 'Export failed', description: message })
      }
    } finally {
      setRendering(false)
      setStage('')
      abortRef.current = null
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <div className="space-y-5">
        {/* Result */}
        {result && previewUrl ? (
          <div className="gradient-border glass rounded-3xl p-5">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-white">
              <CheckCircle2 className="h-4 w-4 text-teal-300" aria-hidden="true" />
              Render complete
            </h2>
            <video
              src={previewUrl}
              controls
              playsInline
              className="mt-4 w-full rounded-2xl border border-white/10 bg-black"
            />
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <Detail label="File" value={result.filename} />
              <Detail label="Format" value={result.extension.toUpperCase()} />
              <Detail label="Resolution" value={`${result.width}×${result.height}`} />
              <Detail label="Duration" value={formatTime(result.duration)} />
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={() => downloadBlob(result.filename, result.blob)}>
                <Download className="h-4 w-4" aria-hidden="true" />
                Download video
              </Button>
              <Button variant="secondary" onClick={start}>
                Render again
              </Button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              {result.hasAudio
                ? 'Uploaded narration and music were mixed into this file.'
                : 'This file is silent — no uploaded narration or music was present. Device-voice previews cannot be captured by a browser page.'}
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-300 ring-1 ring-inset ring-gold-400/25">
              <Film className="h-6 w-6" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-white">
              {rendering ? 'Rendering your documentary' : 'Render your documentary'}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              {rendering
                ? 'Frames are captured in real time, so a render takes about as long as the film itself. You can cancel at any point.'
                : `The timeline is ${formatTime(timeline.duration)} long across ${project.scenes.length} scenes.`}
            </p>

            {rendering && (
              <div className="mx-auto mt-6 max-w-md space-y-2">
                <Progress value={progress} />
                <p className="font-mono text-xs text-slate-400">
                  {stage} · {Math.round(progress)}%
                </p>
                <Button variant="danger" size="sm" onClick={() => abortRef.current?.abort()}>
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                  Cancel render
                </Button>
              </div>
            )}

            {!rendering && (
              <Button className="mt-6" onClick={start} disabled={!supported || project.scenes.length === 0}>
                <Film className="h-4 w-4" aria-hidden="true" />
                Render video
              </Button>
            )}

            {!supported && (
              <p className="mt-4 text-xs text-record-400">
                This browser cannot record canvas video (MediaRecorder is unavailable).
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-record-500/30 bg-record-500/10 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-record-400" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-record-400">{error}</p>
          </div>
        )}
      </div>

      {/* Settings rail */}
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
        <div className="gradient-border glass rounded-3xl p-5">
          <h2 className="font-display text-base font-semibold text-white">Render settings</h2>
          <div className="mt-4 space-y-4">
            <Field label="Resolution">
              <Select
                aria-label="Export resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                disabled={rendering}
                options={[
                  { value: '1080p', label: '1080p (full HD)' },
                  { value: '720p', label: '720p (smaller file)' },
                ]}
              />
            </Field>
            <Switch
              checked={includeSubtitles}
              onCheckedChange={setIncludeSubtitles}
              label="Burn in subtitles"
              disabled={rendering}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Badge>{project.aspectRatio}</Badge>
            <Badge>{formatTime(timeline.duration)}</Badge>
            {mime ? <Badge className="border-teal-400/30 bg-teal-400/10 text-teal-300">{mime.extension.toUpperCase()}</Badge> : <Badge>Unsupported</Badge>}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
            <Info className="h-4 w-4 text-slate-400" aria-hidden="true" />
            How this render works
          </h3>
          <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-500">
            <li>
              Frames are drawn to a canvas and captured with <span className="font-mono">MediaRecorder</span>, so the
              render runs in real time.
            </li>
            <li>
              Uploaded narration and music are mixed in through Web Audio and{' '}
              <span className="text-slate-300">are</span> included in the file.
            </li>
            <li>
              Device speech-synthesis previews cannot be captured by a browser page — upload audio to include
              narration.
            </li>
            <li>
              The container is {mime?.extension.toUpperCase() ?? 'unavailable'} because that is what this browser
              supports; Reelwright will not label a WebM file as MP4.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-xs text-white">{value}</dd>
    </div>
  )
}

export function ExportSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
}
