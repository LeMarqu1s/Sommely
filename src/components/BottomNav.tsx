import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Home, User } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Pages où la nav est cachée (Scanner, Cave et Profil gardent la barre visible)
  const hidden = ['/onboarding', '/result', '/premium', '/sommelier', '/menu', '/food-pairing', '/investment', '/auth', '/success', '/cave-meal', '/shop'];
  if (hidden.some(p => pathname.startsWith(p))) return null;

  const items: { path: string; icon: typeof Home | null; label: string; emoji: string | null }[] = [
    { path: '/', icon: Home, label: 'Accueil', emoji: null },
    { path: '/scan', icon: Camera, label: 'Scanner', emoji: null },
    { path: '/cave', icon: null, label: 'Ma cave', emoji: '🍾' },
    { path: '/profile', icon: User, label: 'Profil', emoji: null },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 pb-safe z-30 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2">
        {items.map(item => {
          const active = pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl border-none cursor-pointer transition-all ${active ? 'bg-burgundy-dark/8' : 'bg-transparent'}`}
            >
              {item.emoji ? (
                <span className={`text-2xl transition-all ${active ? 'scale-110' : 'opacity-60'}`}>{item.emoji}</span>
              ) : item.icon ? (
                <item.icon size={22} color={active ? '#722F37' : '#9E9E9E'} strokeWidth={active ? 2.5 : 1.8} />
              ) : null}
              <span className={`text-xs font-semibold transition-all ${active ? 'text-burgundy-dark' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
