import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { uid } from '@/lib/utils'

type ToastKind = 'info' | 'success' | 'error'

interface Toast {
  id: string
  kind: ToastKind
  title: string
  description?: string
}

interface ToastContextValue {
  push: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const ICONS: Record<ToastKind, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertTriangle,
}

const ACCENT: Record<ToastKind, string> = {
  info: 'text-azure-300',
  success: 'text-teal-300',
  error: 'text-record-400',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = uid('toast')
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }])
      window.setTimeout(() => dismiss(id), toast.kind === 'error' ? 7000 : 4500)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ push }), [push])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.kind]
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-white/15 bg-ink-800/95 p-3.5 shadow-card backdrop-blur"
                role="status"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${ACCENT[toast.kind]}`} aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{toast.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  aria-label="Dismiss notification"
                  className="rounded-full p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
