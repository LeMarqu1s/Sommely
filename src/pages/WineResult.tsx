import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '../components/Logo';
import {
  ArrowLeft,
  Heart,
  Share2,
  ShoppingBag,
  Wine,
  MapPin,
  Calendar,
  Grape,
  Star,
  ChevronRight,
  X,
  ExternalLink,
  type LucideIcon,
} from 'lucide-react';
import { useState, useEffect } from 'react';

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

function generateExplanation(wine: any, score: number, profile: any): string {
  if (!profile) return 'Ce vin correspond à votre profil de débutant. Un excellent choix pour explorer cette région.';

  const explanations: string[] = [];

  if (score >= 85) {
    explanations.push('Ce vin correspond parfaitement à vos préférences.');
  } else if (score >= 70) {
    explanations.push('Ce vin correspond bien à vos goûts.');
  } else {
    explanations.push('Ce vin ne correspond pas totalement à vos préférences habituelles.');
  }

  if (profile.types && profile.types.includes('red_bold') && wine.type?.includes('Rouge')) {
    explanations.push('Vous aimez les vins rouges, et ce vin est dans votre registre.');
  }

  if (profile.budget === 'premium' && wine.avgPrice > 40) {
    explanations.push('Son prix correspond à votre budget habituel.');
  } else if (profile.budget === 'medium' && wine.avgPrice >= 10 && wine.avgPrice <= 25) {
    explanations.push('Il rentre dans votre budget.');
  }

  if (wine.region?.includes('Bordeaux') && profile.regions && profile.regions.includes('bordeaux')) {
    explanations.push('Vous connaissez déjà Bordeaux, vous apprécierez ses caractéristiques.');
  }

  return explanations.join(' ');
}

