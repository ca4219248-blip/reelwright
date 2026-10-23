import { Link } from 'lucide-react'
import { Logo } from '@/components/primitives'
import { cn } from '@/lib/utils'

/** Shared chrome for the in-app views (dashboard, wizard, studio, settings). */
export function AppShell({
  children,
  navigate,
  active,
  right,
  wide = false,
}: {
  children: React.ReactNode
  navigate: (to: string) => void
  active: 'dashboard' | 'wizard' | 'studio' | 'settings'
  right?: React.ReactNode
  wide?: boolean
}) {
  const items: { id: typeof active; label: string; to: string }[] = [
    { id: 'dashboard', label: 'Projects', to: '/app' },
    { id: 'wizard', label: 'New documentary', to: '/new' },
    { id: 'settings', label: 'Settings', to: '/settings' },
  ]

  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/85 backdrop-blur-xl">
        <div className={cn('mx-auto flex items-center gap-4 px-4 py-3 sm:px-6', wide ? 'max-w-8xl' : 'max-w-7xl')}>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-full transition-opacity hover:opacity-90"
            aria-label="Reelwright home"
          >
            <Logo />
          </button>

          <nav aria-label="Application" className="ml-2 hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.to)}
                aria-current={active === item.id ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  active === item.id
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white',
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {right}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-400 transition-colors hover:text-white sm:inline-flex"
            >
              <Link className="h-3.5 w-3.5" aria-hidden="true" />
              Home
            </button>
          </div>
        </div>

        {/* Compact nav for small screens */}
        <nav aria-label="Application mobile" className="flex items-center gap-1 overflow-x-auto px-4 pb-2 md:hidden no-scrollbar">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.to)}
              aria-current={active === item.id ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                active === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white',
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>

      <main className={cn('mx-auto px-4 py-8 sm:px-6', wide ? 'max-w-8xl' : 'max-w-7xl')}>{children}</main>
    </div>
  )
}
