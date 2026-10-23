import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export function DropdownMenuContent({
  children,
  align = 'end',
  className,
}: {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end'
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        align={align}
        sideOffset={6}
        className={cn(
          'z-50 min-w-[11rem] overflow-hidden rounded-2xl border border-white/15 bg-ink-800/95 p-1.5 shadow-card backdrop-blur',
          className,
        )}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  )
}

export function DropdownMenuItem({
  children,
  onSelect,
  destructive,
  className,
}: {
  children: React.ReactNode
  onSelect?: () => void
  destructive?: boolean
  className?: string
}) {
  return (
    <DropdownMenuPrimitive.Item
      onSelect={onSelect}
      className={cn(
        'flex cursor-pointer select-none items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none transition-colors',
        destructive
          ? 'text-record-400 data-[highlighted]:bg-record-500/15'
          : 'text-slate-200 data-[highlighted]:bg-white/10 data-[highlighted]:text-white',
        className,
      )}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  )
}

export function DropdownMenuSeparator() {
  return <DropdownMenuPrimitive.Separator className="my-1 h-px bg-white/10" />
}
