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

    // Si y'a un access_token dans le hash, c'est un callback OAuth — ne pas rediriger
    if (hash && hash.includes('access_token')) return;

    if (isLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    if (profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [pathname, hash, user, profile?.onboarding_completed, isLoading, navigate]);

  return <>{children}</>;
}
