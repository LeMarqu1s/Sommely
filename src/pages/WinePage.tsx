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

  const pageStyle = {
    minHeight: '100vh',
    background: '#FAF9F6',
    color: '#2C1810',
    fontFamily: 'Inter, sans-serif',
    paddingBottom: 100,
  };

  if (!wine) {
    return (
      <div
        style={{
          ...pageStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#2C1810', marginBottom: 16 }}>
          Vin non trouvé
        </h1>
        <p style={{ color: '#6B5D56', textAlign: 'center', marginBottom: 24 }}>
          Cette page n'existe pas.
        </p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: '#722F37',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 9999,
            fontWeight: 600,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <article style={{ maxWidth: 672, margin: '0 auto', padding: '32px 20px' }}>
        <header style={{ marginBottom: 32 }}>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            style={{
              display: 'inline-block',
              fontSize: 18,
              fontWeight: 700,
              color: '#722F37',
              textDecoration: 'none',
              marginBottom: 24,
            }}
          >
            Sommely
          </a>
          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700, color: '#2C1810', lineHeight: 1.2 }}>
            Scanner {wine.name} avec Sommely
          </h1>
        </header>

        <div
          style={{
            borderRadius: 16,
            border: '1px solid rgba(114,47,55,0.2)',
            padding: 24,
            marginBottom: 24,
            background: '#FFFFFF',
          }}
        >
          <p style={{ color: '#6B5D56', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
            Scannez l'étiquette de votre bouteille de {wine.name} et recevez en 3 secondes votre score personnalisé,
            les accords mets & vins et des conseils de dégustation.
          </p>
          <button
            onClick={() => navigate('/scan', { state: { fromWine: wine.slug } })}
            style={{
              width: '100%',
              padding: '16px',
              background: '#722F37',
              color: 'white',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 16,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              marginBottom: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
          >
            <Camera size={22} />
            Scanner ce vin
          </button>
          <button
            onClick={() => navigate('/premium')}
            style={{
              width: '100%',
              padding: 12,
              border: '2px solid #722F37',
              color: '#722F37',
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Essai gratuit 7 jours
          </button>
        </div>

        <footer style={{ fontSize: 12, color: '#6B5D56' }}>
          <p>Sommely — Votre sommelier IA. Scannez, dégustez, partagez.</p>
        </footer>
      </article>
    </div>
  );
}
