# Reelwright — a browser-native documentary studio

Turn a topic into a scripted, storyboarded, narrated, subtitled documentary — and render it to a real
video file. Everything runs in the browser. No account, no backend, no API keys.

> **Reelwright is honest about what it does.** It never presents a failed generation as a success, and
> it never labels a WebM file as MP4. See [Capabilities](#capabilities-what-works-and-what-doesnt) for
> the exact split between what runs locally and what would need an external service.

---

## Features

- **Guided creation wizard** — topic, length (1/3/5/10/15/30 min), language, documentary style and
  aspect ratio (16:9, 9:16, 1:1).
- **Script + scene engine** — a structured script (intro, development, conclusion) broken into
  timestamped scenes with a visual prompt, camera move and transition for each.
- **Storyboard** — edit narration, prompts, titles, durations, camera and transitions; reorder,
  duplicate, add and delete scenes; fit every scene's duration to how long its narration actually takes
  to speak.
- **Voiceover** — preview narration through your device's built-in speech voices (Hindi and English
  among others), with speed, pitch and volume controls. Attach your own narration audio per scene.
- **Subtitles** — captions generated from narration, fully editable, with font, size, colour, position
  and background controls, plus **real `.srt` export**.
- **Timeline editor** — zoomable multi-scene timeline, per-scene trimming and reordering, camera moves,
  transitions, text overlays, a preview player, and a background music bed with volume, fade in/out and
  automatic ducking under narration.
- **Video export** — renders the timeline to a downloadable video file via the browser's own media
  pipeline, with progress and cancellation.
- **Project management** — create, rename, duplicate and delete projects; everything autosaves to
  IndexedDB on your device.

---

## Capabilities: what works, and what doesn't

Because Reelwright runs with **no API keys**, some things are done locally rather than in the cloud.
This is the honest split.

### Works right now, no keys required

| Capability | How |
| --- | --- |
| Script, storyboard and scene breakdown | Offline rule-based **beat engine** (`src/engine/script.ts`) |
| Scene visuals | Locally drawn **procedural cinematic artwork** (`src/engine/visuals.ts`) |
| Voiceover preview | The device's **SpeechSynthesis** voices |
| Subtitles + `.srt` export | Generated from narration (`src/engine/subtitles.ts`) |
| Timeline editing, music, auto-ducking | Web Audio (`src/engine/audio.ts`) |
| Video export | Canvas + **MediaRecorder** (`src/engine/exporter.ts`) |
| Projects | **IndexedDB** on your device (`src/lib/db.ts`) |

### Needs an external service (clearly marked, never faked)

| Capability | Why | What happens without it |
| --- | --- | --- |
| **AI-generated scene images** | Requires an image model | Optional keyless public endpoint; if the request fails the scene keeps its procedural artwork and the UI says so |
| **Cloud TTS voices** | Requires a provider key | Not offered; device voices are used instead |
| **Narration captured into the export** | Browsers cannot capture speech-synthesis output | Upload narration audio per scene — uploaded audio *is* mixed into the file |
| **Server-side MP4 at broadcast bitrates** | Needs FFmpeg on a server | Export uses the browser's encoder; MP4 when supported, otherwise WebM, labelled correctly |

**Important honesty notes**

- The script engine is a **curated, rule-based narrative library**, not a language model. The UI labels
  it "Offline engine" everywhere and the wizard says so explicitly.
- Export runs in **real time** — a five-minute documentary takes about five minutes to render, because
  `MediaRecorder` captures a live canvas stream. Progress and cancel are provided.
- A render is only reported as successful once a non-empty video blob exists. If recording produces no
  data, the export fails loudly.

---

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| Styling | Tailwind CSS 3.4 (custom cinematic tokens) |
| Animation | Framer Motion 11 |
| Components | shadcn/ui-style primitives over Radix UI |
| Icons | lucide-react |
| Storage | IndexedDB (projects + settings) |
| Media | Canvas 2D, Web Audio, MediaRecorder, SpeechSynthesis |

No backend. No API keys. Nothing is uploaded.

---

## Getting started

