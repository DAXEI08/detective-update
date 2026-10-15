import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  icon?: ReactNode
  size?: 'md' | 'lg' | 'sm'
}
const base = 'tap inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-45 disabled:cursor-not-allowed select-none'
const variants: Record<Variant, string> = {
  primary: 'bg-gold-500 text-ink-900 hover:bg-gold-400 active:bg-gold-600',
  secondary: 'bg-ink-700 text-cream-100 border border-ink-500 hover:bg-ink-600',
  ghost: 'text-cream-200 hover:bg-ink-700/70',
  danger: 'bg-bad/15 text-bad border border-bad/40 hover:bg-bad/25',
}
const sizes = { sm: 'px-3 text-sm', md: 'px-4 text-sm sm:text-base', lg: 'px-6 text-base sm:text-lg min-h-[52px]' }

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', icon, className = '', children, type = 'button', ...rest }, ref,
) {
  return (
    <button ref={ref} type={type} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {icon}
      {children}
    </button>
  )
})
