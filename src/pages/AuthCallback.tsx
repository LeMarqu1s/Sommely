import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    
    const errorParam = params.get('error') || hashParams.get('error');
    const errorDesc = params.get('error_description') || hashParams.get('error_description');

    if (errorParam || errorDesc) {
      setError(errorDesc 
        ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
        : 'Connexion annulée.');
      return;
    }

    // Supabase PKCE flow : échange le code automatiquement
    // On attend juste que la session soit prête
    let timeout: ReturnType<typeof setTimeout>;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        clearTimeout(timeout);
        subscription.unsubscribe();
        const done = localStorage.getItem('sommely_onboarding_done');
        navigate(done ? '/home' : '/onboarding', { replace: true });
      }
    });

    // Vérifie aussi si session déjà là
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        clearTimeout(timeout);
        subscription.unsubscribe();
        const done = localStorage.getItem('sommely_onboarding_done');
        navigate(done ? '/home' : '/onboarding', { replace: true });
      }
    });

    // Timeout 10 secondes
    timeout = setTimeout(() => {
      subscription.unsubscribe();
      navigate('/auth', { replace: true });
    }, 10000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
          <button onClick={() => navigate('/auth', { replace: true })}
            className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-semibold border-none cursor-pointer">
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
