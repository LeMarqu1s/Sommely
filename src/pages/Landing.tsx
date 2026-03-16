import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Camera, MessageCircle, TrendingUp, Wine, Star, ArrowRight } from 'lucide-react';

// ─── Bottle SVG ───────────────────────────────────────────
function Bottle({ className = '', style = {} }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 120 320" fill="none" className={className} style={style}>
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0d0205"/>
          <stop offset="20%" stopColor="#1f0810"/>
          <stop offset="50%" stopColor="#2d0d14"/>
          <stop offset="80%" stopColor="#1f0810"/>
          <stop offset="100%" stopColor="#0d0205"/>
        </linearGradient>
        <linearGradient id="wine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B1a2a"/>
          <stop offset="100%" stopColor="#3d0d12"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5D77C"/>
          <stop offset="100%" stopColor="#8B7010"/>
        </linearGradient>
        <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="transparent"/>
          <stop offset="35%" stopColor="rgba(255,255,255,0.08)"/>
          <stop offset="50%" stopColor="rgba(255,255,255,0.2)"/>
          <stop offset="65%" stopColor="rgba(255,255,255,0.06)"/>
          <stop offset="100%" stopColor="transparent"/>
        </linearGradient>
        <clipPath id="wineClip">
          <rect x="18" y="195" width="84" height="100"/>
        </clipPath>
      </defs>
      {/* Body */}
      <path d="M42 100 C24 112 18 136 18 162 L18 264 C18 278 30 288 44 288 L76 288 C90 288 102 278 102 264 L102 162 C102 136 96 112 78 100 Z" fill="url(#bg)"/>
      {/* Wine */}
      <path d="M42 100 C24 112 18 136 18 162 L18 264 C18 278 30 288 44 288 L76 288 C90 288 102 278 102 264 L102 162 C102 136 96 112 78 100 Z" fill="url(#wine)" clipPath="url(#wineClip)"/>
      {/* Shine */}
      <path d="M42 100 C24 112 18 136 18 162 L18 264 C18 278 30 288 44 288 L76 288 C90 288 102 278 102 264 L102 162 C102 136 96 112 78 100 Z" fill="url(#shine)"/>
      {/* Left highlight */}
      <path d="M26 145 C24 138 22 152 22 165 L22 248 C23 252 26 254 27 252 Z" fill="rgba(255,255,255,0.07)"/>
      {/* Neck */}
      <path d="M46 32 L46 100 L74 100 L74 32 Z" fill="url(#bg)"/>
      <path d="M46 32 L46 100 L74 100 L74 32 Z" fill="url(#shine)" opacity="0.6"/>
      {/* Cap */}
      <rect x="44" y="16" width="32" height="20" rx="7" fill="url(#gold)"/>
      <rect x="46" y="19" width="28" height="4" rx="2" fill="rgba(255,255,255,0.35)"/>
      {/* Label */}
      <rect x="26" y="158" width="68" height="76" rx="8" fill="rgba(255,255,255,0.96)"/>
      <rect x="26" y="158" width="68" height="5" rx="3" fill="url(#gold)"/>
      <rect x="26" y="229" width="68" height="5" rx="3" fill="url(#gold)"/>
      <text x="60" y="182" textAnchor="middle" fill="#722F37" fontSize="10" fontWeight="900" fontFamily="Georgia,serif" letterSpacing="3">SOMMELY</text>
      <line x1="32" y1="191" x2="88" y2="191" stroke="#D4AF37" strokeWidth="0.8" opacity="0.7"/>
      <text x="60" y="202" textAnchor="middle" fill="#9E9E9E" fontSize="7.5" fontFamily="Georgia,serif" letterSpacing="1.5">SOMMELIER IA</text>
      <text x="60" y="218" textAnchor="middle" fill="#C4989E" fontSize="7" fontFamily="Georgia,serif">2026</text>
    </svg>
  );
}

// ─── Section wrapper ──────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.75, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}>
      {children}
    </motion.div>
  );
}

