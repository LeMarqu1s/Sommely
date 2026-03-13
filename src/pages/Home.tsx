import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, ChevronRight, TrendingUp, Star, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCaveBottles, getScansCountTotal } from '../lib/supabase';

export function Home() {
  const navigate = useNavigate();
  const { user, profile, subscriptionState } = useAuth();
  const [scanCount, setScanCount] = useState(0);
  const [caveValue, setCaveValue] = useState(0);
  const [caveBottles, setCaveBottles] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [recentWine, setRecentWine] = useState<{ name: string; year?: number; region?: string } | null>(null);

  const firstName = (profile?.taste_profile as any)?.firstName || profile?.name?.split(' ')[0] || '';
  const isPremium = subscriptionState.isPro || subscriptionState.isTrial;
  const scansRemaining = isPremium ? 999 : Math.max(0, 3 - subscriptionState.scansThisMonth);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setTimeOfDay('Bonjour');
    else if (h < 18) setTimeOfDay('Bon après-midi');
    else setTimeOfDay('Bonsoir');
  }, []);

  useEffect(() => {
    if (user?.id) {
      getCaveBottles(user.id).then(({ data }) => {
        if (data?.length) {
          const val = data.reduce((s, b) => s + Number(b.current_price) * b.quantity, 0);
          const total = data.reduce((s, b) => s + b.quantity, 0);
          setCaveValue(Math.round(val));
          setCaveBottles(total);
        }
      });
      getScansCountTotal(user.id).then(({ count }) => setScanCount(count ?? 0));
    } else {
      setScanCount(0);
      setCaveValue(0);
      setCaveBottles(0);
    }
  }, [user?.id]);

  useEffect(() => {
    try {
      const lastScan = localStorage.getItem('sommely_last_scan');
      if (lastScan) setRecentWine(JSON.parse(lastScan));
    } catch { /* ignore */ }
  }, []);

  const features = [
    {
      id: 'menu',
      emoji: '📋',
      title: 'Carte du restaurant',
      subtitle: 'Meilleur rapport qualité-prix',
      color: 'from-amber-500/10 to-amber-600/5',
      border: 'border-amber-200/50',
      route: '/menu',
      tag: 'Exclusif',
      tagColor: 'bg-amber-100 text-amber-700',
    },
    {
      id: 'food',
      emoji: '🍽️',
      title: 'Accord mets & vins',
      subtitle: 'Quel vin avec ce plat ?',
      color: 'from-orange-500/10 to-orange-600/5',
      border: 'border-orange-200/50',
      route: '/food-pairing',
      tag: 'IA',
      tagColor: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'sommelier',
      emoji: '🍷',
      title: 'Chat Antoine',
      subtitle: 'Votre sommelier IA disponible 24h/24',
      color: 'from-burgundy-dark/10 to-burgundy-medium/5',
      border: 'border-burgundy-dark/20',
      route: '/sommelier',
      tag: 'IA',
      tagColor: 'bg-burgundy-dark/10 text-burgundy-dark',
    },
    {
      id: 'cave-meal',
      emoji: '👨‍🍳',
      title: 'Ce soir je cuisine...',
      subtitle: 'Quelle bouteille ouvrir dans ma cave ?',
      color: 'from-orange-500/10 to-orange-600/5',
      border: 'border-orange-200/50',
      route: '/cave-meal',
      tag: 'Nouveau',
      tagColor: 'bg-orange-100 text-orange-700',
    },
    {
      id: 'shop',
      emoji: '🛒',
      title: 'Boutique & Parrainage',
      subtitle: 'Offres exclusives · Invitez vos amis',
      color: 'from-purple-500/10 to-purple-600/5',
      border: 'border-purple-200/50',
      route: '/shop',
      tag: 'Offres',
      tagColor: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="min-h-screen bg-cream font-body">

      {/* HEADER */}
      <div className="bg-white px-6 pt-12 pb-6 border-b border-gray-light/20">
        <div className="max-w-lg mx-auto">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-dark text-sm">{timeOfDay}{firstName ? `, ${firstName}` : ''} 👋</p>
              <h1 className="font-display text-2xl font-bold text-black-wine mt-0.5">
                {isPremium ? '🌟 Sommely Pro' : 'Sommely'}
              </h1>
            </div>
            <button onClick={() => navigate('/profile')} className="w-11 h-11 rounded-full bg-burgundy-dark flex items-center justify-center border-none cursor-pointer shadow-md">
              {firstName ? (
                <span className="font-display text-base font-bold text-white">{firstName[0].toUpperCase()}</span>
              ) : (
                <img src="/IMG_1639-transparent.png" alt="Sommely" width={24} height={24} className="object-contain" style={{ filter: 'brightness(0) invert(1)' }} onError={(e) => { (e.target as HTMLImageElement).src = '/Logo%20Sommely.jpeg'; (e.target as HTMLImageElement).style.filter = 'brightness(0) invert(1)'; }} />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 py-5 space-y-5">

        {/* CTA SCANNER PRINCIPAL */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/scan')}
          className="w-full bg-gradient-to-br from-burgundy-dark to-burgundy-medium rounded-3xl p-6 text-white border-none cursor-pointer shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <Camera size={24} color="white" />
              </div>
              {!isPremium && (
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${scansRemaining > 1 ? 'bg-white/15 text-white' : scansRemaining === 1 ? 'bg-orange-400/30 text-orange-200' : 'bg-red-400/30 text-red-200'}`}>
                  {scansRemaining > 0 ? `${scansRemaining} scan${scansRemaining > 1 ? 's' : ''} gratuit${scansRemaining > 1 ? 's' : ''}` : 'Limite atteinte'}
                </div>
              )}
              {isPremium && <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-gold/30 text-gold">♾ Illimité</div>}
            </div>
            <h2 className="font-display text-2xl font-bold mb-1">Scanner un vin en 3 secondes</h2>
            <p className="text-white/60 text-sm">Photographiez l'étiquette, Antoine analyse et vous donne un score personnalisé selon vos goûts.</p>
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-0.5 bg-white/10" />
              <span className="text-white/40 text-xs">Appuyez pour commencer</span>
              <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
            </div>
          </div>
        </motion.button>

        {/* STATS RAPIDES */}
        {(scanCount > 0 || caveBottles > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
          >
            <div className="bg-white rounded-2xl border border-gray-light/30 p-3.5 text-center shadow-sm">
              <p className="font-display text-2xl font-bold text-black-wine">{scanCount}</p>
              <p className="text-xs text-gray-dark">Scans</p>
            </div>
            <button onClick={() => navigate('/cave')} className="bg-white rounded-2xl border border-gray-light/30 p-3.5 text-center shadow-sm hover:shadow-md transition-all cursor-pointer">
              <p className="font-display text-2xl font-bold text-black-wine">{caveBottles}</p>
              <p className="text-xs text-gray-dark">En cave</p>
            </button>
            <button onClick={() => navigate('/cave')} className="bg-white rounded-2xl border border-gray-light/30 p-3.5 text-center shadow-sm hover:shadow-md transition-all cursor-pointer">
              <p className="font-display text-lg font-bold text-black-wine">{caveValue > 0 ? `${Math.round(caveValue / 1000 * 10) / 10}k€` : '...'}</p>
              <p className="text-xs text-gray-dark">Cave</p>
            </button>
          </motion.div>
        )}

        {/* CAVE VIRTUELLE */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/cave')}
          className="w-full bg-white rounded-2xl border border-gray-light/30 shadow-sm p-5 text-left cursor-pointer hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-burgundy-dark/5 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🍾</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-black-wine text-sm">Ma cave virtuelle</p>
              </div>
              <p className="text-xs text-gray-dark">
                {caveBottles > 0
                  ? `${caveBottles} bouteille${caveBottles > 1 ? 's' : ''} · Valeur : ${caveValue.toLocaleString('fr-FR')} €`
                  : 'Gérez vos bouteilles · Prix en temps réel'}
              </p>
            </div>
            <ChevronRight size={18} color="#D1CBC4" />
          </div>
          {caveValue > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-light/30 flex items-center gap-2">
              <TrendingUp size={14} color="#2E7D32" />
              <span className="text-xs text-green-700 font-semibold">Prix mis à jour par IA</span>
              <span className="text-xs text-gray-dark ml-auto">Simulation vente →</span>
            </div>
          )}
        </motion.button>

        {/* FONCTIONNALITÉS EXCLUSIVES */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-display text-base font-bold text-black-wine">Fonctionnalités exclusives</p>
            <div className="flex items-center gap-1">
              <Zap size={12} color="#D4AF37" fill="#D4AF37" />
              <span className="text-xs text-gray-dark font-medium">Introuvable sur Vivino</span>
            </div>
          </div>
          <div className="space-y-3">
            {features.map((f, i) => (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                onClick={() => navigate(f.route)}
                className={`w-full bg-gradient-to-r ${f.color} rounded-2xl border ${f.border} p-4 text-left cursor-pointer hover:shadow-md transition-all`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl flex-shrink-0">{f.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-black-wine text-sm">{f.title}</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.tagColor}`}>{f.tag}</span>
                    </div>
                    <p className="text-xs text-gray-dark">{f.subtitle}</p>
                  </div>
                  <ChevronRight size={16} color="#D1CBC4" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* BANNER PREMIUM si pas premium */}
        {!isPremium && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={() => navigate('/premium')}
            className="w-full bg-gradient-to-r from-gold/20 to-amber-400/10 border border-gold/30 rounded-2xl p-5 text-left cursor-pointer hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center flex-shrink-0">
                <Star size={20} color="#D4AF37" fill="#D4AF37" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-black-wine text-sm">Passer à Sommely Pro</p>
                <p className="text-xs text-gray-dark">Scans illimités · Cave illimitée · Toutes les fonctionnalités</p>
              </div>
              <ChevronRight size={16} color="#D4AF37" />
            </div>
          </motion.button>
        )}

        {/* DERNIÈRE ACTIVITÉ */}
        {recentWine && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4"
          >
            <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-3">Dernier vin scanné</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-burgundy-dark/5 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🍷</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-black-wine text-sm truncate">{recentWine.name}</p>
                <p className="text-xs text-gray-dark">{recentWine.year} · {recentWine.region}</p>
              </div>
              <button onClick={() => navigate('/scan')} className="bg-burgundy-dark text-white text-xs px-3 py-1.5 rounded-full border-none cursor-pointer font-semibold">
                Rescanner
              </button>
            </div>
          </motion.div>
        )}

        {/* TIPS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="bg-white rounded-2xl border border-gray-light/30 p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">💡</span>
            <div>
              <p className="text-xs font-bold text-black-wine mb-1">Le saviez-vous ?</p>
              <p className="text-xs text-gray-dark leading-relaxed">
                Les restaurants majorent les vins en moyenne de 250%. Utilisez &quot;Carte du restaurant&quot; pour trouver les meilleures affaires sur n'importe quelle carte des vins.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="h-6" />

        {/* Footer */}
        <div className="text-center pb-4">
          <button onClick={() => navigate('/privacy')} className="text-xs text-gray-dark/50 hover:text-burgundy-dark bg-transparent border-none cursor-pointer underline">
            Politique de confidentialité
          </button>
        </div>
      </div>
    </div>
  );
}
