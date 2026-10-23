import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-300 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-gold-gradient text-ink-950 shadow-glow-sm hover:shadow-glow hover:brightness-105 bg-[length:200%_200%] animate-gradient-x',
        secondary: 'glass text-white hover:bg-white/[0.07] hover:border-white/20',
        ghost: 'text-slate-300 hover:text-white hover:bg-white/[0.06]',
        outline: 'border border-white/15 text-white hover:border-gold-400/60 hover:bg-gold-500/10',
        azure: 'bg-azure-gradient text-white shadow-glow-azure hover:brightness-110',
        danger: 'border border-record-500/40 text-record-400 hover:bg-record-500/15',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-5 text-sm',
        lg: 'h-12 px-7 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  },
)
Button.displayName = 'Button'

export { buttonVariants }
