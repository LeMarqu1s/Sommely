import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Camera, MessageCircle, TrendingUp, Wine, ChevronRight, Star, Zap } from 'lucide-react';

// ─── Wine Bottle SVG Component ────────────────────────────
function WineBottle3D({ rotate = 0, scale = 1, glowColor = '#722F37' }: { rotate?: number; scale?: number; glowColor?: string }) {
  return (
    <div style={{ transform: `perspective(800px) rotateY(${rotate}deg) scale(${scale})`, transformStyle: 'preserve-3d', transition: 'transform 0.6s cubic-bezier(0.23,1,0.32,1)' }}>
      <svg width="80" height="200" viewBox="0 0 80 200" fill="none"
        style={{ filter: `drop-shadow(0 20px 40px ${glowColor}66) drop-shadow(0 4px 12px ${glowColor}44)` }}>
        <defs>
          <linearGradient id={`bottle-${rotate}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0d0205" />
            <stop offset="25%" stopColor="#2a0810" />
            <stop offset="50%" stopColor="#3d1018" />
            <stop offset="75%" stopColor="#2a0810" />
            <stop offset="100%" stopColor="#0d0205" />
          </linearGradient>
          <linearGradient id={`wine-${rotate}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9B2335" />
            <stop offset="100%" stopColor="#5a1420" />
          </linearGradient>
          <linearGradient id={`gold-${rotate}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F5D77C" />
            <stop offset="100%" stopColor="#9B7B1A" />
          </linearGradient>
          <linearGradient id={`shine-${rotate}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="70%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        {/* Body */}
        <path d="M28 65 C16 72 12 88 12 108 L12 168 C12 178 20 184 30 184 L50 184 C60 184 68 178 68 168 L68 108 C68 88 64 72 52 65 Z" fill={`url(#bottle-${rotate})`} />
        {/* Wine level */}
        <path d="M28 65 C16 72 12 88 12 108 L12 168 C12 178 20 184 30 184 L50 184 C60 184 68 178 68 168 L68 108 C68 88 64 72 52 65 Z" fill={`url(#wine-${rotate})`} clipPath={`url(#clip-${rotate})`} />
        <clipPath id={`clip-${rotate}`}><rect x="12" y="120" width="56" height="80" /></clipPath>
        {/* Shine */}
        <path d="M28 65 C16 72 12 88 12 108 L12 168 C12 178 20 184 30 184 L50 184 C60 184 68 178 68 168 L68 108 C68 88 64 72 52 65 Z" fill={`url(#shine-${rotate})`} />
        {/* Left highlight */}
        <path d="M18 90 C16 86 15 95 15 105 L15 155 C15 158 17 160 19 160 L19 90 Z" fill="rgba(255,255,255,0.06)" />
        {/* Neck */}
        <path d="M30 20 L30 65 L50 65 L50 20 Z" fill={`url(#bottle-${rotate})`} />
        <path d="M30 20 L30 65 L50 65 L50 20 Z" fill={`url(#shine-${rotate})`} opacity="0.5" />
        {/* Cork/Cap */}
        <rect x="28" y="10" width="24" height="14" rx="5" fill={`url(#gold-${rotate})`} />
        <rect x="30" y="12" width="20" height="3" rx="1.5" fill="rgba(255,255,255,0.3)" />
        {/* Label */}
        <rect x="17" y="100" width="46" height="52" rx="6" fill="rgba(255,255,255,0.95)" />
        <rect x="17" y="100" width="46" height="4" rx="3" fill={`url(#gold-${rotate})`} />
        <rect x="17" y="148" width="46" height="4" rx="3" fill={`url(#gold-${rotate})`} />
        <text x="40" y="120" textAnchor="middle" fill="#722F37" fontSize="7" fontWeight="900" fontFamily="Georgia,serif" letterSpacing="2">SOMMELY</text>
        <line x1="22" y1="126" x2="58" y2="126" stroke="#D4AF37" strokeWidth="0.5" opacity="0.6" />
        <text x="40" y="134" textAnchor="middle" fill="#9E9E9E" fontSize="5" fontFamily="Georgia,serif" letterSpacing="1">SOMMELIER IA</text>
        <text x="40" y="144" textAnchor="middle" fill="#C4989E" fontSize="4.5" fontFamily="Georgia,serif">2026</text>
      </svg>
    </div>
  );
}

// ─── Floating Bottle Scene ────────────────────────────────
function BottleScene() {
  const [hovered, setHovered] = useState(false);
  
  return (
    <div className="relative flex items-center justify-center" style={{ height: 280 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      
      {/* Glow orb */}
      <motion.div className="absolute rounded-full"
        style={{ width: 200, height: 200, background: 'radial-gradient(circle, rgba(114,47,55,0.3) 0%, transparent 70%)' }}
        animate={{ scale: hovered ? 1.3 : 1, opacity: hovered ? 0.8 : 0.5 }}
        transition={{ duration: 1 }} />

      {/* Left bottle */}
      <motion.div className="absolute"
        style={{ left: '5%', bottom: 20 }}
        animate={{ y: hovered ? -8 : [0, -6, 0], rotate: hovered ? -5 : -8, scale: 0.75, opacity: hovered ? 0.6 : 0.4 }}
        transition={{ duration: hovered ? 0.5 : 3, repeat: hovered ? 0 : Infinity, ease: 'easeInOut' }}>
        <WineBottle3D rotate={-25} glowColor="#D4AF37" />
      </motion.div>

      {/* Center bottle — main */}
      <motion.div className="relative z-10"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
        <WineBottle3D rotate={hovered ? 8 : 0} scale={1} />
      </motion.div>

      {/* Right bottle */}
      <motion.div className="absolute"
        style={{ right: '5%', bottom: 20 }}
        animate={{ y: hovered ? -8 : [0, -8, 0], rotate: hovered ? 5 : 8, scale: 0.75, opacity: hovered ? 0.6 : 0.4 }}
        transition={{ duration: hovered ? 0.5 : 3.5, repeat: hovered ? 0 : Infinity, ease: 'easeInOut', delay: 0.5 }}>
        <WineBottle3D rotate={25} glowColor="#722F37" />
      </motion.div>

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${15 + i * 14}%`,
            background: i % 2 === 0 ? 'rgba(212,175,55,0.8)' : 'rgba(114,47,55,0.8)',
            boxShadow: i % 2 === 0 ? '0 0 6px rgba(212,175,55,1)' : '0 0 6px rgba(114,47,55,1)',
          }}
          animate={{ y: [20, -60, 20], opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.6, ease: 'easeInOut' }} />
      ))}
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay, accent }: { icon: React.ReactNode; title: string; desc: string; delay: number; accent: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.3 } }}
      className="relative rounded-3xl p-7 cursor-default overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
      
      {/* Accent glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: accent }} />
      
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white shadow-lg"
          style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)`, boxShadow: `0 8px 24px ${accent}44` }}>
          {icon}
        </div>
        <h3 className="font-display font-bold text-lg mb-2" style={{ color: '#1a0508', letterSpacing: '-0.01em' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: '#6B5D56' }}>{desc}</p>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────
export function Landing() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const heroScale = useTransform(smoothProgress, [0, 0.3], [1, 0.95]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.3], [1, 0]);

  return (
    <div ref={containerRef} className="min-h-screen font-body overflow-x-hidden" style={{ background: '#FAFAF8' }}>

      {/* ── NAV ── */}
      <motion.nav initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, #722F37, #5a1e24)' }}>
              <span className="text-white text-xs font-black">S</span>
            </div>
            <span className="font-display font-bold text-base" style={{ color: '#1a0508', letterSpacing: '-0.02em' }}>Sommely</span>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth')}
            className="text-sm font-semibold px-5 py-2.5 rounded-full border-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', color: '#722F37', boxShadow: '0 2px 12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.6)' }}>
            Essayer gratuitement
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <motion.div style={{ scale: heroScale, opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-10 overflow-hidden">
        
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 100% 80% at 50% -5%, rgba(114,47,55,0.07) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 85% 90%, rgba(212,175,55,0.05) 0%, transparent 50%)' }} />
          {/* Grid lines */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.25,
            backgroundImage: 'linear-gradient(rgba(114,47,55,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(114,47,55,0.08) 1px, transparent 1px)',
            backgroundSize: '80px 80px' }} />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
          
          {/* Badge */}
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
            style={{ background: 'rgba(114,47,55,0.07)', border: '1px solid rgba(114,47,55,0.15)' }}>
            <motion.div className="w-2 h-2 rounded-full" style={{ background: '#722F37' }}
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#722F37' }}>
              Sommelier IA · 7 jours gratuits
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            className="font-display font-bold mb-6"
            style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', lineHeight: 1.02, color: '#1a0508', letterSpacing: '-0.03em' }}>
            Votre sommelier
            <br />
            <span style={{ background: 'linear-gradient(135deg, #722F37 0%, #D4AF37 60%, #722F37 100%)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              personnel
            </span>
            <br />
            dans votre poche.
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.8 }}
            className="text-lg mb-10 max-w-lg leading-relaxed" style={{ color: '#6B5D56' }}>
            Scannez n'importe quelle bouteille. Score personnalisé en 3 secondes.
            Antoine, votre IA sommelier, répond à tout.
          </motion.p>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-8">
            <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth')}
              className="relative px-8 py-4 rounded-2xl font-bold text-white text-base border-none cursor-pointer overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #722F37, #8B4049)', boxShadow: '0 12px 40px rgba(114,47,55,0.4), 0 2px 8px rgba(114,47,55,0.2)' }}>
              <motion.div className="absolute inset-0 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }} />
              <span className="relative z-10">Essayer gratuitement — 7 jours →</span>
            </motion.button>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold cursor-pointer"
              style={{ color: '#722F37', background: 'rgba(114,47,55,0.06)', border: '1px solid rgba(114,47,55,0.12)' }}>
              Découvrir <ChevronRight size={16} />
            </button>
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
            className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['47', '23', '12', '36'].map((id, i) => (
                <img key={i} src={`https://i.pravatar.cc/32?img=${id}`} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              ))}
            </div>
            <div>
              <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} size={11} fill="#D4AF37" color="#D4AF37" />)}</div>
              <p className="text-xs mt-0.5" style={{ color: '#9E9E9E' }}>+2 400 amateurs · 4,9/5</p>
            </div>
          </motion.div>
        </div>

        {/* 3D Bottle scene */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}
          className="w-full max-w-xs mt-8">
          <BottleScene />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2">
            <div className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
              style={{ borderColor: 'rgba(114,47,55,0.25)' }}>
              <div className="w-1 h-2 rounded-full" style={{ background: '#722F37' }} />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* ── FEATURES ── */}
      <div id="features" className="py-32 px-6 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(114,47,55,0.03) 0%, transparent 70%)' }} />
        <div className="max-w-5xl mx-auto relative z-10">
          
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-20">
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#D4AF37', letterSpacing: '0.2em' }}>Fonctionnalités</p>
            <h2 className="font-display font-bold mb-5" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#1a0508', letterSpacing: '-0.03em', lineHeight: 1.05 }}>
              Fini de choisir
              <br />au hasard.
            </h2>
            <p className="text-base max-w-sm mx-auto" style={{ color: '#6B5D56', lineHeight: 1.7 }}>
              Tout ce dont vous avez besoin pour devenir un expert du vin.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <Camera size={22} />, title: 'Scanner en 3 secondes', desc: 'GPT-4o identifie l\'étiquette et calcule votre score personnalisé selon vos goûts, votre niveau et votre budget.', accent: '#722F37', delay: 0 },
              { icon: <MessageCircle size={22} />, title: 'Antoine, votre sommelier IA', desc: 'Posez n\'importe quelle question. Antoine répond comme un vrai expert, 24h/24, en tenant compte de votre cave.', accent: '#D4AF37', delay: 0.1 },
              { icon: <Wine size={22} />, title: 'Cave virtuelle intelligente', desc: 'Cataloguez, valorisez et optimisez vos bouteilles. Prix dynamiques mis à jour par IA.', accent: '#374151', delay: 0.2 },
              { icon: <TrendingUp size={22} />, title: 'IA Investissement', desc: 'Prédictions de valeur à 1, 3 et 5 ans. Grade A+ → D sur chaque vin. Simulez vos ventes.', accent: '#065F46', delay: 0.3 },
            ].map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div className="py-32 px-6" style={{ background: 'linear-gradient(180deg, #FAFAF8 0%, #F5F0EB 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#D4AF37', letterSpacing: '0.2em' }}>Tarifs</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#1a0508', letterSpacing: '-0.03em' }}>
              Simple et transparent.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-3xl p-8"
              style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
              <p className="font-semibold mb-2 text-sm" style={{ color: '#9E9E9E' }}>Mensuel</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display font-bold" style={{ fontSize: '3rem', color: '#1a0508', letterSpacing: '-0.03em' }}>4,99€</span>
                <span className="text-sm" style={{ color: '#9E9E9E' }}>/mois</span>
              </div>
              <p className="text-xs mb-8" style={{ color: '#9E9E9E' }}>Sans engagement</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm cursor-pointer border"
                style={{ color: '#722F37', borderColor: 'rgba(114,47,55,0.25)', background: 'transparent' }}>
                Commencer →
              </motion.button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
              className="rounded-3xl p-8 relative overflow-hidden"
              style={{ background: 'linear-gradient(150deg, #722F37 0%, #4a1820 100%)', boxShadow: '0 24px 64px rgba(114,47,55,0.35)' }}>
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-10 translate-x-10"
                style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.2) 0%, transparent 70%)' }} />
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', backdropFilter: 'blur(10px)' }}>
                ⭐ Meilleure valeur
              </div>
              <p className="font-semibold mb-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Annuel</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display font-bold text-white" style={{ fontSize: '3rem', letterSpacing: '-0.03em' }}>4€</span>
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>/mois</span>
              </div>
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>48€/an</p>
              <p className="text-xs mb-8" style={{ color: '#D4AF37' }}>Économisez 11,88€/an</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="w-full py-3.5 rounded-2xl font-bold text-sm cursor-pointer border-none text-white"
                style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                Commencer →
              </motion.button>
            </motion.div>
          </div>
          <p className="text-center text-xs mt-6" style={{ color: '#9E9E9E' }}>
            7 jours gratuits · Sans carte bancaire · Paiement sécurisé Stripe
          </p>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
            className="text-center mb-16">
            <p className="text-xs font-black uppercase tracking-widest mb-4" style={{ color: '#D4AF37', letterSpacing: '0.2em' }}>Témoignages</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#1a0508', letterSpacing: '-0.03em' }}>
              Ils ne choisissent plus
              <br />au hasard.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { img: '47', name: 'Marie L.', role: 'Amateure passionnée', text: 'Antoine m\'a sauvé au restaurant. Je ne commande plus au hasard.' },
              { img: '23', name: 'Thomas R.', role: 'Collectionneur', text: 'Ma cave virtuelle me fait économiser des centaines d\'euros par an.' },
              { img: '12', name: 'Sophie M.', role: 'Œnologue amateur', text: 'Le scanner est bluffant. Résultats en 3 secondes, précision remarquable.' },
            ].map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="rounded-3xl p-7"
                style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 4px 24px rgba(0,0,0,0.05)' }}>
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => <Star key={j} size={13} fill="#D4AF37" color="#D4AF37" />)}
                </div>
                <p className="text-sm leading-relaxed mb-6" style={{ color: '#374151', fontStyle: 'italic' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/40?img=${t.img}`} alt={t.name} className="w-9 h-9 rounded-full object-cover" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#1a0508' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#9E9E9E' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div className="py-24 px-6 pb-32">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
            className="rounded-3xl p-12 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(150deg, #1a0508 0%, #2d0d14 50%, #1a0508 100%)', boxShadow: '0 40px 80px rgba(26,5,8,0.25)' }}>
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(212,175,55,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(114,47,55,0.2) 0%, transparent 50%)' }} />
            {/* Grid */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            <div className="relative z-10">
              <motion.div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                style={{ background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)' }}
                animate={{ boxShadow: ['0 0 0 0 rgba(212,175,55,0)', '0 0 0 8px rgba(212,175,55,0)', '0 0 0 0 rgba(212,175,55,0)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}>
                <Zap size={12} fill="#D4AF37" color="#D4AF37" />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#D4AF37' }}>Commencer maintenant</span>
              </motion.div>
              <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                Votre premier scan
                <br />est gratuit.
              </h2>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Rejoignez +2 400 amateurs qui ne choisissent plus au hasard.
              </p>
              <motion.button whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D77C)', color: '#1a0508', boxShadow: '0 8px 32px rgba(212,175,55,0.3)' }}>
                Essayer gratuitement → 
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="py-8 px-6" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #722F37, #5a1e24)' }}>
              <span className="text-white text-xs font-black">S</span>
            </div>
            <span className="font-display font-bold text-sm" style={{ color: '#1a0508', letterSpacing: '-0.01em' }}>Sommely</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/privacy')} className="text-xs bg-transparent border-none cursor-pointer hover:underline" style={{ color: '#9E9E9E' }}>
              Politique de confidentialité
            </button>
            <span className="text-xs" style={{ color: '#9E9E9E' }}>© 2026 Sommely</span>
          </div>
        </div>
      </div>
    </div>
  );
}
