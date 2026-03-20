import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap, Star, TrendingUp, Wine, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { redirectToCheckout } from '../utils/stripe';
import { useTheme } from '../context/ThemeContext';

type Plan = 'monthly' | 'annual';

export function Premium() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<Plan>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const { subscriptionState } = useAuth();
  const { isPro, isTrial, daysLeftInTrial } = subscriptionState;
  const { formatPrice } = useTheme();

  const handleSubscribe = async (plan: Plan) => {
    setIsLoading(true);
    try {
      await redirectToCheckout(plan);
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'annual' as Plan,
      label: 'Annuel',
      badge: 'Meilleure valeur',
      price: formatPrice(47.99),
      period: '/an',
      subline: `Soit ${formatPrice(4)}/mois · Économisez ${formatPrice(60)}`,
      sublineGreen: true,
      highlight: true,
      cta: 'Commencer maintenant →',
    },
    {
      id: 'monthly' as Plan,
      label: 'Mensuel',
      badge: null,
      price: formatPrice(8.99),
      period: '/mois',
      subline: 'Sans engagement · Résiliable à tout moment',
      sublineGreen: false,
      highlight: false,
      cta: 'Essayer un mois',
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
          <h1 className="font-display text-3xl font-bold text-black-wine mb-2">Devenez un expert du vin</h1>
          <p className="text-gray-dark text-sm leading-relaxed">
            Le seul outil qui combine IA, cave personnelle et sommelier 24h/24. Ce que Vivino ne fera jamais.
          </p>
        </motion.div>

        {/* Pourquoi passer Pro ? — 3 cards horizontales */}
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

        {/* Social proof Trustpilot-style */}
        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex -space-x-2">
              {['47','23','12','36'].map((id, i) => (
                <img key={i} src={`https://i.pravatar.cc/40?img=${id}`} alt="user" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
              ))}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-0.5 justify-end mb-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill="#D4AF37"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <p className="text-xs text-gray-dark font-medium">4,9/5 · 847 avis</p>
            </div>
          </div>
          {[
            { img: '10', name: 'Lucas M.', text: "J'ai scanné un Gevrey-Chambertin au resto, score 91/100. J'ai commandé sans hésiter. Le serveur était impressionné." },
            { img: '11', name: 'Camille R.', text: "La cave virtuelle m'a dit que mon Pomerol 2018 valait 40% de plus que ce que j'ai payé. J'aurais jamais su sans Sommely." },
            { img: '15', name: 'Alexandre D.', text: "Antoine m'a conseillé un accord parfait pour mon dîner. Mes invités ont cru que j'étais sommelier. Vaut largement les 4€/mois." },
          ].map((r, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-t border-gray-light/20">
              <img src={`https://i.pravatar.cc/32?img=${r.img}`} alt={r.name} className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-semibold text-black-wine">{r.name}</span>
                  <div className="flex">{[...Array(5)].map((_, j) => <svg key={j} width="9" height="9" viewBox="0 0 24 24" fill="#D4AF37"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}</div>
                </div>
                <p className="text-xs text-gray-dark leading-relaxed">{r.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Plans — 2 plans : Annuel mis en avant, Mensuel neutre */}
        <div className="space-y-3 pt-1">
          {plans.map((plan) => (
            <motion.button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              whileTap={{ scale: 0.98 }}
              className={`w-full text-left rounded-2xl border-2 transition-all relative bg-white ${
                plan.highlight
                  ? 'p-5 shadow-md cursor-pointer min-h-[88px]'
                  : 'p-5 cursor-pointer min-h-[88px]'
              } ${
                selectedPlan === plan.id
                  ? plan.highlight ? 'border-burgundy-dark shadow-lg' : 'border-burgundy-dark shadow-md'
                  : plan.highlight ? 'border-burgundy-dark/60 hover:border-burgundy-dark' : 'border-gray-light/40 hover:border-gray-dark/30'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-4 text-xs font-bold px-3 py-1 rounded-full bg-gold text-black-wine">
                  {plan.badge}
                </span>
              )}
              <div className={`flex items-center justify-between ${plan.highlight ? 'pr-8' : 'pr-6'} min-h-[72px]`}>
                <div>
                  <p className={`font-semibold text-black-wine ${plan.highlight ? 'text-base' : 'text-sm'}`}>{plan.label}</p>
                  <p className={`text-xs mt-0.5 ${plan.sublineGreen ? 'text-green-700 font-medium' : 'text-gray-dark'}`}>{plan.subline}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                  <span style={{ fontSize: plan.highlight ? '28px' : '24px', fontWeight: 900, color: '#722F37' }}>{plan.price}</span>
                  <span style={{ fontSize: '14px', color: '#6B5D56' }}>{plan.period}</span>
                </div>
              </div>
              {selectedPlan === plan.id && (
                <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-burgundy-dark flex items-center justify-center`}>
                  <Check size={12} color="white" />
                </div>
              )}
            </motion.button>
          ))}
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
          {isLoading ? 'Redirection...' : (plans.find(p => p.id === selectedPlan)?.cta ?? 'Commencer maintenant →')}
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
