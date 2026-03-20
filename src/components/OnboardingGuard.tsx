import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PUBLIC_ROUTES = [
  '/auth',
  '/auth/confirm',
  '/onboarding',
  '/invite',
  '/premium',
  '/share',
  '/vin',
  '/',
  '/success',
  '/privacy',
];

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF9F6' }}>
      <div className="w-8 h-8 rounded-full border-2 border-burgundy-dark border-t-transparent animate-spin" />
    </div>
  );
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingSpinner />;

  const isPublic = PUBLIC_ROUTES.some(r => location.pathname.startsWith(r));

  // Pas connecté + route privée → auth
  if (!user && !isPublic) {
    return <Navigate to="/auth" replace />;
  }

  // Connecté + onboarding pas fait + pas déjà sur onboarding
  if (user && profile && !profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Connecté + onboarding fait + sur page auth → accueil
  if (user && profile?.onboarding_completed && location.pathname === '/auth') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
