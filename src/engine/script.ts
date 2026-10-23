import {
  type AspectRatio,
  type CameraMove,
  type DocStyle,
  type DurationMinutes,
  type LanguageCode,
  type Scene,
  type Transition,
} from '../lib/types'
import { hashString, mulberry32, uid } from '../lib/utils'

/**
 * The offline script engine.
 *
 * This is a deterministic, rule-based composer — not a language model. It
 * assembles a documentary script from a curated library of narrative beats,
 * parameterised by the topic, style, language and target duration. It is
 * labelled as such throughout the UI and never claims to be an LLM.
 */

export interface ScriptBrief {
  topic: string
  style: DocStyle
  language: LanguageCode
  targetDuration: DurationMinutes
  aspectRatio: AspectRatio
}

export interface GeneratedScript {
  title: string
  logline: string
  synopsis: string
  scenes: Scene[]
}

type Beat = {
  role: 'hook' | 'context' | 'subject' | 'development' | 'turning' | 'evidence' | 'implication' | 'conclusion'
  /** Short chapter label used for the on-screen overlay. */
  chapter: { en: string; hi: string }
  en: string[]
  hi: string[]
}

const BEATS: Beat[] = [
  {
    role: 'hook',
    chapter: { en: 'Opening', hi: 'प्रारंभ' },
    en: [
      'Some stories begin quietly. This one begins with {topic} — and with a question that has refused to go away.',
      'There are subjects we think we understand. {Topic} is not one of them. Not yet.',
      'Before anything else, hold one image in your mind: {topic}. Everything that follows grows from it.',
      'It is easy to pass {topic} by. It is much harder to explain it. That is where we begin.',
    ],
    hi: [
      'कुछ कहानियाँ शांति से शुरू होती हैं। यह कहानी {topic} से शुरू होती है — और एक ऐसे सवाल से, जो अब तक अनुत्तरित है।',
      'कुछ विषय हमें लगता है कि हम समझ चुके हैं। {topic} उनमें से नहीं है। अभी नहीं।',
      'सबसे पहले एक तस्वीर मन में रखिए: {topic}। आगे जो कुछ होगा, वह इसी से निकलेगा।',
    ],
  },
  {
    role: 'context',
    chapter: { en: 'Context', hi: 'पृष्ठभूमि' },
    en: [
      'To understand {topic}, we have to start further back than feels comfortable — with the conditions that made it possible.',
      'Context matters here. {Topic} did not appear from nowhere; it was assembled, piece by piece, over a long stretch of time.',
      'Every account of {topic} begins in the same place: with what came before it, and with who was paying attention.',
    ],
    hi: [
      '{topic} को समझने के लिए हमें अपेक्षा से कहीं पीछे जाना होगा — उन परिस्थितियों तक, जिन्होंने इसे संभव बनाया।',
      'यहाँ संदर्भ महत्वपूर्ण है। {topic} अचानक नहीं आया; यह लंबे समय में, टुकड़े-टुकड़े करके बना।',
      '{topic} का हर वर्णन एक ही जगह से शुरू होता है — उससे पहले जो था, और उनसे जो ध्यान दे रहे थे।',
    ],
  },
  {
    role: 'subject',
    chapter: { en: 'The Subject', hi: 'विषय' },
    en: [
      'At the centre of it all sits {topic} itself — and the closer you look, the less simple it becomes.',
      'Here is the subject in plain terms: {topic}. Everything else in this film is an attempt to see it clearly.',
      'What is {topic}, exactly? The honest answer is that it is several things at once, and each one changes the others.',
    ],
    hi: [
      'इस सबके केंद्र में {topic} है — और जितना करीब से देखें, उतना ही यह कम सरल लगता है।',
      'विषय सीधे शब्दों में: {topic}। इस फ़िल्म का बाकी सब कुछ इसे स्पष्ट देखने का प्रयास है।',
      '{topic} आख़िर क्या है? सच्चा उत्तर यह है कि यह एक साथ कई चीज़ें है, और हर एक बाक़ी को बदल देती है।',
    ],
  },
  {
    role: 'development',
    chapter: { en: 'How It Works', hi: 'यह कैसे होता है' },
    en: [
      'Follow the process and a pattern emerges. Small forces, repeated patiently, begin to shape something larger than themselves.',
      'Step by step, {topic} reveals its mechanics — and the mechanics are rarely where we expect to find them.',
      'The details matter more than the headlines. It is in the quiet, repeated actions that {topic} actually takes form.',
      'Watch closely and the sequence becomes clear: pressure, response, adjustment, and then a new equilibrium.',
    ],
    hi: [
      'प्रक्रिया पर चलिए और एक पैटर्न उभरता है। छोटी शक्तियाँ, धैर्य से दोहराई गईं, अपने से बड़ा कुछ बनाने लगती हैं।',
      'एक-एक कदम पर {topic} अपनी कार्यप्रणाली दिखाता है — और वह अक्सर वहाँ नहीं होती जहाँ हम ढूँढ़ते हैं।',
      'ब्यौरे सुर्ख़ियों से ज़्यादा मायने रखते हैं। शांत, दोहराए गए कार्यों में ही {topic} आकार लेता है।',
    ],
  },
  {
    role: 'turning',
    chapter: { en: 'The Turning Point', hi: 'निर्णायक मोड़' },
    en: [
      'Then something shifts. The moment is easy to miss in real time, and impossible to ignore in hindsight.',
      'And here the story turns. What had been gradual becomes sudden, and the old explanations stop fitting.',
      'There is a hinge in every account of {topic}. This is where it turns — quietly, and then all at once.',
    ],
    hi: [
      'फिर कुछ बदल जाता है। उस पल को उस समय पहचानना कठिन है, और बाद में नज़रअंदाज़ करना असंभव।',
      'और यहीं कहानी मुड़ती है। जो धीरे-धीरे हो रहा था, वह अचानक हो जाता है।',
      '{topic} के हर वर्णन में एक मोड़ होता है। यहीं वह मुड़ता है — चुपचाप, और फिर एक साथ।',
    ],
  },
  {
    role: 'evidence',
    chapter: { en: 'The Evidence', hi: 'प्रमाण' },
    en: [
      'Look at what the record actually shows. The numbers are unglamorous, but they are difficult to argue with.',
      'The evidence does not arrive in a single dramatic reveal. It accumulates — and accumulation is the point.',
      'Trace it back to the sources and the picture sharpens. What looked like coincidence starts to look like structure.',
    ],
    hi: [
      'देखिए अभिलेख वास्तव में क्या दिखाते हैं। आँकड़े चमकदार नहीं हैं, पर उनसे बहस करना कठिन है।',
      'प्रमाण एक नाटकीय क्षण में नहीं आते। वे जमा होते हैं — और यही जमाव मायने रखता है।',
      'स्रोतों तक पीछे चलिए और तस्वीर साफ़ होती है। जो संयोग लगा, वह ढाँचा लगने लगता है।',
    ],
  },
  {
    role: 'implication',
    chapter: { en: 'Why It Matters', hi: 'यह क्यों मायने रखता है' },
    en: [
      'Which brings us to the part that is not about the past at all. {Topic} is not finished with us.',
      'The consequences reach further than the subject itself — into decisions that are still being made right now.',
      'This is why {topic} matters beyond its own boundaries: it changes what the next generation inherits.',
    ],
    hi: [
      'और अब वह हिस्सा, जो अतीत का नहीं है। {topic} अभी हमसे पीछा नहीं छोड़ता।',
      'परिणाम विषय से आगे तक पहुँचते हैं — उन निर्णयों तक, जो अभी लिए जा रहे हैं।',
      'इसीलिए {topic} अपनी सीमाओं से परे मायने रखता है: यह बदल देता है कि अगली पीढ़ी को क्या मिलेगा।',
    ],
  },
  {
    role: 'conclusion',
    chapter: { en: 'Closing', hi: 'समापन' },
    en: [
      'So we return to where we began — with {topic}, and with that first question. Only now, we can answer it.',
      'That is the story of {topic}: not a neat ending, but a clearer view. And a clearer view is where everything starts.',
      'The film ends here. The subject does not. {Topic} continues — and now, so does your attention to it.',
    ],
    hi: [
      'तो हम वहीं लौटते हैं जहाँ से शुरू किया था — {topic}, और वही पहला सवाल। अब हम उत्तर दे सकते हैं।',
      'यही है {topic} की कहानी: साफ़ अंत नहीं, बल्कि एक स्पष्ट दृष्टि। और स्पष्ट दृष्टि से ही सब शुरू होता है।',
      'फ़िल्म यहाँ समाप्त होती है। विषय नहीं। {topic} जारी रहता है — और अब आपका ध्यान भी।',
    ],
  },
]

