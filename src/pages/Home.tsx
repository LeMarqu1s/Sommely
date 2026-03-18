import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ChevronRight, Star, Zap } from 'lucide-react';

// ─── 30 CONSEILS FIXES — rotation toutes les 10 secondes ──────────────────
const WINE_TIPS = [
  "Les restaurants majorent les vins en moyenne de 250 %. Utilisez \"Carte du restaurant\" pour trouver les meilleures affaires.",
  "Un vin rouge servi trop chaud perd ses arômes délicats. La température idéale est entre 16 et 18 °C.",
  "Le Champagne se conserve mieux que vous ne le pensez : un non-millésimé peut se garder 3 à 5 ans.",
  "Le verre Bourgogne en ballon permet aux arômes complexes de se développer. Essayez-le avec un Pinot Noir.",
  "\"Terroir\" désigne l'ensemble des facteurs naturels (sol, climat, exposition) qui influencent le goût d'un vin.",
  "Le carafage n'est pas réservé aux grands vins : même un vin à 10 € peut s'ouvrir après 20 minutes en carafe.",
  "Un bouchon qui sent le carton mouillé = un vin \"bouchonné\". Défaut courant causé par le TCA, pas par vous.",
  "Le millésime 2020 est exceptionnel en Bordeaux et en Bourgogne. Profitez-en avant que les prix ne s'envolent.",
  "En Champagne, \"Blanc de Blancs\" = 100 % Chardonnay, frais et minéral. \"Blanc de Noirs\" = Pinot, plus charpenté.",
  "La Provence représente 40 % de la production mondiale de rosé. Pour un rosé de qualité, cherchez une robe pâle.",
  "Le Sancerre et le Pouilly-Fumé sont tous deux à base de Sauvignon Blanc, à seulement 5 km de distance.",
  "Un Sauternes peut se conserver 50 ans. Sa richesse en sucre et son acidité en font un vin d'exception.",
  "Plus il fait chaud, plus les raisins sont sucrés, et plus le vin aura un fort degré d'alcool.",
  "L'astringence des tannins s'adoucit avec le temps. C'est pourquoi les grands Bordeaux se gardent des décennies.",
  "\"AOC\" garantit que le vin respecte des règles strictes de production dans sa région d'origine.",
  "Le Viognier est le seul cépage blanc autorisé dans l'appellation Condrieu, réputée pour ses arômes floraux.",
  "Un vin orange est un vin blanc vinifié comme un rouge, avec macération des peaux. Tendance, complexe, polarisant.",
  "Barolo et Barbaresco sont deux grands vins italiens du même cépage — le Nebbiolo — mais aux personnalités très distinctes.",
  "Stockage idéal : 12-14 °C, obscurité totale, bouteille à l'horizontale, humidité 60-70 %, sans vibrations.",
  "En Bourgogne, un \"premier cru\" est en dessous d'un \"grand cru\". L'inverse de la hiérarchie bordelaise !",
  "Le Gewurztraminer d'Alsace est l'un des vins les plus aromatiques du monde : rose, litchi, épices orientales.",
  "Pomerol est le seul grand vignoble de Bordeaux sans classement officiel. Et pourtant, Pétrus y vaut plus de 3 000 €.",
  "\"Sur lie\" signifie que le vin a élevé en contact avec les levures mortes — texture plus riche et crémeuse.",
  "Le Chablis, en Bourgogne, est réputé pour sa minéralité crayeuse unique. Accord parfait avec les huîtres.",
  "La biodynamie en viticulture suit les cycles lunaires. Controversée mais adoptée par de nombreux grands domaines.",
  "L'Amarone della Valpolicella est fait de raisins séchés 3-4 mois. D'où sa concentration et sa puissance uniques.",
  "Le Rioja Gran Reserva vieillit au minimum 5 ans avant commercialisation, dont 2 ans en barrique de chêne.",
  "Un vin peut être \"végétal\" (poivron vert, herbe) à cause de Cabernet Sauvignon vendangé trop tôt.",
  "Dans le Nouveau Monde, le cépage figure sur l'étiquette. En Europe, c'est l'appellation qui prime.",
  "La Romanée-Conti est le vin le plus convoité du monde : plus de 15 000 € la bouteille pour un millésime récent.",
];
import { useAuth } from '../context/AuthContext';
import { getCaveBottles, getScansCountTotal } from '../lib/supabase';

