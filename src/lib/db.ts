import type { AppSettings, Project } from './types'

/**
 * Tiny IndexedDB wrapper. Projects (which embed image/audio data URLs) live
 * here rather than in localStorage, because localStorage's ~5 MB quota cannot
 * hold media. Falls back to an in-memory map when IndexedDB is unavailable
 * (e.g. private-mode edge cases) so the app still runs for the session.
 */

const DB_NAME = 'reelwright'
const DB_VERSION = 1
const PROJECTS = 'projects'
const SETTINGS = 'settings'

let memoryFallback: { projects: Map<string, Project>; settings: Map<string, unknown> } | null = null

function useMemory(): boolean {
  if (memoryFallback) return true
  return typeof indexedDB === 'undefined'
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(PROJECTS)) {
        db.createObjectStore(PROJECTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(SETTINGS)) {
        db.createObjectStore(SETTINGS, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('Failed to open IndexedDB'))
  })
}

async function withStore<T>(
  store: string,
  mode: IDBTransactionMode,
  run: (s: IDBObjectStore) => IDBRequest,
): Promise<T> {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(store, mode)
    const req = run(tx.objectStore(store))
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'))
    tx.oncomplete = () => db.close()
  })
}

export async function loadProjects(): Promise<Project[]> {
  if (useMemory()) {
    return memoryFallback ? [...memoryFallback.projects.values()] : []
  }
  try {
    const all = await withStore<Project[]>(PROJECTS, 'readonly', (s) => s.getAll())
    return all ?? []
  } catch {
    memoryFallback = memoryFallback ?? { projects: new Map(), settings: new Map() }
    return [...memoryFallback.projects.values()]
  }
}

export async function saveProject(project: Project): Promise<void> {
  if (useMemory()) {
    memoryFallback = memoryFallback ?? { projects: new Map(), settings: new Map() }
    memoryFallback.projects.set(project.id, project)
    return
  }
  try {
    await withStore(PROJECTS, 'readwrite', (s) => s.put(project))
  } catch {
    memoryFallback = memoryFallback ?? { projects: new Map(), settings: new Map() }
    memoryFallback.projects.set(project.id, project)
  }
}

export async function removeProject(id: string): Promise<void> {
  if (useMemory()) {
    memoryFallback?.projects.delete(id)
    return
  }
  try {
    await withStore(PROJECTS, 'readwrite', (s) => s.delete(id))
  } catch {
    memoryFallback?.projects.delete(id)
  }
}

export async function loadSettings(): Promise<Partial<AppSettings> | null> {
  if (useMemory()) {
    return (memoryFallback?.settings.get('app') as Partial<AppSettings>) ?? null
  }
  try {
    const row = await withStore<{ key: string; value: Partial<AppSettings> } | undefined>(
      SETTINGS,
      'readonly',
      (s) => s.get('app'),
    )
    return row?.value ?? null
  } catch {
    return null
  }
}

export async function saveSettings(value: AppSettings): Promise<void> {
  if (useMemory()) {
    memoryFallback = memoryFallback ?? { projects: new Map(), settings: new Map() }
    memoryFallback.settings.set('app', value)
    return
  }
  try {
    await withStore(SETTINGS, 'readwrite', (s) => s.put({ key: 'app', value }))
  } catch {
    memoryFallback = memoryFallback ?? { projects: new Map(), settings: new Map() }
    memoryFallback.settings.set('app', value)
  }
}
