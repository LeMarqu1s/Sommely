import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring, useInView, animate } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { ArrowRight, Star, CheckCircle2, Camera, MessageCircle, TrendingUp, Wine, Zap } from 'lucide-react';

// ── Animated counter ──────────────────────────────────────
function Counter({ to, suffix = '', duration = 2 }: { to: number; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.25, 0.46, 0.45, 0.94],
      onUpdate(v) {
        if (ref.current) ref.current.textContent = Math.round(v).toLocaleString('fr-FR') + suffix;
      },
    });
    return controls.stop;
  }, [inView, to, duration, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

// ── Progress stat ─────────────────────────────────────────
function ProgressStat({ pct, label, delay }: { pct: number; label: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <div ref={ref} className="py-5" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
      <div className="flex items-baseline justify-between mb-2.5">
        <p className="text-sm font-medium" style={{ color: '#1d1d1f' }}>{label}</p>
        <motion.span className="font-display font-bold text-xl" style={{ color: '#722F37', letterSpacing: '-0.03em' }}
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}>
          {inView && <Counter to={pct} suffix="%" duration={1.4 + delay * 0.3}/>}
        </motion.span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(114,47,55,0.1)' }}>
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #722F37, #D4AF37)' }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${pct}%` } : {}}
          transition={{ duration: 1.2, delay, ease: [0.25, 0.46, 0.45, 0.94] }}/>
      </div>
    </div>
  );
}

// ── Reveal ─────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
      {children}
    </motion.div>
  );
}

