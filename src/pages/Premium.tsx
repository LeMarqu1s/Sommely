import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap, Star, TrendingUp, Wine, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { redirectToCheckout } from '../utils/stripe';

type Plan = 'monthly' | 'annual';

export function Premium() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const { subscriptionState } = useAuth();
  const { isPro, isTrial, daysLeftInTrial } = subscriptionState;

  const handleSubscribe = async (plan: Plan) => {
    setIsLoading(true);
    try {
      await redirectToCheckout(plan);
    } finally {
      setIsLoading(false);
    }
  };

  const ctaLabel =
    selectedPlan === 'annual' ? 'Commencer maintenant →' : 'Essayer un mois';

  const features = [
    { icon: <Zap size={18} />, title: 'Scans illimités', desc: 'Identifiez autant de vins que vous voulez' },
    { icon: <Wine size={18} />, title: 'Cave illimitée', desc: 'Gérez des centaines de bouteilles avec prix dynamiques' },
    { icon: <Star size={18} />, title: 'Chat Antoine', desc: 'Sommelier IA disponible 24h/24 pour tous vos conseils' },
    { icon: <TrendingUp size={18} />, title: 'IA Investissement', desc: 'Prédictions valeur +1/3/5 ans, grade A+ → D' },
    { icon: <Check size={18} />, title: 'Scan menu restaurant', desc: 'Meilleur rapport qualité-prix sur toute carte' },
    { icon: <Check size={18} />, title: 'Accords mets-vins', desc: 'Suggestions personnalisées pour chaque plat' },
    { icon: <Check size={18} />, title: 'Ce soir je cuisine...', desc: 'Quelle bouteille ouvrir de votre cave ?' },
    // { icon: <Check size={18} />, title: 'Boutique & Parrainage', desc: 'Offres exclusives + invitez vos amis' }, // STANDBY
  ];

  if (isPro && !isTrial) {
    return (
      <div className="min-h-screen bg-cream font-body flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{ background: '#722F37' }}>
          <Star size={40} color="#D4AF37" fill="#D4AF37" />
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
      <div className="bg-white border-b border-gray-light/30 px-5 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm" style={{ paddingLeft: '72px' }}>
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
                  ? `Il vous reste ${daysLeftInTrial} jour${daysLeftInTrial > 1 ? 's' : ''} · Choisissez votre plan pour continuer`
                  : "Votre essai se termine aujourd'hui"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ background: '#722F37' }}>
            <Star size={40} color="#D4AF37" fill="#D4AF37" />
          </div>
          <h1 className="font-display text-3xl font-bold text-black-wine mb-2">Devenez un expert du vin</h1>
          <p className="text-gray-dark text-sm leading-relaxed">
            Le seul outil qui combine IA, cave personnelle et sommelier 24h/24. Ce que Vivino ne fera jamais.
          </p>
        </motion.div>

        {/* Pourquoi passer Pro ? · 3 cards horizontales */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <h3 className="font-display text-base font-bold text-black-wine">Pourquoi passer Pro ?</h3>
          <div className="flex gap-3 overflow-x-auto pb-1 -mx-1">
            <div className="flex-shrink-0 w-[min(260px,75vw)] bg-white rounded-2xl border border-gray-light/30 p-4 shadow-sm">
              <p className="text-lg mb-1">🎯</p>
              <p className="font-semibold text-black-wine text-sm mb-0.5">Score GPT-4o personnalisé</p>
              <p className="text-xs text-gray-dark">Pas une note générique. Un score calculé selon VOS goûts exacts.</p>
            </div>
            <div className="flex-shrink-0 w-[min(260px,75vw)] bg-white rounded-2xl border border-gray-light/30 p-4 shadow-sm">
              <p className="text-lg mb-1">📋</p>
              <p className="font-semibold text-black-wine text-sm mb-0.5">Scan de carte restaurant</p>
              <p className="text-xs text-gray-dark">Trouvez le meilleur rapport qualité-prix sur n&apos;importe quelle carte. Économisez 30-100€ par repas.</p>
            </div>
            <div className="flex-shrink-0 w-[min(260px,75vw)] bg-white rounded-2xl border border-gray-light/30 p-4 shadow-sm">
              <p className="text-lg mb-1">🏰</p>
              <p className="font-semibold text-black-wine text-sm mb-0.5">Cave virtuelle avec prix temps réel</p>
              <p className="text-xs text-gray-dark">Suivez la valeur de vos bouteilles. Sachant quand vendre, quand ouvrir.</p>
            </div>
          </div>
        </motion.div>

        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4 text-center">
          <p className="text-sm font-semibold text-black-wine">Rejoignez nos premiers utilisateurs</p>
          <p className="text-xs text-gray-dark mt-1 leading-relaxed">
            Sommely évolue avec vous — votre avis compte pour améliorer l&apos;expérience.
          </p>
        </div>

        {/* Plans · Mensuel + Annuel (même largeur, même structure) */}
        <div className="grid grid-cols-2 gap-3 w-full items-stretch pt-1">
          <motion.button
            type="button"
            onClick={() => setSelectedPlan('monthly')}
            whileTap={{ scale: 0.98 }}
            className="relative rounded-2xl border-2 bg-white p-4 text-left flex flex-col"
            style={{
              borderColor: selectedPlan === 'monthly' ? '#722F37' : 'rgba(0,0,0,0.08)',
              boxShadow: selectedPlan === 'monthly' ? '0 4px 14px rgba(114,47,55,0.12)' : undefined,
              minHeight: 200,
            }}
          >
            <div style={{ minHeight: 26, marginBottom: 8 }} />
            <p className="font-semibold text-black-wine text-sm mb-3">Mensuel</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'nowrap' }}>
              <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: '#1a0508' }}>8,99</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1a0508' }}>€</span>
              <span style={{ fontSize: 15, color: '#9E9E9E', marginLeft: 2 }}>/mois</span>
            </div>
            <div style={{ fontSize: 13, color: '#9E9E9E', marginTop: 8, lineHeight: 1.35, flex: 1 }}>
              Sans engagement · Résiliable à tout moment
            </div>
            {selectedPlan === 'monthly' && (
              <div className="absolute right-3 bottom-3 w-5 h-5 rounded-full bg-burgundy-dark flex items-center justify-center">
                <Check size={12} color="white" />
              </div>
            )}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => setSelectedPlan('annual')}
            whileTap={{ scale: 0.98 }}
            className="relative rounded-2xl border-2 bg-white p-4 text-left flex flex-col"
            style={{
              borderColor: selectedPlan === 'annual' ? '#722F37' : 'rgba(0,0,0,0.08)',
              boxShadow: selectedPlan === 'annual' ? '0 4px 14px rgba(114,47,55,0.12)' : undefined,
              minHeight: 200,
            }}
          >
            <div
              className="absolute left-1/2 -translate-x-1/2 -top-2.5 whitespace-nowrap text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: '#FFFBF0', color: '#D4AF37', border: '1px solid #D4AF37' }}
            >
              ⭐ Meilleure valeur
            </div>
            <div style={{ minHeight: 26, marginBottom: 8 }} />
            <p className="font-semibold text-black-wine text-sm mb-3">Annuel</p>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'nowrap' }}>
              <span style={{ fontSize: 40, fontWeight: 900, lineHeight: 1, color: '#1a0508' }}>47,99</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#1a0508' }}>€</span>
              <span style={{ fontSize: 15, color: '#9E9E9E', marginLeft: 2 }}>/an</span>
            </div>
            <div style={{ fontSize: 13, color: '#2E7D32', marginTop: 4 }}>
              Soit 4€/mois · Économisez 12€/an
            </div>
            {selectedPlan === 'annual' && (
              <div className="absolute right-3 bottom-3 w-5 h-5 rounded-full bg-burgundy-dark flex items-center justify-center">
                <Check size={12} color="white" />
              </div>
            )}
          </motion.button>
        </div>

        {/* Trust points */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs text-gray-dark">
          <span>✓ Trial 7 jours inclus</span>
          <span>✓ Annulable à tout moment</span>
          <span>✓ Paiement sécurisé Stripe</span>
        </div>

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSubscribe(selectedPlan)}
          disabled={isLoading}
          className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-bold text-base border-none cursor-pointer shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
        >
          {isLoading ? 'Redirection...' : ctaLabel}
        </motion.button>

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

        <div style={{ height: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }} />
      </div>
    </div>
  );
}