const STYLE_PROMPTS: Record<DocStyle, string> = {
  cinematic: 'cinematic wide shot, volumetric light, shallow depth of field, film grain, teal and amber grade',
  historical: 'archival texture, muted sepia tones, weathered paper, soft window light, documentary photograph',
  educational: 'clean illustrative composition, bright even lighting, clear focal subject, minimal background',
  scientific: 'laboratory precision, cool blue key light, macro detail, crisp focus, technical atmosphere',
  investigative: 'low-key lighting, high contrast, tense composition, rain-slicked surfaces, reportage style',
  nature: 'golden hour landscape, dramatic clouds, mist in the valley, telephoto compression, natural palette',
}

const STYLE_PALETTES: Record<DocStyle, string[][]> = {
  cinematic: [
    ['#0B1020', '#1B2A4A', '#F5A623', '#FFC24B'],
    ['#0A0A11', '#2A1B3D', '#FF8A5B', '#6D8BFF'],
    ['#050810', '#123240', '#2DD4BF', '#FFC24B'],
  ],
  historical: [
    ['#1A1410', '#3A2A1A', '#C9A66B', '#E8D9B5'],
    ['#141210', '#33291E', '#A8855A', '#D8C49A'],
  ],
  educational: [
    ['#0B1220', '#1B3A5C', '#6D8BFF', '#B6F6FF'],
    ['#0E1016', '#243A52', '#5EEAD4', '#FFC24B'],
  ],
  scientific: [
    ['#060A14', '#122A44', '#6D8BFF', '#9DB4FF'],
    ['#05070E', '#0F2A3A', '#2DD4BF', '#B6F6FF'],
  ],
  investigative: [
    ['#0A0A0C', '#241A1A', '#F03E3E', '#C9A66B'],
    ['#08080B', '#1A1A22', '#6D8BFF', '#FF6B6B'],
  ],
  nature: [
    ['#04120E', '#0E3A2A', '#5EEAD4', '#F7CE74'],
    ['#0A1208', '#1E3A1A', '#B6D98A', '#FFC24B'],
  ],
}

