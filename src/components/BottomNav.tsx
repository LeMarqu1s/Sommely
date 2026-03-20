import { useNavigate, useLocation } from 'react-router-dom';
import { Camera, Home, User } from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const hidden = ['/onboarding', '/result', '/menu', '/food-pairing', '/investment', '/auth', '/auth/callback', '/success', '/cave-meal', '/shop'];
  if (hidden.some(p => pathname.startsWith(p))) return null;

  type Item = { path: string; label: string; icon: 'home' | 'scan' | 'antoine' | 'cave' | 'profile' };

  const items: Item[] = [
    { path: '/home', label: 'Accueil', icon: 'home' },
    { path: '/sommelier', label: 'Antoine', icon: 'antoine' },
    { path: '/scan', label: 'Scanner', icon: 'scan' },
    { path: '/cave', label: 'Ma cave', icon: 'cave' },
    { path: '/profile', label: 'Profil', icon: 'profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-1 pb-safe shadow-lg z-[100]">
      <div className="max-w-lg mx-auto flex items-center justify-between py-1.5 px-0.5">
        {items.map(item => {
          const active = pathname === item.path || (item.path !== '/home' && pathname.startsWith(item.path + '/'));
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-1.5 rounded-2xl border-none cursor-pointer transition-all min-w-0 flex-1 max-w-[20%] ${active ? 'bg-burgundy-dark/8' : 'bg-transparent'}`}
            >
              {item.icon === 'home' && (
                <Home size={22} color={active ? '#722F37' : '#9E9E9E'} strokeWidth={active ? 2.5 : 1.8} />
              )}
              {item.icon === 'scan' && (
                <Camera size={22} color={active ? '#722F37' : '#9E9E9E'} strokeWidth={active ? 2.5 : 1.8} />
              )}
              {item.icon === 'antoine' && (
                <div style={{ position: 'relative', display: 'inline-flex' }}>
                  <span style={{ fontSize: 22 }}>💬</span>
                  <span
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      background: '#D4AF37',
                      color: '#2C1810',
                      fontSize: 8,
                      fontWeight: 700,
                      padding: '1px 4px',
                      borderRadius: 6,
                    }}
                  >
                    IA
                  </span>
                </div>
              )}
              {item.icon === 'cave' && (
                <span className={`text-xl transition-all ${active ? 'scale-110' : 'opacity-60'}`}>🍾</span>
              )}
              {item.icon === 'profile' && (
                <User size={22} color={active ? '#722F37' : '#9E9E9E'} strokeWidth={active ? 2.5 : 1.8} />
              )}
              <span className={`text-[10px] font-semibold leading-tight text-center truncate w-full ${active ? 'text-burgundy-dark' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
