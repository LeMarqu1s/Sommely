import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap, Star, TrendingUp, Wine, Shield, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { redirectToCheckout } from '../utils/stripe';

type Plan = 'monthly' | 'annual' | 'prestige';

export function Premium() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const { subscriptionState } = useAuth();
  const { isPro, isTrial, daysLeftInTrial } = subscriptionState;

  const handleSubscribe = async (plan: Plan) => {
    if (plan === 'prestige') return;
    setIsLoading(true);
    try {
      await redirectToCheckout(plan);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'prestige' as Plan,
      label: 'Prestige',
      price: '14,99€',
      period: '/mois',
      sub: 'Accès prioritaire aux nouvelles features',
      badge: null,
      highlight: false,
      anchor: true,
    },
    {
      id: 'annual' as Plan,
      label: 'Annuel',
      price: '48€',
      period: '/an',
      sub: 'Soit 4€/mois · Économisez 131€ vs Prestige',
      badge: '⭐ Meilleure valeur',
      highlight: true,
      anchor: false,
    },
    {
      id: 'monthly' as Plan,
      label: 'Mensuel',
      price: '4,99€',
      period: '/mois',
      sub: 'Sans engagement',
      badge: null,
      highlight: false,
      anchor: false,
    },
  ];

  const features = [
    { icon: <Zap size={18} />, title: 'Scans illimités', desc: 'Identifiez autant de vins que vous voulez' },
    { icon: <Wine size={18} />, title: 'Cave illimitée', desc: 'Gérez des centaines de bouteilles avec prix dynamiques' },
    { icon: <Star size={18} />, title: 'Chat Antoine', desc: 'Sommelier IA disponible 24h/24 pour tous vos conseils' },
    { icon: <TrendingUp size={18} />, title: 'IA Investissement', desc: 'Prédictions valeur +1/3/5 ans, grade A+ → D' },
    { icon: <Check size={18} />, title: 'Scan menu restaurant', desc: 'Meilleur rapport qualité-prix sur toute carte' },
    { icon: <Check size={18} />, title: 'Accords mets-vins', desc: 'Suggestions personnalisées pour chaque plat' },
    { icon: <Check size={18} />, title: 'Ce soir je cuisine...', desc: 'Quelle bouteille ouvrir de votre cave ?' },
    { icon: <Check size={18} />, title: 'Boutique & Parrainage', desc: 'Offres exclusives + invitez vos amis' },
  ];

  if (isPro && !isTrial) {
    return (
      <div className="min-h-screen bg-cream font-body flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mb-4">
          <Star size={40} color="#2C1810" fill="#2C1810" />
        </div>
        <h1 className="font-display text-2xl font-bold text-black-wine mb-2">Vous êtes déjà Pro !</h1>
        <p className="text-gray-dark text-sm text-center mb-6">Profitez de toutes les fonctionnalités.</p>
        <button onClick={() => navigate('/home')} className="bg-burgundy-dark text-white px-8 py-3 rounded-full font-semibold text-sm border-none cursor-pointer">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Header */}
      <div className="bg-white border-b border-gray-light/30 px-5 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button
          onClick={() => (window.history.length > 2 ? navigate(-1) : navigate('/home'))}
          className="bg-transparent border-none cursor-pointer p-1"
          aria-label="Retour"
        >
          <ArrowLeft size={20} color="#722F37" />
        </button>
        <span className="font-display text-base font-bold text-burgundy-dark">Sommely Pro</span>
        <div className="w-8" />
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-5">

        {/* Trial banner */}
        {isTrial && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Essai gratuit en cours</p>
              <p className="text-amber-700 text-xs">
                {daysLeftInTrial > 0
                  ? `Il vous reste ${daysLeftInTrial} jour${daysLeftInTrial > 1 ? 's' : ''} — choisissez votre plan pour continuer`
                  : "Votre essai se termine aujourd'hui"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Star size={40} color="#2C1810" fill="#2C1810" />
          </div>
          <h1 className="font-display text-3xl font-bold text-black-wine mb-2">Choisissez votre plan</h1>
          <p className="text-gray-dark text-sm leading-relaxed">
            Votre sommelier expert illimité · Sans engagement pour le mensuel
          </p>
        </motion.div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex -space-x-2">
            {['🧑', '👩', '👨', '🧑'].map((e, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-burgundy-dark/10 flex items-center justify-center text-sm border-2 border-cream">{e}</div>
            ))}
          </div>
          <p className="text-xs text-gray-dark">+2 400 amateurs nous font confiance</p>
        </div>

        {/* Plans — 3 niveaux avec ancre */}
        <div className="space-y-3 pt-1">
          {plans.map((plan) => (
            <motion.button
              key={plan.id}
              onClick={() => !plan.anchor && setSelectedPlan(plan.id)}
              whileTap={plan.anchor ? {} : { scale: 0.98 }}
              className={`w-full text-left rounded-2xl border-2 p-4 transition-all relative bg-white ${
                plan.anchor
                  ? 'border-gray-light/30 opacity-50 cursor-default'
                  : selectedPlan === plan.id
                  ? 'border-burgundy-dark shadow-md cursor-pointer'
                  : 'border-gray-light/40 cursor-pointer hover:border-gray-dark/30'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-4 bg-burgundy-dark text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              {plan.anchor && (
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown size={12} color="#D4AF37" />
                  <span className="text-xs font-semibold text-gold">Prestige</span>
                </div>
              )}
              <div className="flex items-center justify-between pr-6">
                <div>
                  <p className={`font-semibold text-sm ${plan.anchor ? 'text-gray-dark' : 'text-black-wine'}`}>{plan.label}</p>
                  <p className={`text-xs mt-0.5 ${plan.highlight ? 'text-green-700 font-medium' : 'text-gray-dark'}`}>{plan.sub}</p>
                </div>
                <div className="text-right">
                  <span className={`font-display text-2xl font-bold ${plan.anchor ? 'text-gray-dark' : 'text-burgundy-dark'}`}>{plan.price}</span>
                  <span className="text-xs text-gray-dark ml-0.5">{plan.period}</span>
                </div>
              </div>
              {selectedPlan === plan.id && !plan.anchor && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-burgundy-dark flex items-center justify-center">
                  <Check size={12} color="white" />
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSubscribe(selectedPlan)}
          disabled={isLoading}
          className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold text-base border-none cursor-pointer shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
        >
          {isLoading ? 'Redirection...' : 'Commencer maintenant →'}
        </motion.button>
        <p className="text-gray-dark/60 text-xs text-center -mt-2">
          Annulable à tout moment · Paiement sécurisé Stripe
        </p>

        {/* Features */}
        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-5">
          <h3 className="font-display text-lg font-bold text-black-wine mb-4">Tout ce que vous débloquez</h3>
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-burgundy-dark/5 flex items-center justify-center flex-shrink-0 text-burgundy-dark">{f.icon}</div>
                <div>
                  <p className="font-semibold text-black-wine text-sm">{f.title}</p>
                  <p className="text-xs text-gray-dark">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Guarantee */}
        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} color="#2E7D32" />
            <p className="font-semibold text-black-wine text-sm">Garantie satisfait ou remboursé 7 jours</p>
          </div>
          <p className="text-xs text-gray-dark leading-relaxed">
            Essayez Sommely Pro sans risque. Si vous n'êtes pas satisfait dans les 7 premiers jours, nous vous remboursons intégralement.
          </p>
        </div>

        {/* FAQ */}
        <div className="space-y-3">
          {[
            { q: "Puis-je annuler à tout moment ?", a: "Oui, annulation en 1 clic depuis votre profil. Pas d'engagement pour le mensuel." },
            { q: "Mes données sont-elles sécurisées ?", a: "Paiement 100% sécurisé via Stripe. Nous ne stockons aucune donnée bancaire." },
            { q: "Comment fonctionne le parrainage ?", a: "Invitez un ami avec votre code. Quand il devient payant, vous recevez tous les deux 1 mois Pro offert." },
            { q: "Que se passe-t-il après les 7 jours gratuits ?", a: "Votre accès devient limité. Choisissez un plan pour continuer sans interruption." },
          ].map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-light/30 p-4">
              <p className="font-semibold text-black-wine text-sm mb-1">{faq.q}</p>
              <p className="text-xs text-gray-dark">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
