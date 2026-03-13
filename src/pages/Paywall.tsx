import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Shield, RefreshCw, Crown } from 'lucide-react';
import { PaymentButtons } from '../components/payment/PaymentButtons';
import { useMemberCount } from '../hooks/useMemberCount';
import { TierKey } from '../lib/stripe';

const FEATURES_COMPARISON = [
  { name: 'Scans par mois', free: '3', monthly: '10', annual: 'Illimités' },
  { name: 'Score personnalisé', free: true, monthly: true, annual: true },
  { name: 'Accords mets-vins', free: true, monthly: true, annual: true },
  { name: 'Sommelier IA 24h/24', free: false, monthly: false, annual: true },
  { name: 'Gestion de cave', free: false, monthly: false, annual: true },
  { name: 'Alertes promotions', free: false, monthly: false, annual: true },
  { name: 'Historique illimité', free: false, monthly: true, annual: true },
  { name: 'Futures fonctionnalités', free: false, monthly: false, annual: true },
  { name: 'Support prioritaire', free: false, monthly: false, annual: false },
];

const TESTIMONIALS = [
  {
    text: "J'ai essayé le mensuel puis je suis passé à l'annuel. La différence de valeur est énorme pour 2,50 € par mois.",
    author: 'Thomas D.',
    role: '34 ans, Paris',
    initials: 'TD',
  },
  {
    text: "J'ai sauté sur l'offre annuelle. Pour 2,50 €/mois c'est le meilleur investissement que j'ai fait pour mes soirées.",
    author: 'Sarah K.',
    role: '28 ans, Lyon',
    initials: 'SK',
  },
  {
    text: "En 3 mois j'ai économisé bien plus que le prix annuel. La rentabilité est immédiate.",
    author: 'Marc L.',
    role: '41 ans, Bordeaux',
    initials: 'ML',
  },
];

