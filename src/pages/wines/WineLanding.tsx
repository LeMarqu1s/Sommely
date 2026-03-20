import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import { getWineBySlug } from './winesData';

const SITE_URL = 'https://sommely.shop';
const DEFAULT_OG_IMAGE = `${SITE_URL}/IMG_1639-transparent.png`;

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

export function WineLanding() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const wine = slug ? getWineBySlug(slug) : undefined;

  useEffect(() => {
    if (!wine) return;

    const title = `${wine.name} — Guide, description et scanner | Sommely`;
    const description = `${wine.description.slice(0, 155)}... Scannez ce vin avec Sommely pour obtenir votre score personnalisé.`;
    const url = `${SITE_URL}/vin/${wine.slug}`;
    const ogTitle = `${wine.name} | Sommely — Votre sommelier IA`;
    const ogDescription = wine.description.slice(0, 200);

    document.title = title;
    setMetaTag('description', description);
    setMetaTag('og:title', ogTitle, true);
    setMetaTag('og:description', ogDescription, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:url', url, true);
    setMetaTag('og:image', DEFAULT_OG_IMAGE, true);
    setMetaTag('og:locale', 'fr_FR', true);
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', ogTitle);
    setMetaTag('twitter:description', ogDescription);

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
          <p className="text-xs font-bold uppercase tracking-widest text-burgundy-dark mb-2">
            {wine.region} · {wine.country}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-black-wine leading-tight mb-2">
            {wine.name}
          </h1>
          <p className="text-sm text-gray-dark">
            {wine.type}
          </p>
        </header>

        <div className="prose prose-sm max-w-none mb-10">
          <p className="text-black-wine leading-relaxed text-base">
            {wine.description}
          </p>
        </div>

        <div className="rounded-2xl border border-burgundy-dark/20 p-6 mb-10" style={{ background: 'var(--bg-card)' }}>
          <h2 className="font-display text-lg font-bold text-black-wine mb-2">
            Découvrez ce vin avec Sommely
          </h2>
          <p className="text-gray-dark text-sm mb-4">
            Scannez l'étiquette de votre bouteille et recevez en 3 secondes votre score personnalisé, 
            les accords mets & vins et des conseils de dégustation.
          </p>
          <button
            onClick={() => navigate('/scan', { state: { fromWine: wine.slug } })}
            className="w-full py-4 bg-burgundy-dark text-white rounded-xl font-semibold text-base border-none cursor-pointer flex items-center justify-center gap-3 hover:bg-burgundy-medium transition-colors shadow-md"
          >
            <Camera size={22} />
            Scanner ce vin avec Sommely
          </button>
        </div>

        <footer className="text-xs text-gray-dark">
          <p>
            Sommely — Votre sommelier IA. Scannez, dégustez, partagez.
          </p>
        </footer>
      </article>
    </div>
  );
}
