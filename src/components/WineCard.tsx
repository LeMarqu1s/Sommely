import { cn } from '@/lib/utils'
import type { Wine } from '@/data'

interface WineCardProps {
  wine: Wine
  onClick?: () => void
  compact?: boolean
  className?: string
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-success'
  if (score >= 60) return 'text-warning'
  return 'text-danger'
}

export function WineCard({ wine, onClick, compact, className }: WineCardProps) {
  return (
    <article
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl shadow-lg shadow-stone-200/50 bg-white/90 backdrop-blur-sm overflow-hidden transition-all active:scale-[0.99]',
        onClick && 'cursor-pointer hover:shadow-xl',
        compact ? 'flex gap-3 p-3' : 'p-4',
        className
      )}
    >
      <div className={cn('bg-stone-100 rounded-xl overflow-hidden flex-shrink-0', compact ? 'w-16 h-20' : 'w-full aspect-[3/4]')}>
        <img src={wine.imageUrl} alt={wine.name} className="w-full h-full object-cover" />
      </div>
      <div className={cn('flex flex-col min-w-0', compact ? 'flex-1 justify-center' : 'mt-3')}>
        <h3 className={cn('font-display font-semibold text-stone-900', compact ? 'text-sm' : 'text-lg')}>{wine.name}</h3>
        <p className="text-stone-500 text-sm">{wine.region} · {wine.year}</p>
        <div className={cn('flex items-center gap-2 mt-1', compact && 'mt-0.5')}>
          <span className={cn('font-semibold', scoreColor(wine.score))}>{wine.score}/100</span>
          <span className="text-stone-400 text-sm">Match {wine.profilGout}%</span>
        </div>
      </div>
    </article>
  )
}
