import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_ROUTES = ['/auth', '/auth/confirm', '/onboarding', '/invite', '/premium', '/share', '/success', '/privacy', '/', '/vin'];
const ONBOARDING_ROUTES = ['/onboarding'];

export function OnboardingGuard() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    // OAuth / magic link en cours — ne jamais interrompre
    if (search.includes('code=') || window.location.hash.includes('access_token')) return;

    // Attendre fin du chargement
    if (isLoading) return;

    // Pas connecté → page de connexion (sauf routes publiques et /profile, /cave)
    if (!user) {
      if (PUBLIC_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))) return;
      if (pathname === '/profile' || pathname === '/cave') return;
      navigate('/auth', { replace: true });
      return;
    }

    // Connecté : vérifier onboarding
    const localDone = localStorage.getItem('sommely_onboarding_done');
    if (localDone) return;

    // Ne jamais rediriger depuis /profile ou /cave — laisser l'utilisateur accéder
    if (pathname === '/profile' || pathname === '/cave') return;

    // Connecté mais onboarding pas fait → /onboarding (sauf si déjà dessus)
    if (profile && !profile.onboarding_completed) {
      const alreadyOnAuthOrOnboarding = ['/auth', '/auth/confirm', '/onboarding'].some(
        p => pathname === p || pathname.startsWith(p + '/')
      );
      if (!alreadyOnAuthOrOnboarding) {
        navigate('/onboarding', { replace: true });
      } else if (pathname === '/auth' || pathname.startsWith('/auth/')) {
        // Sur /auth avec session : rediriger vers onboarding
        navigate('/onboarding', { replace: true });
      }
      return;
    }
  }, [pathname, search, user, profile, isLoading, navigate]);

  return null;
}
