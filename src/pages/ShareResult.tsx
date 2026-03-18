import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Logo } from '../components/Logo';
import { MapPin, Grape } from 'lucide-react';

function getScoreInfo(score: number) {
  if (score >= 85) return { color: '#2E7D32', label: 'Coup de cœur' };
  if (score >= 70) return { color: '#F57C00', label: 'Excellent' };
  if (score >= 50) return { color: '#1976D2', label: 'Correct' };
  return { color: '#C62828', label: 'Pas mon style' };
}

export function ShareResult() {
  const [searchParams] = useSearchParams();
  const wine = searchParams.get('wine') || 'Vin inconnu';
  const score = parseInt(searchParams.get('score') || '0', 10);
  const region = searchParams.get('region') || '';
  const type = searchParams.get('type') || '';
  const year = searchParams.get('year') || '';
  const grapes = searchParams.get('grapes') || '';

  const scoreInfo = getScoreInfo(score);
  const ogImageUrl = `https://sommely.shop/api/og?${new URLSearchParams({
    wine,
    score: String(score),
    region,
    type,
    year,
  }).toString()}`;

  useEffect(() => {
    document.title = `${wine}${year ? ` · ${year}` : ''} · ${score}/100 — Sommely`;
    // Meta dynamiques pour le partage social
    const desc = region
      ? `${wine} — Score Sommely ${score}/100 · ${region} · sommely.shop`
      : `${wine} — Score Sommely ${score}/100 · sommely.shop`;
    let ogImage = document.querySelector('meta[property="og:image"]');
    let ogTitle = document.querySelector('meta[property="og:title"]');
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogImage) {
      ogImage = document.createElement('meta');
      ogImage.setAttribute('property', 'og:image');
      document.head.appendChild(ogImage);
    }
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogImage.setAttribute('content', ogImageUrl);
    ogTitle.setAttribute('content', `${wine}${year ? ` · ${year}` : ''} · ${score}/100 — Sommely`);
    ogDesc.setAttribute('content', desc);
    return () => {
      document.title = 'Sommely — Le Yuka du vin';
    };
  }, [wine, year, score, region, ogImageUrl]);

  return (
    <div
      className="min-h-screen flex flex-col font-body"
      style={{ background: '#0d0608' }}
    >
      {/* Header minimal : logo centré */}
      <header className="flex justify-center pt-8 pb-6 px-4">
        <div className="flex items-center gap-2">
          <Logo size={28} variant="white" />
          <span className="font-display text-xl font-bold text-white">Sommely</span>
        </div>
      </header>

      {/* Card principale */}
      <main className="flex-1 px-5 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/10"
        >
          <div
            className="h-2 w-full"
            style={{ backgroundColor: scoreInfo.color }}
          />
          <div className="p-6">
            <h1 className="font-display text-2xl font-bold text-black-wine mb-1">
              {wine}
              {year ? ` · ${year}` : ''}
            </h1>
            {region && (
              <div className="flex items-center gap-2 text-gray-dark text-sm mb-4">
                <MapPin size={14} />
                <span>{region}{type ? ` · ${type}` : ''}</span>
              </div>
            )}

            <div className="flex items-center gap-6 mt-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-24 h-24 rounded-full flex items-center justify-center border-4"
                style={{
                  borderColor: scoreInfo.color,
                  backgroundColor: `${scoreInfo.color}15`,
                }}
              >
                <span
                  className="font-display text-3xl font-bold"
                  style={{ color: scoreInfo.color }}
                >
                  {score}
                </span>
              </motion.div>
              <div>
                <div
                  className="inline-block px-4 py-2 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: scoreInfo.color }}
                >
                  {scoreInfo.label}
                </div>
                <p className="text-gray-dark text-xs mt-2">Score personnalisé Sommely</p>
              </div>
            </div>

            {grapes && (
              <div className="flex items-start gap-2 mt-5 pt-5 border-t border-gray-light/30">
                <Grape size={16} className="text-burgundy-dark flex-shrink-0 mt-0.5" />
                <p className="text-sm text-black-wine">{grapes.replace(/,/g, ', ')}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Section partagé par */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-white/50 text-sm mt-6"
        >
          Partagé par un utilisateur Sommely
        </motion.p>

        {/* CTA */}
        <motion.a
          href="https://sommely.shop"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="block w-full mt-8 py-5 rounded-2xl font-bold text-center text-white no-underline border-2 border-gold bg-gold/20 hover:bg-gold/30 active:scale-[0.98] transition-all cursor-pointer"
          style={{ borderColor: 'rgba(212,175,55,0.6)' }}
        >
          Découvrir Sommely — C&apos;est gratuit →
        </motion.a>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-white/40 text-sm">
          Le Yuka du vin · sommely.shop
        </p>
      </footer>
    </div>
  );
}
