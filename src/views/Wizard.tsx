import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Check, Clapperboard, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Badge, Card, Field, Input, SegmentedControl, Select, Textarea } from '@/components/ui/primitives'
import { Progress } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/toast'
import { useAppStore } from '@/store/AppStore'
import { generateScript, SCRIPT_ENGINE_NOTE } from '@/engine/script'
import { buildCues } from '@/engine/subtitles'
import {
  ASPECT_RATIOS,
  DOC_STYLES,
  DURATIONS,
  LANGUAGES,
  type AspectRatio,
  type DocStyle,
  type DurationMinutes,
  type LanguageCode,
} from '@/lib/types'

const STEPS = ['Brief', 'Format', 'Language', 'Review'] as const

export function Wizard({ navigate }: { navigate: (to: string) => void }) {
  const { createProject, updateProject } = useAppStore()
  const { push } = useToast()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [topic, setTopic] = useState('')
  const [duration, setDuration] = useState<DurationMinutes>(5)
  const [style, setStyle] = useState<DocStyle>('cinematic')
  const [language, setLanguage] = useState<LanguageCode>('en')
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9')
  const [generating, setGenerating] = useState(false)

  const topicValid = topic.trim().length >= 3
  const canAdvance = step === 0 ? topicValid : true

  const suggestedName = useMemo(() => {
    if (!topic.trim()) return ''
    const t = topic.trim()
    return t.length > 48 ? `${t.slice(0, 48)}…` : t
  }, [topic])

  const generate = async () => {
    setGenerating(true)
    // Yield a frame so the "composing" state paints before the (fast) work runs.
    await new Promise((r) => requestAnimationFrame(() => r(null)))

    try {
      const project = createProject({
        name: name.trim() || suggestedName || 'Untitled documentary',
        topic: topic.trim(),
        language,
        style,
        aspectRatio,
        targetDuration: duration,
      })

      const script = generateScript({
        topic: topic.trim(),
        style,
        language,
        targetDuration: duration,
        aspectRatio,
      })
      const cues = buildCues(script.scenes, language)

      updateProject(project.id, (p) => ({
        ...p,
        title: script.title,
        logline: script.logline,
        synopsis: script.synopsis,
        scenes: script.scenes,
        cues,
        status: 'storyboard-ready',
      }))

      push({
        kind: 'success',
        title: 'Script and storyboard ready',
        description: `${script.scenes.length} scenes composed by the offline engine.`,
      })
      navigate(`/studio/${project.id}`)
    } catch (err) {
      push({
        kind: 'error',
        title: 'Could not compose the script',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
      setGenerating(false)
    }
  }

  return (
    <AppShell navigate={navigate} active="wizard">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          New documentary
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Four quick steps. Everything can be changed later in the studio.
        </p>

        {/* Step indicator */}
        <ol className="mt-7 flex items-center gap-2" aria-label="Progress">
          {STEPS.map((label, i) => (
            <li key={label} className="flex flex-1 items-center gap-2">
              <span
                className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < step
                    ? 'bg-teal-400/20 text-teal-300'
                    : i === step
                      ? 'bg-gold-gradient text-ink-950'
                      : 'bg-white/10 text-slate-500'
                }`}
                aria-current={i === step ? 'step' : undefined}
              >
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className={`hidden text-sm sm:block ${i === step ? 'text-white' : 'text-slate-500'}`}>{label}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-white/10" aria-hidden="true" />}
            </li>
          ))}
        </ol>

        <Card className="mt-6 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <Field
                    label="What is your documentary about?"
                    htmlFor="topic"
                    hint="A phrase works best — “the history of lighthouses”, “how coral reefs recover”."
                  >
                    <Textarea
                      id="topic"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. the migration of Arctic terns"
                      autoFocus
                    />
                  </Field>
                  <Field
                    label="Project name (optional)"
                    htmlFor="name"
                    hint={`Leave blank to use “${suggestedName || 'your topic'}”.`}
                  >
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={suggestedName || 'Untitled documentary'}
                    />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-7">
                  <Field label="Target length" hint="Scenes are distributed across this runtime.">
                    <SegmentedControl
                      ariaLabel="Target length"
                      value={duration}
                      onChange={setDuration}
                      options={DURATIONS.map((d) => ({ value: d, label: `${d} min` }))}
                    />
                  </Field>
                  <Field label="Documentary style">
                    <SegmentedControl
                      ariaLabel="Documentary style"
                      value={style}
                      onChange={setStyle}
                      options={DOC_STYLES.map((s) => ({ value: s.id, label: s.label, hint: s.blurb }))}
                    />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-7">
                  <Field
                    label="Narration language"
                    hint="The offline script engine is authored in English and Hindi. Other languages produce English narration, which you can rewrite scene by scene."
                  >
                    <Select
                      aria-label="Narration language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                      options={LANGUAGES.map((l) => ({ value: l.code, label: `${l.label} — ${l.native}` }))}
                    />
                  </Field>
                  <Field label="Aspect ratio">
                    <SegmentedControl
                      ariaLabel="Aspect ratio"
                      value={aspectRatio}
                      onChange={setAspectRatio}
                      options={ASPECT_RATIOS.map((a) => ({ value: a.id, label: a.id, hint: a.label }))}
                    />
                  </Field>
                  {(language === 'en' || language === 'hi') && (
                    <p className="text-xs text-slate-500">
                      English and Hindi narration will be written by the offline beat engine.
                    </p>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="font-display text-lg font-semibold text-white">Review your brief</h2>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    <ReviewRow label="Project" value={name.trim() || suggestedName || 'Untitled documentary'} />
                    <ReviewRow label="Topic" value={topic.trim()} />
                    <ReviewRow label="Length" value={`${duration} minutes`} />
                    <ReviewRow label="Style" value={DOC_STYLES.find((s) => s.id === style)?.label ?? style} />
                    <ReviewRow
                      label="Language"
                      value={LANGUAGES.find((l) => l.code === language)?.label ?? language}
                    />
                    <ReviewRow label="Aspect" value={aspectRatio} />
                  </dl>

                  <div className="rounded-2xl border border-gold-400/20 bg-gold-500/[0.06] p-4">
                    <p className="flex items-start gap-2 text-xs leading-relaxed text-gold-100/90">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-300" aria-hidden="true" />
                      {SCRIPT_ENGINE_NOTE}
                    </p>
                  </div>

                  {generating && (
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 text-sm text-slate-300">
                        <Loader2 className="h-4 w-4 animate-spin text-gold-300" aria-hidden="true" />
                        Composing script, scenes and subtitles…
                      </p>
                      <Progress value={70} />
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-6">
            <Button
              variant="ghost"
              onClick={() => (step === 0 ? navigate('/app') : setStep((s) => s - 1))}
              disabled={generating}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Continue
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            ) : (
              <Button onClick={generate} disabled={generating || !topicValid}>
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Wand2 className="h-4 w-4" aria-hidden="true" />
                )}
                Generate documentary
              </Button>
            )}
          </div>
        </Card>

        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
          <Badge>Offline engine</Badge>
          <span>No network required to generate the script.</span>
        </div>
      </div>
    </AppShell>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm text-white">{value || '—'}</dd>
    </div>
  )
}