export function Paywall() {
  const navigate = useNavigate();
  const memberCount = useMemberCount();
  const [selectedTier, setSelectedTier] = useState<TierKey>('annual');
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [userFirstName, setUserFirstName] = useState('');

  useEffect(() => {
    const profile = localStorage.getItem('sommely_profile');
    if (profile) {
      const parsed = JSON.parse(profile);
      if (parsed.firstName) setUserFirstName(parsed.firstName);
    }
    const sub = localStorage.getItem('sommely_subscription');
    if (sub) navigate('/scan');
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((i) => (i + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handlePaymentSuccess = () => {
    setShowSuccess(true);
    setTimeout(() => navigate('/scan'), 2500);
  };

  const handlePaymentError = (error: string) => {
    alert(error);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-burgundy-dark flex flex-col items-center justify-center px-6 font-body text-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <div className="text-8xl mb-6">🎉</div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown size={24} color="#D4AF37" />
            <span className="font-display text-2xl font-bold text-white">Sommely Club</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-3">
            Bienvenue{userFirstName ? `, ${userFirstName}` : ''} !
          </h1>
          <p className="text-white/70 text-lg mb-8">
            {selectedTier === 'annual'
              ? 'Votre Sommely Club Annuel est actif. Scans illimités !'
              : 'Votre abonnement mensuel est actif.'}
          </p>
          <div className="flex items-center justify-center gap-2 bg-white/10 rounded-2xl px-6 py-3">
            <RefreshCw size={16} className="animate-spin text-white/60" />
            <span className="text-white/70 text-sm">Redirection en cours...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-body text-black-wine ">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-light/30">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-burgundy-dark flex items-center justify-center overflow-hidden p-0.5">
            <img src="/IMG_1639-transparent.png" alt="Sommely" width={20} height={20} className="object-contain" style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).src = '/Logo%20Sommely.jpeg'; (e.target as HTMLImageElement).style.filter = 'brightness(0) invert(1)'; }} />
          </div>
          <span className="font-display text-lg font-bold text-burgundy-dark">Sommely</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-full bg-gray-light/30 flex items-center justify-center border-none cursor-pointer hover:bg-gray-light/50 transition-colors"
          aria-label="Fermer"
        >
          <X size={16} color="#6B5D56" />
        </button>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-display text-3xl font-bold text-black-wine mb-3 leading-tight">
            {userFirstName ? `${userFirstName}, passez` : 'Passez'} au niveau supérieur
          </h1>
          <p className="text-gray-dark text-base">Choisissez l'offre qui vous correspond.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-center gap-4 py-4 bg-white rounded-2xl border border-gray-light/30 shadow-sm"
        >
          <div className="text-center px-3">
            <p className="font-display text-xl font-bold text-burgundy-dark">{memberCount}</p>
            <p className="text-xs text-gray-dark">membres actifs</p>
          </div>
          <div className="w-px h-8 bg-gray-light/50" />
          <div className="text-center px-3">
            <div className="flex justify-center mb-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} size={12} fill="#D4AF37" color="#D4AF37" />
              ))}
            </div>
            <p className="text-xs text-gray-dark">4.8/5</p>
          </div>
          <div className="w-px h-8 bg-gray-light/50" />
          <div className="text-center px-3">
            <p className="font-display text-xl font-bold text-burgundy-dark">300€</p>
            <p className="text-xs text-gray-dark">économisés en moy.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          <p className="text-sm font-semibold text-black-wine text-center mb-4">Choisissez votre offre</p>

          <button
            onClick={() => setSelectedTier('monthly')}
            className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left ${
              selectedTier === 'monthly'
                ? 'border-burgundy-dark bg-burgundy-dark/5 shadow-md'
                : 'border-gray-light/60 bg-white hover:border-burgundy-light'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-black-wine text-sm">Mensuel</p>
                <p className="text-gray-dark text-xs mt-0.5">10 scans par mois · Recommandations de base</p>
              </div>
              <div className="text-right">
                <p className="font-display text-2xl font-bold text-black-wine">4,99 €</p>
                <p className="text-xs text-gray-dark">par mois</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedTier('annual')}
            className={`w-full rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left overflow-hidden ${
              selectedTier === 'annual'
                ? 'border-gold shadow-xl scale-[1.02]'
                : 'border-gold/50 bg-white hover:border-gold shadow-md'
            }`}
          >
            <div className="bg-gold px-4 py-1.5 flex items-center justify-between">
              <span className="text-black-wine text-xs font-bold uppercase tracking-wide">⭐ Le plus populaire</span>
              <span className="text-black-wine text-xs font-bold">-40% aujourd'hui</span>
            </div>
            <div className="p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-bold text-black-wine">Annuel</p>
                  <p className="text-gray-dark text-xs mt-0.5">Scans illimités + tout inclus</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="font-display text-3xl font-bold text-burgundy-dark">1€</span>
                  </div>
                  <p className="text-xs text-gray-dark">puis 29,99 €/an</p>
                  <p className="text-xs text-gray-light line-through">49,99 €/an</p>
                </div>
              </div>
              <div className="bg-gold/10 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-yellow-800">
                  Soit 2,50 €/mois, moins cher qu'un café
                </p>
              </div>
            </div>
          </button>

        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-gray-light/30 shadow-lg p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} color="#2E7D32" />
            <p className="text-sm font-semibold text-black-wine">
              {selectedTier === 'annual'
                ? "Offre sélectionnée : 1 € aujourd'hui puis 29,99 €/an"
                : "Offre sélectionnée : 4,99 € par mois"}
            </p>
          </div>

          <PaymentButtons selectedTier={selectedTier} onSuccess={handlePaymentSuccess} onError={handlePaymentError} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-light/20">
            <h2 className="font-display text-lg font-bold text-black-wine">Comparaison des offres</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-light/20">
                  <th className="text-left px-4 py-3 text-gray-dark font-medium">Fonctionnalité</th>
                  <th className="text-center px-2 py-3 text-gray-dark font-medium">Gratuit</th>
                  <th className="text-center px-2 py-3 text-gray-dark font-medium">Mensuel</th>
                  <th className="text-center px-2 py-3 text-burgundy-dark font-bold bg-burgundy-dark/5">Annuel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-light/20">
                {FEATURES_COMPARISON.map((row) => (
                  <tr key={row.name} className="hover:bg-cream/50">
                    <td className="px-4 py-3 text-gray-dark font-medium">{row.name}</td>
                    {['free', 'monthly', 'annual'].map((col) => {
                      const val = row[col as keyof typeof row];
                      const isAnnual = col === 'annual';
                      return (
                        <td key={col} className={`text-center px-2 py-3 ${isAnnual ? 'bg-burgundy-dark/5' : ''}`}>
                          {typeof val === 'boolean' ? (
                            val ? (
                              <span className="text-success font-bold">✓</span>
                            ) : (
                              <span className="text-gray-light">-</span>
                            )
                          ) : (
                            <span className={`font-semibold ${isAnnual ? 'text-burgundy-dark' : 'text-black-wine'}`}>
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={15} fill="#D4AF37" color="#D4AF37" />
                ))}
              </div>
              <p className="text-gray-dark text-sm leading-relaxed italic mb-4">
                «{TESTIMONIALS[activeTestimonial].text}»
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-burgundy-dark flex items-center justify-center text-white text-xs font-bold">
                  {TESTIMONIALS[activeTestimonial].initials}
                </div>
                <div>
                  <p className="font-semibold text-black-wine text-sm">{TESTIMONIALS[activeTestimonial].author}</p>
                  <p className="text-gray-dark text-xs">{TESTIMONIALS[activeTestimonial].role}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-center gap-1.5 mt-4">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveTestimonial(i)}
                className={`rounded-full transition-all duration-300 border-none cursor-pointer p-0 ${
                  i === activeTestimonial ? 'w-5 h-1.5 bg-burgundy-dark' : 'w-1.5 h-1.5 bg-gray-light'
                }`}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-light/20">
            <h2 className="font-display text-lg font-bold text-black-wine">Questions fréquentes</h2>
          </div>
          <div className="divide-y divide-gray-light/20">
            {[
              {
                q: "Qu'est-ce qui est inclus dans Sommely Club ?",
                a: "Scans illimités, score personnalisé selon vos goûts, accords mets-vins, gestion de cave et sommelier IA 24h/24. Tout pour ne plus jamais vous tromper en rayon.",
              },
              {
                q: "Comment le score m'aide-t-il à choisir ?",
                a: "Notre IA analyse vos préférences (budget, types de vins, occasions) et compare chaque bouteille à votre profil. Un score 85+ signifie : ce vin est fait pour vous.",
              },
              {
                q: `Pourquoi ${memberCount} amateurs font confiance à Sommely ?`,
                a: "Sommely les aide à économiser en évitant les mauvaises bouteilles. Ils notent l'app 4,8/5 et la recommandent à leurs amis. Rejoignez une communauté qui ne se trompe plus.",
              },
              {
                q: "Puis-je utiliser Sommely immédiatement après paiement ?",
                a: "Oui. Dès confirmation, tous les scans illimités et fonctionnalités premium sont débloqués. Vous pouvez scanner votre prochaine bouteille en quelques secondes.",
              },
              {
                q: "Le paiement est-il sécurisé ?",
                a: "Oui. Nous utilisons Stripe, leader mondial des paiements en ligne (utilisé par des millions de sites). Vos données bancaires sont cryptées et jamais stockées chez nous.",
              },
            ].map((item, i) => (
              <div key={i} className="px-6 py-4">
                <p className="font-semibold text-black-wine text-sm mb-1.5">{item.q}</p>
                <p className="text-gray-dark text-xs leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-burgundy-dark rounded-3xl p-6 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />
          <h3 className="font-display text-xl font-bold text-white mb-1">
            Offre actuelle :{' '}
            {selectedTier === 'annual'
              ? "1 € aujourd'hui"
              : "4,99 €/mois"}
          </h3>
          <p className="text-white/60 text-xs mb-5">Paiement sécurisé Stripe</p>
          <PaymentButtons selectedTier={selectedTier} onSuccess={handlePaymentSuccess} onError={handlePaymentError} />
        </motion.div>

        <div className="text-center pb-8">
          <button
            onClick={() => navigate('/scan')}
            className="text-gray-dark text-sm hover:text-burgundy-dark transition-colors bg-transparent border-none cursor-pointer underline"
          >
            Continuer avec la version gratuite (3 scans/jour)
          </button>
        </div>
      </div>
    </div>
  );
}

