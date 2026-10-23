import { createContext, useContext, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/* Surfaces                                                                    */
/* -------------------------------------------------------------------------- */

export function Card({ className, interactive = false, ...props }: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'gradient-border glass rounded-3xl shadow-card',
        interactive && 'transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-glow-sm',
        className,
      )}
      {...props}
    />
  )
}

export function Panel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-white/10 bg-ink-900/70', className)} {...props} />
}

export function Badge({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-slate-300',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/* -------------------------------------------------------------------------- */
/* Form controls                                                               */
/* -------------------------------------------------------------------------- */

export function Label({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn('text-sm font-medium text-slate-200', className)} {...props}>
      {children}
    </label>
  )
}

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label?: string
  hint?: string
  htmlFor?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
    </div>
  )
}

const controlBase =
  'w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-gold-400/60 focus:outline-none disabled:opacity-50'

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlBase, className)} {...props} />
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(controlBase, 'min-h-[6rem] resize-y leading-relaxed', className)} {...props} />
}

export interface SelectOption {
  value: string
  label: string
}

export function Select({
  className,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { options: SelectOption[] }) {
  return (
    <div className="relative">
      <select
        className={cn(controlBase, 'appearance-none pr-10 [&>option]:bg-ink-800', className)}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    </div>
  )
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  id,
}: {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label: string
  disabled?: boolean
  id?: string
}) {
  const generated = useId()
  const switchId = id ?? generated
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full border p-0 transition-colors disabled:opacity-50',
          checked ? 'border-gold-400/60 bg-gold-500/40' : 'border-white/15 bg-white/10',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 block rounded-full bg-white transition-[left] duration-200',
            checked ? 'left-[1.35rem]' : 'left-0.5',
          )}
          style={{ height: '1.125rem', width: '1.125rem' }}
        />
      </button>
      <label htmlFor={switchId} className="cursor-pointer text-sm text-slate-300">
        {label}
      </label>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Progress                                                                    */
/* -------------------------------------------------------------------------- */

export function Progress({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-white/10', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gold-gradient transition-[width] duration-200"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Tabs                                                                        */
/* -------------------------------------------------------------------------- */

const TabsCtx = createContext<{ value: string; setValue: (v: string) => void } | null>(null)

export function Tabs({
  value,
  onValueChange,
  children,
  className,
}: {
  value: string
  onValueChange: (v: string) => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <TabsCtx.Provider value={{ value, setValue: onValueChange }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="tablist" className={cn('inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.03] p-1', className)}>
      {children}
    </div>
  )
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(TabsCtx)
  if (!ctx) throw new Error('Tab must be used within <Tabs>')
  const active = ctx.value === value
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-white text-ink-950' : 'text-slate-300 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}

export function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useContext(TabsCtx)
  if (!ctx || ctx.value !== value) return null
  return <div role="tabpanel">{children}</div>
}

/* -------------------------------------------------------------------------- */
/* Segmented control (used for duration, style, aspect ratio)                  */
/* -------------------------------------------------------------------------- */

export function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: { value: T; label: string; hint?: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
  ariaLabel: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-xl border px-4 py-2.5 text-left text-sm transition-all',
              active
                ? 'border-gold-400/60 bg-gold-500/15 text-white shadow-glow-sm'
                : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white',
            )}
          >
            <span className="block font-medium">{option.label}</span>
            {option.hint && <span className="mt-0.5 block text-xs text-slate-500">{option.hint}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  return { value, setValue, toggle: () => setValue((v) => !v) }
}
