import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';

export function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState('Connexion en cours...');

  useEffect(() => {
    // Animation de progression
    const steps = [
      { pct: 20, label: 'Vérification Google...', delay: 300 },
      { pct: 45, label: 'Identification du compte...', delay: 900 },
      { pct: 70, label: 'Chargement de votre cave...', delay: 1600 },
      { pct: 90, label: 'Presque prêt...', delay: 2400 },
    ];

    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach(({ pct, label, delay }) => {
      timers.push(setTimeout(() => {
        setProgress(pct);
        setLabel(label);
      }, delay));
    });

    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const errorParam = params.get('error') || hashParams.get('error');
    const errorDesc = params.get('error_description') || hashParams.get('error_description');

    if (errorParam || errorDesc) {
      timers.forEach(clearTimeout);
      setError(errorDesc
        ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
        : 'Connexion annulée.');
      return;
    }

    const redirect = (_session: any) => {
      timers.forEach(clearTimeout);
      setProgress(100);
      setLabel('Bienvenue ! 🍷');
      setTimeout(() => {
        const done = localStorage.getItem('sommely_onboarding_done');
        navigate(done ? '/home' : '/onboarding', { replace: true });
      }, 600);
    };

    // Check session immédiatement
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { redirect(session); return; }

      // Sinon écoute onAuthStateChange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          subscription.unsubscribe();
          redirect(session);
        }
      });

      // Timeout 12 secondes
      const timeout = setTimeout(() => {
        subscription.unsubscribe();
        timers.forEach(clearTimeout);
        navigate('/auth', { replace: true });
      }, 12000);

      timers.push(timeout);
    });

    return () => timers.forEach(clearTimeout);
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
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center font-body px-8">
      <div className="flex flex-col items-center gap-8 w-full max-w-xs">

        {/* Bouteille animée */}
        <div className="relative" style={{ width: 80, height: 180 }}>
          <svg width="80" height="180" viewBox="0 0 80 180" fill="none">
            {/* Corps bouteille */}
            <path d="M28 60 C20 65 14 78 14 95 L14 155 C14 162 20 168 28 168 L52 168 C60 168 66 162 66 155 L66 95 C66 78 60 65 52 60 Z"
              fill="white" stroke="#722F37" strokeWidth="2.5"/>
            {/* Goulot */}
            <path d="M32 20 L32 60 L48 60 L48 20 Z" fill="white" stroke="#722F37" strokeWidth="2.5"/>
            {/* Bouchon */}
            <rect x="30" y="12" width="20" height="12" rx="3" fill="#722F37"/>

            {/* Vin qui se remplit — clipPath */}
            <clipPath id="wineClip">
              <rect x="14" y={168 - (progress / 100) * 73} width="52" height={168} />
            </clipPath>
            <motion.path
              d="M28 60 C20 65 14 78 14 95 L14 155 C14 162 20 168 28 168 L52 168 C60 168 66 162 66 155 L66 95 C66 78 60 65 52 60 Z"
              fill="#722F37"
              clipPath="url(#wineClip)"
              initial={{ opacity: 0.8 }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Reflet */}
            <path d="M22 90 C22 85 26 80 30 80 L30 140 C26 140 22 135 22 130 Z" fill="white" fillOpacity="0.15"/>

            {/* Étiquette */}
            {progress > 30 && (
              <motion.rect
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                x="20" y="100" width="40" height="35" rx="4"
                fill="white" fillOpacity="0.9"
              />
            )}
            {progress > 30 && (
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                x="40" y="122" textAnchor="middle"
                fill="#722F37" fontSize="7" fontWeight="bold"
                fontFamily="serif"
              >
                Sommely
              </motion.text>
            )}
          </svg>

          {/* Pourcentage */}
          <motion.div
            className="absolute -bottom-8 left-0 right-0 text-center"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-burgundy-dark font-bold text-lg">{progress}%</span>
          </motion.div>
        </div>

        {/* Barre de progression */}
        <div className="w-full mt-4">
          <div className="w-full h-1.5 bg-gray-light/40 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-burgundy-dark rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Label */}
        <motion.p
          key={label}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-gray-dark text-sm text-center"
        >
          {label}
        </motion.p>
      </div>
    </div>
  );
}
