import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../components/Logo';
import {
  ArrowLeft,
  Heart,
  Share2,
  Wine,
  MapPin,
  Calendar,
  Grape,
  Percent,
  Star,
  ChevronRight,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect, useLayoutEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { WineAnalysis } from '../lib/openai';
import {
  calculatePersonalizedScore,
  generateDetailedExplanation,
  type ScoreBreakdown,
  type UserProfile,
} from '../lib/matchScore';

type WineResultLocationState = {
  wine?: WineAnalysis;
  /** Alias accepté (ex. profil) */
  wineData?: WineAnalysis;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  explanation?: string;
  from?: string;
};

/** Vin affiché : analyse + champs enrichis (Scanner / favoris). */
type WineDisplay = WineAnalysis & {
  avgPrice?: number | string;
  id?: string;
  description?: string;
};

function isValidWineForResult(w: unknown): w is WineDisplay {
  if (!w || typeof w !== 'object') return false;
  const name = (w as Record<string, unknown>).name;
  return String(name ?? '').trim().length > 0;
}

const FOOD_PAIRINGS: Record<string, { emoji: string; label: string }[]> = {
  Rouge: [
    { emoji: '🥩', label: 'Viande rouge' },
    { emoji: '🧀', label: 'Fromage affiné' },
    { emoji: '🍄', label: 'Plats en sauce' },
  ],
  Blanc: [
    { emoji: '🐟', label: 'Poisson' },
    { emoji: '🦞', label: 'Fruits de mer' },
    { emoji: '🥗', label: 'Salade' },
  ],
  Rosé: [
    { emoji: '🍕', label: 'Pizza' },
    { emoji: '🥗', label: 'Charcuterie' },
    { emoji: '🥂', label: 'Apéritif' },
  ],
  Champagne: [
    { emoji: '🦞', label: 'Homard' },
    { emoji: '🍣', label: 'Sushi' },
    { emoji: '🧀', label: 'Comté' },
  ],
  'Rouge corse': [
    { emoji: '🥩', label: 'Viande rouge grillée' },
    { emoji: '🧀', label: 'Fromage affiné' },
    { emoji: '🍄', label: 'Plats en sauce' },
  ],
  'Rouge puissant': [
    { emoji: '🥩', label: 'Côte de bœuf' },
    { emoji: '🦆', label: 'Canard confit' },
    { emoji: '🍖', label: 'Gibier' },
  ],
  'Rouge fruité': [
    { emoji: '🍕', label: 'Pizza et pâtes' },
    { emoji: '🥗', label: 'Charcuterie' },
    { emoji: '🧀', label: 'Fromage frais' },
  ],
  'Blanc sec': [
    { emoji: '🐟', label: 'Poisson grillé' },
    { emoji: '🦞', label: 'Fruits de mer' },
    { emoji: '🥗', label: 'Salade composée' },
  ],
  'Blanc doux': [
    { emoji: '🦆', label: 'Foie gras' },
    { emoji: '🍰', label: 'Desserts' },
    { emoji: '🧀', label: 'Roquefort' },
  ],
};

const DEFAULT_PAIRINGS = [
  { emoji: '🍽️', label: 'Plats du quotidien' },
  { emoji: '🧀', label: 'Plateau de fromages' },
  { emoji: '🥂', label: 'Apéritif' },
];

function getScoreInfo(score: number) {
  if (score >= 85) return { color: '#2E7D32', bg: 'bg-success/10', text: 'Parfait pour vous !', emoji: '🎯' };
  if (score >= 70) return { color: '#F57C00', bg: 'bg-warning/10', text: 'Très bon choix', emoji: '👍' };
  if (score >= 50) return { color: '#1976D2', bg: 'bg-blue-500/10', text: 'Correct pour vous', emoji: '🤔' };
  return { color: '#C62828', bg: 'bg-danger/10', text: 'Pas idéal pour vous', emoji: '⚠️' };
}

/** Extrait le premier nombre d'un prix potentiellement sous forme de range ("30-50", "30€-50€") ou number. */
function extractNumber(p: number | string | null | undefined): number {
  if (p == null) return 0;
  if (typeof p === 'number') return p;
  const match = String(p).replace(/€/g, '').match(/\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

/** Formate un prix (number ou string range) en "~X {devise}" en prenant toujours le premier nombre. */
function sanitizePrice(p: number | string, fmt: (n: number) => string): string {
  const n = extractNumber(p);
  return n > 0 ? `~ ${fmt(n)}` : '';
}

/** Ordre de grandeur en années pour le texte de garde (ex. « 5-10 ans », « 8 ans », années cibles). */
function maxGardeYearsFromText(text: string): number {
  const t = text.toLowerCase();
  const range = t.match(/(\d+)\s*[-–]\s*(\d+)\s*ans/);
  if (range) return Math.max(parseInt(range[1], 10), parseInt(range[2], 10));
  const withAns = [...t.matchAll(/(\d+)\s*ans/g)];
  if (withAns.length) return Math.max(...withAns.map((m) => parseInt(m[1], 10)));
  const nums = (text.match(/\d+/g) || []).map((s) => parseInt(s, 10));
  const plausible = nums.filter((n) => n >= 1 && n <= 80);
  if (plausible.length) return Math.max(...plausible);
  const cy = new Date().getFullYear();
  const y4 = (text.match(/\b(20[2-9]\d{2})\b/g) || []).map((s) => parseInt(s, 10));
  if (y4.length) return Math.max(0, Math.max(...y4) - cy);
  return 0;
}

export function WineResult() {
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as WineResultLocationState | null;
  /** Scanner : `wine` ; profil / alias : `wineData` */
  const wineRaw = state?.wine ?? state?.wineData;
  const wine: WineDisplay | undefined = isValidWineForResult(wineRaw) ? (wineRaw as WineDisplay) : undefined;
  const score = state?.score ?? 75;
  const { formatPrice } = useTheme();

  const stateNav = state;
  const fromProfile = state?.from === 'profile';

  const [isFavorite, setIsFavorite] = useState(false);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showCopied, setShowCopied] = useState(false);

  /** Sans vin valide → redirection vers /scan (pas de Navigate au rendu, pas de deps [navigate]) */
  useLayoutEffect(() => {
    if (!wine) {
      navigate('/scan', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uniquement quand le vin disparaît
  }, [wine]);

  useEffect(() => {
    const profile = localStorage.getItem('sommely_profile');
    if (profile) {
      try {
        setUserProfile(JSON.parse(profile));
      } catch {
        /* profil local invalide */
      }
    }

    const timer = setTimeout(() => setShowScoreAnimation(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!wine) {
    return null;
  }

  const scoreInfo = getScoreInfo(score);
  const pairings = (wine.type && FOOD_PAIRINGS[wine.type]) || DEFAULT_PAIRINGS;

  const tasteProfile = (userProfile || null) as UserProfile | null;
  const avgForScore = extractNumber(wine.avgPrice);
  const scoreBreakdown: ScoreBreakdown =
    stateNav?.scoreBreakdown ??
    (tasteProfile
      ? calculatePersonalizedScore(wine as WineAnalysis, { avgPrice: avgForScore }, tasteProfile)
      : {
          total: score,
          typeMatch: 0,
          budgetMatch: 0,
          intensityMatch: 0,
          aromaMatch: 0,
          sweetnessMatch: 0,
          regionBonus: 0,
          explanation: [],
        });

  const explanation = generateDetailedExplanation(
    wine as WineAnalysis,
    scoreBreakdown,
    tasteProfile,
    avgForScore || undefined,
    {}
  );
  const firstName = userProfile?.firstName || '';

  const isChampagne = ['Champagne', 'Pétillant', 'Mousseux'].includes(wine.type || '');
  type DetailItem = { icon: LucideIcon; label: string; value: string };

  const wineDetails: DetailItem[] = [
    { icon: Wine, label: 'Type', value: wine.type || 'Non spécifié' },
    { icon: MapPin, label: 'Région', value: wine.region || 'Non spécifié' },
    { icon: Calendar, label: 'Millésime', value: wine.year != null ? String(wine.year) : 'Non millésimé' },
    { icon: Percent, label: 'ALCOOL', value: wine.alcohol ? `${wine.alcohol}` : 'Non spécifié' },
    {
      icon: Grape,
      label: isChampagne ? 'Assemblage' : 'Cépages',
      value: Array.isArray(wine.grapes)
        ? wine.grapes.join(', ')
        : String(wine.grapes || 'Non spécifié'),
    },
    ...(isChampagne && wine.dosage
      ? [{ icon: Grape, label: 'Dosage / Sucre', value: wine.dosage }]
      : []),
  ];

  const bp = (wine.bottlePrices || {}) as Record<string, number | string | null | undefined>;
  const priceRange: { min: number; max: number } | undefined = wine.priceRange;

  // Prix de référence 75cl : AI > avgPrice > 0 (robuste aux strings "30-50")
  const ref750 = (() => {
    const n = extractNumber(bp['cl750']);
    return n > 0 ? n : extractNumber(wine.avgPrice);
  })();

  const showAgingPotentialRow =
    Boolean(wine.agingPotential) &&
    (ref750 > 15 || maxGardeYearsFromText(wine.agingPotential ?? '') > 3);

  // Fourchette pour la 75cl uniquement
  const format75cl = (price: number) =>
    priceRange && priceRange.min > 0 && priceRange.max > 0
      ? `${formatPrice(priceRange.min)} – ${formatPrice(priceRange.max)}`
      : `~ ${formatPrice(price)}`;

  // Afficher uniquement les formats confirmés par l'IA — jamais de calcul inventé
  const priceRows: DetailItem[] = [
    ...(extractNumber(bp['cl1875']) > 0 ? [{ icon: Star, label: isChampagne ? 'Piccolo / Quart (18,75cl)' : 'Piccolo (18,75cl)', value: sanitizePrice(bp['cl1875']!, formatPrice) }] : []),
    ...(extractNumber(bp['cl375'])  > 0 ? [{ icon: Star, label: isChampagne ? 'Demi (37,5cl)' : 'Demi-bouteille (37,5cl)', value: sanitizePrice(bp['cl375']!, formatPrice) }] : []),
    { icon: Star, label: 'Bouteille (75cl)', value: format75cl(ref750) },
    ...(extractNumber(bp['cl1500']) > 0 ? [{ icon: Star, label: 'Magnum (1,5L)', value: sanitizePrice(bp['cl1500']!, formatPrice) }] : []),
    ...(extractNumber(bp['cl3000']) > 0 ? [{ icon: Star, label: isChampagne ? 'Jéroboam (3L)' : 'Double Magnum (3L)', value: sanitizePrice(bp['cl3000']!, formatPrice) }] : []),
    ...(extractNumber(bp['cl6000']) > 0 ? [{ icon: Star, label: isChampagne ? 'Mathusalem (6L)' : 'Impériale (6L)', value: sanitizePrice(bp['cl6000']!, formatPrice) }] : []),
  ].filter(() => ref750 > 0);

  const handleShare = async () => {
    const scoreLabel = score >= 85 ? 'Coup de cœur' : score >= 70 ? 'Excellent' : score >= 50 ? 'Correct' : 'Pas mon style';
    const params = new URLSearchParams({
      wine: wine.name || '',
      score: String(score),
      region: wine.region || '',
      type: wine.type || '',
      year: String(wine.year || ''),
      grapes: Array.isArray(wine.grapes) ? wine.grapes.join(',') : (wine.grapes || ''),
    });
    const shareUrl = `https://sommely.shop/share?${params.toString()}`;
    const shareText = [
      `🍷 ${wine.name}${wine.year ? ` · ${wine.year}` : ''}`,
      '',
      `⭐ Score Sommely : ${score}/100 — ${scoreLabel}`,
      '',
      wine.region ? `📍 ${wine.region}` : '',
      '',
      '✦ Voir le résultat complet :',
      shareUrl,
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${wine.name} · ${score}/100 — Sommely`,
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // Annulé par l'utilisateur — ne rien faire
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (e) {
        console.error('Share failed:', e);
      }
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    const favorites = JSON.parse(localStorage.getItem('sommely_favorites') || '[]');
    if (!isFavorite) {
      favorites.push({ ...wine, score, savedAt: new Date().toISOString() });
    } else {
      const index = favorites.findIndex(
        (f: any) =>
          wine.id != null && f.id != null
            ? f.id === wine.id
            : f.name === wine.name && String(f.year ?? '') === String(wine.year ?? '')
      );
      if (index > -1) favorites.splice(index, 1);
    }
    localStorage.setItem('sommely_favorites', JSON.stringify(favorites));
  };

  const scanCount = parseInt(localStorage.getItem('sommely_scan_count') || '0');
  const scansRemaining = Math.max(0, 3 - scanCount);

  return (
    <div className="min-h-screen bg-cream font-body text-black-wine ">
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-md border-b border-gray-light/30 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => (fromProfile ? navigate('/profile') : navigate('/scan'))}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer"
          aria-label="Retour"
        >
          <ArrowLeft size={20} color="#6B5D56" />
          <span className="text-gray-dark text-sm font-medium">Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <Logo size={24} variant="default" />
          <span className="font-display text-lg font-bold text-burgundy-dark">Sommely</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFavorite}
            className="w-9 h-9 rounded-full bg-white border border-gray-light/50 flex items-center justify-center shadow-sm cursor-pointer transition-all hover:scale-110"
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={16} fill={isFavorite ? '#722F37' : 'none'} color={isFavorite ? '#722F37' : '#6B5D56'} />
          </button>
          <div className="relative">
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-white border border-gray-light/50 flex items-center justify-center shadow-sm cursor-pointer transition-all hover:scale-110"
              aria-label="Partager"
            >
              <Share2 size={16} color="#6B5D56" />
            </button>
            <AnimatePresence>
              {showCopied && (
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-10 right-0 bg-black-wine text-white text-xs font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-lg"
                >
                  ✓ Copié !
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-8 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-light/20"
        >
          <div className="h-2 w-full" style={{ backgroundColor: scoreInfo.color }} />

          <div className="p-6">
            <h1 className="font-display text-2xl font-bold text-black-wine mb-1">{wine.name}</h1>
            <p className="text-gray-dark text-sm mb-6">
              {wine.appellation} · {wine.year != null ? String(wine.year) : '-'}
            </p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-dark mb-1 uppercase tracking-wide font-semibold">
                  {firstName ? `Score pour ${firstName}` : 'Votre score'}
                </p>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={showScoreAnimation ? { scale: 1, opacity: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                  className="flex items-baseline gap-1"
                >
                  <span className="font-display text-7xl font-bold leading-none" style={{ color: scoreInfo.color }}>
                    {score}
                  </span>
                  <span className="text-2xl text-gray-dark font-medium">/100</span>
                </motion.div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="text-4xl">{scoreInfo.emoji}</div>
                <div className={`px-4 py-2 rounded-full ${scoreInfo.bg} text-center`}>
                  <p className="text-xs font-bold" style={{ color: scoreInfo.color }}>
                    {scoreInfo.text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="rounded-2xl border border-burgundy-dark/15 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(114,47,55,0.06) 0%, rgba(212,175,55,0.06) 100%)' }}
        >
          <button
            type="button"
            onClick={() => {
              if (score >= 85) {
                navigate('/cave', {
                  state: {
                    prefill: {
                      name: wine.name || '',
                      year: wine.year ?? new Date().getFullYear() - 2,
                      region: wine.region || '',
                      type: wine.type || 'Rouge',
                      appellation: wine.appellation || '',
                      grapes:
                        typeof wine.grapes === 'string'
                          ? wine.grapes
                          : Array.isArray(wine.grapes)
                            ? wine.grapes.join(', ')
                            : '',
                      quantity: '1',
                      purchasePrice: '',
                      notes: '',
                      location: '',
                    },
                  },
                });
              } else if (score >= 60) {
                navigate('/scan', { state: { scanHint: 'Scannez une autre bouteille' } });
              } else {
                navigate('/scan');
              }
            }}
            className="w-full text-left px-5 py-4 border-none cursor-pointer bg-transparent hover:bg-white/40 transition-colors"
          >
            {score >= 85 && (
              <p className="text-sm font-semibold text-black-wine">
                Vous avez l&apos;œil. 🍷 Ajoutez-le à votre cave.
              </p>
            )}
            {score >= 60 && score < 85 && (
              <p className="text-sm font-semibold text-black-wine">
                Pas mal. Mais on peut faire mieux pour vous.
              </p>
            )}
            {score < 60 && (
              <p className="text-sm font-semibold text-black-wine">
                Honnêtement ? Remettez-le en rayon.
              </p>
            )}
            <p className="text-xs text-gray-dark mt-1">Appuyez pour continuer →</p>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md p-6 border border-gray-light/20"
        >
          <h2 className="font-display text-lg font-bold text-black-wine mb-3">Pourquoi ce score ?</h2>
          <p className="text-gray-dark text-sm leading-relaxed">{explanation}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-light/20"
        >
          <div className="px-6 py-4 border-b border-gray-light/30">
            <h2 className="font-display text-lg font-bold text-black-wine">Détails du vin</h2>
          </div>
          <div className="divide-y divide-gray-light/20">
            {[...wineDetails, ...priceRows].map((item) => (
              <div key={item.label} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-lg bg-burgundy-dark/8 flex items-center justify-center flex-shrink-0">
                  <item.icon size={15} color="#722F37" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-dark uppercase tracking-wide font-semibold">{item.label}</p>
                  <p className="text-sm text-black-wine font-medium truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {wine.foodPairings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="bg-white rounded-2xl border border-gray-light/30 shadow-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-light/20">
              <h2 className="font-display text-lg font-bold text-black-wine">
                Accords mets et vins
              </h2>
            </div>
            <div className="p-5 space-y-4">
              {wine.foodPairings.perfect && wine.foodPairings.perfect.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-success" />
                    <p className="text-xs font-bold text-success uppercase tracking-wide">Accords parfaits</p>
                  </div>
                  <div className="space-y-1.5">
                    {wine.foodPairings.perfect.map((item: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 bg-success/5 rounded-xl px-3 py-2">
                        <span className="text-success text-sm">✓</span>
                        <span className="text-sm text-black-wine">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {wine.foodPairings.good && wine.foodPairings.good.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-warning" />
                    <p className="text-xs font-bold text-warning uppercase tracking-wide">Bons accords</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wine.foodPairings.good.map((item: string, i: number) => (
                      <span key={i} className="text-xs bg-cream rounded-full px-3 py-1.5 border border-gray-light/40 text-black-wine">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {wine.foodPairings.avoid && wine.foodPairings.avoid.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-danger" />
                    <p className="text-xs font-bold text-danger uppercase tracking-wide">À éviter</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {wine.foodPairings.avoid.map((item: string, i: number) => (
                      <span key={i} className="text-xs bg-danger/5 rounded-full px-3 py-1.5 border border-danger/15 text-danger">
                        ✕ {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {!wine.foodPairings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-md p-6 border border-gray-light/20"
          >
            <h2 className="font-display text-lg font-bold text-black-wine mb-4">S'accorde parfaitement avec</h2>
            <div className="flex gap-3 flex-wrap">
              {pairings.map((pairing: { emoji: string; label: string }) => (
                <div
                  key={pairing.label}
                  className="flex items-center gap-2 bg-cream rounded-full px-4 py-2 border border-gray-light/40"
                >
                  <span className="text-base">{pairing.emoji}</span>
                  <span className="text-sm font-medium text-black-wine">{pairing.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {wine.tastingNotes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-white rounded-2xl border border-gray-light/30 shadow-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-light/20">
              <h2 className="font-display text-lg font-bold text-black-wine">
                Notes de dégustation
              </h2>
            </div>
            <div className="p-6 space-y-4">
              {wine.tastingNotes.color && (
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">👁️</span>
                  <div>
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-1">Robe</p>
                    <p className="text-sm text-black-wine leading-relaxed">{wine.tastingNotes.color}</p>
                  </div>
                </div>
              )}
              {wine.tastingNotes.nose && wine.tastingNotes.nose.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">👃</span>
                  <div>
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-1">Nez</p>
                    <div className="flex flex-wrap gap-2">
                      {wine.tastingNotes.nose.map((note: string, i: number) => (
                        <span key={i} className="text-xs bg-cream rounded-full px-3 py-1 text-black-wine border border-gray-light/40">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {wine.tastingNotes.palate && wine.tastingNotes.palate.length > 0 && (
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">👅</span>
                  <div>
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-1">Bouche</p>
                    <div className="flex flex-wrap gap-2">
                      {wine.tastingNotes.palate.map((note: string, i: number) => (
                        <span key={i} className="text-xs bg-burgundy-dark/5 rounded-full px-3 py-1 text-burgundy-dark border border-burgundy-dark/15">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {wine.tastingNotes.finish && (
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">✨</span>
                  <div>
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-1">Finale</p>
                    <p className="text-sm text-black-wine leading-relaxed">{wine.tastingNotes.finish}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {(wine.servingTemp || wine.decanting || wine.glassType || showAgingPotentialRow) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-2xl border border-gray-light/30 shadow-md overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-light/20">
              <h2 className="font-display text-lg font-bold text-black-wine">
                Conseils de service
              </h2>
            </div>
            <div className="divide-y divide-gray-light/20">
              {wine.servingTemp && (
                <div className="flex items-center gap-4 px-6 py-4">
                  <span className="text-2xl flex-shrink-0">🌡️</span>
                  <div>
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide">Température</p>
                    <p className="text-sm text-black-wine font-medium">{wine.servingTemp}</p>
                  </div>
                </div>
              )}
              {wine.decanting && (
                <div className="flex items-center gap-4 px-6 py-4">
                  <span className="text-2xl flex-shrink-0">🫗</span>
                  <div>
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide">Carafage</p>
                    <p className="text-sm text-black-wine font-medium">{wine.decanting}</p>
                  </div>
                </div>
              )}
              {wine.glassType && (
                <div className="flex items-center gap-4 px-6 py-4">
                  <span className="text-2xl flex-shrink-0">🥂</span>
                  <div>
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide">Verre recommandé</p>
                    <p className="text-sm text-black-wine font-medium">{wine.glassType}</p>
                  </div>
                </div>
              )}
              {showAgingPotentialRow && (
                <div className="flex items-center gap-4 px-6 py-4">
                  <span className="text-2xl flex-shrink-0">⏳</span>
                  <div>
                    <p className="text-xs font-bold text-gray-dark uppercase tracking-wide">Potentiel de garde</p>
                    <p className="text-sm text-black-wine font-medium">{wine.agingPotential}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {wine.story && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-gradient-to-br from-burgundy-dark/5 to-gold/5 rounded-2xl border border-burgundy-dark/15 p-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📖</span>
              <h2 className="font-display text-base font-bold text-burgundy-dark">Le saviez-vous ?</h2>
            </div>
            <p className="text-sm text-gray-dark leading-relaxed italic">{wine.story}</p>
          </motion.div>
        )}

        {wine.tips && wine.tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-white rounded-2xl border border-gray-light/30 shadow-md p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💡</span>
              <h2 className="font-display text-base font-bold text-black-wine">Conseils du sommelier</h2>
            </div>
            <div className="space-y-3">
              {wine.tips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-yellow-800">{i + 1}</span>
                  </div>
                  <p className="text-sm text-gray-dark leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-3"
        >
          <button
            onClick={() => navigate('/scan')}
            className="w-full py-4 bg-burgundy-dark text-white rounded-2xl font-semibold text-base flex items-center justify-center gap-3 hover:bg-burgundy-medium active:scale-95 transition-all duration-200 shadow-md border-none cursor-pointer"
          >
            <Wine size={20} />
            Scanner une autre bouteille
          </button>

          <button
            onClick={handleFavorite}
            className={`w-full py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 active:scale-95 transition-all duration-200 border-2 cursor-pointer ${
              isFavorite
                ? 'bg-burgundy-dark/5 border-burgundy-dark text-burgundy-dark'
                : 'bg-white border-gray-light text-gray-dark hover:border-burgundy-dark hover:text-burgundy-dark'
            }`}
          >
            <Heart size={20} fill={isFavorite ? '#722F37' : 'none'} />
            {isFavorite ? 'Sauvegardé dans mes favoris ❤️' : 'Sauvegarder dans mes favoris'}
          </button>
        </motion.div>

        {scansRemaining <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-burgundy-dark rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            <p className="text-gold text-xs font-bold uppercase tracking-widest mb-2">
              {scansRemaining === 0 ? 'Limite atteinte' : `Plus qu\'un scan gratuit`}
            </p>
            <h3 className="font-display text-xl font-bold text-white mb-2">Passez à Premium</h3>
            <p className="text-white/70 text-sm mb-4 leading-relaxed">
              Scans illimités, gestion de cave IA, sommelier 24h/24 pour seulement 29,99 € par an.
            </p>
            <button
              onClick={() => navigate('/premium')}
              className="flex items-center gap-2 bg-gold text-black-wine px-6 py-3 rounded-full font-bold text-sm border-none cursor-pointer hover:bg-gold-light transition-colors"
            >
              Découvrir Premium
              <ChevronRight size={16} />
            </button>
          </motion.div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

