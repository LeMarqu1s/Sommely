import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_ROUTES = ['/onboarding', '/auth', '/success', '/privacy', '/'];

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

    // Pas connecté → page de connexion
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // Connecté mais onboarding pas fait
    // On vérifie d'abord localStorage (plus fiable que Supabase en temps réel)
    const localDone = localStorage.getItem('sommely_onboarding_done');
    if (localDone) return; // localStorage dit que c'est fait → OK

    // Sinon on vérifie Supabase
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [pathname, search, user, profile, isLoading, navigate]);

  return null;
}
