import { motion } from 'framer-motion'
import {
  ArrowRight,
  Captions,
  Clapperboard,
  Download,
  Film,
  Layers,
  Mic,
  PenLine,
  Play,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuroraBackground, Logo, Reveal, Section, SectionHeading } from '@/components/primitives'
import { DOC_STYLES } from '@/lib/types'

const FEATURES = [
  {
    icon: PenLine,
    title: 'Script & scene breakdown',
    body: 'A structured script with intro, development and conclusion — automatically split into timestamped scenes you can edit.',
    span: 'lg:col-span-3',
  },
  {
    icon: Clapperboard,
    title: 'Storyboard generator',
    body: 'Every scene gets a visual prompt, a camera move and a transition. Reorder, retime, add or delete scenes.',
    span: 'lg:col-span-3',
  },
  {
    icon: Mic,
    title: 'Narration',
    body: 'Preview voiceover instantly with your device’s built-in voices, in Hindi or English — or upload your own audio per scene.',
    span: 'lg:col-span-2',
  },
  {
    icon: Captions,
    title: 'Subtitles & SRT',
    body: 'Captions generated from narration, with full control over font, size, colour and position. Export a real .srt file.',
    span: 'lg:col-span-2',
  },
  {
    icon: Layers,
    title: 'Timeline editor',
    body: 'Multi-scene timeline with trimming, reordering, transitions, text overlays, music and auto-ducking.',
    span: 'lg:col-span-2',
  },
  {
    icon: Download,
    title: 'Real video export',
    body: 'Render the timeline to an actual downloadable video file through your browser’s own media pipeline.',
    span: 'lg:col-span-3',
  },
  {
    icon: Wand2,
    title: 'AI visuals, optional',
    body: 'Generate AI scene images through a keyless public service when you want them — with procedural artwork as the always-available fallback.',
    span: 'lg:col-span-3',
  },
]

const WORKS_OFFLINE = [
  'Script, storyboard and scene breakdown',
  'Procedural cinematic artwork for every scene',
  'Voiceover preview with built-in device voices',
  'Subtitle generation and .srt export',
  'Timeline editing, music and auto-ducking',
  'Video export to a downloadable file',
  'Projects saved on your device',
]

const NEEDS_SERVICE = [
  'AI-generated scene images (keyless public service — optional, with fallback)',
  'Cloud text-to-speech voices (needs a provider key — not included)',
  'Capturing browser narration into the exported file (upload audio instead)',
  'Server-side MP4 rendering at broadcast bitrates',
]

const STEPS = [
  {
    icon: Sparkles,
    title: 'Describe your documentary',
    body: 'Give it a topic, a target length, a language and a style. That is the whole brief.',
  },
  {
    icon: Clapperboard,
    title: 'Shape the storyboard',
    body: 'Reelwright drafts the script and scenes. Edit narration, retime scenes, swap visuals, pick transitions.',
  },
  {
    icon: Film,
    title: 'Narrate, subtitle, export',
    body: 'Preview the voiceover, generate captions, then render a real video file you can download.',
  },
]

