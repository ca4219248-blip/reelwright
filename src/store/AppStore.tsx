import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { loadProjects, loadSettings, removeProject as dbRemove, saveProject, saveSettings } from '@/lib/db'
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type Project,
} from '@/lib/types'
import { uid } from '@/lib/utils'

/**
 * Application store. Projects live in IndexedDB (they embed media), settings
 * alongside them. Writes are debounced per-project so typing in the editor
 * doesn't thrash storage.
 */

export interface ProjectBrief {
  name: string
  topic: string
  language: Project['language']
  style: Project['style']
  aspectRatio: Project['aspectRatio']
  targetDuration: Project['targetDuration']
}

interface AppStoreValue {
  projects: Project[]
  settings: AppSettings
  ready: boolean
  getProject: (id: string) => Project | undefined
  createProject: (brief: ProjectBrief) => Project
  updateProject: (id: string, updater: (p: Project) => Project) => void
  deleteProject: (id: string) => void
  duplicateProject: (id: string) => Project | null
  updateSettings: (patch: Partial<AppSettings>) => void
}

const AppStoreContext = createContext<AppStoreValue | null>(null)

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [ready, setReady] = useState(false)
  const saveTimers = useRef(new Map<string, number>())

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [loadedProjects, loadedSettings] = await Promise.all([loadProjects(), loadSettings()])
      if (cancelled) return
      setProjects(loadedProjects.sort((a, b) => b.updatedAt - a.updatedAt))
      if (loadedSettings) setSettings({ ...DEFAULT_SETTINGS, ...loadedSettings })
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const scheduleSave = useCallback((project: Project) => {
    const existing = saveTimers.current.get(project.id)
    if (existing) window.clearTimeout(existing)
    const timer = window.setTimeout(() => {
      saveTimers.current.delete(project.id)
      void saveProject(project)
    }, 350)
    saveTimers.current.set(project.id, timer)
  }, [])

  const updateProject = useCallback(
    (id: string, updater: (p: Project) => Project) => {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p
          const next = { ...updater(p), updatedAt: Date.now() }
          scheduleSave(next)
          return next
        }),
      )
    },
    [scheduleSave],
  )

  const createProject = useCallback((brief: ProjectBrief): Project => {
    const now = Date.now()
    const project: Project = {
      id: uid('proj'),
      name: brief.name,
      createdAt: now,
      updatedAt: now,
      topic: brief.topic,
      language: brief.language,
      style: brief.style,
      aspectRatio: brief.aspectRatio,
      targetDuration: brief.targetDuration,
      title: '',
      logline: '',
      synopsis: '',
      scenes: [],
      cues: [],
      subtitleStyle: {
        fontFamily: 'Inter',
        scale: 1,
        color: '#FFFFFF',
        background: true,
        position: 'bottom',
        bold: true,
      },
      music: null,
      narration: { voiceURI: null, rate: 1, pitch: 1, volume: 1 },
      status: 'draft',
      generator: 'offline',
    }
    setProjects((prev) => [project, ...prev])
    void saveProject(project)
    return project
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id))
    void dbRemove(id)
  }, [])

  const duplicateProject = useCallback(
    (id: string): Project | null => {
      const source = projects.find((p) => p.id === id)
      if (!source) return null
      const now = Date.now()
      const copy: Project = {
        ...structuredClone(source),
        id: uid('proj'),
        name: `${source.name} (copy)`,
        createdAt: now,
        updatedAt: now,
        status: 'draft',
        exportedAt: undefined,
        lastExportName: undefined,
      }
      setProjects((prev) => [copy, ...prev])
      void saveProject(copy)
      return copy
    },
    [projects],
  )

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      void saveSettings(next)
      return next
    })
  }, [])

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects])

  const value = useMemo<AppStoreValue>(
    () => ({
      projects,
      settings,
      ready,
      getProject,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      updateSettings,
    }),
    [
      projects,
      settings,
      ready,
      getProject,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      updateSettings,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext)
  if (!ctx) throw new Error('useAppStore must be used inside <AppStoreProvider>')
  return ctx
}

export function useProject(id: string | undefined) {
  const { getProject, updateProject } = useAppStore()
  const project = id ? getProject(id) : undefined
  const update = useCallback(
    (updater: (p: Project) => Project) => {
      if (id) updateProject(id, updater)
    },
    [id, updateProject],
  )
  return { project, update }
}
