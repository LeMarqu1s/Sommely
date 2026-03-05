import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const { user, profile, isLoading } = useAuth();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const publicRoutes = ['/onboarding', '/auth', '/success', '/privacy', '/'];
    if (publicRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))) return;

    // Callback OAuth — laisser Supabase traiter le token
    if (hash && hash.includes('access_token')) return;

    // Annule tout timer précédent
    if (redirectTimer.current) clearTimeout(redirectTimer.current);

    // Attendre que le chargement soit fini
    if (isLoading) return;

    // Délai de 800ms pour laisser le profil se charger depuis Supabase
    redirectTimer.current = setTimeout(() => {
      if (!user) {
        // Vérifie le localStorage avant de rediriger
        const done = localStorage.getItem('sommely_onboarding_done');
        if (!done) {
          navigate('/auth', { replace: true });
        }
        return;
      }

      // Connecté : vérifie onboarding
      const done = localStorage.getItem('sommely_onboarding_done');
      if (!done && profile && !profile.onboarding_completed) {
        navigate('/onboarding', { replace: true });
      }
    }, 800);

    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [pathname, hash, user, profile?.onboarding_completed, isLoading, navigate]);

  return <>{children}</>;
}