export function Landing({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <AuroraBackground />

      {/* Marketing nav */}
      <header className="relative z-30">
        <div className="container-page flex items-center justify-between py-5">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {[
              { label: 'Features', href: '#features' },
              { label: 'How it works', href: '#how' },
              { label: 'Capabilities', href: '#capabilities' },
            ].map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app')}>
              Projects
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/new')}>
              Open studio
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-20 pb-16 pt-10 sm:pb-24 sm:pt-16">
        <div className="container-page">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-500/10 px-3 py-1 text-xs font-medium text-gold-200">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Runs entirely in your browser · no account, no API keys
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.05 }}
              className="mt-6 font-serif text-[2.6rem] font-semibold leading-[1.05] tracking-tightest sm:text-6xl lg:text-[4.2rem]"
            >
              Turn any topic into a
              <br className="hidden sm:block" /> <span className="text-gradient">finished documentary.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.14 }}
              className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
            >
              Reelwright scripts it, storyboards it, narrates it, subtitles it and renders it — all on your own
              machine, and it tells you plainly what it can and cannot do.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.22 }}
              className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row"
            >
              <Button variant="primary" size="lg" className="w-full sm:w-auto" onClick={() => navigate('/new')}>
                Start a documentary
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="lg" className="w-full sm:w-auto" asChild>
                <a href="#how">
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  See how it works
                </a>
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.32 }}
              className="mt-6 text-xs text-slate-500"
            >
              Styles: {DOC_STYLES.map((s) => s.label).join(' · ')}
            </motion.p>
          </div>

          <HeroFilmstrip />
        </div>
      </section>

      {/* Features */}
      <Section id="features" className="relative z-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Everything in one place"
            title={
              <>
                From a blank page to a <span className="text-gradient">timeline you can render.</span>
              </>
            }
            description="A complete documentary workflow — brief, script, storyboard, narration, captions, edit and export."
          />

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <Reveal key={feature.title} delay={i * 0.05} className={feature.span}>
                  <div className="gradient-border glass h-full rounded-3xl p-6 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-glow-sm sm:p-7">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-300 ring-1 ring-inset ring-gold-400/25">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.body}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" className="relative z-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                Three steps, <span className="text-gradient">no setup.</span>
              </>
            }
          />
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <Reveal key={step.title} delay={i * 0.1}>
                  <div className="panel h-full p-7">
                    <div className="flex items-center gap-4">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-gold-300 ring-1 ring-inset ring-gold-400/25">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="font-mono text-xs tracking-widest text-slate-600">
                        STEP {String(i + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold text-white">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">{step.body}</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </Section>

      {/* Honest capabilities */}
      <Section id="capabilities" className="relative z-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="No surprises"
            title={
              <>
                What works out of the box — and <span className="text-gradient">what doesn’t.</span>
              </>
            }
            description="Reelwright runs without any API keys, so some things are done locally rather than in the cloud. Here is the honest split."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <Reveal>
              <div className="gradient-border glass h-full rounded-3xl p-7">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
                  <ShieldCheck className="h-5 w-5 text-teal-300" aria-hidden="true" />
                  Works right now, no keys
                </h3>
                <ul className="mt-5 space-y-3">
                  {WORKS_OFFLINE.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-400" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="panel h-full rounded-3xl p-7">
                <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-white">
                  <Sparkles className="h-5 w-5 text-gold-300" aria-hidden="true" />
                  Needs an external service
                </h3>
                <ul className="mt-5 space-y-3">
                  {NEEDS_SERVICE.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400/70" aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs leading-relaxed text-slate-500">
                  Reelwright never presents a failed generation as a success. If a keyless image request fails, the
                  scene keeps its procedural artwork and says so.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="relative z-20">
        <div className="container-page">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-5xl border border-white/10 px-6 py-16 text-center sm:px-12 sm:py-20">
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gold-gradient opacity-90" />
              <div aria-hidden="true" className="absolute inset-0 -z-10 bg-grid opacity-[0.12] mix-blend-overlay" />
              <h2 className="mx-auto max-w-2xl font-serif text-3xl font-semibold leading-[1.1] text-ink-950 sm:text-4xl lg:text-5xl">
                Your first documentary is five fields away.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base text-ink-900/80 sm:text-lg">
                No sign-up. Nothing leaves your device. Just a topic and a little patience.
              </p>
              <div className="mt-9 flex justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/new')}
                  className="bg-ink-950 text-white shadow-lg [background-image:none] [animation:none] hover:bg-ink-900"
                >
                  Start a documentary
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      <footer className="relative z-20 border-t border-white/10 py-10">
        <div className="container-page flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-500">
            Reelwright · a browser-native documentary studio. Projects stay on your device.
          </p>
        </div>
      </footer>
    </div>
  )
}

function HeroFilmstrip() {
  const frames = [0, 1, 2, 3, 4]
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto mt-16 max-w-4xl"
    >
      <div aria-hidden="true" className="absolute -inset-x-8 -top-8 bottom-0 rounded-[3rem] bg-gold-500/15 blur-3xl" />
      <div className="gradient-border glass relative overflow-hidden rounded-3xl p-3 shadow-card sm:rounded-4xl sm:p-4">
        <div className="flex items-center gap-2 px-1 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-record-500 animate-record-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-slate-500">preview · 16:9</span>
          <span className="ml-auto font-mono text-[11px] text-slate-500">04:30</span>
        </div>
        <div className="flex gap-2 overflow-hidden rounded-2xl">
          {frames.map((f) => (
            <div
              key={f}
              className="relative aspect-video flex-1 overflow-hidden rounded-xl border border-white/10"
              style={{
                background: `linear-gradient(140deg, hsl(${24 + f * 12} 60% ${10 + f * 3}%), hsl(${210 + f * 8} 50% ${16 + f * 2}%))`,
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at ${30 + f * 12}% ${35 + f * 6}%, rgba(255,194,75,0.55), transparent 60%)`,
                }}
              />
              <div className="absolute inset-x-2 bottom-2 h-1 rounded-full bg-white/20" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 px-1">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/5 rounded-full bg-gold-gradient" />
          </div>
          <span className="font-mono text-[11px] text-slate-500">scene 2 / 5</span>
        </div>
      </div>
    </motion.div>
  )
}
