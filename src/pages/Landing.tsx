import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Camera, MessageCircle, TrendingUp, Star, Wine, ChevronRight } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const features = [
    {
      icon: <Camera size={24} />,
      title: 'Scanner en 3 secondes',
      desc: 'GPT-4o identifie l\'étiquette et calcule votre score personnalisé selon vos goûts.',
      gradient: 'from-rose-50 to-red-50',
      accent: '#722F37',
    },
    {
      icon: <MessageCircle size={24} />,
      title: 'Antoine, votre sommelier IA',
      desc: 'Posez n\'importe quelle question. Antoine répond comme un expert, 24h/24.',
      gradient: 'from-amber-50 to-yellow-50',
      accent: '#D4AF37',
    },
    {
      icon: <Wine size={24} />,
      title: 'Cave virtuelle intelligente',
      desc: 'Cataloguez, valorisez et optimisez vos bouteilles. Prix en temps réel.',
      gradient: 'from-slate-50 to-gray-50',
      accent: '#374151',
    },
    {
      icon: <TrendingUp size={24} />,
      title: 'IA Investissement',
      desc: 'Prédictions de valeur à 1, 3 et 5 ans. Grade A+ → D sur chaque vin.',
      gradient: 'from-emerald-50 to-green-50',
      accent: '#065F46',
    },
  ];

  const testimonials = [
    { img: '47', name: 'Marie L.', role: 'Amateure passionnée', text: 'Antoine m\'a sauvé au restaurant. Je ne commande plus au hasard.', stars: 5 },
    { img: '23', name: 'Thomas R.', role: 'Collectionneur', text: 'Ma cave virtuelle me fait économiser des centaines d\'euros par an.', stars: 5 },
    { img: '12', name: 'Sophie M.', role: 'Œnologue amateur', text: 'Le scanner est bluffant. Résultats en 3 secondes, précision remarquable.', stars: 5 },
  ];

  return (
    <div className="min-h-screen bg-white font-body overflow-x-hidden">

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#722F37' }}>
              <span className="text-white text-sm font-bold">S</span>
            </div>
            <span className="font-display font-bold text-lg" style={{ color: '#722F37' }}>Sommely</span>
          </div>
          <div
            className="backdrop-blur-xl border border-white/60 rounded-full px-5 py-2.5 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.8)' }}
            onClick={() => navigate('/auth')}
          >
            <span className="text-sm font-semibold" style={{ color: '#722F37' }}>Essayer gratuitement</span>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Background mesh */}
        <div className="absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(114,47,55,0.08) 0%, transparent 60%)',
          }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 60% 40% at 80% 80%, rgba(212,175,55,0.06) 0%, transparent 50%)',
          }} />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-30" style={{
            backgroundImage: 'linear-gradient(rgba(114,47,55,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(114,47,55,0.05) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 text-center px-6 max-w-4xl mx-auto pt-24">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 border"
            style={{
              background: 'rgba(114,47,55,0.06)',
              borderColor: 'rgba(114,47,55,0.15)',
            }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#722F37' }} />
            <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#722F37' }}>
              Sommelier IA · 7 jours gratuits
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="font-display font-bold leading-[1.05] mb-6"
            style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)', color: '#1a0508', letterSpacing: '-0.02em' }}
          >
            Votre sommelier
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #722F37 0%, #D4AF37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              personnel
            </span>
            , dans votre poche.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-lg leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: '#6B5D56' }}
          >
            Scannez n'importe quelle bouteille, obtenez un score personnalisé en 3 secondes. 
            Demandez à Antoine, votre IA sommelier disponible 24h/24.
          </motion.p>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/auth')}
              className="relative overflow-hidden rounded-2xl px-8 py-4 font-bold text-white text-base border-none cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #722F37 0%, #8B4049 100%)',
                boxShadow: '0 8px 32px rgba(114,47,55,0.35), 0 2px 8px rgba(114,47,55,0.2)',
              }}
            >
              <span className="relative z-10">Essayer gratuitement — 7 jours →</span>
            </motion.button>
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-semibold border cursor-pointer"
              style={{ color: '#722F37', borderColor: 'rgba(114,47,55,0.2)', background: 'transparent' }}
            >
              Voir les fonctionnalités
              <ChevronRight size={16} />
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs mt-5"
            style={{ color: '#9E9E9E' }}
          >
            Sans carte bancaire · Annulation à tout moment
          </motion.p>

          {/* Social proof */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center justify-center gap-3 mt-8"
          >
            <div className="flex -space-x-2">
              {['47', '23', '12', '36'].map((id, i) => (
                <img key={i} src={`https://i.pravatar.cc/32?img=${id}`} alt="" className="w-8 h-8 rounded-full border-2 border-white object-cover" />
              ))}
            </div>
            <div className="text-left">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="#D4AF37" color="#D4AF37" />)}
              </div>
              <p className="text-xs" style={{ color: '#6B5D56' }}>+2 400 amateurs · 4,9/5</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5"
            style={{ borderColor: 'rgba(114,47,55,0.3)' }}
          >
            <div className="w-1 h-2 rounded-full" style={{ background: '#722F37' }} />
          </motion.div>
        </motion.div>
      </div>

      {/* Features */}
      <div id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>Fonctionnalités</p>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#1a0508', letterSpacing: '-0.02em' }}>
              Fini de choisir au hasard
            </h2>
            <p className="text-base max-w-md mx-auto" style={{ color: '#6B5D56' }}>
              Tout ce dont vous avez besoin pour devenir un expert du vin.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative rounded-3xl p-7 bg-gradient-to-br ${f.gradient} border overflow-hidden cursor-default`}
                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
              >
                {/* Glass orb */}
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-40"
                  style={{ background: f.accent }} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 text-white"
                    style={{ background: f.accent }}>
                    {f.icon}
                  </div>
                  <h3 className="font-display font-bold text-xl mb-2" style={{ color: '#1a0508' }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#6B5D56' }}>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-24 px-6" style={{ background: 'linear-gradient(180deg, #fff 0%, #faf9f6 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>Tarifs</p>
            <h2 className="font-display font-bold mb-4" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#1a0508', letterSpacing: '-0.02em' }}>
              Simple et transparent
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Monthly */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-3xl p-7 border bg-white"
              style={{ borderColor: 'rgba(0,0,0,0.08)' }}
            >
              <p className="font-semibold mb-1" style={{ color: '#6B5D56' }}>Mensuel</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display font-bold text-4xl" style={{ color: '#1a0508' }}>4,99€</span>
                <span className="text-sm" style={{ color: '#9E9E9E' }}>/mois</span>
              </div>
              <p className="text-sm mb-6" style={{ color: '#9E9E9E' }}>Sans engagement</p>
              <button onClick={() => navigate('/auth')}
                className="w-full py-3.5 rounded-2xl font-semibold text-sm border cursor-pointer"
                style={{ color: '#722F37', borderColor: 'rgba(114,47,55,0.3)', background: 'transparent' }}>
                Commencer
              </button>
            </motion.div>

            {/* Annual */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl p-7 relative overflow-hidden text-white"
              style={{ background: 'linear-gradient(135deg, #722F37 0%, #5a1e24 100%)', boxShadow: '0 20px 60px rgba(114,47,55,0.3)' }}
            >
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(212,175,55,0.25)', color: '#D4AF37' }}>
                ⭐ Meilleure valeur
              </div>
              <p className="font-semibold mb-1 text-white/70">Annuel</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-display font-bold text-4xl">4€</span>
                <span className="text-sm text-white/60">/mois</span>
              </div>
              <p className="text-xs mb-1 text-white/50">Soit 48€/an</p>
              <p className="text-xs mb-6" style={{ color: '#D4AF37' }}>Économisez 11,88€/an</p>
              <button onClick={() => navigate('/auth')}
                className="w-full py-3.5 rounded-2xl font-bold text-sm border-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white', backdropFilter: 'blur(10px)' }}>
                Commencer →
              </button>
            </motion.div>
          </div>

          <p className="text-center text-xs mt-6" style={{ color: '#9E9E9E' }}>
            7 jours gratuits sur tous les plans · Paiement sécurisé Stripe
          </p>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF37' }}>Témoignages</p>
            <h2 className="font-display font-bold" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#1a0508', letterSpacing: '-0.02em' }}>
              Ils nous font confiance
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-3xl p-6 border bg-white"
                style={{ borderColor: 'rgba(0,0,0,0.06)' }}
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(t.stars)].map((_, j) => <Star key={j} size={14} fill="#D4AF37" color="#D4AF37" />)}
                </div>
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#374151' }}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/40?img=${t.img}`} alt={t.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#1a0508' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#9E9E9E' }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-24 px-6">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl p-10 text-center relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #1a0508 0%, #2d0d14 50%, #1a0508 100%)',
              boxShadow: '0 40px 80px rgba(26,5,8,0.3)',
            }}
          >
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(212,175,55,0.4) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(114,47,55,0.6) 0%, transparent 50%)',
            }} />
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#D4AF37' }}>
                Commencer maintenant
              </p>
              <h2 className="font-display font-bold text-white mb-4" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.02em' }}>
                Votre premier scan est gratuit
              </h2>
              <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
                Rejoignez +2 400 amateurs qui ne choisissent plus au hasard.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/auth')}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #F5D77C)', color: '#1a0508' }}
              >
                Essayer gratuitement →
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-8 px-6 border-t" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: '#722F37' }}>
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-display font-bold text-sm" style={{ color: '#722F37' }}>Sommely</span>
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
