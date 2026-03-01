import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

export function PaymentSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem('sommely_subscription', 'premium');
    const timer = setTimeout(() => navigate('/scan'), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-burgundy-dark flex flex-col items-center justify-center px-6 font-body text-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      >
        <div className="text-8xl mb-6">🎉</div>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Crown size={22} color="#D4AF37" />
          <span className="font-display text-2xl font-bold text-white">Sommely Club</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-white mb-3">Bienvenue dans le Club !</h1>
        <p className="text-white/70 text-lg mb-8">Votre accès est actif. Profitez de Sommely.</p>
        <div className="flex items-center justify-center gap-2 bg-white/10 rounded-2xl px-6 py-3">
          <div className="w-4 h-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
          <span className="text-white/70 text-sm">Redirection en cours...</span>
        </div>
      </motion.div>
    </div>
  );
}

