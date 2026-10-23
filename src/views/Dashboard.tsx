import { useMemo, useState } from 'react'
import {
  Clapperboard,
  Clock,
  Copy,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { Badge, Card, Input } from '@/components/ui/primitives'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown'
import { useToast } from '@/components/ui/toast'
import { useAppStore } from '@/store/AppStore'
import { DOC_STYLES, type Project } from '@/lib/types'
import { formatTime, totalDuration } from '@/lib/format'
import { proceduralThumbnail } from '@/engine/visuals'

const STATUS_LABEL: Record<Project['status'], string> = {
  draft: 'Draft',
  'script-ready': 'Script ready',
  'storyboard-ready': 'Storyboard ready',
  narrated: 'Narrated',
  exported: 'Exported',
}

export function Dashboard({ navigate }: { navigate: (to: string) => void }) {
  const { projects, ready, deleteProject, duplicateProject, updateProject } = useAppStore()
  const { push } = useToast()
  const [renaming, setRenaming] = useState<Project | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deleting, setDeleting] = useState<Project | null>(null)

  const sorted = useMemo(() => [...projects].sort((a, b) => b.updatedAt - a.updatedAt), [projects])

  return (
    <AppShell
      navigate={navigate}
      active="dashboard"
      right={
        <Button size="sm" onClick={() => navigate('/new')}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New documentary
        </Button>
      }
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">Projects</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            {projects.length === 0
              ? 'Nothing here yet.'
              : `${projects.length} ${projects.length === 1 ? 'documentary' : 'documentaries'} saved on this device.`}
          </p>
        </div>
      </div>

      {!ready ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState onCreate={() => navigate('/new')} />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => navigate(`/studio/${project.id}`)}
              onRename={() => {
                setRenaming(project)
                setRenameValue(project.name)
              }}
              onDuplicate={() => {
                const copy = duplicateProject(project.id)
                if (copy) push({ kind: 'success', title: 'Project duplicated', description: copy.name })
              }}
              onDelete={() => setDeleting(project)}
            />
          ))}
        </div>
      )}

      {/* Rename dialog */}
      <Dialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <DialogContent
          title="Rename project"
          description="This only changes the display name."
          footer={
            <>
              <Button variant="ghost" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (renaming && renameValue.trim()) {
                    updateProject(renaming.id, (p) => ({ ...p, name: renameValue.trim() }))
                    push({ kind: 'success', title: 'Project renamed' })
                  }
                  setRenaming(null)
                }}
              >
                Save
              </Button>
            </>
          }
        >
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            aria-label="Project name"
            placeholder="Project name"
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent
          title="Delete this project?"
          description={`“${deleting?.name ?? ''}” and all of its scenes, media and settings will be removed from this device. This cannot be undone.`}
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (deleting) {
                    deleteProject(deleting.id)
                    push({ kind: 'info', title: 'Project deleted' })
                  }
                  setDeleting(null)
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete project
              </Button>
            </>
          }
        />
      </Dialog>
    </AppShell>
  )
}

function ProjectCard({
  project,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  project: Project
  onOpen: () => void
  onRename: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const thumb = useMemo(() => {
    const first = project.scenes[0]
    if (!first) return null
    if (first.visual.dataUrl) return first.visual.dataUrl
    return proceduralThumbnail(first.visual.seed, first.visual.palette, 480, 270)
  }, [project.scenes])

  const styleLabel = DOC_STYLES.find((s) => s.id === project.style)?.label ?? project.style
  const duration = totalDuration(project.scenes)

  return (
    <Card interactive className="flex flex-col overflow-hidden">
      <button
        type="button"
        onClick={onOpen}
        className="relative block aspect-video w-full overflow-hidden border-b border-white/10"
        aria-label={`Open ${project.name}`}
      >
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-ink-800 text-slate-600">
            <Clapperboard className="h-8 w-8" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 to-transparent" />
        <div className="absolute left-3 top-3">
          <Badge className={project.status === 'exported' ? 'border-teal-400/30 bg-teal-400/10 text-teal-300' : ''}>
            {STATUS_LABEL[project.status]}
          </Badge>
        </div>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate font-display text-base font-semibold text-white">{project.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{project.topic}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${project.name}`}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={onOpen}>
                <Clapperboard className="h-4 w-4" aria-hidden="true" />
                Open studio
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onRename}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onDuplicate}>
                <Copy className="h-4 w-4" aria-hidden="true" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onSelect={onDelete}>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {styleLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clapperboard className="h-3.5 w-3.5" aria-hidden="true" />
            {project.scenes.length} scenes
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatTime(duration)}
          </span>
        </div>

        <Button variant="secondary" size="sm" className="mt-5 w-full" onClick={onOpen}>
          Open studio
        </Button>
      </div>
    </Card>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-4xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-20 text-center">
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-500/15 text-gold-300 ring-1 ring-inset ring-gold-400/25">
        <Clapperboard className="h-6 w-6" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-xl font-semibold text-white">No documentaries yet</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
        Give Reelwright a topic and it will draft the script, break it into scenes, and hand you a timeline you can
        narrate, subtitle and render.
      </p>
      <Button className="mt-7" onClick={onCreate}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Create your first documentary
      </Button>
    </div>
  )
}
