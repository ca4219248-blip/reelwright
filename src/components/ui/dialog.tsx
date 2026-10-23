import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close

export function DialogContent({
  title,
  description,
  children,
  footer,
  className,
}: {
  title: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  className?: string
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/15 bg-ink-900 p-6 shadow-card focus:outline-none',
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <DialogPrimitive.Title className="font-display text-lg font-semibold text-white">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="mt-1.5 text-sm leading-relaxed text-slate-400">
                {description}
              </DialogPrimitive.Description>
            )}
          </div>
          <DialogPrimitive.Close
            aria-label="Close dialog"
            className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </DialogPrimitive.Close>
        </div>

        {children && <div className="mt-5">{children}</div>}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
