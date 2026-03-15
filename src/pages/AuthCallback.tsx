import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // Vérifie les erreurs dans l'URL
    const hash = window.location.hash.slice(1);
    const search = window.location.search.slice(1);
    const params = new URLSearchParams(hash || search);
    const errorParam = params.get('error');
    const errorDesc = params.get('error_description');

    if (errorParam || errorDesc) {
      const msg = errorDesc
        ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
        : errorParam === 'access_denied'
        ? 'Connexion annulée.'
        : `Erreur : ${errorParam}`;
      setError(msg);
      return;
    }

    // Attend que Supabase établisse la session via le hash OAuth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const done = localStorage.getItem('sommely_onboarding_done');
        navigate(done ? '/home' : '/onboarding', { replace: true });
      } else {
        // Écoute onAuthStateChange si la session n'est pas encore prête
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            const done = localStorage.getItem('sommely_onboarding_done');
            navigate(done ? '/home' : '/onboarding', { replace: true });
          } else if (event === 'SIGNED_OUT') {
            subscription.unsubscribe();
            navigate('/auth', { replace: true });
          }
        });

        // Timeout de sécurité — 5 secondes max
        setTimeout(() => {
          subscription.unsubscribe();
          navigate('/auth', { replace: true });
        }, 5000);
      }
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 font-body">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} color="#C62828" />
          </div>
          <h1 className="font-display text-xl font-bold text-black-wine mb-2">Connexion impossible</h1>
          <p className="text-gray-dark text-sm mb-6">{error}</p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-semibold border-none cursor-pointer"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center font-body">
      <div className="flex flex-col items-center gap-4">
        <Loader size={28} className="animate-spin text-burgundy-dark" />
        <p className="text-gray-dark text-sm">Connexion en cours...</p>
      </div>
    </div>
  );
}
