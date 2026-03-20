import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { getWineSeoBySlug } from '../data/wines-seo';

const SITE_URL = 'https://sommely.shop';

function setMetaTag(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function WinePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const wine = slug ? getWineSeoBySlug(slug) : undefined;

  useEffect(() => {
    if (!wine) return;

    const title = `${wine.name} — Score et avis | Sommely`;
    const description = `Scannez ${wine.name} gratuitement avec Sommely pour obtenir votre score personnalisé et des avis détaillés.`;
    const url = `${SITE_URL}/vin/${wine.slug}`;

    document.title = title;
    setMetaTag('description', description);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', url, true);
    setMetaTag('og:locale', 'fr_FR', true);

    return () => {
      document.title = 'Sommely — Le Yuka du vin';
      setMetaTag('description', 'Scannez une étiquette de vin et recevez votre score personnalisé en 3 secondes.');
      setMetaTag('og:title', 'Sommely — Le Yuka du vin', true);
      setMetaTag('og:description', 'Scannez une bouteille, recevez votre score personnalisé.', true);
      setMetaTag('og:url', SITE_URL, true);
    };
  }, [wine]);

  if (!wine) {
    return (
      <div className="min-h-screen font-body flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg-app)' }}>
        <h1 className="font-display text-2xl font-bold text-black-wine mb-4">Vin non trouvé</h1>
        <p className="text-gray-dark text-center mb-6">Cette page n'existe pas.</p>
        <button
          onClick={() => navigate('/')}
          className="bg-burgundy-dark text-white px-6 py-3 rounded-full font-semibold text-sm border-none cursor-pointer"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ background: 'var(--bg-app)' }}>
      <article className="max-w-2xl mx-auto px-5 py-8">
        <header className="mb-8">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-black-wine leading-tight">
            Scanner {wine.name} avec Sommely
          </h1>
        </header>

        <div className="rounded-2xl border border-burgundy-dark/20 p-6 mb-6" style={{ background: 'var(--bg-card)' }}>
          <p className="text-gray-dark text-sm mb-6">
            Scannez l'étiquette de votre bouteille de {wine.name} et recevez en 3 secondes votre score personnalisé,
            les accords mets & vins et des conseils de dégustation.
          </p>
          <button
            onClick={() => navigate('/scan', { state: { fromWine: wine.slug } })}
            className="w-full py-4 bg-burgundy-dark text-white rounded-xl font-semibold text-base border-none cursor-pointer flex items-center justify-center gap-3 hover:bg-burgundy-medium transition-colors shadow-md mb-3"
          >
            <Camera size={22} />
            Scanner ce vin
          </button>
          <button
            onClick={() => navigate('/premium')}
            className="w-full py-3 border-2 border-burgundy-dark text-burgundy-dark rounded-xl font-semibold text-sm bg-transparent cursor-pointer hover:bg-burgundy-dark/5 transition-colors"
          >
            Essai gratuit 7 jours
          </button>
        </div>

        <footer className="text-xs text-gray-dark">
          <p>Sommely — Votre sommelier IA. Scannez, dégustez, partagez.</p>
        </footer>
      </article>
    </div>
  );
}
