import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const done = localStorage.getItem('sommely_onboarding_done');
    const publicRoutes = ['/onboarding'];
    if (!done && !publicRoutes.includes(pathname)) {
      navigate('/onboarding', { replace: true });
    }
  }, [pathname, navigate]);

  return <>{children}</>;
}