const CAMERA_CYCLE: CameraMove[] = ['ken-burns', 'pan-left', 'zoom-in', 'pan-right', 'zoom-out', 'static']
const TRANSITION_CYCLE: Transition[] = ['fade', 'dissolve', 'cut', 'slide-left', 'zoom', 'slide-right']

/** Scene counts tuned so each scene lands at a comfortable 25–45s. */
const SCENE_COUNT: Record<DurationMinutes, number> = {
  1: 5,
  3: 7,
  5: 9,
  10: 11,
  15: 13,
  30: 15,
}

/** Beat order for the opening and closing of the film. */
const OPENING: Beat['role'][] = ['hook', 'context', 'subject']
const CLOSING: Beat['role'][] = ['implication', 'conclusion']
const MIDDLE: Beat['role'][] = ['development', 'turning', 'evidence']

function fill(template: string, topic: string): string {
  const capitalised = topic.charAt(0).toUpperCase() + topic.slice(1)
  return template.replace(/\{topic\}/g, topic).replace(/\{Topic\}/g, capitalised)
}

function pick<T>(list: T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length) % list.length]
}

function buildBeatSequence(count: number, rng: () => number): Beat['role'][] {
  const sequence: Beat['role'][] = [...OPENING]
  const remaining = Math.max(0, count - OPENING.length - CLOSING.length)
  for (let i = 0; i < remaining; i += 1) {
    sequence.push(MIDDLE[i % MIDDLE.length])
  }
  // Shuffle the middle a little so two projects on the same topic still differ.
  const middleStart = OPENING.length
  const middleEnd = middleStart + remaining
  const middle = sequence.slice(middleStart, middleEnd)
  for (let i = middle.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[middle[i], middle[j]] = [middle[j], middle[i]]
  }
  return [...OPENING, ...middle, ...CLOSING]
}

function titleFor(topic: string, style: DocStyle, rng: () => number): string {
  const t = topic.charAt(0).toUpperCase() + topic.slice(1)
  const patterns: Record<DocStyle, string[]> = {
    cinematic: [`${t}: A Portrait`, `The Quiet Life of ${t}`, `${t} — In Light and Shadow`],
    historical: [`${t}: The Long Record`, `Before and After ${t}`, `${t} Through the Archive`],
    educational: [`Understanding ${t}`, `${t}, Explained`, `A Field Guide to ${t}`],
    scientific: [`${t}: The Evidence`, `Inside ${t}`, `The Mechanics of ${t}`],
    investigative: [`The ${t} Files`, `${t}: What We Found`, `Following ${t}`],
    nature: [`${t}: A Natural History`, `Wild ${t}`, `${t} in Its Own Time`],
  }
  return pick(patterns[style], rng)
}

