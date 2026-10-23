import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AppStoreProvider } from '@/store/AppStore'
import { ToastProvider } from '@/components/ui/toast'
import { useHashRoute } from '@/hooks/useHashRoute'
import { Landing } from '@/views/Landing'
import { Dashboard } from '@/views/Dashboard'
import { Wizard } from '@/views/Wizard'
import { Studio } from '@/views/Studio'
import { Settings } from '@/views/Settings'

/** Keeps a render error in one view from taking down the whole application. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6">
          <div className="max-w-md text-center">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-record-500/15 text-record-400">
              <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            </span>
            <h1 className="mt-5 font-display text-xl font-semibold text-white">Something went wrong</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{this.state.error.message}</p>
            <Button
              className="mt-6"
              onClick={() => {
                this.setState({ error: null })
                window.location.hash = '/app'
              }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Back to projects
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function Router() {
  const { path, navigate } = useHashRoute()
  const segments = path.split('/').filter(Boolean)

  if (segments.length === 0) return <Landing navigate={navigate} />

  const [first, second] = segments

  switch (first) {
    case 'app':
      return <Dashboard navigate={navigate} />
    case 'new':
      return <Wizard navigate={navigate} />
    case 'settings':
      return <Settings navigate={navigate} />
    case 'studio':
      return second ? <Studio navigate={navigate} id={second} /> : <Dashboard navigate={navigate} />
    default:
      return <Landing navigate={navigate} />
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppStoreProvider>
        <ToastProvider>
          <Router />
        </ToastProvider>
      </AppStoreProvider>
    </ErrorBoundary>
  )
}
