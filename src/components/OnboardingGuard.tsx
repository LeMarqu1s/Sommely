import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_ROUTES = ['/onboarding', '/auth', '/auth/callback', '/success', '/privacy', '/'];

export function OnboardingGuard() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, profile, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Reset redirect flag on route change
    hasRedirected.current = false;
  }, [pathname]);

  useEffect(() => {
    if (hasRedirected.current) return;
    if (PUBLIC_ROUTES.some(p => pathname === p || pathname.startsWith(p + '/'))) return;
    if (isLoading) return;

    if (!user) {
      hasRedirected.current = true;
      navigate('/auth', { replace: true });
      return;
    }

    const done = localStorage.getItem('sommely_onboarding_done');
    if (!done && profile && !profile.onboarding_completed) {
      hasRedirected.current = true;
      navigate('/onboarding', { replace: true });
    }
  }, [pathname, user, profile, isLoading, navigate]);

  return null;
}
