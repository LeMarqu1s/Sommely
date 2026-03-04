import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wine,
  Settings,
  Crown,
  LogOut,
  Edit3,
  Star,
  Heart,
  Clock,
  ChevronRight,
  Award,
  Zap,
  Shield,
  RefreshCw,
  Bell,
  User,
  Share2,
  Copy,
} from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { getUserScans, getScansCountTotal } from '../lib/supabase';

const BADGES = [
  { id: 'first', label: 'Premier scan', icon: '🍷', threshold: 1, description: 'Vous avez scanné votre première bouteille' },
  { id: 'explorer', label: 'Explorateur', icon: '🗺️', threshold: 5, description: '5 bouteilles scannées' },
  { id: 'amateur', label: 'Amateur', icon: '🎓', threshold: 15, description: '15 bouteilles scannées' },
  { id: 'connaisseur', label: 'Connaisseur', icon: '🏆', threshold: 30, description: '30 bouteilles scannées' },
  { id: 'expert', label: 'Expert', icon: '👑', threshold: 50, description: '50 bouteilles scannées' },
  { id: 'sommelier', label: 'Sommelier', icon: '🌟', threshold: 100, description: '100 bouteilles scannées' },
];

const SUBSCRIPTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  free: { label: 'Gratuit', color: '#6B5D56', bg: 'bg-gray-light/30' },
  monthly: { label: 'Mensuel', color: '#1976D2', bg: 'bg-blue-100' },
  annual: { label: 'Club Annuel', color: '#722F37', bg: 'bg-burgundy-dark/10' },
  lifetime: { label: 'À vie', color: '#D4AF37', bg: 'bg-gold/15' },
};

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, subscription, subscriptionState, signOut, isAuthenticated, refreshSubscription } = useAuth();
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [scanCountTotal, setScanCountTotal] = useState(0);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoadingScans, setIsLoadingScans] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const tasteProfile = (profile?.taste_profile as Record<string, unknown>) || {};
  const localProfile = { ...tasteProfile };
  try {
    const local = localStorage.getItem('sommely_profile');
    if (local) Object.assign(localProfile, JSON.parse(local));
  } catch { /* ignore */ }
  const isPro = subscriptionState.isPro || subscriptionState.isTrial;
  const subscriptionTier = isPro ? (subscriptionState.plan || 'annual') : 'free';
  const localFavorites = JSON.parse(localStorage.getItem('sommely_favorites') || '[]');

  const firstName = (localProfile.firstName as string) || profile?.name || user?.user_metadata?.full_name?.split(' ')[0] || 'Vous';
  const email = user?.email || profile?.email || '';
  const subInfo = SUBSCRIPTION_LABELS[subscriptionTier] || SUBSCRIPTION_LABELS.free;

  const scansRemaining = subscriptionState.isPro || subscriptionState.isTrial
    ? 999
    : Math.max(0, 3 - subscriptionState.scansThisMonth);
  const expiry = subscription?.current_period_end || subscriptionState.trialEndsAt;

  const earnedBadges = BADGES.filter((b) => scanCountTotal >= b.threshold);
  const nextBadge = BADGES.find((b) => scanCountTotal < b.threshold);

  useEffect(() => {
    setFavorites(localFavorites);
  }, [localFavorites]);

  useEffect(() => {
    if (user) {
      setIsLoadingScans(true);
      Promise.all([
        getUserScans(user.id, 5),
        getScansCountTotal(user.id),
      ]).then(([{ data }, { count }]) => {
        if (data) setRecentScans(data);
        setScanCountTotal(count ?? 0);
        setIsLoadingScans(false);
      });
    } else {
      setRecentScans([]);
      setScanCountTotal(0);
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleCancelSubscription = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    refreshSubscription();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream font-body text-black-wine overflow-x-hidden">
      <div className="bg-white border-b border-gray-light/30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/scan')}
            className="flex items-center gap-2 bg-transparent border-none cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-burgundy-dark flex items-center justify-center overflow-hidden">
              <Logo size={20} variant="white" />
            </div>
            <span className="font-display text-lg font-bold text-burgundy-dark">Sommely</span>
          </button>
          {isPro && (
            <div className="inline-flex items-center gap-1.5 bg-gold/10 border border-gold/30 rounded-full px-3 py-1">
              <Star size={14} color="#D4AF37" fill="#D4AF37" />
              <span className="text-xs font-bold text-gold">Pro</span>
            </div>
          )}
        </div>
        <button
          onClick={() => navigate('/scan')}
          className="flex items-center gap-1 text-gray-dark text-sm bg-transparent border-none cursor-pointer hover:text-burgundy-dark transition-colors"
        >
          <Wine size={16} />
          Scanner
        </button>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-light/20"
        >
          <div className="h-20 bg-gradient-to-br from-burgundy-dark to-burgundy-medium relative -z-0">
            <div
              className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #D4AF37 0%, transparent 60%)' }}
            />
          </div>

          <div className="px-6 pb-6 relative z-10 -mt-8">
            <div className="flex items-end justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl bg-burgundy-dark border-4 border-white flex items-center justify-center shadow-lg">
                <span className="text-white font-display text-2xl font-bold">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => navigate('/onboarding')}
                className="flex items-center gap-1.5 bg-cream border border-gray-light rounded-full px-3 py-1.5 text-xs text-gray-dark hover:text-burgundy-dark transition-colors cursor-pointer"
              >
                <Edit3 size={12} />
                Modifier mon profil
              </button>
            </div>

            <h1 className="font-display text-xl font-bold text-black-wine mb-0.5">Bonjour, {firstName} ! 👋</h1>
            {email && <p className="text-gray-dark text-sm mb-3">{email}</p>}

            <div className={`inline-flex items-center gap-2 ${subInfo.bg} rounded-full px-4 py-2`}>
              {subscriptionTier === 'lifetime' ? (
                <Crown size={14} color={subInfo.color} />
              ) : subscriptionTier !== 'free' ? (
                <Star size={14} color={subInfo.color} fill={subInfo.color} />
              ) : (
                <Zap size={14} color={subInfo.color} />
              )}
              <span className="text-xs font-bold" style={{ color: subInfo.color }}>
                {subInfo.label}
                    {subscriptionTier === 'free' && ` · ${scansRemaining} scan${scansRemaining > 1 ? 's' : ''} restant ce mois`}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { icon: Wine, value: scanCountTotal.toString(), label: 'Scans', color: '#722F37' },
            { icon: Heart, value: favorites.length.toString(), label: 'Favoris', color: '#C62828' },
            { icon: Award, value: earnedBadges.length.toString(), label: 'Badges', color: '#D4AF37' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-4 text-center border border-gray-light/30 shadow-sm"
            >
              <stat.icon size={20} color={stat.color} className="mx-auto mb-2" />
              <p className="font-display text-2xl font-bold text-black-wine">{stat.value}</p>
              <p className="text-xs text-gray-dark">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <button
            onClick={() => navigate('/menu')}
            className="w-full flex items-center gap-4 bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-gold/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-black-wine text-sm">Scanner la carte</p>
              <p className="text-xs text-gray-dark">Meilleur rapport qualité-prix au resto</p>
            </div>
            <ChevronRight size={16} color="#D1CBC4" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-light/20 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-black-wine">Mes badges 🏅</h2>
            <span className="text-xs text-gray-dark">
              {earnedBadges.length}/{BADGES.length}
            </span>
          </div>
          <div className="p-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {BADGES.map((badge) => {
                const earned = scanCountTotal >= badge.threshold;
                return (
                  <div
                    key={badge.id}
                    className={`flex-shrink-0 flex flex-col items-center gap-1 p-3 rounded-2xl border transition-all ${
                      earned ? 'bg-gold/10 border-gold/40 shadow-sm' : 'bg-gray-light/10 border-gray-light/30 opacity-50'
                    }`}
                    style={{ minWidth: '72px' }}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-xs font-semibold text-center text-black-wine leading-tight">
                      {badge.label}
                    </span>
                    {!earned && (
                      <span className="text-xs text-gray-dark">{badge.threshold} scans</span>
                    )}
                  </div>
                );
              })}
            </div>
            {nextBadge && (
              <div className="mt-3 bg-cream rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-black-wine">
                    Prochain badge : {nextBadge.label} {nextBadge.icon}
                  </span>
                  <span className="text-xs text-gray-dark">
                    {scanCountTotal}/{nextBadge.threshold}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-light/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-burgundy-dark to-gold rounded-full"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, (scanCountTotal / nextBadge.threshold) * 100)}%`,
                    }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-light/20 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-black-wine">Mon profil de dégustation</h2>
            <button
              onClick={() => navigate('/onboarding')}
              className="text-xs text-burgundy-dark font-semibold bg-transparent border-none cursor-pointer hover:underline"
            >
              Modifier
            </button>
          </div>
          <div className="px-6 py-4 space-y-3">
            {[
              {
                label: 'Budget habituel',
                value:
                  localProfile.budget === 'low'
                    ? 'Moins de 10 €'
                    : localProfile.budget === 'medium'
                    ? '10-20 €'
                    : localProfile.budget === 'high'
                    ? '20-40 €'
                    : localProfile.budget === 'premium'
                    ? 'Plus de 40 €'
                    : 'Non défini',
              },
              {
                label: 'Niveau',
                value:
                  localProfile.expertise === 'beginner'
                    ? 'Débutant'
                    : localProfile.expertise === 'learning'
                    ? 'En apprentissage'
                    : localProfile.expertise === 'amateur'
                    ? 'Amateur'
                    : localProfile.expertise === 'expert'
                    ? 'Expert'
                    : 'Non défini',
              },
              {
                label: 'Fréquence',
                value:
                  localProfile.frequency === 'rarely'
                    ? 'Rarement'
                    : localProfile.frequency === 'monthly'
                    ? '1-2 fois par mois'
                    : localProfile.frequency === 'weekly'
                    ? 'Chaque semaine'
                    : localProfile.frequency === 'daily'
                    ? 'Plusieurs fois par semaine'
                    : 'Non défini',
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-gray-dark">{item.label}</span>
                <span className="text-sm font-semibold text-black-wine">{item.value}</span>
              </div>
            ))}
            {!localProfile.budget && !localProfile.expertise && (
              <button
                onClick={() => navigate('/onboarding')}
                className="w-full py-3 border-2 border-dashed border-gray-light rounded-xl text-sm text-gray-dark hover:border-burgundy-dark hover:text-burgundy-dark transition-colors bg-transparent cursor-pointer"
              >
                + Compléter mon profil pour de meilleures recommandations
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-light/20 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-black-wine">Mes scans récents</h2>
            <Clock size={16} color="#6B5D56" />
          </div>
          <div>
            {isLoadingScans ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw size={20} className="animate-spin text-gray-dark" />
              </div>
            ) : recentScans.length > 0 ? (
              recentScans.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center gap-4 px-6 py-4 border-b border-gray-light/20 last:border-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-burgundy-dark/10 flex items-center justify-center flex-shrink-0">
                    <Wine size={18} color="#722F37" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black-wine text-sm truncate">{scan.wine_name}</p>
                    <p className="text-xs text-gray-dark">
                      {scan.wine_type} · {scan.wine_region}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className="font-display text-lg font-bold"
                      style={{
                        color: scan.score >= 85 ? '#2E7D32' : scan.score >= 60 ? '#F57C00' : '#C62828',
                      }}
                    >
                      {scan.score}
                    </p>
                    <p className="text-xs text-gray-dark">/100</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center py-8 px-6 text-center">
                <Wine size={32} color="#D1CBC4" className="mb-3" />
                <p className="text-gray-dark text-sm mb-3">Aucun scan pour l'instant</p>
                <button
                  onClick={() => navigate('/scan')}
                  className="bg-burgundy-dark text-white px-6 py-2.5 rounded-full text-sm font-semibold border-none cursor-pointer hover:bg-burgundy-medium transition-colors"
                >
                  Scanner ma première bouteille 🍷
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {favorites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-light/20 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-black-wine">Mes vins favoris ❤️</h2>
              <Heart size={16} color="#C62828" fill="#C62828" />
            </div>
            <div>
              {favorites.slice(0, 3).map((fav: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-4 px-6 py-4 border-b border-gray-light/20 last:border-0"
                >
                  <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                    <Heart size={18} color="#C62828" fill="#C62828" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black-wine text-sm truncate">{fav.name}</p>
                    <p className="text-xs text-gray-dark">
                      {fav.type} · {fav.region}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-lg font-bold text-success">{fav.score}</p>
                    <p className="text-xs text-gray-dark">/100</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {profile?.referral_code && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-light/20 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-black-wine">Parrainer des amis</h2>
              <Share2 size={16} color="#722F37" />
            </div>
            <div className="px-6 py-4">
              <p className="text-xs text-gray-dark mb-2">Partagez votre code : 14 jours de trial pour vos amis, 1 mois offert pour vous s'ils passent Pro !</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 py-2.5 px-3 bg-cream rounded-xl font-mono text-sm font-bold text-burgundy-dark">
                  {profile.referral_code}
                </code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/invite/${profile.referral_code}`;
                    navigator.clipboard?.writeText(url);
                  }}
                  className="p-2.5 bg-burgundy-dark text-white rounded-xl border-none cursor-pointer"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-light/20">
            <h2 className="font-display text-base font-bold text-black-wine">Mon abonnement</h2>
          </div>
          <div className="px-6 py-4">
            {subscriptionState.isTrial ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-black-wine">Période d'essai</p>
                    <p className="text-xs text-gray-dark">
                      {subscriptionState.daysLeftInTrial} jour{subscriptionState.daysLeftInTrial > 1 ? 's' : ''} restant{subscriptionState.daysLeftInTrial > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
                    <Zap size={18} color="#D4AF37" />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/premium')}
                  className="w-full py-3.5 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border-none cursor-pointer hover:bg-burgundy-medium transition-colors shadow-md"
                >
                  <Crown size={16} />
                  Passer à Pro · 4,99€/mois
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : subscriptionTier === 'free' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-black-wine">Formule gratuite</p>
                    <p className="text-xs text-gray-dark">
                      {scansRemaining} scan{scansRemaining > 1 ? 's' : ''} restants ce mois
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gray-light/30 flex items-center justify-center">
                    <Zap size={18} color="#6B5D56" />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/premium')}
                  className="w-full py-3.5 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 border-none cursor-pointer hover:bg-burgundy-medium transition-colors shadow-md"
                >
                  <Crown size={16} />
                  Passer à Pro · 4,99€/mois
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-black-wine">{subInfo.label}</p>
                    <p className="text-xs text-gray-dark">
                      {subscriptionTier === 'lifetime'
                        ? 'Accès permanent à vie'
                        : expiry
                        ? `Actif jusqu'au ${new Date(expiry).toLocaleDateString('fr-FR')}`
                        : 'Pro actif'}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${subInfo.bg} flex items-center justify-center`}>
                    {subscriptionTier === 'lifetime' ? (
                      <Crown size={18} color={subInfo.color} />
                    ) : (
                      <Star size={18} color={subInfo.color} fill={subInfo.color} />
                    )}
                  </div>
                </div>
                {subscriptionTier !== 'lifetime' && (
                  <button
                    onClick={handleCancelSubscription}
                    className="text-xs text-gray-dark hover:text-danger transition-colors bg-transparent border-none cursor-pointer underline"
                  >
                    Gérer ou annuler mon abonnement
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-white rounded-2xl border border-gray-light/30 shadow-sm overflow-hidden"
        >
          {[
            { icon: Bell, label: 'Notifications', action: () => {}, color: '#6B5D56' },
            { icon: Shield, label: 'Confidentialité', action: () => {}, color: '#6B5D56' },
            { icon: Settings, label: 'Paramètres', action: () => {}, color: '#6B5D56' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-4 px-6 py-4 border-b border-gray-light/20 last:border-0 hover:bg-cream transition-colors cursor-pointer bg-transparent text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-light/30 flex items-center justify-center">
                <item.icon size={16} color={item.color} />
              </div>
              <span className="flex-1 text-sm font-medium text-black-wine">{item.label}</span>
              <ChevronRight size={16} color="#D1CBC4" />
            </button>
          ))}
        </motion.div>

        {isAuthenticated ? (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            onClick={handleSignOut}
            className="w-full py-4 bg-white border-2 border-danger/30 text-danger rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-danger/5 transition-colors"
          >
            <LogOut size={18} />
            Se déconnecter
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            onClick={() => navigate('/auth')}
            className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer border-none hover:bg-burgundy-medium transition-colors shadow-md"
          >
            <User size={18} />
            Se connecter pour sauvegarder mes données
          </motion.button>
        )}

        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 px-6 pb-6"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-xl font-bold text-black-wine mb-2">Avant d'annuler…</h3>
              <p className="text-gray-dark text-sm mb-4">
                Vous allez perdre l'accès aux scans illimités, au sommelier IA et à la gestion de cave.
              </p>
              <div className="bg-gold/10 border border-gold/30 rounded-2xl p-4 mb-5">
                <p className="text-sm font-semibold text-yellow-800 mb-1">Alternative : Pausez votre abonnement</p>
                <p className="text-xs text-gray-dark">
                  Passez au plan gratuit et gardez votre historique. Reprenez quand vous voulez.
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowCancelConfirm(false);
                    navigate('/premium');
                  }}
                  className="w-full py-3.5 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm border-none cursor-pointer hover:bg-burgundy-medium transition-colors"
                >
                  Rester Premium 🏅
                </button>
                <button
                  onClick={confirmCancel}
                  className="w-full py-3 text-danger text-sm font-medium bg-transparent border-none cursor-pointer hover:underline"
                >
                  Confirmer l'annulation
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