export function WineResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showScoreAnimation, setShowScoreAnimation] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showPriceSheet, setShowPriceSheet] = useState(false);

  const wine = location.state?.wine;
  const score = location.state?.score || 75;

  useEffect(() => {
    const profile = localStorage.getItem('sommely_profile');
    if (profile) setUserProfile(JSON.parse(profile));

    const timer = setTimeout(() => setShowScoreAnimation(true), 300);
    return () => clearTimeout(timer);
  }, []);

  if (!wine) {
    navigate('/scan');
    return null;
  }

  const scoreInfo = getScoreInfo(score);
  const pairings = (wine.type && FOOD_PAIRINGS[wine.type]) || DEFAULT_PAIRINGS;
  const explanation = (location.state as { explanation?: string })?.explanation ?? generateExplanation(wine, score, userProfile);
  const firstName = userProfile?.firstName || '';

  const isChampagne = ['Champagne', 'Pétillant', 'Mousseux'].includes(wine.type || '');

  type DetailItem = { icon: LucideIcon; label: string; value: string };

  const wineDetails: DetailItem[] = [
    { icon: Wine, label: 'Type', value: wine.type || 'Non spécifié' },
    { icon: MapPin, label: 'Région', value: wine.region || 'Non spécifié' },
    { icon: Calendar, label: 'Millésime', value: wine.year != null ? String(wine.year) : 'Non millésimé' },
    {
      icon: Grape,
      label: isChampagne ? 'Assemblage' : 'Cépages',
      value: wine.grapes || 'Non spécifié',
    },
    ...(isChampagne && wine.dosage
      ? [{ icon: Grape, label: 'Dosage / Sucre', value: wine.dosage }]
      : []),
  ];

  const bp = (wine.bottlePrices || {}) as Record<string, number | null | undefined>;
  const priceRange: { min: number; max: number } | undefined = wine.priceRange;

  // Prix de référence 75cl : AI > avgPrice > 0
  const ref750 = (bp['cl750'] && bp['cl750'] > 0 ? bp['cl750'] : null) ?? wine.avgPrice ?? 0;

  // Fourchette pour la 75cl uniquement
  const format75cl = (price: number) =>
    priceRange && priceRange.min > 0 && priceRange.max > 0
      ? `${priceRange.min}€ – ${priceRange.max}€`
      : `~ ${price}€`;

  // Toujours calculer les 3 formats de base + optionnels si IA les fournit
  const priceRows: DetailItem[] = [
    // Piccolo 18,75cl : champagne = toujours calculé ; vin tranquille = seulement si AI le précise
    ...(isChampagne || (bp['cl1875'] && bp['cl1875'] > 0) ? [{
      icon: Star,
      label: isChampagne ? 'Piccolo / Quart (18,75cl)' : 'Piccolo (18,75cl)',
      value: `~ ${bp['cl1875'] && bp['cl1875'] > 0 ? bp['cl1875'] : Math.round(ref750 * 0.55)}€`,
    }] : []),
    // Demi-bouteille 37,5cl : toujours affiché
    {
      icon: Star,
      label: isChampagne ? 'Demi (37,5cl)' : 'Demi-bouteille (37,5cl)',
      value: `~ ${bp['cl375'] && bp['cl375'] > 0 ? bp['cl375'] : Math.round(ref750 * 0.60)}€`,
    },
    // Bouteille standard 75cl : toujours affiché avec fourchette
    { icon: Star, label: 'Bouteille (75cl)', value: format75cl(ref750) },
    // Magnum 1,5L : toujours affiché
    {
      icon: Star,
      label: 'Magnum (1,5L)',
      value: `~ ${bp['cl1500'] && bp['cl1500'] > 0 ? bp['cl1500'] : Math.round(ref750 * 1.85)}€`,
    },
    // Jéroboam/Double Magnum 3L : seulement si AI le précise
    ...(bp['cl3000'] && bp['cl3000'] > 0 ? [{
      icon: Star,
      label: isChampagne ? 'Jéroboam (3L)' : 'Double Magnum (3L)',
      value: `~ ${bp['cl3000']}€`,
    }] : []),
    // Mathusalem/Impériale 6L : seulement si AI le précise
    ...(bp['cl6000'] && bp['cl6000'] > 0 ? [{
      icon: Star,
      label: isChampagne ? 'Mathusalem (6L)' : 'Impériale (6L)',
      value: `~ ${bp['cl6000']}€`,
    }] : []),
  ].filter(r => ref750 > 0);

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    const favorites = JSON.parse(localStorage.getItem('sommely_favorites') || '[]');
    if (!isFavorite) {
      favorites.push({ ...wine, score, savedAt: new Date().toISOString() });
    } else {
      const index = favorites.findIndex((f: any) => f.id === wine.id);
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
          onClick={() => navigate('/scan')}
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
          <button className="w-9 h-9 rounded-full bg-white border border-gray-light/50 flex items-center justify-center shadow-sm cursor-pointer transition-all hover:scale-110" aria-label="Partager">
            <Share2 size={16} color="#6B5D56" />
          </button>
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

        {(wine.servingTemp || wine.decanting || wine.glassType || wine.agingPotential) && (
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
              {wine.agingPotential && (
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
            onClick={() => setShowPriceSheet(true)}
            className="w-full py-4 bg-gold text-black-wine rounded-2xl font-semibold text-base flex items-center justify-center gap-3 hover:bg-gold-light active:scale-95 transition-all duration-200 shadow-md border-none cursor-pointer"
          >
            <ShoppingBag size={20} />
            Trouver moins cher 🔍
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

      {/* ── PRICE COMPARISON BOTTOM SHEET ── */}
      <AnimatePresence>
        {showPriceSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setShowPriceSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl overflow-hidden"
              style={{ maxHeight: '85vh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-light/20">
                <div>
                  <h3 className="font-display text-lg font-bold text-black-wine">Trouver moins cher</h3>
                  <p className="text-xs text-gray-dark mt-0.5 truncate max-w-[240px]">
                    {wine.name}{wine.year ? ` · ${wine.year}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowPriceSheet(false)}
                  className="w-8 h-8 rounded-full bg-gray-light/30 flex items-center justify-center border-none cursor-pointer"
                >
                  <X size={16} color="#6B5D56" />
                </button>
              </div>

              <div className="overflow-y-auto px-6 py-5 space-y-3">
                {/* Badge partenaire */}
                <div className="bg-burgundy-dark/5 border border-burgundy-dark/15 rounded-2xl px-4 py-3 flex items-center gap-3">
                  <span className="text-xl flex-shrink-0">🤝</span>
                  <div>
                    <p className="text-xs font-bold text-burgundy-dark">Partenaire Sommely</p>
                    <p className="text-xs text-gray-dark">Commandez via nos liens et soutenez Sommely sans surcoût pour vous.</p>
                  </div>
                </div>

                {/* Revendeurs */}
                {[
                  {
                    name: 'Wine-Searcher',
                    desc: 'Comparateur mondial · Prix en temps réel',
                    emoji: '🌍',
                    url: `https://www.wine-searcher.com/find/${encodeURIComponent(`${wine.name}${wine.year ? ' ' + wine.year : ''}`)}`,
                    tag: 'Mondial',
                    tagColor: 'bg-blue-100 text-blue-700',
                  },
                  {
                    name: 'Millésima',
                    desc: 'Cave en ligne · Bordeaux & Grands crus',
                    emoji: '🏰',
                    url: `https://www.millesima.fr/recherche.html?q=${encodeURIComponent(wine.name)}`,
                    tag: 'Partenaire',
                    tagColor: 'bg-gold/20 text-yellow-800',
                    isAffiliate: true,
                  },
                  {
                    name: 'iDealwine',
                    desc: 'Ventes aux enchères & occasions',
                    emoji: '🔨',
                    url: `https://www.idealwine.com/fr/recherche-vins/?q=${encodeURIComponent(wine.name)}`,
                    tag: 'Enchères',
                    tagColor: 'bg-orange-100 text-orange-700',
                  },
                  {
                    name: 'La Cave à Vin',
                    desc: 'Grands crus & vins en primeur',
                    emoji: '🍾',
                    url: `https://www.lacaveduvin.com/recherche?q=${encodeURIComponent(wine.name)}`,
                    tag: 'Primeurs',
                    tagColor: 'bg-purple-100 text-purple-700',
                  },
                ].map((shop) => (
                  <a
                    key={shop.name}
                    href={shop.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 bg-white border border-gray-light/30 rounded-2xl p-4 hover:border-burgundy-dark/20 hover:shadow-md transition-all no-underline"
                    style={{ textDecoration: 'none' }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-cream flex items-center justify-center flex-shrink-0 text-xl">
                      {shop.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-sm text-black-wine">{shop.name}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${shop.tagColor}`}>{shop.tag}</span>
                        {shop.isAffiliate && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-burgundy-dark/10 text-burgundy-dark">♥ Sommely</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-dark">{shop.desc}</span>
                    </div>
                    <ExternalLink size={15} color="#D1CBC4" className="flex-shrink-0" />
                  </a>
                ))}

                {wine.avgPrice != null && (
                  <div className="bg-cream rounded-2xl p-4 text-center">
                    <p className="text-xs text-gray-dark mb-1">Prix de référence estimé</p>
                    <p className="font-display text-xl font-bold text-burgundy-dark">~ {wine.avgPrice} €</p>
                    <p className="text-xs text-gray-dark mt-1">pour une bouteille de 75 cl</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

