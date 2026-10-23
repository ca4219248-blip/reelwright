import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

const offset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 24 },
  down: { x: 0, y: -24 },
  left: { x: 24, y: 0 },
  right: { x: -24, y: 0 },
  none: { x: 0, y: 0 },
}

export function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  direction?: Direction
  delay?: number
}) {
  const reduce = useReducedMotion()
  const { x, y } = reduce ? offset.none : offset[direction]
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x, y }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: '-70px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export function Section({ className, children, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('relative py-20 sm:py-24 lg:py-28', className)} {...props}>
      {children}
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        align === 'center' ? 'mx-auto max-w-2xl items-center text-center' : 'max-w-2xl',
        className,
      )}
    >
      {eyebrow && (
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gold-300">
          <span className="h-1.5 w-1.5 rounded-full bg-gold-400" aria-hidden="true" />
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl font-bold leading-[1.1] tracking-tightest sm:text-4xl lg:text-[2.6rem]">
        {title}
      </h2>
      {description && <p className="text-base leading-relaxed text-slate-400 sm:text-lg">{description}</p>}
    </div>
  )
}

export function AuroraBackground({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gold-500/20 blur-[130px] animate-pulse-glow" />
      <div className="absolute -left-40 top-40 h-[26rem] w-[26rem] rounded-full bg-azure-500/20 blur-[130px]" />
      <div className="absolute -right-32 top-10 h-[24rem] w-[24rem] rounded-full bg-gold-400/15 blur-[130px] animate-float-slow" />
      <div className="absolute inset-0 bg-grid mask-fade-b opacity-40" />
    </div>
  )
}

export function Logo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="rw-mark" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFC24B" />
            <stop offset="0.6" stopColor="#F5A623" />
            <stop offset="1" stopColor="#4F6BF5" />
          </linearGradient>
        </defs>
        <circle cx="16" cy="16" r="9.5" stroke="url(#rw-mark)" strokeWidth="2" />
        <circle cx="16" cy="16" r="3.2" fill="url(#rw-mark)" />
        <path d="M16 3.5v3M16 25.5v3M3.5 16h3M25.5 16h3" stroke="url(#rw-mark)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="font-display text-[1.3rem] font-bold tracking-tight text-white">Reelwright</span>
      )}
    </span>
  )
}
