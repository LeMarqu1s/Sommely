import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/auth/confirm',
  '/auth/callback',
  '/onboarding',
  '/invite',
  '/premium',
  '/share',
  '/vin',
  '/success',
  '/privacy',
];

export default function OnboardingGuard({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  const hasToken =
    window.location.hash.includes('access_token') ||
    window.location.search.includes('token_hash') ||
    window.location.hash.includes('token_hash');

  if (hasToken) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FAF9F6',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 40 }}>🍷</div>
        <div
          style={{
            color: '#722F37',
            fontSize: 14,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Chargement...
        </div>
      </div>
    );
  }

  const isPublic = PUBLIC_ROUTES.some(
    (r) => location.pathname === r || location.pathname.startsWith(r + '/')
  );

  if (!user && !isPublic) {
    return <Navigate to="/auth" replace />;
  }

  if (
    user &&
    profile &&
    !profile.onboarding_completed &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  if (
    user &&
    profile?.onboarding_completed &&
    location.pathname === '/auth'
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