export function Home() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user, profile, subscriptionState, isLoading } = useAuth();
  
  // Show wine bottle loading if OAuth callback (code= or access_token in URL)
  const hasOAuth = search.includes('code=') || window.location.hash.includes('access_token');
  const [showLoader, setShowLoader] = useState(hasOAuth);
  const [loaderPct, setLoaderPct] = useState(15);

  useEffect(() => {
    if (!hasOAuth) return;
    const steps = [35, 60, 80, 95];
    const timers = steps.map((pct, i) => setTimeout(() => setLoaderPct(pct), 500 + i * 600));
    return () => timers.forEach(clearTimeout);
  }, [hasOAuth]);

  useEffect(() => {
    if (!hasOAuth) return;
    if (!isLoading && user) {
      setLoaderPct(100);
      // Clean URL
      window.history.replaceState(null, '', '/home');
      setTimeout(() => setShowLoader(false), 700);
    }
    // Timeout fallback - 12s max
    const timeout = setTimeout(() => setShowLoader(false), 12000);
    return () => clearTimeout(timeout);
  }, [hasOAuth, isLoading, user]);
  const [scanCount, setScanCount] = useState(0);
  const [caveValue, setCaveValue] = useState(0);
  const [caveBottles, setCaveBottles] = useState(0);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [recentWine, setRecentWine] = useState<{ name: string; year?: number; region?: string } | null>(null);
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * WINE_TIPS.length));
  const tipIndexRef = useRef(tipIndex);

  const firstName = (profile?.taste_profile as any)?.firstName || profile?.name?.split(' ')[0] || '';
  const isPremium = subscriptionState.isPro || subscriptionState.isTrial;
  const scansRemaining = isPremium ? 999 : Math.max(0, 3 - subscriptionState.scansThisMonth);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setTimeOfDay('Bonjour');
    else if (h < 18) setTimeOfDay('Bon après-midi');
    else setTimeOfDay('Bonsoir');
  }, []);

  // Rotation du conseil toutes les 10 secondes
  useEffect(() => {
    tipIndexRef.current = tipIndex;
  }, [tipIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex(i => (i + 1) % WINE_TIPS.length);
    }, 10000);
    return () => clearInterval(interval);
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

  if (showLoader) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-body relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0d0608 0%, #1a0a0d 40%, #0d0608 100%)' }}>
        <motion.div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(114,47,55,0.3) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity }} />
        {[...Array(6)].map((_, i) => (
          <motion.div key={i} className="absolute w-1 h-1 rounded-full"
            style={{ left: `${10 + i * 15}%`, bottom: '25%',
              background: i % 2 === 0 ? 'rgba(212,175,55,0.7)' : 'rgba(114,47,55,0.9)',
              boxShadow: i % 2 === 0 ? '0 0 8px rgba(212,175,55,0.9)' : '0 0 8px rgba(114,47,55,0.9)' }}
            animate={{ y: [0, -100, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, delay: i * 0.5 }} />
        ))}
        <div className="relative z-10 flex flex-col items-center gap-8 px-8 w-full max-w-xs">
          <div className="relative">
            <motion.div className="absolute inset-0 rounded-full blur-3xl"
              style={{ background: 'radial-gradient(circle, rgba(114,47,55,0.6) 0%, transparent 60%)' }}
              animate={{ scale: [0.8, 1.1, 0.8] }} transition={{ duration: 2, repeat: Infinity }} />
            <svg width="90" height="200" viewBox="0 0 80 180" className="relative z-10"
              style={{ filter: 'drop-shadow(0 0 25px rgba(114,47,55,0.7))' }}>
              <defs>
                <linearGradient id="hbg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0d0205"/><stop offset="50%" stopColor="#1f0810"/><stop offset="100%" stopColor="#0d0205"/>
                </linearGradient>
                <linearGradient id="hwine" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9B2335"/><stop offset="100%" stopColor="#4a0d14"/>
                </linearGradient>
                <linearGradient id="hgold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#F5D77C"/><stop offset="100%" stopColor="#8B7523"/>
                </linearGradient>
                <clipPath id="hclip">
                  <rect x="13" y={168 - (loaderPct / 100) * 82} width="54" height="82"/>
                </clipPath>
              </defs>
              <path d="M28 58 C18 65 13 80 13 96 L13 154 C13 162 20 168 28 168 L52 168 C60 168 67 162 67 154 L67 96 C67 80 62 65 52 58 Z" fill="url(#hbg)" stroke="rgba(114,47,55,0.4)" strokeWidth="1.5"/>
              <motion.path d="M28 58 C18 65 13 80 13 96 L13 154 C13 162 20 168 28 168 L52 168 C60 168 67 162 67 154 L67 96 C67 80 62 65 52 58 Z"
                fill="url(#hwine)" clipPath="url(#hclip)"
                animate={{ opacity: [0.85, 1, 0.85] }} transition={{ duration: 1.5, repeat: Infinity }}/>
              <path d="M31 18 L31 58 L49 58 L49 18 Z" fill="url(#hbg)" stroke="rgba(114,47,55,0.3)" strokeWidth="1.5"/>
              <rect x="29" y="10" width="22" height="12" rx="4" fill="url(#hgold)"/>
              {loaderPct > 25 && (
                <g>
                  <rect x="19" y="95" width="42" height="40" rx="4" fill="rgba(250,249,246,0.92)"/>
                  <rect x="19" y="95" width="42" height="3" rx="2" fill="url(#hgold)"/>
                  <text x="40" y="112" textAnchor="middle" fill="#722F37" fontSize="7" fontWeight="bold" fontFamily="Georgia,serif">SOMMELY</text>
                  <text x="40" y="121" textAnchor="middle" fill="#9E9E9E" fontSize="4.5" fontFamily="Georgia,serif">SOMMELIER IA</text>
                  <text x="40" y="133" textAnchor="middle" fill="#6B5D56" fontSize="4.5" fontFamily="Georgia,serif">2026</text>
                </g>
              )}
            </svg>
          </div>
          <motion.span key={loaderPct} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="font-bold" style={{ fontSize: '3.5rem', background: 'linear-gradient(135deg, #D4AF37, #F5D77C, #D4AF37)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 20px rgba(212,175,55,0.6))', fontFamily: 'Georgia, serif' }}>
            {loaderPct}%
          </motion.span>
          <div className="w-full">
            <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <motion.div className="h-full rounded-full" animate={{ width: `${loaderPct}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{ background: 'linear-gradient(90deg, #722F37, #D4AF37)', boxShadow: '0 0 12px rgba(212,175,55,0.5)' }}/>
            </div>
          </div>
          <p className="text-white/50 text-sm">{loaderPct < 100 ? 'Connexion en cours...' : 'Bienvenue ! 🍷'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ background: '#FAFAF8' }}>

      {/* HEADER */}
      <div className="px-5 pb-4" style={{ background: 'rgba(250,250,248,0.9)', backdropFilter: 'blur(20px)', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 48px)', paddingLeft: '72px' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm mb-0.5" style={{ color: '#9E9E9E' }}>{timeOfDay}{firstName ? `, ${firstName}` : ''} 👋</p>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-xl" style={{ color: '#1a0508', letterSpacing: '-0.02em' }}>
                {isPremium ? 'Sommely Pro' : 'Sommely'}
              </h1>
              {isPremium && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(212,175,55,0.15)', color: '#D4AF37' }}>
                  ♾ Illimité
                </span>
              )}
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center border-none cursor-pointer font-display font-bold text-white text-base shadow-lg"
            style={{ background: 'linear-gradient(135deg, #722F37, #8B4049)' }}
          >
            {firstName ? firstName[0].toUpperCase() : 'S'}
          </motion.button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 pt-4 pb-8 space-y-4">

        {/* SCANNER CTA — glassmorphism premium */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/scan')}
          className="w-full rounded-3xl p-6 text-left border-none cursor-pointer relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #722F37 0%, #5a1e24 100%)',
            boxShadow: '0 20px 60px rgba(114,47,55,0.25), 0 4px 16px rgba(114,47,55,0.15)',
          }}
        >
          {/* Glass orbs */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-16 translate-x-16"
            style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full translate-y-12 -translate-x-12"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)' }} />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                <Camera size={22} color="white" />
              </div>
              {!isPremium && scansRemaining > 0 && (
                <div className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}>
                  {scansRemaining} scan{scansRemaining > 1 ? 's' : ''} gratuit{scansRemaining > 1 ? 's' : ''}
                </div>
              )}
              {isPremium && (
                <div className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                  ♾ Illimité
                </div>
              )}
            </div>
            <h2 className="font-display font-bold text-xl text-white mb-1.5" style={{ letterSpacing: '-0.01em' }}>
              Scanner une bouteille
            </h2>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
              GPT-4o identifie l&apos;étiquette · Score personnalisé en 3 secondes
            </p>
            <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>Appuyer pour commencer</span>
              <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
            </div>
          </div>
        </motion.button>

        {/* STATS */}
        {(scanCount > 0 || caveBottles > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3"
          >
            {[
              { label: 'Scans', value: scanCount, onClick: undefined },
              { label: 'Bouteilles', value: caveBottles, onClick: () => navigate('/cave') },
              { label: 'Cave', value: caveValue > 0 ? `${caveValue > 999 ? `${Math.round(caveValue/1000*10)/10}k` : caveValue}€` : '—', onClick: () => navigate('/cave') },
            ].map((s, i) => (
              <motion.div key={i} whileTap={{ scale: 0.97 }}
                onClick={s.onClick}
                className="rounded-2xl p-4 text-center border"
                style={{ background: 'white', borderColor: 'rgba(0,0,0,0.06)', cursor: s.onClick ? 'pointer' : 'default', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <p className="font-display font-bold text-xl" style={{ color: '#1a0508', letterSpacing: '-0.02em' }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9E9E9E' }}>{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* CAVE */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/cave')}
          className="w-full rounded-2xl p-5 text-left border cursor-pointer"
          style={{ background: 'white', borderColor: 'rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(114,47,55,0.06)' }}>🍾</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm mb-0.5" style={{ color: '#1a0508' }}>Ma cave virtuelle</p>
              <p className="text-xs" style={{ color: '#9E9E9E' }}>
                {caveBottles > 0
                  ? `${caveBottles} bouteille${caveBottles > 1 ? 's' : ''} · ${caveValue.toLocaleString('fr-FR')} €`
                  : 'Gérez vos bouteilles · Prix en temps réel'}
              </p>
            </div>
            <ChevronRight size={16} style={{ color: '#D1CBC4', flexShrink: 0 }} />
          </div>
        </motion.button>

        {/* FONCTIONNALITÉS */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold text-sm" style={{ color: '#1a0508' }}>Fonctionnalités</p>
            <div className="flex items-center gap-1">
              <Zap size={11} fill="#D4AF37" color="#D4AF37" />
              <span className="text-xs font-medium" style={{ color: '#D4AF37' }}>Introuvable sur Vivino</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {features.map((f, i) => (
              <motion.button
                key={f.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(f.route)}
                className="w-full rounded-2xl p-4 text-left border cursor-pointer flex items-center gap-2"
                style={{ background: 'white', borderColor: 'rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(114,47,55,0.06)' }}>{f.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 min-w-0">
                    <p className="font-semibold text-sm flex-shrink-0" style={{ color: '#1a0508' }}>{f.title}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.tagColor}`}>{f.tag}</span>
                  </div>
                  <p className="text-xs" style={{ color: '#9E9E9E' }}>{f.subtitle}</p>
                </div>
                <ChevronRight size={15} style={{ color: '#D1CBC4', flexShrink: 0 }} />
              </motion.button>
            ))}
          </div>
        </div>

        {/* BANNER PREMIUM */}
        {!isPremium && (
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/premium')}
            className="w-full rounded-2xl p-5 text-left cursor-pointer relative overflow-hidden border-none"
            style={{
              background: 'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 100%)',
              border: '1px solid rgba(212,175,55,0.25)',
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(212,175,55,0.2)' }}>
                <Star size={18} fill="#D4AF37" color="#D4AF37" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#1a0508' }}>Passer à Sommely Pro</p>
                <p className="text-xs" style={{ color: '#9E9E9E' }}>Scans illimités · Cave illimitée · Antoine 24h/24</p>
              </div>
              <ChevronRight size={16} style={{ color: '#D4AF37' }} />
            </div>
          </motion.button>
        )}

        {/* DERNIER SCAN */}
        {recentWine && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-4 border"
            style={{ background: 'white', borderColor: 'rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
          >
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#9E9E9E' }}>Dernier scan</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(114,47,55,0.06)' }}>🍷</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: '#1a0508' }}>{recentWine.name}</p>
                <p className="text-xs" style={{ color: '#9E9E9E' }}>{recentWine.year} · {recentWine.region}</p>
              </div>
              <button onClick={() => navigate('/scan')}
                className="text-xs font-semibold px-3 py-1.5 rounded-full border-none cursor-pointer text-white"
                style={{ background: '#722F37' }}>
                Rescanner
              </button>
            </div>
          </motion.div>
        )}

        {/* TIP — rotation toutes les 10 secondes parmi 30 conseils */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'rgba(114,47,55,0.03)', borderColor: 'rgba(114,47,55,0.1)' }}
        >
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <span className="text-sm">💡</span>
            <p className="text-xs font-bold" style={{ color: '#1a0508' }}>Le saviez-vous ?</p>
            <span className="ml-auto text-xs font-medium tabular-nums" style={{ color: 'rgba(114,47,55,0.4)' }}>
              {tipIndex + 1}/{WINE_TIPS.length}
            </span>
          </div>
          <div className="relative min-h-[48px] px-4 pb-4">
            <AnimatePresence mode="wait">
              <motion.p
                key={tipIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="text-xs leading-relaxed"
                style={{ color: '#9E9E9E' }}
              >
                {WINE_TIPS[tipIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
          {/* Barre de progression */}
          <div className="h-0.5 w-full" style={{ background: 'rgba(114,47,55,0.06)' }}>
            <motion.div
              key={`progress-${tipIndex}`}
              className="h-full"
              style={{ background: 'rgba(114,47,55,0.25)', transformOrigin: 'left' }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 10, ease: 'linear' }}
            />
          </div>
        </motion.div>

        <div className="h-28" />
      </div>
    </div>
  );
}
