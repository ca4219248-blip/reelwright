import { useCallback, useEffect, useState } from 'react'

/**
 * Minimal hash router. Hash routing (rather than history routing) keeps deep
 * links working on GitHub Pages, where the server cannot rewrite paths.
 */

export function useHashRoute(): { path: string; navigate: (to: string) => void } {
  const [path, setPath] = useState(() => (typeof window === 'undefined' ? '/' : window.location.hash.slice(1) || '/'))

  useEffect(() => {
    const onChange = () => setPath(window.location.hash.slice(1) || '/')
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((to: string) => {
    const next = to.startsWith('/') ? to : `/${to}`
    if (window.location.hash.slice(1) === next) return
    window.location.hash = next
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  return { path, navigate }
}
