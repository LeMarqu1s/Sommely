import { useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

// Pages où le header global est masqué (elles ont leur propre branding full-screen)
const HIDDEN_ROUTES = ['/', '/onboarding', '/auth', '/auth/callback', '/invite', '/sommelier', '/privacy', '/result', '/share', '/menu', '/food-pairing', '/cave-meal', '/investment', '/shop', '/premium', '/success'];

export function GlobalLogoHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isHidden = HIDDEN_ROUTES.some(r =>
    r === '/' ? pathname === '/' : pathname.startsWith(r)
  );

  if (isHidden) return null;

  return (
    // Pas de right:0 — on couvre uniquement la zone du pill, pas toute la largeur
    // Pas de backdrop-filter sur le wrapper — évite les bugs d'interception de touch sur iOS WebKit
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        pointerEvents: 'none',
      }}
    >
      <button
        onClick={() => navigate('/home')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          margin: '8px 14px',
          padding: '8px 10px',
          background: '#722F37',
          borderRadius: '999px',
          border: '1px solid rgba(255,255,255,0.18)',
          cursor: 'pointer',
          pointerEvents: 'auto',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
        }}
      >
        <Logo size={26} variant="white" />
      </button>
    </div>
  );
}
