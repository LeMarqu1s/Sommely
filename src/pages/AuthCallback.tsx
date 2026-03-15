import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const STEPS = [
  { pct: 15, label: 'Vérification Google', sublabel: 'Authentification sécurisée...' },
  { pct: 35, label: 'Identification du compte', sublabel: 'Récupération de votre profil...' },
  { pct: 60, label: 'Chargement de votre cave', sublabel: 'Synchronisation des données...' },
  { pct: 80, label: 'Préparation d\'Antoine', sublabel: 'Votre sommelier se réveille...' },
  { pct: 95, label: 'Presque là', sublabel: 'Derniers ajustements...' },
  { pct: 100, label: 'Bienvenue ! 🍷', sublabel: 'Tout est prêt pour vous' },
];

export function AuthCallback() {
  const navigate = useNavigate();
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');

  const currentStep = STEPS[stepIndex];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const errorParam = params.get('error') || hashParams.get('error');
    const errorDesc = params.get('error_description') || hashParams.get('error_description');

    if (errorParam || errorDesc) {
      setError(errorDesc ? decodeURIComponent(errorDesc.replace(/\+/g, ' ')) : 'Connexion annulée.');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Anime les étapes
    [0, 1, 2, 3, 4].forEach((i, idx) => {
      timers.push(setTimeout(() => setStepIndex(i + 1), 400 + idx * 500));
    });

    const redirect = () => {
      timers.forEach(clearTimeout);
      setStepIndex(5);
      setTimeout(() => {
        const done = localStorage.getItem('sommely_onboarding_done');
        navigate(done ? '/home' : '/onboarding', { replace: true });
      }, 800);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        subscription.unsubscribe();
        redirect();
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) { subscription.unsubscribe(); redirect(); }
    });

    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      timers.forEach(clearTimeout);
      navigate('/auth', { replace: true });
    }, 15000);

    return () => { timers.forEach(clearTimeout); clearTimeout(timeout); subscription.unsubscribe(); };
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 font-body"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0d 50%, #0a0a0a 100%)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
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
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(114,47,55,0.3) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Particules flottantes */}
      {[...Array(8)].map((_, i) => (
        <motion.div key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${10 + i * 12}%`,
            background: i % 2 === 0 ? 'rgba(212,175,55,0.6)' : 'rgba(114,47,55,0.8)',
            boxShadow: i % 2 === 0 ? '0 0 6px rgba(212,175,55,0.8)' : '0 0 6px rgba(114,47,55,0.8)',
          }}
          animate={{ y: [-20, -80, -20], opacity: [0, 1, 0] }}
          transition={{ duration: 2.5 + i * 0.3, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-10 px-8 w-full max-w-sm">

        {/* Bouteille SVG premium */}
        <div className="relative">
          {/* Glow derrière la bouteille */}
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ background: 'radial-gradient(circle, rgba(114,47,55,0.5) 0%, transparent 60%)' }}
            animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <svg width="90" height="200" viewBox="0 0 80 180" className="relative z-10" style={{ filter: 'drop-shadow(0 0 20px rgba(114,47,55,0.6))' }}>
            <defs>
              <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1a0508" />
                <stop offset="30%" stopColor="#2d0d14" />
                <stop offset="70%" stopColor="#2d0d14" />
                <stop offset="100%" stopColor="#1a0508" />
              </linearGradient>
              <linearGradient id="wineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B1a2a" />
                <stop offset="100%" stopColor="#4a0d14" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#8B7523" />
              </linearGradient>
              <clipPath id="wineClip">
                <rect x="14" y={168 - (currentStep.pct / 100) * 80} width="52" height="80" />
              </clipPath>
            </defs>

            {/* Corps bouteille */}
            <path d="M28 58 C18 65 13 80 13 96 L13 154 C13 162 20 168 28 168 L52 168 C60 168 67 162 67 154 L67 96 C67 80 62 65 52 58 Z" fill="url(#bottleGrad)" stroke="rgba(114,47,55,0.5)" strokeWidth="1"/>

            {/* Reflet gauche */}
            <path d="M20 85 C18 80 17 92 17 100 L17 145 C17 148 18 150 20 150 Z" fill="white" fillOpacity="0.05"/>

            {/* Vin qui monte */}
            <motion.path
              d="M28 58 C18 65 13 80 13 96 L13 154 C13 162 20 168 28 168 L52 168 C60 168 67 162 67 154 L67 96 C67 80 62 65 52 58 Z"
              fill="url(#wineGrad)"
              clipPath="url(#wineClip)"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />

            {/* Surface du vin avec vague */}
            {currentStep.pct > 5 && (
              <motion.ellipse
                cx="40"
                cy={168 - (currentStep.pct / 100) * 80}
                rx="26"
                ry="3"
                fill="rgba(180,40,60,0.6)"
                animate={{ rx: [24, 27, 24], ry: [2, 4, 2] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}

            {/* Goulot */}
            <path d="M31 18 L31 58 L49 58 L49 18 Z" fill="url(#bottleGrad)" stroke="rgba(114,47,55,0.4)" strokeWidth="1"/>

            {/* Bouchon doré */}
            <rect x="29" y="10" width="22" height="12" rx="4" fill="url(#goldGrad)"/>
            <rect x="31" y="12" width="18" height="2" rx="1" fill="rgba(255,255,255,0.2)"/>

            {/* Étiquette */}
            {currentStep.pct > 20 && (
              <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <rect x="19" y="95" width="42" height="40" rx="4" fill="rgba(250,249,246,0.95)" />
                <rect x="19" y="95" width="42" height="3" rx="2" fill="url(#goldGrad)" />
                <text x="40" y="112" textAnchor="middle" fill="#722F37" fontSize="7" fontWeight="bold" fontFamily="Georgia, serif">SOMMELY</text>
                <text x="40" y="122" textAnchor="middle" fill="#9E9E9E" fontSize="5" fontFamily="Georgia, serif">SOMMELIER IA</text>
                <line x1="24" y1="127" x2="56" y2="127" stroke="#D4AF37" strokeWidth="0.5" opacity="0.5"/>
                <text x="40" y="133" textAnchor="middle" fill="#6B5D56" fontSize="4.5" fontFamily="Georgia, serif">2026</text>
              </motion.g>
            )}

            {/* Brillance */}
            <path d="M22 70 C21 68 21 75 22 80 L23 115 C22 117 21 115 21 113 L21 72 Z" fill="white" fillOpacity="0.08"/>
          </svg>
        </div>

        {/* Pourcentage néon */}
        <motion.div
          key={currentStep.pct}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <span className="font-display font-bold"
            style={{
              fontSize: '3.5rem',
              background: 'linear-gradient(135deg, #D4AF37, #F5D77C, #D4AF37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
              filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.5))',
            }}>
            {currentStep.pct}%
          </span>
        </motion.div>

        {/* Barre de progression néon */}
        <div className="w-full space-y-4">
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${currentStep.pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ background: 'linear-gradient(90deg, #722F37, #D4AF37)', boxShadow: '0 0 10px rgba(212,175,55,0.4)' }}
            />
          </div>

          {/* Steps dots */}
          <div className="flex justify-center gap-2">
            {STEPS.slice(0, 5).map((_, i) => (
              <motion.div key={i}
                className="w-1.5 h-1.5 rounded-full"
                animate={{
                  background: i < stepIndex ? '#D4AF37' : 'rgba(255,255,255,0.2)',
                  boxShadow: i < stepIndex ? '0 0 6px rgba(212,175,55,0.8)' : 'none',
                }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* Label animé */}
        <AnimatePresence mode="wait">
          <motion.div key={stepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-center space-y-1">
            <p className="font-semibold text-white text-base">{currentStep.label}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)' }} className="text-xs">{currentStep.sublabel}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
