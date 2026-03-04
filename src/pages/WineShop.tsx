import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, ExternalLink, Gift, Star } from 'lucide-react';
import { canAccessFeature } from '../utils/subscription';
import { useAuth } from '../context/AuthContext';

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

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SOMMELY-';
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  code += '-';
  for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

export function WineShop() {
  const navigate = useNavigate();
  const { subscriptionState } = useAuth();
  const [activeTab, setActiveTab] = useState<'partners' | 'promos' | 'referral'>('partners');
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!canAccessFeature(subscriptionState, 'shop')) {
      navigate('/premium');
      return;
    }
    let code = localStorage.getItem('sommely_referral_code');
    if (!code) {
      code = generateReferralCode();
      localStorage.setItem('sommely_referral_code', code);
    }
    setReferralCode(code);
  }, [navigate, subscriptionState]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareMessage = `Découvre Sommely, ton sommelier IA personnel ! 🍷 Scanne n'importe quel vin, obtiens un score personnalisé et des conseils d'expert. Utilise mon code ${referralCode} pour un mois Pro offert !`;

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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-gray-dark mb-4">
              Nos partenaires vous offrent des réductions exclusives avec le code Sommely.
            </p>
            {PARTNERS.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-burgundy-dark/5 flex items-center justify-center text-2xl">
                    {p.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-black-wine">{p.name}</h3>
                    <p className="text-xs text-gray-dark mb-2">{p.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-gold/10 rounded-lg px-2 py-1">
                        <span className="text-xs font-bold text-black-wine">{p.code}</span>
                        <button
                          onClick={() => copyToClipboard(p.code, `code-${p.id}`)}
                          className="p-0.5 rounded hover:bg-gold/20 cursor-pointer"
                        >
                          <Copy size={12} color="#6B5D56" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-green-700">{p.discount}</span>
                    </div>
                  </div>
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-burgundy-dark flex items-center justify-center flex-shrink-0 hover:bg-burgundy-medium transition-colors"
                  >
                    <ExternalLink size={16} color="white" />
                  </a>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'promos' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-gray-dark mb-4">Vins en promotion du moment chez nos partenaires.</p>
            {PROMOS.map((promo, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-light/30 shadow-sm p-4 flex items-center gap-4"
              >
                <div className="w-14 h-14 rounded-xl bg-burgundy-dark/5 flex items-center justify-center text-2xl">
                  🍷
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-black-wine">{promo.name}</p>
                  <p className="text-xs text-gray-dark">{promo.region}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-dark line-through">{promo.priceNormal}€</span>
                    <span className="font-bold text-burgundy-dark">{promo.pricePromo}€</span>
                    <span className="text-xs font-bold text-green-700">-{promo.discount}%</span>
                  </div>
                </div>
                <a
                  href={promo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 bg-burgundy-dark text-white rounded-xl text-xs font-semibold hover:bg-burgundy-medium transition-colors"
                >
                  Commander
                </a>
              </div>
            ))}
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
                <span className="font-mono font-bold text-xl text-burgundy-dark flex-1">{referralCode}</span>
                <button
                  onClick={() => copyToClipboard(referralCode, 'ref')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-burgundy-dark text-white rounded-lg text-sm font-semibold border-none cursor-pointer hover:bg-burgundy-medium"
                >
                  <Copy size={14} />
                  {copied === 'ref' ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <button
                onClick={() => copyToClipboard(shareMessage, 'msg')}
                className="w-full py-3 bg-gold/20 text-black-wine rounded-xl font-semibold text-sm border border-gold/40 cursor-pointer hover:bg-gold/30 transition-colors flex items-center justify-center gap-2"
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
