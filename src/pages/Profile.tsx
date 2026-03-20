import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wine,
  Settings,
  Crown,
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
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useTheme, CURRENCIES } from '../context/ThemeContext';
import { getUserScans, getScansCountTotal, applyReferralCode, getReferralStats } from '../lib/supabase';
import { SaveFlowModal } from '../components/SaveFlow';

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
  const [searchParams] = useSearchParams();
  const { user, profile, subscription, subscriptionState, isAuthenticated, refreshSubscription, refreshProfile } = useAuth();
  const { theme, toggleTheme, currency, setCurrency, formatPrice } = useTheme();
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [scanCountTotal, setScanCountTotal] = useState(0);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoadingScans, setIsLoadingScans] = useState(false);
  const [showSaveFlow, setShowSaveFlow] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralMessage, setReferralMessage] = useState('');
  const [referralSuccess, setReferralSuccess] = useState(false);
  const [referralStats, setReferralStats] = useState({ total: 0, rewarded: 0, pending: 0 });
  const [copied, setCopied] = useState(false);

  const tasteProfile = (profile?.taste_profile as Record<string, unknown>) || {};
  const localProfile = { ...tasteProfile };
  try {
    const local = localStorage.getItem('sommely_profile');
    if (local) Object.assign(localProfile, JSON.parse(local));
  } catch { /* ignore */ }
  const isPro = subscriptionState.isPro || subscriptionState.isTrial;
  const subscriptionTier = isPro ? (subscriptionState.plan || 'annual') : 'free';
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
    try {
      const stored = localStorage.getItem('sommely_favorites');
      setFavorites(stored ? JSON.parse(stored) : []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!user) {
      setRecentScans([]);
      setScanCountTotal(0);
      return;
    }
    let mounted = true;
    setIsLoadingScans(true);
    Promise.all([
      getUserScans(user.id, 5),
      getScansCountTotal(user.id),
    ]).then(([{ data }, { count }]) => {
      if (!mounted) return;
      if (data) setRecentScans(data);
      setScanCountTotal(count ?? 0);
      setIsLoadingScans(false);
    });
    return () => { mounted = false; };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) getReferralStats(user.id).then(setReferralStats);
  }, [user?.id]);

  useEffect(() => {
    if (searchParams.get('referral_applied') === '1') {
      setReferralSuccess(true);
      setReferralMessage('✅ Code appliqué ! 1 mois offert ajouté à votre compte.');
      window.history.replaceState(null, '', '/profile');
    }
  }, [searchParams]);

  const accountAgeMs = profile?.created_at ? Date.now() - new Date(profile.created_at).getTime() : 0;
  const accountUnder7Days = accountAgeMs < 7 * 24 * 60 * 60 * 1000;
  const showUseReferralSection = !profile?.referred_by && accountUnder7Days && user?.id;

  const handleApplyReferral = async () => {
    if (!user?.id) return;
    setReferralLoading(true);
    const result = await applyReferralCode(user.id, referralInput);
    setReferralLoading(false);
    if (result.error) {
      setReferralSuccess(false);
      setReferralMessage('❌ ' + result.error);
    } else {
      setReferralSuccess(true);
      setReferralMessage('✅ Code appliqué ! 1 mois offert ajouté à votre compte.');
      setReferralInput('');
      refreshProfile?.();
    }
  };

  const copyReferralCode = async () => {
    if (profile?.referral_code) {
      await navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareReferral = () => {
    if (profile?.referral_code && navigator.share) {
      navigator.share({
        title: 'Sommely — Le Yuka du vin',
        text: `Rejoins-moi sur Sommely avec mon code ${profile.referral_code} et obtiens 1 mois offert ! 🍷`,
        url: `https://sommely.shop?ref=${profile.referral_code}`,
      });
    } else if (profile?.referral_code) {
      copyReferralCode();
    }
  };

  return (
    <div className="min-h-screen font-body" style={{ background: 'var(--bg-app)' }}>
      <div className="px-5 flex items-center justify-center"
        style={{ background: 'var(--bg-app)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)', paddingBottom: '16px' }}>
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Profil</span>
          {isPro && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>Pro</span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl overflow-hidden" style={{ background: 'var(--bg-card)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', border: '1px solid var(--border)' }}
        >
          <div className="h-24 relative -z-0"
            style={{ background: 'linear-gradient(150deg, #2d0d14 0%, #1a0508 100%)' }}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #D4AF37 0%, transparent 55%)' }}/>
            {/* Grain */}
            <div className="absolute inset-0 opacity-15" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
              backgroundSize: '150px',
            }}/>
          </div>

          <div className="px-6 pb-6 relative z-10 -mt-8">
            <div className="flex items-end justify-between mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                style={{ background: 'linear-gradient(135deg, #722F37, #8B4049)', border: '3px solid white', boxShadow: '0 4px 20px rgba(114,47,55,0.3)' }}>
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
              className="rounded-2xl p-4 text-center border border-gray-light/30 shadow-sm"
              style={{ background: 'var(--bg-card)' }}
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
          transition={{ delay: 0.1 }}
          className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
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
          className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
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
                  (localProfile.experience === 'debutant' || localProfile.expertise === 'beginner')
                    ? 'Débutant'
                    : (localProfile.experience === 'curieux' || localProfile.expertise === 'learning')
                    ? 'Curieux'
                    : (localProfile.experience === 'passionne' || localProfile.expertise === 'amateur')
                    ? 'Passionné'
                    : (localProfile.experience === 'expert' || localProfile.expertise === 'expert')
                    ? 'Expert'
                    : 'Non défini',
              },
              {
                label: 'Style préféré',
                value:
                  localProfile.body === 2
                    ? 'Léger & frais'
                    : localProfile.body === 5
                    ? 'Équilibré'
                    : localProfile.body === 8
                    ? 'Charpenté & puissant'
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
          className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <div className="px-6 py-4 border-b border-gray-light/20 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-black-wine">Mes scans récents</h2>
            <Clock size={16} color="var(--text-secondary)" />
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
            className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
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

        {showUseReferralSection && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.17 }}
            style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C1810', marginBottom: 4 }}>🎁 Code de parrainage</h3>
            <p style={{ fontSize: 13, color: '#9E9E9E', marginBottom: 12 }}>
              Un ami vous a recommandé Sommely ? Entrez son code pour obtenir 1 mois offert.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Ex: JEAN2024"
                maxLength={12}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 10,
                  border: '1.5px solid #E8E0D8', fontSize: 14,
                  fontFamily: 'monospace', letterSpacing: 2,
                  textTransform: 'uppercase', outline: 'none',
                }}
              />
              <button
                onClick={handleApplyReferral}
                disabled={referralInput.length < 4 || referralLoading}
                style={{
                  background: '#722F37', color: 'white', border: 'none',
                  borderRadius: 10, padding: '10px 18px', fontSize: 14,
                  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {referralLoading ? '...' : 'Appliquer'}
              </button>
            </div>
            {referralMessage && (
              <p style={{ marginTop: 8, fontSize: 13, color: referralSuccess ? '#2E7D32' : '#C62828' }}>
                {referralMessage}
              </p>
            )}
          </motion.div>
        )}

        {profile?.referral_code && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            style={{ background: 'white', borderRadius: 16, padding: 20, marginBottom: 16, border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2C1810', marginBottom: 4 }}>🍷 Parrainez vos amis</h3>
            <p style={{ fontSize: 13, color: '#9E9E9E', marginBottom: 12 }}>
              Jusqu&apos;à 3 amis peuvent utiliser votre code. Chaque ami qui s&apos;abonne vous offre 1 mois gratuit.
              {referralStats.total > 0 && ` Vous avez déjà parrainé ${referralStats.total} ami${referralStats.total > 1 ? 's' : ''}.`}
            </p>
            {(() => {
              const usagesLeft = 3 - referralStats.total;
              return (
                <div
                  style={{
                    fontSize: 12,
                    color: usagesLeft > 0 ? '#2E7D32' : '#C62828',
                    marginTop: 6,
                    fontWeight: 600,
                  }}
                >
                  {usagesLeft > 0
                    ? `✓ ${usagesLeft} utilisation${usagesLeft > 1 ? 's' : ''} restante${usagesLeft > 1 ? 's' : ''}`
                    : '✗ Code épuisé — 3/3 utilisations atteintes'}
                </div>
              );
            })()}
            <div
              onClick={copyReferralCode}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && copyReferralCode()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#F5F0E8', borderRadius: 12, padding: '12px 16px',
                cursor: 'pointer', border: '1.5px dashed #722F37',
              }}
            >
              <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 700, color: '#722F37', letterSpacing: 3 }}>
                {profile.referral_code}
              </span>
              <span style={{ fontSize: 12, color: '#9E9E9E' }}>{copied ? '✓ Copié !' : 'Appuyer pour copier'}</span>
            </div>
            {referralStats.total > 0 && (
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <div style={{ flex: 1, background: '#F5F0E8', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#722F37' }}>{referralStats.total}</div>
                  <div style={{ fontSize: 11, color: '#9E9E9E' }}>Amis parrainés</div>
                </div>
                <div style={{ flex: 1, background: '#F5F0E8', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#2E7D32' }}>{referralStats.rewarded}</div>
                  <div style={{ fontSize: 11, color: '#9E9E9E' }}>Mois offerts</div>
                </div>
              </div>
            )}
            {(profile?.referral_reward_months ?? 0) > 0 && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #722F37, #8B4049)',
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 24 }}>🎁</span>
                <div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>
                    {profile.referral_reward_months} mois offert{profile.referral_reward_months! > 1 ? 's' : ''} grâce à vos parrainages
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                    Votre abonnement est étendu automatiquement
                  </div>
                </div>
              </div>
            )}
            <button
              onClick={shareReferral}
              style={{
                width: '100%', marginTop: 12, padding: '12px',
                background: '#722F37', color: 'white', border: 'none',
                borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              🔗 Partager mon code
            </button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
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
                  {`Passer à Pro · ${formatPrice(8.99)}/mois`}
                  <ChevronRight size={16} />
                </button>
                <p className="text-xs text-gray-dark mt-2 text-center">Économisez 60€ avec l&apos;annuel</p>
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
                  {`Passer à Pro · ${formatPrice(8.99)}/mois`}
                  <ChevronRight size={16} />
                </button>
                <p className="text-xs text-gray-dark mt-2 text-center">Économisez 60€ avec l&apos;annuel</p>
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
                    onClick={() => setShowSaveFlow(true)}
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
          className="rounded-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          {[
            { icon: Bell, label: 'Notifications', action: () => setShowNotifications(true), color: 'var(--text-secondary)' },
            { icon: Shield, label: 'Confidentialité', action: () => navigate('/privacy'), color: 'var(--text-secondary)' },
            { icon: Settings, label: 'Paramètres', action: () => setShowSettings(true), color: 'var(--text-secondary)' },
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <button
              type="button"
              onClick={async () => {
                try {
                  await supabase.auth.signOut();
                } catch (e) {
                  console.error(e);
                } finally {
                  localStorage.clear();
                  window.location.replace('/auth');
                }
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: 'transparent',
                border: '1.5px solid #C62828',
                borderRadius: 12,
                color: '#C62828',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
                marginTop: 16,
              }}
            >
              Se déconnecter
            </button>
          </motion.div>
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

        {user && (
          <SaveFlowModal
            isOpen={showSaveFlow}
            onClose={() => setShowSaveFlow(false)}
            subscriptionId={subscription?.stripe_subscription_id ?? null}
            customerId={subscription?.stripe_customer_id ?? null}
            nextBillingDate={subscription?.current_period_end ?? null}
            plan={subscriptionState.plan}
            userId={user.id}
            refreshSubscription={refreshSubscription}
            onSuccessCancel={() => refreshSubscription()}
          />
        )}

        <div className="h-32" />

        {showNotifications && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 flex items-end justify-center z-[60] px-6 pb-24" onClick={() => setShowNotifications(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="rounded-3xl p-6 w-full max-w-lg" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <h3 className="font-display text-xl font-bold text-black-wine mb-3">🔔 Notifications</h3>
              <p className="text-gray-dark text-sm mb-5">Les notifications push arrivent dans la prochaine version. Vous serez alerté quand vos vins atteignent leur apogée et quand les prix bougent.</p>
              <button onClick={() => setShowNotifications(false)} className="w-full py-3.5 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm border-none cursor-pointer">Fermer</button>
            </motion.div>
          </motion.div>
        )}

        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 flex items-end justify-center z-[60] px-6 pb-24" onClick={() => setShowSettings(false)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="rounded-3xl p-6 w-full max-w-lg space-y-4" style={{ background: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <h3 className="font-display text-xl font-bold text-black-wine">⚙️ Paramètres</h3>
              <div className="bg-cream rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-dark">Devise</span>
                  <div className="flex gap-1">
                    {CURRENCIES.map(c => (
                      <button key={c.code} onClick={() => setCurrency(c)}
                        style={{
                          padding: '4px 8px', borderRadius: '8px', fontSize: '12px',
                          fontWeight: 600, border: 'none', cursor: 'pointer',
                          background: currency.code === c.code ? '#722F37' : 'var(--bg-input)',
                          color: currency.code === c.code ? 'white' : 'var(--text-primary)',
                        }}>
                        {c.symbol}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-dark">Apparence</span>
                  <button
                    onClick={toggleTheme}
                    style={{
                      background: theme === 'dark' ? '#722F37' : '#F5F0E8',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: '999px',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: theme === 'dark' ? 'white' : '#1a0508',
                    }}
                  >
                    {theme === 'dark' ? '☀️ Clair' : '🌙 Sombre'}
                  </button>
                </div>
                <div className="flex items-center justify-between"><span className="text-sm text-gray-dark">Version</span><span className="text-sm font-semibold text-black-wine">Sommely 1.0</span></div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await supabase.auth.signOut();
                  } catch (e) {
                    console.error(e);
                  } finally {
                    localStorage.clear();
                    window.location.replace('/auth');
                  }
                }}
                className="w-full py-3.5 border-2 border-red-200 text-red-600 rounded-2xl font-semibold text-sm bg-transparent cursor-pointer"
              >
                Supprimer mon compte
              </button>
              <button onClick={() => setShowSettings(false)} className="w-full py-3.5 bg-burgundy-dark text-white rounded-2xl font-semibold text-sm border-none cursor-pointer">Fermer</button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

