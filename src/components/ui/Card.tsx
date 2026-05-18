import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
}

export function Card({ children, className, hoverable = false }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-gray-200 dark:border-gray-700/50 bg-white dark:bg-gray-900/50 p-6',
        hoverable && 'transition-all duration-300 hover:shadow-xl hover:shadow-brand-500/10 hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
