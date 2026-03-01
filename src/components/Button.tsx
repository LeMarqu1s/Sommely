import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'lg',
  fullWidth,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-[0.98] min-h-[48px]',
        fullWidth && 'w-full',
        size === 'sm' && 'min-h-[36px] px-4 text-sm',
        size === 'md' && 'px-6 text-base',
        size === 'lg' && 'px-8 text-base',
        variant === 'primary' && 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary/90',
        variant === 'secondary' && 'bg-secondary text-stone-900 shadow-lg shadow-secondary/30 hover:bg-secondary/90',
        variant === 'outline' && 'border-2 border-primary text-primary hover:bg-primary/10',
        variant === 'ghost' && 'text-stone-700 hover:bg-stone-200/50',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
