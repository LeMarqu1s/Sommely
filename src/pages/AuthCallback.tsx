import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, AlertCircle } from 'lucide-react';

/**
 * Page de retour OAuth (Google, etc.)
 * Gère les erreurs dans l'URL et affiche un message clair.
 */
export function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Supabase peut mettre les erreurs dans le hash OU dans les query params
    const hash = window.location.hash.slice(1);
    const search = window.location.search.slice(1);
    const params = new URLSearchParams(hash || search);

    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error || errorDescription) {
      setStatus('error');
      if (errorDescription) {
        const decoded = decodeURIComponent(errorDescription.replace(/\+/g, ' '));
        setErrorMessage(decoded);
      } else if (error === 'access_denied') {
        setErrorMessage('Connexion annulée. Vous pouvez réessayer.');
      } else if (error === 'redirect_uri_mismatch') {
        setErrorMessage(
          'Erreur Google : dans Google Cloud Console → Authorized redirect URIs, ajoute l\'URL de Supabase (pas sommely-wine.vercel.app !). Voir GOOGLE-OAUTH-SETUP.md'
        );
      } else {
        setErrorMessage(`Erreur de connexion : ${error || 'Veuillez réessayer.'}`);
      }
      return;
    }

    // Succès : la session est déjà établie par Supabase, rediriger
    const done = localStorage.getItem('sommely_onboarding_done');
    navigate(done ? '/home' : '/onboarding', { replace: true });
  }, [navigate]);

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 font-body">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} color="#C62828" />
          </div>
          <h1 className="font-display text-xl font-bold text-black-wine mb-2">Connexion impossible</h1>
          <p className="text-gray-dark text-sm mb-6">{errorMessage}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-semibold border-none cursor-pointer"
            >
              Réessayer
            </button>
            <button
              onClick={() => navigate('/', { replace: true })}
              className="w-full py-3 text-gray-dark text-sm bg-transparent border-none cursor-pointer hover:underline"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 font-body">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-burgundy-dark flex items-center justify-center overflow-hidden p-2">
          <img src="/IMG_1639-transparent.png" alt="Sommely" width={40} height={40} className="object-contain" style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).src = '/Logo%20Sommely.jpeg'; (e.target as HTMLImageElement).style.filter = 'brightness(0) invert(1)'; }} />
        </div>
        <Loader size={24} className="animate-spin text-burgundy-dark" />
        <p className="text-gray-dark text-sm">Connexion en cours...</p>
      </div>
    </div>
  );
}
