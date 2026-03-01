import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, Zap, Star, TrendingUp, Wine, Shield } from 'lucide-react';
import { getSubscriptionStatus } from '../utils/subscription';
import { redirectToCheckout } from '../utils/stripe';

export function Premium() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const { isPro, expiry } = getSubscriptionStatus();

  const handleSubscribe = async (plan: 'monthly' | 'annual') => {
    await redirectToCheckout(plan);
  };

  const features = [
    { icon: <Zap size={20} />, title: 'Scans illimités', desc: "Identifiez autant de vins que vous voulez" },
    { icon: <Wine size={20} />, title: 'Cave illimitée', desc: 'Gérez des centaines de bouteilles avec prix dynamiques' },
    { icon: <Star size={20} />, title: 'Chat Antoine', desc: 'Sommelier IA disponible 24h/24 pour tous vos conseils' },
    { icon: <TrendingUp size={20} />, title: 'IA Investissement', desc: 'Prédictions valeur +1/3/5 ans, grade A+ → D' },
    { icon: <Check size={20} />, title: 'Scan menu restaurant', desc: 'Meilleur rapport qualité-prix sur toute carte des vins' },
    { icon: <Check size={20} />, title: 'Accords mets-vins', desc: 'Suggestions personnalisées pour chaque plat' },
    { icon: <Check size={20} />, title: 'Ce soir je cuisine...', desc: 'Quelle bouteille ouvrir de votre cave ?' },
    { icon: <Check size={20} />, title: 'Boutique & Parrainage', desc: 'Offres exclusives + invitez vos amis' },
  ];

  const comparison = [
    { feature: 'Scans de vins', free: '3 scans TOTAL', pro: 'Illimité ✅' },
    { feature: 'Cave virtuelle', free: '5 bouteilles max', pro: 'Illimitée ✅' },
    { feature: 'Chat Antoine (sommelier IA)', free: '❌', pro: '✅ Illimité' },
    { feature: 'Scan menu restaurant', free: '❌', pro: '✅' },
    { feature: 'Accords mets-vins IA', free: '❌', pro: '✅' },
    { feature: 'IA prédictive investissement', free: '❌', pro: '✅' },
    { feature: 'Prix dynamiques cave', free: '❌', pro: '✅' },
    { feature: 'Simulation vente', free: '❌', pro: '✅' },
    { feature: '"Ce soir je cuisine..."', free: '❌', pro: '✅' },
  ];

  if (isPro) {
    return (
      <div className="min-h-screen bg-cream font-body flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mb-4">
          <Star size={40} color="#2C1810" fill="#2C1810" />
        </div>
        <h1 className="font-display text-2xl font-bold text-black-wine mb-2">Vous êtes déjà Pro !</h1>
        <p className="text-gray-dark text-sm text-center mb-6">
          {expiry ? `Abonnement actif jusqu'au ${new Date(expiry).toLocaleDateString('fr-FR')}` : 'Profitez de toutes les fonctionnalités.'}
        </p>
        <button onClick={() => navigate('/')} className="bg-burgundy-dark text-white px-8 py-3 rounded-full font-semibold text-sm border-none cursor-pointer">
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream font-body">
      <div className="bg-white border-b border-gray-light/30 px-5 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer p-1">
          <ArrowLeft size={20} color="#722F37" />
        </button>
        <span className="font-display text-base font-bold text-burgundy-dark">Sommely Pro</span>
        <div className="w-8" />
      </div>

      <div className="max-w-lg mx-auto px-5 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-gold flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Star size={40} color="#2C1810" fill="#2C1810" />
          </div>
          <h1 className="font-display text-3xl font-bold text-black-wine mb-2">Passez à Sommely Pro</h1>
          <p className="text-gray-dark text-sm leading-relaxed">
            Votre sommelier expert illimité + toutes les fonctionnalités premium
          </p>
        </motion.div>

        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-2 flex gap-2">
          <button
            onClick={() => setSelectedPlan('monthly')}
            className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer ${selectedPlan === 'monthly' ? 'bg-burgundy-dark text-white' : 'bg-transparent text-gray-dark'}`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setSelectedPlan('annual')}
            className={`relative flex-1 py-3 rounded-xl font-semibold text-sm transition-all border-none cursor-pointer ${selectedPlan === 'annual' ? 'bg-burgundy-dark text-white' : 'bg-transparent text-gray-dark'}`}
          >
            Annuel
            <span className="absolute -top-2 -right-2 bg-gold text-black-wine text-xs font-bold px-2 py-0.5 rounded-full">
              -32%
            </span>
          </button>
        </div>

        <motion.div
          key={selectedPlan}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-br from-burgundy-dark to-burgundy-medium rounded-3xl p-6 text-white shadow-xl"
        >
          <div className="text-center mb-6">
            <p className="text-white/60 text-sm mb-1">Sommely Pro</p>
            <div className="flex items-baseline justify-center gap-2">
              <span className="font-display text-5xl font-bold">{selectedPlan === 'monthly' ? '4,99€' : '49€'}</span>
              <span className="text-white/60 text-lg">/ {selectedPlan === 'monthly' ? 'mois' : 'an'}</span>
            </div>
            {selectedPlan === 'annual' && (
              <p className="text-gold text-sm font-semibold mt-2">Soit 4,08€/mois · Économie de 10,88€</p>
            )}
          </div>
          <button
            onClick={() => handleSubscribe(selectedPlan)}
            className="w-full py-4 bg-gold text-black-wine rounded-2xl font-bold text-base border-none cursor-pointer shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            S'abonner maintenant
          </button>
          <p className="text-white/40 text-xs text-center mt-3">Annulation à tout moment · Paiement sécurisé Stripe</p>
        </motion.div>

        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-5">
          <h3 className="font-display text-lg font-bold text-black-wine mb-4">Tout ce que vous débloquez</h3>
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-burgundy-dark/5 flex items-center justify-center flex-shrink-0 text-burgundy-dark">
                  {f.icon}
                </div>
                <div>
                  <p className="font-semibold text-black-wine text-sm">{f.title}</p>
                  <p className="text-xs text-gray-dark">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden">
          <div className="bg-burgundy-dark/5 px-5 py-3 border-b border-gray-light/20">
            <h3 className="font-display text-base font-bold text-black-wine">Free vs Pro</h3>
          </div>
          <div className="divide-y divide-gray-light/20">
            {comparison.map((row, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 px-5 py-3 items-center">
                <p className="text-xs text-gray-dark col-span-1">{row.feature}</p>
                <p className="text-xs text-gray-dark text-center">{row.free}</p>
                <p className="text-xs font-semibold text-burgundy-dark text-center">{row.pro}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} color="#2E7D32" />
            <p className="font-semibold text-black-wine text-sm">Garantie satisfait ou remboursé 7 jours</p>
          </div>
          <p className="text-xs text-gray-dark leading-relaxed">
            Essayez Sommely Pro sans risque. Si vous n'êtes pas satisfait dans les 7 premiers jours, nous vous
            remboursons intégralement.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: "Puis-je annuler à tout moment ?",
              a: "Oui, annulation en 1 clic depuis votre profil. Pas d'engagement.",
            },
            {
              q: 'Mes données sont-elles sécurisées ?',
              a: 'Paiement 100% sécurisé via Stripe. Nous ne stockons aucune donnée bancaire.',
            },
            {
              q: 'Comment fonctionne le parrainage ?',
              a: "Invitez 1 ami avec votre code → vous recevez tous les deux 1 mois Pro offert.",
            },
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
