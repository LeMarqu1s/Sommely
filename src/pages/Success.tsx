import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export function Success() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get('plan') as 'monthly' | 'annual';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Active le statut Pro
    const expiry = plan === 'annual'
      ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    localStorage.setItem('sommely_subscription_tier', 'pro');
    localStorage.setItem('sommely_subscription_type', plan || 'monthly');
    localStorage.setItem('sommely_subscription_expiry', expiry.toISOString());

    // Compte à rebours
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [plan, navigate]);

  const features = [
    '🔍 Scans illimités',
    '🍾 Cave illimitée',
    '🍷 Chat Antoine 24h/24',
    '📋 Scan menu restaurant',
    '📈 IA prédictive investissement',
    '👨‍🍳 Ce soir je cuisine...',
    '🛒 Boutique & Parrainage',
  ];

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 font-body">

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-24 h-24 rounded-full bg-burgundy-dark flex items-center justify-center mb-6 shadow-xl">
        <Check size={48} color="white" strokeWidth={3} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="font-display text-3xl font-bold text-black-wine text-center mb-2">
        Bienvenue dans Sommely Pro !
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-gray-dark text-center text-sm mb-6 max-w-xs leading-relaxed">
        Abonnement {plan === 'annual' ? 'annuel · 49€/an' : 'mensuel · 4,99€/mois'} activé.
        Toutes les fonctionnalités sont débloquées !
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-5 w-full max-w-xs mb-6 space-y-2">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.07 }}
            className="flex items-center gap-3">
            <Check size={14} color="#722F37" strokeWidth={3} className="flex-shrink-0" />
            <p className="text-sm text-black-wine">{feature}</p>
          </motion.div>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        onClick={() => navigate('/')}
        className="w-full max-w-xs py-4 bg-burgundy-dark text-white rounded-2xl font-bold border-none cursor-pointer shadow-lg active:scale-95 transition-all">
        Découvrir Sommely Pro ({countdown}s) 🍷
      </motion.button>
    </div>
  );
}
