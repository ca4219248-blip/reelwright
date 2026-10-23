import { useState } from 'react'
import { Clapperboard, Film, LayoutGrid, Captions, Mic, Search } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Badge, Tabs, TabList, Tab, TabPanel } from '@/components/ui/primitives'
import { StoryboardTab } from '@/components/studio/StoryboardTab'
import { VoiceTab } from '@/components/studio/VoiceTab'
import { EditorTab } from '@/components/studio/EditorTab'
import { SubtitlesTab } from '@/components/studio/SubtitlesTab'
import { ExportTab } from '@/components/studio/ExportTab'
import { useAppStore, useProject } from '@/store/AppStore'
import { DOC_STYLES } from '@/lib/types'
import { formatTime, totalDuration } from '@/lib/format'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  'script-ready': 'Script ready',
  'storyboard-ready': 'Storyboard ready',
  narrated: 'Narrated',
  exported: 'Exported',
}

export function Studio({ navigate, id }: { navigate: (to: string) => void; id: string }) {
  const { project, update } = useProject(id)
  const { settings } = useAppStore()
  const [tab, setTab] = useState('storyboard')

  if (!project) {
    return (
      <AppShell navigate={navigate} active="dashboard">
        <div className="mx-auto max-w-md py-24 text-center">
          <Search className="mx-auto h-8 w-8 text-slate-600" aria-hidden="true" />
          <h1 className="mt-4 font-display text-xl font-semibold text-white">Project not found</h1>
          <p className="mt-2 text-sm text-slate-400">
            This project may have been deleted, or the link is out of date.
          </p>
          <Button className="mt-6" onClick={() => navigate('/app')}>
            Back to projects
          </Button>
        </div>
      </AppShell>
    )
  }

  const styleLabel = DOC_STYLES.find((s) => s.id === project.style)?.label ?? project.style

  return (
    <AppShell
      navigate={navigate}
      active="studio"
      wide
      right={
        <Button variant="secondary" size="sm" onClick={() => setTab('export')}>
          <Film className="h-4 w-4" aria-hidden="true" />
          Export
        </Button>
      }
    >
      {/* Project header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <input
            value={project.name}
            onChange={(e) => update((p) => ({ ...p, name: e.target.value }))}
            aria-label="Project name"
            className="w-full max-w-xl rounded-lg border border-transparent bg-transparent font-display text-2xl font-bold tracking-tight text-white transition-colors hover:border-white/10 focus:border-gold-400/60 focus:outline-none sm:text-3xl"
          />
          <p className="mt-1.5 line-clamp-1 text-sm text-slate-400">{project.topic}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className="border-gold-400/30 bg-gold-500/10 text-gold-200">{STATUS_LABEL[project.status]}</Badge>
            <Badge>{styleLabel}</Badge>
            <Badge>{project.aspectRatio}</Badge>
            <Badge>{project.language.toUpperCase()}</Badge>
            <Badge>{project.scenes.length} scenes</Badge>
            <Badge>{formatTime(totalDuration(project.scenes))}</Badge>
            <Badge>Offline engine</Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mt-7">
        <TabList className="max-w-full overflow-x-auto no-scrollbar">
          <Tab value="storyboard">
            <span className="inline-flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              Storyboard
            </span>
          </Tab>
          <Tab value="voice">
            <span className="inline-flex items-center gap-2">
              <Mic className="h-3.5 w-3.5" aria-hidden="true" />
              Voice
            </span>
          </Tab>
          <Tab value="editor">
            <span className="inline-flex items-center gap-2">
              <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
              Editor
            </span>
          </Tab>
          <Tab value="subtitles">
            <span className="inline-flex items-center gap-2">
              <Captions className="h-3.5 w-3.5" aria-hidden="true" />
              Subtitles
            </span>
          </Tab>
          <Tab value="export">
            <span className="inline-flex items-center gap-2">
              <Film className="h-3.5 w-3.5" aria-hidden="true" />
              Export
            </span>
          </Tab>
        </TabList>

        <div className="mt-6">
          <TabPanel value="storyboard">
            <StoryboardTab project={project} update={update} settings={settings} />
          </TabPanel>
          <TabPanel value="voice">
            <VoiceTab project={project} update={update} />
          </TabPanel>
          <TabPanel value="editor">
            <EditorTab project={project} update={update} />
          </TabPanel>
          <TabPanel value="subtitles">
            <SubtitlesTab project={project} update={update} />
          </TabPanel>
          <TabPanel value="export">
            <ExportTab project={project} update={update} />
          </TabPanel>
        </div>
      </Tabs>

      {project.logline && (
        <p className="mt-8 max-w-3xl border-t border-white/10 pt-6 text-sm italic leading-relaxed text-slate-500">
          {project.logline}
        </p>
      )}
    </AppShell>
  )
}
