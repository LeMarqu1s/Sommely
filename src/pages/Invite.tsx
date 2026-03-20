import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { applyReferralCode } from '../lib/supabase';

const PENDING_REFERRAL_KEY = 'pending_referral';

export function Invite() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading, refreshProfile } = useAuth();
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState('');

  const refCode = code || searchParams.get('ref')?.trim().toUpperCase();

  useEffect(() => {
    if (refCode) {
      localStorage.setItem(PENDING_REFERRAL_KEY, refCode);
    }
  }, [refCode]);

  useEffect(() => {
    if (isLoading || !refCode) return;
    if (!user) return;

    setApplying(true);
    applyReferralCode(user.id, refCode)
      .then((result) => {
        localStorage.removeItem(PENDING_REFERRAL_KEY);
        refreshProfile?.();
        if (result.error) {
          setError(result.error);
        } else {
          navigate('/profile?referral_applied=1', { replace: true });
        }
      })
      .catch(() => setError('Erreur lors de l\'application du code'))
      .finally(() => setApplying(false));
  }, [user, isLoading, refCode, navigate, refreshProfile]);

  useEffect(() => {
    if (!refCode && !isLoading) navigate('/', { replace: true });
  }, [refCode, isLoading, navigate]);

  if (!user && refCode) {
    return (
      <div className="min-h-screen font-body flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg-app)' }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🎁</div>
          <h1 className="font-display text-2xl font-bold text-black-wine mb-3">
            Votre ami vous offre 1 mois gratuit avec Sommely
          </h1>
          <p className="text-gray-dark text-sm mb-6">
            Créez votre compte avec le code <strong className="text-burgundy-dark">{refCode}</strong> et profitez d&apos;un mois Pro offert.
          </p>
          <button
            onClick={() => navigate(`/auth?referral=${encodeURIComponent(refCode)}`, { replace: true })}
            className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold text-base border-none cursor-pointer hover:bg-burgundy-medium transition-colors"
          >
            Créer mon compte
          </button>
        </div>
      </div>
    );
  }

  if (user && applying) {
    return (
      <div className="min-h-screen font-body flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg-app)' }}>
        <div className="w-10 h-10 rounded-full border-2 border-burgundy-dark border-t-transparent animate-spin" />
        <p className="mt-4 text-gray-dark text-sm">Application du code en cours...</p>
      </div>
    );
  }

  if (user && error) {
    return (
      <div className="min-h-screen font-body flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg-app)' }}>
        <p className="text-danger text-sm mb-4">{error}</p>
        <button
          onClick={() => navigate('/profile', { replace: true })}
          className="py-3 px-6 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm border-none cursor-pointer"
        >
          Retour au profil
        </button>
      </div>
    );
  }

  return null;
}

export { PENDING_REFERRAL_KEY };
