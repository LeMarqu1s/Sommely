import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, useAnimationFrame } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ArrowRight, Star, Zap, Camera, MessageCircle, TrendingUp, Wine } from 'lucide-react';

// ─── Utilities ──────────────────────────────────────────
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e: MouseEvent) => setPos({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return pos;
}

// ─── Realistic Bottle ───────────────────────────────────
function WineBottle3D({ rotY = 0, scale = 1, opacity = 1, id = 'a' }: { rotY?: number; scale?: number; opacity?: number; id?: string }) {
  return (
    <div style={{
      transform: `perspective(1200px) rotateY(${rotY}deg) scale(${scale})`,
      transformStyle: 'preserve-3d',
      opacity,
      willChange: 'transform',
    }}>
      <svg width="88" height="240" viewBox="0 0 88 240" fill="none"
        style={{ filter: `drop-shadow(0 ${20 * scale}px ${40 * scale}px rgba(114,47,55,${0.4 * opacity})) drop-shadow(0 4px 12px rgba(0,0,0,${0.3 * opacity}))` }}>
        <defs>
          <linearGradient id={`body-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#050103"/>
            <stop offset="18%" stopColor="#150507"/>
            <stop offset="42%" stopColor="#280b10"/>
            <stop offset="58%" stopColor="#280b10"/>
            <stop offset="82%" stopColor="#150507"/>
            <stop offset="100%" stopColor="#050103"/>
          </linearGradient>
          <linearGradient id={`wine-${id}`} x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%" stopColor="#6b1520"/>
            <stop offset="100%" stopColor="#2a060a"/>
          </linearGradient>
          <linearGradient id={`cap-${id}`} x1="0%" y1="0%" x2="20%" y2="100%">
            <stop offset="0%" stopColor="#f0cc60"/>
            <stop offset="40%" stopColor="#c9a227"/>
            <stop offset="100%" stopColor="#7a5f10"/>
          </linearGradient>
          <linearGradient id={`sheen-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent"/>
            <stop offset="28%" stopColor="rgba(255,255,255,0.05)"/>
            <stop offset="42%" stopColor="rgba(255,255,255,0.18)"/>
            <stop offset="56%" stopColor="rgba(255,255,255,0.04)"/>
            <stop offset="100%" stopColor="transparent"/>
          </linearGradient>
          <radialGradient id={`lbl-${id}`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fffef8"/>
            <stop offset="100%" stopColor="#f5f0e8"/>
          </radialGradient>
          <clipPath id={`wclip-${id}`}><rect x="13" y="162" width="62" height="68"/></clipPath>
        </defs>

        {/* Body */}
        <path d="M32 82 C18 92 13 110 13 130 L13 208 C13 219 20 226 32 226 L56 226 C68 226 75 219 75 208 L75 130 C75 110 70 92 56 82 Z" fill={`url(#body-${id})`}/>
        {/* Wine */}
        <path d="M32 82 C18 92 13 110 13 130 L13 208 C13 219 20 226 32 226 L56 226 C68 226 75 219 75 208 L75 130 C75 110 70 92 56 82 Z" fill={`url(#wine-${id})`} clipPath={`url(#wclip-${id})`}/>
        {/* Sheen */}
        <path d="M32 82 C18 92 13 110 13 130 L13 208 C13 219 20 226 32 226 L56 226 C68 226 75 219 75 208 L75 130 C75 110 70 92 56 82 Z" fill={`url(#sheen-${id})`}/>
        {/* Edge highlight left */}
        <path d="M19 118 C17 112 16 122 16 132 L16 200 C17 203 19 204 20 202 Z" fill="rgba(255,255,255,0.06)"/>

        {/* Neck */}
        <path d="M34 24 L34 82 L54 82 L54 24 Z" fill={`url(#body-${id})`}/>
        <path d="M34 24 L34 82 L54 82 L54 24 Z" fill={`url(#sheen-${id})`} opacity="0.7"/>
        {/* Neck ring */}
        <rect x="32" y="76" width="24" height="7" rx="2" fill={`url(#cap-${id})`} opacity="0.5"/>

        {/* Capsule */}
        <path d="M33 8 L33 26 Q33 30 44 30 Q55 30 55 26 L55 8 Q55 4 44 4 Q33 4 33 8 Z" fill={`url(#cap-${id})`}/>
        <path d="M33 8 L33 13 Q33 16 44 16 Q55 16 55 13 L55 8 Q55 4 44 4 Q33 4 33 8 Z" fill="rgba(255,255,255,0.22)"/>
        <path d="M33 8 Q33 4 44 4 Q55 4 55 8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>

        {/* Label */}
        <rect x="17" y="128" width="54" height="60" rx="5" fill={`url(#lbl-${id})`}/>
        {/* Top gold bar */}
        <rect x="17" y="128" width="54" height="4.5" rx="2.5" fill={`url(#cap-${id})`}/>
        {/* Bottom gold bar */}
        <rect x="17" y="183.5" width="54" height="4.5" rx="2.5" fill={`url(#cap-${id})`}/>
        {/* Inner frame */}
        <rect x="20" y="135" width="48" height="46" rx="3" fill="none" stroke="#c9a227" strokeWidth="0.4" opacity="0.45"/>

        {/* Label text */}
        <text x="44" y="150" textAnchor="middle" fill="#5a1420" fontSize="7.5" fontWeight="900" fontFamily="Georgia, 'Times New Roman', serif" letterSpacing="2.5">SOMMELY</text>
        <line x1="22" y1="155" x2="66" y2="155" stroke="#c9a227" strokeWidth="0.5" opacity="0.55"/>
        <text x="44" y="163" textAnchor="middle" fill="#8b6068" fontSize="5" fontFamily="Georgia, serif" letterSpacing="1.2">SOMMELIER IA</text>
        <line x1="28" y1="168" x2="60" y2="168" stroke="#c9a227" strokeWidth="0.3" opacity="0.35"/>
        <text x="44" y="175" textAnchor="middle" fill="#a08080" fontSize="4.5" fontFamily="Georgia, serif" letterSpacing="0.8">BORDEAUX · 2023</text>
      </svg>
    </div>
  );
}

// ─── Hero Bottle Scene ───────────────────────────────────
function HeroBottleScene() {
  const mouse = useMousePosition();
  const [hovered, setHovered] = useState(false);
  const t = useRef(0);
  const [tick, setTick] = useState(0);

  useAnimationFrame((time) => {
    t.current = time / 1000;
    setTick(time);
  });

  const float = Math.sin(t.current * 0.8) * 8;
  const floatL = Math.sin(t.current * 0.6 + 1) * 6;
  const floatR = Math.sin(t.current * 0.7 + 2) * 7;

  return (
    <div className="relative flex items-end justify-center select-none"
      style={{ height: 280, width: '100%', maxWidth: 360 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>

      {/* Ground reflection glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full blur-2xl"
        style={{ width: 200, height: 32, background: 'rgba(114,47,55,0.18)' }}/>

      {/* Left bottle */}
      <div className="absolute" style={{
        left: '2%', bottom: 8,
        transform: `translateY(${floatL}px) rotate(-10deg)`,
        transition: 'none',
      }}>
        <WineBottle3D id="left" rotY={hovered ? -30 : -20 + mouse.x * 15} scale={0.68} opacity={0.55}/>
      </div>

      {/* Center bottle — main */}
      <div className="relative z-10" style={{
        transform: `translateY(${float}px) perspective(1200px) rotateY(${mouse.x * 8}deg) rotateX(${-mouse.y * 3}deg)`,
        transition: 'none',
        willChange: 'transform',
      }}>
        <WineBottle3D id="center" rotY={0} scale={1.1} opacity={1}/>
      </div>

      {/* Right bottle */}
      <div className="absolute" style={{
        right: '2%', bottom: 8,
        transform: `translateY(${floatR}px) rotate(10deg)`,
        transition: 'none',
      }}>
        <WineBottle3D id="right" rotY={hovered ? 30 : 20 + mouse.x * -15} scale={0.68} opacity={0.55}/>
      </div>
    </div>
  );
}

// ─── Feature card ────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay, accent }: { icon: React.ReactNode; title: string; desc: string; delay: number; accent: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="rounded-2xl p-5 cursor-default"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white"
        style={{ background: accent, boxShadow: `0 4px 16px ${accent}55` }}>
        {icon}
      </div>
      <h3 className="font-display font-bold text-base mb-1.5 text-white" style={{ letterSpacing: '-0.01em' }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: '#86868b' }}>{desc}</p>
    </motion.div>
  );
}

// ─── Scroll reveal ────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

// ─── Main ────────────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const smoothY = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });
  const heroOpacity = useTransform(smoothY, [0, 0.6], [1, 0]);
  const heroScale = useTransform(smoothY, [0, 0.6], [1, 0.96]);
  const bottleY = useTransform(smoothY, [0, 1], [0, -60]);

  return (
    <div className="font-body" style={{ background: '#fff', overflowX: 'hidden' }}>

      {/* ─── NAV ─────────────────────────────────────── */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(255,255,255,0.82)', backdropFilter: 'saturate(200%) blur(24px)', WebkitBackdropFilter: 'saturate(200%) blur(24px)', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between" style={{ height: 44 }}>
          <span className="font-display font-bold text-sm" style={{ color: '#1d1d1f', letterSpacing: '-0.02em' }}>Sommely</span>
          <div className="hidden sm:flex items-center gap-6">
            {['Fonctionnalités', 'Tarifs', 'Avis'].map(l => (
              <button key={l} onClick={() => document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs bg-transparent border-none cursor-pointer transition-colors hover:opacity-60" style={{ color: '#6e6e73' }}>
                {l}
              </button>
            ))}
          </div>
          <motion.button whileHover={{ opacity: 0.82 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
            className="text-xs font-semibold px-4 py-1.5 rounded-full text-white border-none cursor-pointer"
            style={{ background: '#1d1d1f' }}>
            Essayer
          </motion.button>
        </div>
      </motion.nav>

      {/* ─── HERO ────────────────────────────────────── */}
      <motion.div ref={heroRef}
        className="min-h-screen flex flex-col items-center justify-center text-center px-5 pt-12 relative overflow-hidden"
        style={{ opacity: heroOpacity, scale: heroScale, background: 'linear-gradient(180deg, #fff 0%, #f9f8f6 60%, #f2ede8 100%)' } as any}>

        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 140% 80% at 50% -5%, rgba(114,47,55,0.055) 0%, transparent 55%)',
        }}/>

        {/* Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.9, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 300 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 text-xs font-semibold"
          style={{ background: 'rgba(114,47,55,0.07)', color: '#722F37', border: '1px solid rgba(114,47,55,0.13)' }}>
          <motion.span className="w-1.5 h-1.5 rounded-full inline-block bg-current"
            animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}/>
          Sommelier IA · 7 jours gratuits
        </motion.div>

        {/* H1 */}
        <div className="overflow-hidden mb-2">
          <motion.h1 initial={{ y: '100%' }} animate={{ y: 0 }}
            transition={{ delay: 0.25, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold"
            style={{ fontSize: 'clamp(3rem, 10vw, 6.8rem)', lineHeight: 0.97, letterSpacing: '-0.045em', color: '#1d1d1f' }}>
            Votre sommelier
          </motion.h1>
        </div>
        <div className="overflow-hidden mb-5">
          <motion.h1 initial={{ y: '100%' }} animate={{ y: 0 }}
            transition={{ delay: 0.35, duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-bold"
            style={{ fontSize: 'clamp(3rem, 10vw, 6.8rem)', lineHeight: 0.97, letterSpacing: '-0.045em',
              background: 'linear-gradient(135deg, #722F37 0%, #c9821a 50%, #722F37 100%)',
              backgroundSize: '200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
            dans votre poche.
          </motion.h1>
        </div>

        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mb-8 max-w-md text-base leading-relaxed" style={{ color: '#6e6e73' }}>
          Scannez une bouteille, obtenez un score personnalisé en&nbsp;3&nbsp;secondes.
          Antoine, votre IA sommelier, répond à tout.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          <motion.button whileHover={{ scale: 1.025, y: -1 }} whileTap={{ scale: 0.975 }}
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm text-white border-none cursor-pointer"
            style={{
              background: 'linear-gradient(145deg, #8B4049 0%, #722F37 50%, #5a1e24 100%)',
              boxShadow: '0 4px 20px rgba(114,47,55,0.32), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}>
            Essayer gratuitement <ArrowRight size={14}/>
          </motion.button>
          <button onClick={() => document.getElementById('fonctionnalités')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm font-medium bg-transparent border-none cursor-pointer transition-opacity hover:opacity-60" style={{ color: '#6e6e73' }}>
            En savoir plus ↓
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="flex items-center gap-3 mb-6">
          <div className="flex -space-x-2">
            {['47','23','12','36'].map((id,i) => (
              <img key={i} src={`https://i.pravatar.cc/28?img=${id}`} alt=""
                className="w-7 h-7 rounded-full border-2 border-white object-cover"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}/>
            ))}
          </div>
          <div className="text-left">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_,i) => <Star key={i} size={10} fill="#D4AF37" color="#D4AF37"/>)}
            </div>
            <p className="text-xs mt-0.5" style={{ color: '#6e6e73' }}>+2 400 amateurs · 4,8/5</p>
          </div>
        </motion.div>

        {/* Bottles */}
        <motion.div style={{ y: bottleY }} className="w-full flex justify-center">
          <HeroBottleScene/>
        </motion.div>
      </motion.div>

      {/* ─── FEATURES — dark full-bleed ─────────────── */}
      <div id="fonctionnalités" style={{ background: '#1d1d1f' }} className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#D4AF37' }}>Fonctionnalités</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.035em', color: '#f5f5f7', lineHeight: 1.05 }}>
              Fini de choisir au hasard.
            </h2>
            <p className="mt-3 text-sm max-w-xs mx-auto" style={{ color: '#6e6e73' }}>
              Tout ce qu'il faut pour devenir un expert du vin.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <Camera size={18}/>, title: 'Scanner en 3 secondes', desc: 'GPT-4o identifie l\'étiquette. Score personnalisé selon vos goûts et votre budget.', accent: '#722F37', delay: 0 },
              { icon: <MessageCircle size={18}/>, title: 'Antoine, sommelier IA', desc: 'Posez n\'importe quelle question. Antoine répond comme un expert, 24h/24.', accent: '#c9a227', delay: 0.07 },
              { icon: <Wine size={18}/>, title: 'Cave virtuelle', desc: 'Cataloguez, valorisez et optimisez vos bouteilles. Prix IA en temps réel.', accent: '#374151', delay: 0.14 },
              { icon: <TrendingUp size={18}/>, title: 'IA Investissement', desc: 'Prédictions à 1, 3, 5 ans. Grade A+ → D. Simulez vos ventes.', accent: '#065F46', delay: 0.21 },
            ].map((f,i) => <FeatureCard key={i} {...f}/>)}
          </div>
        </div>
      </div>

      {/* ─── PRICING ─────────────────────────────────── */}
      <div id="tarifs" className="py-20 px-5" style={{ background: '#f5f5f7' }}>
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#D4AF37' }}>Tarifs</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.035em', color: '#1d1d1f', lineHeight: 1.05 }}>
              Simple et transparent.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Reveal>
              <div className="rounded-3xl p-7 h-full flex flex-col"
                style={{ background: 'white', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 2px 16px rgba(0,0,0,0.04)' }}>
                <p className="text-sm font-semibold mb-4" style={{ color: '#86868b' }}>Mensuel</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display font-bold" style={{ fontSize: '3.2rem', color: '#1d1d1f', letterSpacing: '-0.04em', lineHeight: 1 }}>4,99€</span>
                  <span className="text-sm" style={{ color: '#86868b' }}>/mois</span>
                </div>
                <div className="space-y-2 mb-7 flex-1">
                  {['Scans illimités', 'Cave virtuelle illimitée', 'Chat Antoine 24h/24', 'Tous les accords mets-vins'].map(f => (
                    <div key={f} className="flex items-center gap-2.5">
                      <Zap size={12} color="#722F37" fill="#722F37"/>
                      <span className="text-xs" style={{ color: '#374151' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/auth')}
                  className="w-full py-3 rounded-2xl font-semibold text-sm cursor-pointer"
                  style={{ color: '#722F37', border: '1.5px solid rgba(114,47,55,0.28)', background: 'transparent' }}>
                  Commencer →
                </motion.button>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="rounded-3xl p-7 h-full flex flex-col relative overflow-hidden"
                style={{ background: 'linear-gradient(155deg, #2d0d14 0%, #180609 100%)', boxShadow: '0 16px 48px rgba(114,47,55,0.28)' }}>
                {/* Grain */}
                <div className="absolute inset-0 opacity-25 pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px',
                }}/>
                {/* Gold spot */}
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -translate-y-8 translate-x-8 pointer-events-none"
                  style={{ background: 'rgba(212,175,55,0.18)' }}/>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>Annuel</p>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(212,175,55,0.18)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.28)' }}>
                      ⭐ Meilleure valeur
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display font-bold text-white" style={{ fontSize: '3.2rem', letterSpacing: '-0.04em', lineHeight: 1 }}>4€</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>/mois</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>48€ facturé annuellement</p>
                  <p className="text-xs mb-6" style={{ color: '#D4AF37' }}>✦ Économisez 11,88€/an</p>
                  <div className="space-y-2 mb-7 flex-1">
                    {['Tout du mensuel inclus', 'Accès prioritaire nouveautés', 'IA Investissement avancée', 'Support prioritaire'].map(f => (
                      <div key={f} className="flex items-center gap-2.5">
                        <Zap size={12} color="#D4AF37" fill="#D4AF37"/>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/auth')}
                    className="w-full py-3 rounded-2xl font-bold text-sm cursor-pointer border-none"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #c9a227)', color: '#1d1d1f' }}>
                    Commencer →
                  </motion.button>
                </div>
              </div>
            </Reveal>
          </div>
          <p className="text-center text-xs mt-5" style={{ color: '#aeaeb2' }}>
            7 jours gratuits · Sans carte bancaire · Paiement sécurisé Stripe
          </p>
        </div>
      </div>

      {/* ─── TESTIMONIALS ────────────────────────────── */}
      <div id="avis" className="py-16 px-5" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#D4AF37' }}>Avis clients</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.035em', color: '#1d1d1f', lineHeight: 1.05 }}>
              Ils ne choisissent plus au hasard.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { img: '47', name: 'M. Laurent', loc: 'Paris', rating: 5, text: 'Plus précis que mon caviste. Le score personnalisé correspond exactement à mes goûts.' },
              { img: '23', name: 'T. Renaud', loc: 'Lyon', rating: 5, text: 'Antoine m\'a évité une bouteille décevante à 80€ au restaurant. Je m\'en sers à chaque sortie.' },
              { img: '12', name: 'S. Martin', loc: 'Bordeaux', rating: 4, text: 'Ma cave estimée à 3 200€ par l\'IA. Je ne savais même pas. Vraiment bluffant.' },
            ].map((t,i) => (
              <Reveal key={i} delay={i * 0.07}>
                <div className="rounded-2xl p-5 h-full" style={{ background: '#f5f5f7', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(t.rating)].map((_,j) => <Star key={j} size={11} fill="#D4AF37" color="#D4AF37"/>)}
                    {[...Array(5 - t.rating)].map((_,j) => <Star key={j} size={11} fill="transparent" color="#D4AF37"/>)}
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#374151', fontStyle: 'italic' }}>"{t.text}"</p>
                  <div className="flex items-center gap-2.5">
                    <img src={`https://i.pravatar.cc/36?img=${t.img}`} alt={t.name} className="w-8 h-8 rounded-full object-cover"/>
                    <div>
                      <p className="font-bold text-xs" style={{ color: '#1d1d1f' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: '#aeaeb2' }}>{t.loc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ─── CTA FINAL — dark cinematic ──────────────── */}
      <div className="px-5 py-20" style={{ background: '#1d1d1f' }}>
        <div className="max-w-xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: '#D4AF37' }}>Commencer maintenant</p>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', letterSpacing: '-0.04em', color: '#f5f5f7', lineHeight: 1.05 }}>
              Votre premier scan<br/>est gratuit.
            </h2>
            <p className="text-sm mb-8" style={{ color: '#6e6e73' }}>
              Rejoignez +2 400 amateurs qui ne choisissent plus au hasard.
            </p>
            <motion.button whileHover={{ scale: 1.025, y: -1 }} whileTap={{ scale: 0.975 }}
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm border-none cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #c9a227)', color: '#1d1d1f', boxShadow: '0 8px 32px rgba(212,175,55,0.22)' }}>
              Essayer gratuitement <ArrowRight size={14}/>
            </motion.button>
          </Reveal>
        </div>
      </div>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <div className="py-5 px-5" style={{ background: '#1d1d1f', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display font-bold text-xs" style={{ color: 'rgba(255,255,255,0.3)', letterSpacing: '-0.01em' }}>Sommely</span>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/privacy')} className="text-xs bg-transparent border-none cursor-pointer hover:opacity-60" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Confidentialité
            </button>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.18)' }}>© 2026 Sommely</span>
          </div>
        </div>
      </div>
    </div>
  );
}
