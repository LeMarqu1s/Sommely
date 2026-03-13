import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    const publicRoutes = ['/onboarding', '/auth', '/auth/callback', '/success'];
    if (publicRoutes.some(p => pathname.startsWith(p))) return;
    if (isLoading) return;

    if (!user) {
      // Pas connecté → auth en premier
      navigate('/auth', { replace: true });
      return;
    }

    // Connecté mais onboarding pas fait
    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [pathname, user, profile?.onboarding_completed, isLoading, navigate]);

  return <>{children}</>;
}