Requires **Node 18+** (Node 20 recommended).

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check and produce ./dist
npm run preview  # preview the production build
npm run typecheck
```

### Environment variables

**None are required.** Reelwright needs no keys, tokens or secrets to run — the `.env.example` file
exists only to document that fact and to leave a marked place if you later wire in a paid provider.
Never commit real keys; the `.gitignore` excludes `.env*`.

---

## Project structure

```
reelwright/
├── index.html
├── public/                       favicon + .nojekyll
└── src/
    ├── App.tsx                   hash router + error boundary
    ├── index.css                 design tokens, cinematic utilities
    ├── lib/
    │   ├── types.ts              the whole domain model
    │   ├── db.ts                 IndexedDB persistence
    │   ├── format.ts             time/SRT formatting, downloads
    │   └── utils.ts              cn(), seeded RNG, hashing
    ├── engine/                   ← all the real work lives here
    │   ├── script.ts             offline beat engine
    │   ├── sceneOps.ts           pure scene operations
    │   ├── visuals.ts            procedural artwork + keyless AI images
    │   ├── narration.ts          SpeechSynthesis wrapper
    │   ├── subtitles.ts          cue generation + SRT
    │   ├── timeline.ts           shared timeline maths
    │   ├── render.ts             canvas frame renderer
    │   ├── audio.ts              Web Audio mixing + ducking
    │   └── exporter.ts           MediaRecorder video export
    ├── store/AppStore.tsx        projects + settings, debounced autosave
    ├── hooks/                    hash route, scroll
    ├── components/
    │   ├── ui/                   button, primitives, slider, dialog, dropdown, toast
    │   ├── primitives/           Reveal, Section, AuroraBackground, Logo
    │   ├── layout/AppShell.tsx
    │   └── studio/               PreviewPlayer + the five studio tabs
    └── views/                    Landing, Dashboard, Wizard, Studio, Settings
```

**Key idea:** the preview player and the exporter both draw through the same functions in
`engine/render.ts`, so what you preview is exactly what you export.

---

## How the engines work

**Script engine.** `generateScript()` picks a beat sequence (hook → context → subject → development /
turning / evidence → implication → conclusion), chooses template variants deterministically from a
hash of your brief, distributes the target duration across scenes with natural variation, and assigns
a palette, camera move and transition per scene. Same brief, same result — and every field is editable.

**Visuals.** `drawProcedural()` draws layered gradient "landscape" or geometric compositions seeded
from the scene, so artwork is stable, instant and offline. `fetchKeylessImage()` requests a real
AI image from a keyless public endpoint; on any failure the caller keeps the procedural artwork.

**Subtitles.** Narration is split on sentence, then clause, then word boundaries; each fragment gets a
slice of the scene duration proportional to its estimated speaking time.

**Export.** Frames are drawn to a canvas, captured with `canvas.captureStream()`, and combined with an
audio track built by scheduling decoded buffers through Web Audio. `MediaRecorder` muxes them into the
first container the browser actually supports.

---

## Deployment (GitHub Pages)

`vite.config.ts` sets `base: './'` and the app uses **hash routing**, so the build works from any
sub-path with no server rewrites. This repository deploys the built `dist/` from a **`gh-pages`**
branch, with Pages configured to serve that branch at `/`.

```bash
npm run build
# publish dist/ to the gh-pages branch, e.g. with the gh-pages package:
npx gh-pages -d dist
```

Then set **Settings → Pages → Source = Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.
A GitHub Actions workflow is an equally good alternative — build with `npm ci && npm run build` and
publish `dist/` with `actions/upload-pages-artifact` + `actions/deploy-pages`.

---

## Accessibility

- Semantic landmarks, a skip-to-content link, and keyboard-visible focus rings.
- All interactive controls expose accessible names, and stateful controls use `aria-pressed` /
  `aria-checked` / `aria-current` / `aria-valuenow` as appropriate.
- Decorative visuals are `aria-hidden`; the preview canvas carries a descriptive label.
- Full `prefers-reduced-motion` support.

---

## License

MIT. Reelwright is an original product built for this project.