function loglineFor(topic: string, style: DocStyle, rng: () => number): string {
  const lines: Record<DocStyle, string[]> = {
    cinematic: [
      `A patient, atmospheric look at ${topic} — and the questions it leaves behind.`,
      `${topic}, told in light, texture and time.`,
    ],
    historical: [
      `How ${topic} was made, changed and remembered across the record.`,
      `A chronological account of ${topic}, from its earliest traces to its present form.`,
    ],
    educational: [
      `A clear, structured explanation of ${topic} — what it is, how it works, and why it matters.`,
      `${topic} broken into plain steps, with the reasoning shown at every stage.`,
    ],
    scientific: [
      `An evidence-led examination of ${topic} and the mechanisms behind it.`,
      `What the data actually says about ${topic}.`,
    ],
    investigative: [
      `A close reading of ${topic}, following the questions most accounts leave open.`,
      `${topic}, traced through the details that do not quite fit.`,
    ],
    nature: [
      `An observational portrait of ${topic}, filmed at its own pace.`,
      `${topic} across a season — slow, immersive and unhurried.`,
    ],
  }
  return pick(lines[style], rng)
}

function synopsisFor(topic: string, style: DocStyle): string {
  return `This ${style} documentary examines ${topic} across its context, mechanics and consequences. It opens with the question that motivates the film, establishes the background that made ${topic} possible, then works through how it functions, the moment it changed, and the evidence that supports the account. It closes by considering what ${topic} means beyond its own boundaries — and what remains open.`
}

export function generateScript(brief: ScriptBrief): GeneratedScript {
  const topic = brief.topic.trim() || 'an unnamed subject'
  const seed = hashString(`${topic}|${brief.style}|${brief.language}|${brief.targetDuration}`)
  const rng = mulberry32(seed)

  const count = SCENE_COUNT[brief.targetDuration]
  const roles = buildBeatSequence(count, rng)
  const totalSeconds = brief.targetDuration * 60
  const palette = pick(STYLE_PALETTES[brief.style], rng)
  const byRole = new Map(BEATS.map((b) => [b.role, b]))

  // Distribute duration with a little natural variation, then correct the drift.
  const weights = roles.map(() => 0.85 + rng() * 0.3)
  const weightSum = weights.reduce((a, b) => a + b, 0)
  let durations = weights.map((w) => Math.round((totalSeconds * w) / weightSum))
  const drift = totalSeconds - durations.reduce((a, b) => a + b, 0)
  durations[durations.length - 1] += drift

  const scenes: Scene[] = roles.map((role, index) => {
    const beat = byRole.get(role)!
    const templates = brief.language === 'hi' ? beat.hi : beat.en
    const narration = fill(pick(templates, rng), topic)
    const chapter = brief.language === 'hi' ? beat.chapter.hi : beat.chapter.en
    const shotSeed = hashString(`${topic}|${index}|${role}`)

    return {
      id: uid('scene'),
      title: chapter,
      narration,
      visualPrompt: `${STYLE_PROMPTS[brief.style]} — ${topic}, ${chapter.toLowerCase()}`,
      camera: CAMERA_CYCLE[index % CAMERA_CYCLE.length],
      transition: TRANSITION_CYCLE[index % TRANSITION_CYCLE.length],
      duration: Math.max(6, durations[index]),
      overlay: index === 0 ? titleFor(topic, brief.style, rng) : chapter,
      visual: {
        kind: 'procedural',
        prompt: `${topic} — ${chapter}`,
        seed: shotSeed,
        palette,
      },
      audio: null,
    }
  })

  return {
    title: titleFor(topic, brief.style, rng),
    logline: loglineFor(topic, brief.style, rng),
    synopsis: synopsisFor(topic, brief.style),
    scenes,
  }
}

export const SCRIPT_ENGINE_NOTE =
  'Scripts are composed by Reelwright’s offline beat engine — a curated, rule-based narrative library, not a language model. Every scene is fully editable.'

/** Palette for a style, deterministic per seed. Used when adding new scenes. */
export function paletteForStyle(style: DocStyle, seed: number): string[] {
  const options = STYLE_PALETTES[style]
  return options[seed % options.length]
}