export function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const bottleY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const bottleScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  return (
    <div className="font-body" style={{ background: '#fff', color: '#1d1d1f', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
          <span className="font-display font-bold text-sm" style={{ color: '#1d1d1f', letterSpacing: '-0.01em' }}>Sommely</span>
          <nav className="hidden sm:flex items-center gap-6">
            {['Fonctionnalités', 'Tarifs', 'Témoignages'].map(item => (
              <button key={item} onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs bg-transparent border-none cursor-pointer" style={{ color: '#6e6e73' }}>
                {item}
              </button>
            ))}
          </nav>
          <motion.button whileHover={{ opacity: 0.85 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
            className="text-xs font-semibold px-4 py-2 rounded-full border-none cursor-pointer text-white"
            style={{ background: '#722F37' }}>
            Essayer gratuitement
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <div ref={heroRef} className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #fff 0%, #fafaf8 100%)' }}>
        
        {/* Subtle radial bg */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(114,47,55,0.06) 0%, transparent 55%)'
        }}/>

        {/* Badge */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
          style={{ background: 'rgba(114,47,55,0.07)', color: '#722F37', border: '1px solid rgba(114,47,55,0.12)' }}>
          <motion.span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#722F37' }}
            animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}/>
          Sommelier IA · 7 jours gratuits
        </motion.div>

        {/* Headline */}
        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="font-display font-bold max-w-3xl"
          style={{ fontSize: 'clamp(2.8rem, 9vw, 6.5rem)', lineHeight: 1.0, letterSpacing: '-0.04em', color: '#1d1d1f' }}>
          Votre sommelier<br/>
          <span style={{
            background: 'linear-gradient(135deg, #722F37 0%, #D4AF37 50%, #722F37 100%)',
            backgroundSize: '200%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            dans votre poche.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.7 }}
          className="mt-5 mb-8 max-w-md text-base leading-relaxed"
          style={{ color: '#6e6e73' }}>
          Scannez une bouteille. Score personnalisé en 3 secondes.
          Antoine, votre IA sommelier, répond à tout, 24h/24.
        </motion.p>

        {/* CTAs */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center gap-3 mb-10">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/auth')}
            className="flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm text-white border-none cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #722F37, #8B4049)', boxShadow: '0 4px 20px rgba(114,47,55,0.35)' }}>
            Essayer gratuitement <ArrowRight size={15}/>
          </motion.button>
          <button onClick={() => document.getElementById('fonctionnalités')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm font-medium border-none bg-transparent cursor-pointer" style={{ color: '#6e6e73' }}>
            En savoir plus ↓
          </button>
        </motion.div>

        {/* Social proof */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
          className="flex items-center gap-3 mb-8">
          <div className="flex -space-x-2">
            {['47','23','12','36'].map((id,i) => (
              <img key={i} src={`https://i.pravatar.cc/28?img=${id}`} alt="" className="w-7 h-7 rounded-full border-2 border-white object-cover"/>
            ))}
          </div>
          <div className="text-left">
            <div className="flex gap-0.5">{[...Array(5)].map((_,i) => <Star key={i} size={10} fill="#D4AF37" color="#D4AF37"/>)}</div>
            <p className="text-xs" style={{ color: '#6e6e73' }}>+2 400 amateurs · 4,9/5</p>
          </div>
        </motion.div>

        {/* 3 Bottles hero */}
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 1 }}
          style={{ y: bottleY, scale: bottleScale }}
          className="relative flex items-end justify-center gap-4 w-full max-w-sm">
          
          {/* Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-24 rounded-full blur-3xl"
            style={{ background: 'rgba(114,47,55,0.12)' }}/>

          {/* Left bottle */}
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="opacity-50" style={{ transform: 'rotate(-8deg) scale(0.75)', transformOrigin: 'bottom center' }}>
            <Bottle style={{ width: 70, filter: 'drop-shadow(0 8px 20px rgba(114,47,55,0.2))' }}/>
          </motion.div>

          {/* Center bottle — main */}
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative z-10">
            <Bottle style={{ width: 100, filter: 'drop-shadow(0 16px 40px rgba(114,47,55,0.35))' }}/>
          </motion.div>

          {/* Right bottle */}
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="opacity-50" style={{ transform: 'rotate(8deg) scale(0.75)', transformOrigin: 'bottom center' }}>
            <Bottle style={{ width: 70, filter: 'drop-shadow(0 8px 20px rgba(114,47,55,0.2))' }}/>
          </motion.div>
        </motion.div>
      </div>

      {/* ── FEATURES — Full bleed dark ── */}
      <div id="fonctionnalités" style={{ background: '#1d1d1f' }} className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37', letterSpacing: '0.2em' }}>Fonctionnalités</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.03em', color: '#f5f5f7', lineHeight: 1.05 }}>
              Fini de choisir au hasard.
            </h2>
            <p className="mt-4 text-sm" style={{ color: '#6e6e73' }}>
              Tout ce dont vous avez besoin pour devenir un expert du vin.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <Camera size={20}/>, title: 'Scanner en 3 secondes', desc: 'GPT-4o identifie l\'étiquette et calcule votre score personnalisé selon vos goûts et votre budget.', color: '#722F37' },
              { icon: <MessageCircle size={20}/>, title: 'Antoine, sommelier IA', desc: 'Posez n\'importe quelle question. Antoine répond comme un vrai expert, en tenant compte de votre cave.', color: '#D4AF37' },
              { icon: <Wine size={20}/>, title: 'Cave virtuelle intelligente', desc: 'Cataloguez, valorisez et optimisez vos bouteilles. Prix dynamiques mis à jour par IA.', color: '#374151' },
              { icon: <TrendingUp size={20}/>, title: 'IA Investissement', desc: 'Prédictions de valeur à 1, 3 et 5 ans. Grade A+ → D. Simulez vos ventes.', color: '#065F46' },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="rounded-2xl p-6"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-white"
                    style={{ background: f.color, boxShadow: `0 4px 16px ${f.color}44` }}>
                    {f.icon}
                  </div>
                  <h3 className="font-display font-bold text-base mb-2" style={{ color: '#f5f5f7', letterSpacing: '-0.01em' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#86868b' }}>{f.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING — Light avec texture ── */}
      <div id="tarifs" className="py-20 px-6" style={{ background: '#fafaf8' }}>
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37', letterSpacing: '0.2em' }}>Tarifs</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.03em', color: '#1d1d1f', lineHeight: 1.05 }}>
              Simple et transparent.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Mensuel */}
            <FadeIn>
              <div className="rounded-3xl p-7 h-full flex flex-col"
                style={{ background: 'white', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                <div>
                  <p className="text-sm font-semibold mb-4" style={{ color: '#6e6e73' }}>Mensuel</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display font-bold" style={{ fontSize: '3.5rem', color: '#1d1d1f', letterSpacing: '-0.04em', lineHeight: 1 }}>4,99€</span>
                    <span className="text-sm" style={{ color: '#6e6e73' }}>/mois</span>
                  </div>
                  <p className="text-xs mb-6" style={{ color: '#aeaeb2' }}>Sans engagement</p>
                  <div className="space-y-2 mb-8">
                    {['Scans illimités', 'Cave virtuelle', 'Chat Antoine', 'Tous les accords mets-vins'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(114,47,55,0.1)' }}>
                          <span style={{ fontSize: 8, color: '#722F37' }}>✓</span>
                        </div>
                        <span className="text-xs" style={{ color: '#1d1d1f' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/auth')}
                  className="w-full py-3 rounded-2xl font-semibold text-sm cursor-pointer border"
                  style={{ color: '#722F37', borderColor: 'rgba(114,47,55,0.25)', background: 'transparent' }}>
                  Commencer →
                </motion.button>
              </div>
            </FadeIn>

            {/* Annuel — dark glass */}
            <FadeIn delay={0.1}>
              <div className="rounded-3xl p-7 h-full flex flex-col relative overflow-hidden"
                style={{
                  background: 'linear-gradient(150deg, #2d0d14 0%, #1a0508 100%)',
                  boxShadow: '0 16px 48px rgba(114,47,55,0.3)',
                }}>
                {/* Grain texture */}
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                  backgroundSize: '200px 200px',
                }}/>
                {/* Gold glow */}
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -translate-y-10 translate-x-10"
                  style={{ background: 'rgba(212,175,55,0.15)' }}/>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>Annuel</p>
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: 'rgba(212,175,55,0.2)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                      ⭐ Meilleure valeur
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display font-bold text-white" style={{ fontSize: '3.5rem', letterSpacing: '-0.04em', lineHeight: 1 }}>4€</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>/mois</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>48€ facturé annuellement</p>
                  <p className="text-xs mb-6" style={{ color: '#D4AF37' }}>✦ Économisez 11,88€/an</p>
                  <div className="space-y-2 mb-8">
                    {['Tout du mensuel', 'Priorité support', 'Accès aux nouvelles features', 'IA Investissement avancée'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.2)' }}>
                          <span style={{ fontSize: 8, color: '#D4AF37' }}>✓</span>
                        </div>
                        <span className="text-xs text-white/70">{f}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/auth')}
                    className="w-full py-3 rounded-2xl font-bold text-sm cursor-pointer border-none text-white mt-auto"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #B8921E)', color: '#1d1d1f' }}>
                    Commencer →
                  </motion.button>
                </div>
              </div>
            </FadeIn>
          </div>

          <p className="text-center text-xs mt-5" style={{ color: '#aeaeb2' }}>
            7 jours gratuits · Sans carte bancaire · Paiement sécurisé Stripe
          </p>
        </div>
      </div>

      {/* ── TESTIMONIALS — light ── */}
      <div id="témoignages" className="py-20 px-6" style={{ background: 'white' }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37', letterSpacing: '0.2em' }}>Témoignages</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', letterSpacing: '-0.03em', color: '#1d1d1f', lineHeight: 1.05 }}>
              Ils ne choisissent plus au hasard.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { img: '47', name: 'Marie L.', role: 'Amateure passionnée', text: 'Antoine m\'a sauvé au restaurant. Je ne commande plus au hasard.' },
              { img: '23', name: 'Thomas R.', role: 'Collectionneur', text: 'Ma cave virtuelle me fait économiser des centaines d\'euros par an.' },
              { img: '12', name: 'Sophie M.', role: 'Œnologue amateur', text: 'Le scanner est bluffant. Résultats en 3 secondes, précision remarquable.' },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="rounded-2xl p-6" style={{ background: '#fafaf8', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <div className="flex gap-0.5 mb-4">
                    {[...Array(5)].map((_,j) => <Star key={j} size={12} fill="#D4AF37" color="#D4AF37"/>)}
                  </div>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: '#374151', fontStyle: 'italic' }}>"{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/36?img=${t.img}`} alt={t.name} className="w-8 h-8 rounded-full object-cover"/>
                    <div>
                      <p className="font-bold text-xs" style={{ color: '#1d1d1f' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: '#aeaeb2' }}>{t.role}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA — Full bleed dark ── */}
      <div className="py-24 px-6" style={{ background: '#1d1d1f' }}>
        <div className="max-w-xl mx-auto text-center">
          <FadeIn>
            <div className="relative">
              {/* Grain */}
              <div className="absolute inset-0 rounded-3xl opacity-20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
                backgroundSize: '200px 200px',
              }}/>
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37', letterSpacing: '0.2em' }}>Commencer maintenant</p>
              <h2 className="font-display font-bold mb-4" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', letterSpacing: '-0.03em', color: '#f5f5f7', lineHeight: 1.05 }}>
                Votre premier scan<br/>est gratuit.
              </h2>
              <p className="text-sm mb-8" style={{ color: '#6e6e73' }}>
                Rejoignez +2 400 amateurs qui ne choisissent plus au hasard.
              </p>
              <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D77C)', color: '#1d1d1f', boxShadow: '0 8px 32px rgba(212,175,55,0.25)' }}>
                Essayer gratuitement <ArrowRight size={15}/>
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="py-6 px-6" style={{ background: '#1d1d1f', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-display font-bold text-sm" style={{ color: 'rgba(255,255,255,0.5)', letterSpacing: '-0.01em' }}>Sommely</span>
          <div className="flex items-center gap-5">
            <button onClick={() => navigate('/privacy')} className="text-xs bg-transparent border-none cursor-pointer hover:underline" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Confidentialité
            </button>
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>© 2026 Sommely</span>
          </div>
        </div>
      </div>
    </div>
  );
}
