import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'brand' | 'success' | 'warning' | 'info'
  className?: string
}

export function Badge({ children, variant = 'brand', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold',
        {
          'bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300': variant === 'brand',
          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300': variant === 'success',
          'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300': variant === 'warning',
          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
