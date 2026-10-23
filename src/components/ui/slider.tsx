import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  label,
  displayValue,
  className,
}: {
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
  label: string
  displayValue?: string
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {displayValue && <span className="font-mono text-xs text-slate-400">{displayValue}</span>}
      </div>
      <SliderPrimitive.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        aria-label={label}
      >
        <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-white/15">
          <SliderPrimitive.Range className="absolute h-full bg-gold-gradient" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border-2 border-ink-900 bg-gold-400 shadow-glow-sm transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/60" />
      </SliderPrimitive.Root>
    </div>
  )
}
