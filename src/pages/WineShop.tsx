import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Gift, Star } from 'lucide-react';
import { canAccessFeature } from '../utils/subscription';
import { useAuth } from '../context/AuthContext';

const COMING_SOON_CARD = (
  <div style={{
    background: 'white',
    borderRadius: 16,
    padding: 32,
    textAlign: 'center',
    border: '2px dashed #E8E0D8',
  }}>
    <div style={{ fontSize: 32, marginBottom: 12 }}>🔒</div>
    <h3 style={{ color: '#2C1810', fontWeight: 700, marginBottom: 8 }}>
      Bientôt disponible
    </h3>
    <p style={{ color: '#9E9E9E', fontSize: 14 }}>
      Partenaires exclusifs, promotions et offres spéciales arrivent très bientôt.
    </p>
  </div>
);

/* STANDBY — contenu caché, card À venir affichée à la place
const PARTNERS = [
  {
    id: 'idealwine',
    name: 'iDealwine',
    logo: '🍷',
    description: 'Enchères et vente de vins de propriété',
    code: 'SOMMELY10',
    discount: '10%',
    link: 'https://www.idealwine.com',
  },
  {
    id: 'vinatis',
    name: 'Vinatis',
    logo: '🛒',
    description: 'Caviste en ligne, large choix',
    code: 'SOMMELY5',
    discount: '5%',
    link: 'https://www.vinatis.com',
  },
  {
    id: 'wineco',
    name: 'Wine & Co',
    logo: '✨',
    description: 'Vins fins et accords mets-vins',
    code: 'SOMMELY',
    discount: 'Offre spéciale',
    link: 'https://www.wineandco.com',
  },
  {
    id: 'twil',
    name: 'Twil',
    logo: '📦',
    description: 'Abonnement vins personnalisé',
    code: 'SOMMELY15',
    discount: '15% 1er mois',
    link: 'https://www.twil.fr',
  },
  {
    id: 'lavinia',
    name: 'Lavinia',
    logo: '🏛️',
    description: 'Caviste premium Paris et en ligne',
    code: 'SOMMELY',
    discount: 'Sur présentation',
    link: 'https://www.lavinia.fr',
  },
];

const PROMOS = [
  { name: 'Château Meyney 2018', region: 'Saint-Estèphe', priceNormal: 28, pricePromo: 22, discount: 21, link: '#' },
  { name: 'Domaine Laroche Chablis', region: 'Chablis', priceNormal: 18, pricePromo: 14, discount: 22, link: '#' },
  { name: 'Champagne Pierre Peters', region: 'Champagne', priceNormal: 52, pricePromo: 42, discount: 19, link: '#' },
];
*/

