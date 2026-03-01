import { NavLink, useLocation } from 'react-router-dom'
import { Home, ScanLine, Wine, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', icon: Home, label: 'Accueil' },
  { to: '/scan', icon: ScanLine, label: 'Scan' },
  { to: '/cave', icon: Wine, label: 'Cave' },
  { to: '/profil', icon: User, label: 'Profil' },
]

export function BottomBar() {
  const location = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb">
      <div className="backdrop-blur-md bg-white/80 border-t border-stone-200/80">
        <div className="flex items-end justify-around h-16 px-2 max-w-lg mx-auto">
          {tabs.map(({ to, icon: Icon, label }) => {
            const isScan = to === '/scan'
            const isActive = location.pathname === to

            if (isScan) {
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={cn(
                    'flex flex-col items-center justify-center -mb-6 w-14 h-14 rounded-full shadow-lg transition-transform active:scale-95',
                    'bg-primary text-white'
                  )}
                >
                  <Icon className="w-6 h-6" strokeWidth={2.5} />
                  <span className="text-[10px] font-medium mt-0.5">Scan</span>
                </NavLink>
              )
            }

            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 py-2 text-stone-500 transition-colors',
                  isActive && 'text-primary'
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
                <span className="text-[10px] font-medium mt-0.5">{label}</span>
              </NavLink>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
