import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const STEPS = [
  { pct: 15, label: 'Vérification Google', sublabel: 'Authentification sécurisée...' },
  { pct: 35, label: 'Identification du compte', sublabel: 'Récupération de votre profil...' },
  { pct: 60, label: 'Chargement de votre cave', sublabel: 'Synchronisation des données...' },
  { pct: 80, label: "Préparation d'Antoine", sublabel: 'Votre sommelier se réveille...' },
  { pct: 95, label: 'Presque là', sublabel: 'Derniers ajustements...' },
  { pct: 100, label: 'Bienvenue ! 🍷', sublabel: 'Tout est prêt pour vous' },
];

export function AuthCallback() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');
  const redirected = useRef(false);

  const currentStep = STEPS[Math.min(stepIndex, STEPS.length - 1)];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const errorParam = params.get('error') || hashParams.get('error');
    const errorDesc = params.get('error_description') || hashParams.get('error_description');

    if (errorParam || errorDesc) {
      setError(errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : 'Connexion annulée.');
      return;
    }

    // Animation steps
    const timers: ReturnType<typeof setTimeout>[] = [];
    [1, 2, 3, 4].forEach((i, idx) => {
      timers.push(setTimeout(() => setStepIndex(i), 500 + idx * 600));
    });

    const doRedirect = () => {
      if (redirected.current) return;
      redirected.current = true;
      timers.forEach(clearTimeout);
      setStepIndex(5);
      setTimeout(() => {
        const done = localStorage.getItem('sommely_onboarding_done');
        navigate(done ? '/home' : '/onboarding', { replace: true });
      }, 700);
    };

    // Supabase détecte automatiquement le token dans l'URL (hash ou code)
    // et déclenche SIGNED_IN via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
        subscription.unsubscribe();
        doRedirect();
      }
    });

    // Vérifie aussi si session déjà établie
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        doRedirect();
      }
    });

    // Timeout 15s
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      timers.forEach(clearTimeout);
      if (!redirected.current) navigate('/auth', { replace: true });
    }, 15000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 font-body"
        style={{ background: 'linear-gradient(135deg, #0d0608 0%, #1a0a0d 50%, #0d0608 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-white font-bold text-xl mb-2">Connexion impossible</h1>
          <p className="text-white/50 text-sm mb-6">{error}</p>
          <button onClick={() => navigate('/auth', { replace: true })}
            className="px-8 py-3 rounded-xl font-semibold text-white border-none cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #722F37, #8B4049)' }}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-body relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0d0608 0%, #1a0a0d 40%, #0d0608 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(114,47,55,0.3) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }} />
        <motion.div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }} />
      </div>

      {/* Particules */}
      {[...Array(8)].map((_, i) => (
        <motion.div key={i} className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${8 + i * 12}%`, bottom: '20%',
            background: i % 2 === 0 ? 'rgba(212,175,55,0.7)' : 'rgba(114,47,55,0.9)',
            boxShadow: i % 2 === 0 ? '0 0 8px rgba(212,175,55,0.9)' : '0 0 8px rgba(114,47,55,0.9)',
          }}
          animate={{ y: [0, -120, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.5 }} />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-8 px-8 w-full max-w-xs">

        {/* Bouteille SVG */}
        <div className="relative">
          <motion.div className="absolute inset-0 rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(114,47,55,0.6) 0%, transparent 60%)' }}
            animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }} />

          <svg width="90" height="200" viewBox="0 0 80 180" className="relative z-10"
            style={{ filter: 'drop-shadow(0 0 25px rgba(114,47,55,0.7))' }}>
            <defs>
              <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d0205" />
                <stop offset="35%" stopColor="#1f0810" />
                <stop offset="65%" stopColor="#1f0810" />
                <stop offset="100%" stopColor="#0d0205" />
              </linearGradient>
              <linearGradient id="wine2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#9B2335" />
                <stop offset="100%" stopColor="#4a0d14" />
              </linearGradient>
              <linearGradient id="gold2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#F5D77C" />
                <stop offset="100%" stopColor="#8B7523" />
              </linearGradient>
              <clipPath id="clip2">
                <motion.rect
                  x="13" width="54"
                  y={168 - (currentStep.pct / 100) * 82}
                  height="82"
                  animate={{ y: 168 - (currentStep.pct / 100) * 82 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                />
              </clipPath>
            </defs>

            <path d="M28 58 C18 65 13 80 13 96 L13 154 C13 162 20 168 28 168 L52 168 C60 168 67 162 67 154 L67 96 C67 80 62 65 52 58 Z"
              fill="url(#bg2)" stroke="rgba(114,47,55,0.4)" strokeWidth="1.5"/>
            <path d="M20 82 C18 78 17 90 17 100 L17 148 C18 150 20 149 20 147 Z"
              fill="white" fillOpacity="0.06"/>
            <motion.path
              d="M28 58 C18 65 13 80 13 96 L13 154 C13 162 20 168 28 168 L52 168 C60 168 67 162 67 154 L67 96 C67 80 62 65 52 58 Z"
              fill="url(#wine2)" clipPath="url(#clip2)"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.5, repeat: Infinity }} />
            {currentStep.pct > 5 && (
              <motion.ellipse cx="40"
                cy={168 - (currentStep.pct / 100) * 82}
                rx="26" ry="3"
                fill="rgba(180,40,60,0.5)"
                animate={{ rx: [23, 27, 23], ry: [2, 4, 2] }}
                transition={{ duration: 1.2, repeat: Infinity }} />
            )}
            <path d="M31 18 L31 58 L49 58 L49 18 Z" fill="url(#bg2)" stroke="rgba(114,47,55,0.3)" strokeWidth="1.5"/>
            <rect x="29" y="10" width="22" height="12" rx="4" fill="url(#gold2)"/>
            <rect x="31" y="12" width="18" height="2" rx="1" fill="rgba(255,255,255,0.25)"/>
            {currentStep.pct > 25 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                <rect x="19" y="95" width="42" height="40" rx="4" fill="rgba(250,249,246,0.92)"/>
                <rect x="19" y="95" width="42" height="3" rx="2" fill="url(#gold2)"/>
                <text x="40" y="112" textAnchor="middle" fill="#722F37" fontSize="7" fontWeight="bold" fontFamily="Georgia,serif">SOMMELY</text>
                <text x="40" y="121" textAnchor="middle" fill="#9E9E9E" fontSize="4.5" fontFamily="Georgia,serif">SOMMELIER IA</text>
                <line x1="24" y1="127" x2="56" y2="127" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5"/>
                <text x="40" y="133" textAnchor="middle" fill="#6B5D56" fontSize="4.5" fontFamily="Georgia,serif">2026</text>
              </motion.g>
            )}
          </svg>
        </div>

        {/* % doré */}
        <motion.div key={currentStep.pct} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <span className="font-bold" style={{
            fontSize: '3.5rem',
            background: 'linear-gradient(135deg, #D4AF37, #F5D77C, #D4AF37)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.6))',
            fontFamily: 'Georgia, serif',
          }}>
            {currentStep.pct}%
          </span>
        </motion.div>

        {/* Barre + dots */}
        <div className="w-full space-y-3">
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${currentStep.pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #722F37, #D4AF37)', boxShadow: '0 0 12px rgba(212,175,55,0.5)' }} />
          </div>
          <div className="flex justify-center gap-2">
            {[0,1,2,3,4].map(i => (
              <motion.div key={i} className="rounded-full"
                animate={{
                  width: i < stepIndex ? 16 : 6,
                  height: 6,
                  background: i < stepIndex ? '#D4AF37' : 'rgba(255,255,255,0.15)',
                  boxShadow: i < stepIndex ? '0 0 8px rgba(212,175,55,0.8)' : 'none',
                }}
                transition={{ duration: 0.3 }} />
            ))}
          </div>
        </div>

        {/* Label */}
        <AnimatePresence mode="wait">
          <motion.div key={stepIndex} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-center space-y-1">
            <p className="font-semibold text-white text-base">{currentStep.label}</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{currentStep.sublabel}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