export function WineShop() {
  const navigate = useNavigate();
  const { profile, subscriptionState } = useAuth();
  const [activeTab, setActiveTab] = useState<'partners' | 'promos' | 'referral'>('partners');
  const [copied, setCopied] = useState<string | null>(null);
  const code = profile?.referral_code || '';

  if (!canAccessFeature(subscriptionState, 'shop')) {
    navigate('/premium');
    return null;
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareMessage = code ? `Découvre Sommely, ton sommelier IA personnel ! 🍷 Scanne n'importe quel vin, obtiens un score personnalisé et des conseils d'expert. Utilise mon code ${code} pour un mois Pro offert !` : '';

  return (
    <div className="min-h-screen bg-cream font-body">
      <div className="bg-white border-b border-gray-light/30 px-5 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button onClick={() => navigate(-1)} className="bg-transparent border-none cursor-pointer p-1">
          <ArrowLeft size={20} color="#722F37" />
        </button>
        <span className="font-display text-base font-bold text-burgundy-dark">Boutique & Parrainage</span>
        <div className="w-8" />
      </div>

      <div className="max-w-lg mx-auto px-5 py-6">
        <div className="flex gap-2 mb-6">
          {(['partners', 'promos', 'referral'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm border-none cursor-pointer transition-all ${
                activeTab === tab
                  ? 'bg-burgundy-dark text-white'
                  : 'bg-white border border-gray-light/40 text-gray-dark'
              }`}
            >
              {tab === 'partners' && 'Partenaires'}
              {tab === 'promos' && 'Promos'}
              {tab === 'referral' && 'Parrainage'}
            </button>
          ))}
        </div>

        {activeTab === 'partners' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {COMING_SOON_CARD}
          </motion.div>
        )}

        {activeTab === 'promos' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {COMING_SOON_CARD}
          </motion.div>
        )}

        {activeTab === 'referral' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

            {/* Double face */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-burgundy-dark rounded-2xl p-4 text-white text-center">
                <div className="text-2xl mb-2">🎁</div>
                <p className="font-bold text-sm mb-1">Vous recevez</p>
                <p className="text-gold font-bold text-base">1 mois offert</p>
                <p className="text-white/60 text-xs mt-1">par ami devenu payant</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-light/30 p-4 text-center shadow-sm">
                <div className="text-2xl mb-2">👋</div>
                <p className="font-bold text-sm text-black-wine mb-1">Votre ami reçoit</p>
                <p className="text-burgundy-dark font-bold text-base">1 mois offert</p>
                <p className="text-gray-dark text-xs mt-1">à son inscription</p>
              </div>
            </div>

            {/* Code parrainage */}
            <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <Gift size={20} color="#D4AF37" />
                <h3 className="font-display font-bold text-black-wine">Votre code de parrainage</h3>
              </div>
              <div className="flex items-center gap-2 bg-cream rounded-xl p-4 mb-3">
                <span className="font-mono font-bold text-xl text-burgundy-dark flex-1">{code || '—'}</span>
                <button
                  onClick={() => code && copyToClipboard(code, 'ref')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-burgundy-dark text-white rounded-lg text-sm font-semibold border-none cursor-pointer hover:bg-burgundy-medium"
                >
                  <Copy size={14} />
                  {copied === 'ref' ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <button
                onClick={() => shareMessage && copyToClipboard(shareMessage, 'msg')}
                disabled={!shareMessage}
                className="w-full py-3 bg-gold/20 text-black-wine rounded-xl font-semibold text-sm border border-gold/40 cursor-pointer hover:bg-gold/30 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy size={16} />
                {copied === 'msg' ? 'Message copié !' : 'Copier le message à envoyer'}
              </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-5">
              <h3 className="font-display font-bold text-black-wine mb-3 flex items-center gap-2">
                <Star size={18} color="#D4AF37" fill="#D4AF37" />
                Vos filleuls
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cream rounded-xl p-3 text-center">
                  <p className="font-bold text-2xl text-burgundy-dark">0</p>
                  <p className="text-xs text-gray-dark mt-0.5">Amis inscrits</p>
                </div>
                <div className="bg-cream rounded-xl p-3 text-center">
                  <p className="font-bold text-2xl text-gold">0</p>
                  <p className="text-xs text-gray-dark mt-0.5">Mois gagnés</p>
                </div>
              </div>
            </div>

            {/* Comment ça marche */}
            <div className="bg-cream rounded-2xl border border-gray-light/30 p-4">
              <p className="text-xs font-bold text-gray-dark uppercase tracking-wide mb-3">Comment ça marche</p>
              <div className="space-y-3">
                {[
                  { num: '1', text: 'Partagez votre code ou message à un ami' },
                  { num: '2', text: "Votre ami s'inscrit et reçoit 1 mois gratuit" },
                  { num: '3', text: "Quand il devient payant, vous recevez 1 mois offert" },
                  { num: '∞', text: "Sans limite — plus d'amis, plus de mois" },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-burgundy-dark flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">{step.num}</span>
                    </div>
                    <p className="text-sm text-black-wine">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