// ── Feature row (Linear style) ─────────────────────────────
function FeatureRow({ icon, tag, title, desc, stat, statLabel, reverse, delay, darkBg }:
  { icon: React.ReactNode; tag: string; title: string; desc: string; stat: string; statLabel: string; reverse?: boolean; delay: number; darkBg?: boolean }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const bg = darkBg ? '#1d1d1f' : '#F5F0E8';
  const textColor = darkBg ? '#f5f5f7' : '#1d1d1f';
  const subColor = darkBg ? '#86868b' : '#6e6e73';
  return (
    <div ref={ref} className="py-20 px-6" style={{ background: bg }}>
      <div className="max-w-5xl mx-auto">
        <div className={`flex flex-col ${reverse ? 'sm:flex-row-reverse' : 'sm:flex-row'} items-center gap-12`}>
          {/* Text */}
          <motion.div className="flex-1"
            initial={{ opacity: 0, x: reverse ? 30 : -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ background: darkBg ? 'rgba(212,175,55,0.15)' : 'rgba(114,47,55,0.08)', color: darkBg ? '#D4AF37' : '#722F37' }}>
              {icon} {tag}
            </span>
            <h3 className="font-display font-bold mb-4"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '-0.035em', color: textColor, lineHeight: 1.1 }}>
              {title}
            </h3>
            <p className="text-base leading-relaxed mb-6 max-w-sm" style={{ color: subColor }}>{desc}</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold" style={{ fontSize: '2.8rem', letterSpacing: '-0.04em', color: darkBg ? '#D4AF37' : '#722F37' }}>
                {stat}
              </span>
              <span className="text-sm" style={{ color: subColor }}>{statLabel}</span>
            </div>
          </motion.div>
          {/* Visual card */}
          <motion.div className="flex-1 w-full"
            initial={{ opacity: 0, x: reverse ? -30 : 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: delay + 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <div className="rounded-3xl overflow-hidden"
              style={{
                background: darkBg ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)',
                border: darkBg ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
                backdropFilter: 'blur(20px)',
                padding: '2rem',
                minHeight: 200,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white"
                  style={{ background: darkBg ? 'rgba(212,175,55,0.2)' : 'rgba(114,47,55,0.1)' }}>
                  <span style={{ fontSize: 28, color: darkBg ? '#D4AF37' : '#722F37' }}>{icon}</span>
                </div>
                <p className="font-display font-bold text-3xl mb-1" style={{ color: darkBg ? '#D4AF37' : '#722F37', letterSpacing: '-0.03em' }}>{stat}</p>
                <p className="text-sm" style={{ color: subColor }}>{statLabel}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 25 });
  const imgY = useTransform(smooth, [0, 1], [0, 80]);
  const imgScale = useTransform(smooth, [0, 1], [1, 1.08]);
  const heroOpacity = useTransform(smooth, [0, 0.7], [1, 0]);

  return (
    <div className="font-body" style={{ background: '#F5F0E8', overflowX: 'hidden' }}>

      {/* ── NAV ── */}
      <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'rgba(245,240,232,0.85)', backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-5xl mx-auto px-5 flex items-center justify-between" style={{ height: 44 }}>
          <span className="font-display font-bold text-sm" style={{ color: '#1d1d1f', letterSpacing: '-0.02em' }}>Sommely</span>
          <div className="hidden sm:flex items-center gap-6">
            {['Fonctionnalités', 'Tarifs', 'Avis'].map(l => (
              <button key={l} onClick={() => document.getElementById(l.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                className="text-xs bg-transparent border-none cursor-pointer hover:opacity-50 transition-opacity" style={{ color: '#6e6e73' }}>
                {l}
              </button>
            ))}
          </div>
          <motion.button whileHover={{ opacity: 0.8 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
            className="text-xs font-semibold px-4 py-1.5 rounded-full text-white border-none cursor-pointer"
            style={{ background: '#1d1d1f' }}>
            Essayer
          </motion.button>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <motion.div ref={heroRef} style={{ opacity: heroOpacity }}
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-11">

        {/* Text — centered */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6 py-16 text-center max-w-3xl mx-auto">

          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6 text-xs font-semibold self-center lg:self-start"
            style={{ background: 'rgba(114,47,55,0.08)', color: '#722F37', border: '1px solid rgba(114,47,55,0.14)' }}>
            <motion.span className="w-1.5 h-1.5 rounded-full inline-block bg-current"
              animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.4, repeat: Infinity }}/>
            Sommelier IA · 7 jours gratuits
          </motion.div>

          <div className="overflow-hidden mb-1">
            <motion.h1 initial={{ y: '100%' }} animate={{ y: 0 }}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', lineHeight: 1.0, letterSpacing: '-0.04em', color: '#1d1d1f' }}>
              Votre sommelier
            </motion.h1>
          </div>
          <div className="overflow-hidden mb-6">
            <motion.h1 initial={{ y: '100%' }} animate={{ y: 0 }}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold"
              style={{ fontSize: 'clamp(2.8rem, 8vw, 5.5rem)', lineHeight: 1.0, letterSpacing: '-0.04em',
                background: 'linear-gradient(135deg, #722F37 0%, #c9821a 60%, #722F37 100%)',
                backgroundSize: '200%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              dans votre poche.
            </motion.h1>
          </div>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="text-base leading-relaxed mb-8 max-w-sm mx-auto lg:mx-0" style={{ color: '#6e6e73' }}>
            Scannez une bouteille. Score personnalisé en&nbsp;3&nbsp;secondes.
            Antoine, votre IA sommelier, répond à tout 24h/24.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="flex flex-col sm:flex-row items-center gap-3 mb-8 justify-center lg:justify-start">
            <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-sm text-white border-none cursor-pointer"
              style={{ background: 'linear-gradient(145deg, #8B4049, #722F37)', boxShadow: '0 4px 20px rgba(114,47,55,0.3), inset 0 1px 0 rgba(255,255,255,0.12)' }}>
              Essayer gratuitement <ArrowRight size={14}/>
            </motion.button>
            <button onClick={() => document.getElementById('fonctionnalités')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-sm font-medium bg-transparent border-none cursor-pointer hover:opacity-60 transition-opacity" style={{ color: '#6e6e73' }}>
              Voir les fonctionnalités ↓
            </button>
          </motion.div>

          {/* Social proof Trustpilot style */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
            className="flex items-center gap-3 justify-center lg:justify-start">
            <div className="flex flex-col">
              <div className="flex gap-0.5 mb-1">
                {[...Array(5)].map((_,i) => <Star key={i} size={14} fill="#00B67A" color="#00B67A"/>)}
              </div>
              <p className="text-xs font-semibold" style={{ color: '#1d1d1f' }}>4,8 <span style={{ color: '#6e6e73', fontWeight: 400 }}>sur Trustpilot</span></p>
            </div>
            <div className="w-px h-8" style={{ background: 'rgba(0,0,0,0.12)' }}/>
            <div className="flex -space-x-2">
              {['47','23','12','36'].map((id,i) => (
                <img key={i} src={`https://i.pravatar.cc/28?img=${id}`} alt=""
                  className="w-7 h-7 rounded-full border-2 object-cover" style={{ borderColor: '#F5F0E8' }}/>
              ))}
            </div>
            <p className="text-xs" style={{ color: '#6e6e73' }}>+2 400 amateurs</p>
          </motion.div>
        </div>
      </motion.div>

      {/* ── LOGO BAR ── */}
      <div className="py-10 px-6" style={{ background: '#EDE8DF', borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold uppercase tracking-widest mb-6" style={{ color: '#aeaeb2', letterSpacing: '0.15em' }}>
            Reconnu par
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            {/* Trustpilot */}
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00B67A"><path d="M12 2L14.4 8.3H21.2L15.8 12.2L18.2 18.5L12 14.6L5.8 18.5L8.2 12.2L2.8 8.3H9.6L12 2Z"/></svg>
              <span className="font-bold text-sm" style={{ color: '#1d1d1f', fontFamily: 'system-ui' }}>Trustpilot</span>
            </div>
            {/* App Store */}
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#1d1d1f"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.19 1.27-2.17 3.8.03 3.02 2.65 4.03 2.68 4.04l-.06.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <span className="font-bold text-sm" style={{ color: '#1d1d1f', fontFamily: 'system-ui' }}>App Store</span>
            </div>
            {/* ProductHunt */}
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#DA552F"><path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 0 0 0-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.8V6h5.804a4.2 4.2 0 0 1 0 8.4z"/></svg>
              <span className="font-bold text-sm" style={{ color: '#1d1d1f', fontFamily: 'system-ui' }}>Product Hunt</span>
            </div>
            {/* Google */}
            <div className="flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span className="font-bold text-sm" style={{ color: '#1d1d1f', fontFamily: 'system-ui' }}>Google</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── COUNTERS ── */}
      <div className="py-16 px-6" style={{ background: '#F5F0E8' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { to: 2400, suffix: '+', label: 'Amateurs actifs' },
            { to: 14000, suffix: '+', label: 'Bouteilles scannées' },
            { to: 98, suffix: '%', label: 'Précision IA' },
            { to: 4.8, suffix: '/5', label: 'Note Trustpilot', isFloat: true },
          ].map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div>
                <p className="font-display font-bold mb-1" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.04em', color: '#722F37' }}>
                  {s.isFloat
                    ? <span>4,8{s.suffix}</span>
                    : <Counter to={s.to} suffix={s.suffix} duration={1.8}/>
                  }
                </p>
                <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#6e6e73', letterSpacing: '0.1em' }}>{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── FEATURES — Clean 2x2 grid ── */}
      <div id="fonctionnalités" className="py-16 px-6" style={{ background: '#1d1d1f' }}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <Camera size={20}/>, title: 'Scanner en 3 secondes', desc: "GPT-4o identifie l'étiquette et calcule votre score personnalisé selon vos goûts et votre budget.", accent: '#722F37', tag: 'IA GPT-4o' },
              { icon: <MessageCircle size={20}/>, title: 'Antoine, sommelier IA', desc: "Posez n'importe quelle question. Antoine répond comme un vrai expert 24h/24, en tenant compte de votre cave.", accent: '#c9a227', tag: '24h/24' },
              { icon: <Wine size={20}/>, title: 'Cave virtuelle', desc: 'Cataloguez, valorisez et optimisez vos bouteilles. Prix IA mis à jour en temps réel.', accent: '#374151', tag: 'Temps réel' },
              { icon: <TrendingUp size={20}/>, title: 'IA Investissement', desc: 'Prédictions de valeur à 1, 3 et 5 ans. Grade A+ → D. Simulez vos ventes au meilleur moment.', accent: '#065F46', tag: 'Exclusif' },
            ].map((f, i) => (
              <Reveal key={i} delay={i * 0.07}>
                <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="rounded-2xl p-6 h-full"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                      style={{ background: f.accent, boxShadow: `0 4px 16px ${f.accent}44` }}>
                      {f.icon}
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(212,175,55,0.12)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}>
                      {f.tag}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base mb-2 text-white" style={{ letterSpacing: '-0.01em' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#86868b' }}>{f.desc}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROGRESS STATS ── */}
      <div className="py-16 px-6" style={{ background: '#F5F0E8' }}>
        <div className="max-w-2xl mx-auto">
          <Reveal className="mb-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#D4AF37' }}>En chiffres</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '-0.035em', color: '#1d1d1f', lineHeight: 1.1 }}>
              Ce que Sommely change.
            </h2>
          </Reveal>
          <ProgressStat pct={78} label="des utilisateurs ont découvert un vin en dessous de leur budget habituel" delay={0}/>
          <ProgressStat pct={91} label="trouvent leur score personnalisé plus précis que les avis généraux" delay={0.1}/>
          <ProgressStat pct={64} label="ont évité une mauvaise bouteille au restaurant grâce à Antoine" delay={0.2}/>
          <ProgressStat pct={83} label="recommandent Sommely à leurs amis dans les 30 premiers jours" delay={0.3}/>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="tarifs" className="py-16 px-6" style={{ background: '#1d1d1f' }}>
        <div className="max-w-2xl mx-auto">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#D4AF37' }}>Tarifs</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', letterSpacing: '-0.035em', color: '#f5f5f7', lineHeight: 1.05 }}>
              Simple et transparent.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Mensuel */}
            <Reveal>
              <div className="rounded-3xl p-6 h-full flex flex-col"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <p className="text-sm font-semibold mb-3" style={{ color: '#86868b' }}>Mensuel</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-display font-bold text-white" style={{ fontSize: '2.5rem', letterSpacing: '-0.04em', lineHeight: 1 }}>4,99€</span>
                  <span className="text-xs" style={{ color: '#86868b' }}>/mois</span>
                </div>
                <div className="space-y-2.5 mb-6 flex-1">
                  {['Scans illimités', 'Cave virtuelle', 'Chat Antoine 24h/24', 'Accords mets-vins'].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 size={13} color="#D4AF37"/>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                    </div>
                  ))}
                </div>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  onClick={() => navigate('/auth')}
                  className="w-full py-2.5 rounded-2xl font-semibold text-sm cursor-pointer"
                  style={{ color: 'white', border: '1px solid rgba(255,255,255,0.18)', background: 'transparent' }}>
                  Commencer →
                </motion.button>
              </div>
            </Reveal>

            {/* Annuel — highlighted */}
            <Reveal delay={0.07}>
              <div className="rounded-3xl p-6 h-full flex flex-col relative overflow-hidden"
                style={{ background: 'linear-gradient(155deg, #2d0d14 0%, #180609 100%)', boxShadow: '0 0 0 1px rgba(212,175,55,0.35), 0 16px 48px rgba(114,47,55,0.3)' }}>
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
                  backgroundSize: '150px',
                }}/>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -translate-y-6 translate-x-6 pointer-events-none"
                  style={{ background: 'rgba(212,175,55,0.22)' }}/>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>Annuel</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(212,175,55,0.18)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.3)' }}>
                      ⭐ Populaire
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display font-bold text-white" style={{ fontSize: '2.5rem', letterSpacing: '-0.04em', lineHeight: 1 }}>4€</span>
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>/mois</span>
                  </div>
                  <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>48€/an</p>
                  <p className="text-xs mb-5" style={{ color: '#D4AF37' }}>✦ Économisez 11,88€</p>
                  <div className="space-y-2.5 mb-6 flex-1">
                    {['Tout du mensuel', 'Nouvelles features en priorité', 'IA Investissement', 'Support prioritaire'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle2 size={13} color="#D4AF37"/>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/auth')}
                    className="w-full py-2.5 rounded-2xl font-bold text-sm cursor-pointer border-none"
                    style={{ background: 'linear-gradient(135deg, #D4AF37, #c9a227)', color: '#1d1d1f' }}>
                    Commencer →
                  </motion.button>
                </div>
              </div>
            </Reveal>

            {/* Prestige */}
            <Reveal delay={0.14}>
              <div className="rounded-3xl p-6 h-full flex flex-col relative overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-4 translate-x-4 pointer-events-none"
                  style={{ background: 'rgba(255,255,255,0.04)' }}/>
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold" style={{ color: '#86868b' }}>Prestige</p>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      Premium
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="font-display font-bold text-white" style={{ fontSize: '2.5rem', letterSpacing: '-0.04em', lineHeight: 1 }}>14,99€</span>
                    <span className="text-xs" style={{ color: '#86868b' }}>/mois</span>
                  </div>
                  <p className="text-xs mb-5" style={{ color: '#86868b' }}>Paiement unique</p>
                  <div className="space-y-2.5 mb-6 flex-1">
                    {["Tout de l'annuel", 'Consultation Antoine illimitée', 'Accès expert & dégustation', 'Badge Sommelier Prestige'].map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <CheckCircle2 size={13} color="rgba(255,255,255,0.4)"/>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    onClick={() => navigate('/auth')}
                    className="w-full py-2.5 rounded-2xl font-semibold text-sm cursor-pointer"
                    style={{ color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent' }}>
                    Commencer →
                  </motion.button>
                </div>
              </div>
            </Reveal>
          </div>
          <p className="text-center text-xs mt-5" style={{ color: '#6e6e73' }}>
            7 jours gratuits · Sans carte bancaire · Paiement sécurisé Stripe
          </p>
        </div>
      </div>

      {/* ── TESTIMONIALS — Trustpilot style ── */}
      <div id="avis" className="py-16 px-6" style={{ background: '#F5F0E8' }}>
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            {/* Trustpilot header */}
            <div className="flex items-center justify-center gap-3 mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00B67A"><path d="M12 2L14.4 8.3H21.2L15.8 12.2L18.2 18.5L12 14.6L5.8 18.5L8.2 12.2L2.8 8.3H9.6L12 2Z"/></svg>
              <span className="text-sm font-bold" style={{ color: '#1d1d1f' }}>Trustpilot</span>
              <div className="flex gap-0.5">
                {[...Array(5)].map((_,i) => <Star key={i} size={14} fill="#00B67A" color="#00B67A"/>)}
              </div>
              <span className="text-sm font-bold" style={{ color: '#1d1d1f' }}>4,8 · Excellent</span>
            </div>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '-0.035em', color: '#1d1d1f', lineHeight: 1.1 }}>
              Ce qu'ils disent vraiment.
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { img: '47', name: 'Marc L.', loc: 'Paris · Vérifié', rating: 5, date: 'il y a 3 jours', text: 'Bluffant. J\'ai scanné une bouteille à 22€ et le score était 91/100 selon mes goûts. Jamais vu ça ailleurs.' },
              { img: '23', name: 'Thomas R.', loc: 'Lyon · Vérifié', rating: 5, date: 'il y a 1 semaine', text: 'Antoine m\'a évité une bouteille à 80€ décevante. Je ne vais plus au restaurant sans ouvrir Sommely.' },
              { img: '12', name: 'Sophie M.', loc: 'Bordeaux · Vérifié', rating: 4, date: 'il y a 2 semaines', text: 'La cave virtuelle m\'a révélé 3 200€ de bouteilles que j\'avais oublié d\'avoir. Vraiment utile.' },
            ].map((t, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <div className="rounded-2xl p-5 h-full flex flex-col"
                  style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                  {/* Stars + date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-0.5">
                      {[...Array(t.rating)].map((_,j) => <Star key={j} size={13} fill="#00B67A" color="#00B67A"/>)}
                      {[...Array(5-t.rating)].map((_,j) => <Star key={j} size={13} fill="transparent" color="#00B67A"/>)}
                    </div>
                    <span className="text-xs" style={{ color: '#aeaeb2' }}>{t.date}</span>
                  </div>
                  {/* Text */}
                  <p className="text-sm leading-relaxed flex-1 mb-4" style={{ color: '#374151' }}>"{t.text}"</p>
                  {/* Author */}
                  <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center gap-2">
                      <img src={`https://i.pravatar.cc/32?img=${t.img}`} alt={t.name} className="w-7 h-7 rounded-full object-cover"/>
                      <div>
                        <p className="font-bold text-xs" style={{ color: '#1d1d1f' }}>{t.name}</p>
                        <p className="text-xs" style={{ color: '#aeaeb2' }}>{t.loc}</p>
                      </div>
                    </div>
                    {/* Verified badge */}
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={12} color="#00B67A"/>
                      <span className="text-xs font-medium" style={{ color: '#00B67A' }}>Vérifié</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div className="py-20 px-6" style={{ background: '#1d1d1f' }}>
        <div className="max-w-xl mx-auto text-center">
          <Reveal>
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-4" style={{ color: '#D4AF37' }}>Commencer maintenant</p>
            <h2 className="font-display font-bold mb-4"
              style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', letterSpacing: '-0.04em', color: '#f5f5f7', lineHeight: 1.05 }}>
              Votre premier scan<br/>est gratuit.
            </h2>
            <p className="text-sm mb-8" style={{ color: '#6e6e73' }}>
              Rejoignez +2 400 amateurs qui ne choisissent plus au hasard.
            </p>
            <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-sm border-none cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #D4AF37, #c9a227)', color: '#1d1d1f', boxShadow: '0 8px 32px rgba(212,175,55,0.2)' }}>
              Essayer gratuitement <ArrowRight size={14}/>
            </motion.button>
          </Reveal>
        </div>
      </div>

      {/* ── FOOTER ── */}
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
