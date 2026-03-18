import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_ROUTES = ['/onboarding', '/auth', '/success', '/privacy', '/', '/share'];

export function OnboardingGuard() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    // Routes publiques — pas de vérification
    if (PUBLIC_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))) return;

    // OAuth en cours — ne pas interrompre
    if (search.includes('code=') || window.location.hash.includes('access_token')) return;

    // Attendre fin du chargement
    if (isLoading) return;

    // Pas connecté → page de connexion (sauf /profile et /cave accessibles en lecture)
    if (!user) {
      if (pathname === '/profile' || pathname === '/cave') return;
      navigate('/auth', { replace: true });
      return;
    }

    // Connecté mais onboarding pas fait
    const localDone = localStorage.getItem('sommely_onboarding_done');
    if (localDone) return;

    // Ne jamais rediriger depuis /profile ou /cave — laisser l'utilisateur accéder
    if (pathname === '/profile' || pathname === '/cave') return;

    // Sinon on vérifie Supabase
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [pathname, search, user, profile, isLoading, navigate]);

  return null;
}
