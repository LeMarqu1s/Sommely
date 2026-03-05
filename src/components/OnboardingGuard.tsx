import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    const publicRoutes = ['/onboarding', '/auth', '/success', '/privacy', '/'];
    if (publicRoutes.some(p => pathname === p || pathname.startsWith(p + '/'))) return;

    // Callback OAuth — laisser Supabase traiter le token
    if (hash && hash.includes('access_token')) return;

    // Attendre que user ET profil soient chargés
    if (isLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // localStorage comme source de vérité principale
    const done = localStorage.getItem('sommely_onboarding_done');
    if (!done && profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [pathname, hash, user, profile, isLoading, navigate]);

  return <>{children}</>;
}
