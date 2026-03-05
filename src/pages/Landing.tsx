import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wine, Star, Camera, MessageCircle, TrendingUp } from 'lucide-react';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream font-body">
      {/* Hero */}
      <div className="bg-gradient-to-br from-burgundy-dark to-burgundy-medium px-6 pt-16 pb-12 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Wine size={40} color="white" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3">Sommely</h1>
          <p className="text-white/80 text-lg mb-2">Votre sommelier personnel, dans votre poche.</p>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">
            Scannez n'importe quelle bouteille et obtenez en 3 secondes un score personnalisé selon vos goûts.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 space-y-3">
          <button
            onClick={() => navigate('/auth')}
            className="w-full max-w-xs mx-auto block py-4 bg-gold text-black-wine rounded-2xl font-bold text-base border-none cursor-pointer shadow-lg hover:opacity-90 transition-all"
          >
            Essayer gratuitement — 7 jours
          </button>
          <p className="text-white/40 text-xs">Sans carte bancaire · Annulation à tout moment</p>
        </motion.div>
      </div>

      {/* Features */}
      <div className="max-w-lg mx-auto px-5 py-10 space-y-4">
        <h2 className="font-display text-2xl font-bold text-black-wine text-center mb-6">
          Fini de choisir au hasard
        </h2>

        {[
          {
            icon: <Camera size={22} color="#722F37" />,
            title: 'Scanner un vin en 3 secondes',
            desc: 'Photographiez l\'étiquette — Antoine analyse et vous donne un score personnalisé selon vos goûts.',
          },
          {
            icon: <MessageCircle size={22} color="#722F37" />,
            title: 'Demandez à Antoine, votre sommelier IA',
            desc: 'Quel vin avec ce plat ? Quelle bouteille offrir ? Antoine répond 24h/24 comme un vrai expert.',
          },
          {
            icon: <Star size={22} color="#722F37" />,
            title: 'Gérez votre cave virtuelle',
            desc: 'Cataloguez vos bouteilles, suivez leur valeur et recevez des suggestions d\'accord mets-vins.',
          },
          {
            icon: <TrendingUp size={22} color="#722F37" />,
            title: 'Scannez la carte du restaurant',
            desc: 'Meilleur rapport qualité-prix sur toute la carte — ne payez plus trop cher au restaurant.',
          },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-5 flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-burgundy-dark/5 flex items-center justify-center flex-shrink-0">
              {f.icon}
            </div>
            <div>
              <p className="font-semibold text-black-wine text-sm mb-1">{f.title}</p>
              <p className="text-xs text-gray-dark leading-relaxed">{f.desc}</p>
            </div>
          </motion.div>
        ))}

        {/* Pricing teaser */}
        <div className="bg-burgundy-dark rounded-2xl p-6 text-white text-center mt-6">
          <p className="text-white/60 text-sm mb-1">À partir de</p>
          <p className="font-display text-4xl font-bold text-gold">4€<span className="text-lg text-white/60">/mois</span></p>
          <p className="text-white/60 text-xs mt-1">7 jours gratuits sans engagement</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 w-full py-3 bg-gold text-black-wine rounded-xl font-bold text-sm border-none cursor-pointer hover:opacity-90 transition-all"
          >
            Commencer gratuitement →
          </button>
        </div>

        {/* Social proof */}
        <div className="text-center py-4">
          <div className="flex justify-center gap-1 mb-2">
            {[...Array(5)].map((_, i) => <Star key={i} size={16} color="#D4AF37" fill="#D4AF37" />)}
          </div>
          <p className="text-sm font-semibold text-black-wine">+2 400 amateurs nous font confiance</p>
          <p className="text-xs text-gray-dark mt-1">Disponible sur iOS et Android</p>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-8 border-t border-gray-light/30">
          <button onClick={() => navigate('/privacy')} className="text-xs text-gray-dark/50 hover:text-burgundy-dark bg-transparent border-none cursor-pointer underline">
            Politique de confidentialité
          </button>
          <p className="text-xs text-gray-dark/30 mt-2">© 2025 Sommely · sommely.shop</p>
        </div>
      </div>
    </div>
  );
}
