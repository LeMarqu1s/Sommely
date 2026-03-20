import { useParams, useNavigate } from 'react-router-dom';

const WINES: Record<string, { name: string; region: string; description: string }> = {
  'chateau-margaux': { name: 'Château Margaux', region: 'Bordeaux', description: 'Premier Grand Cru Classé de Bordeaux, l\'un des vins les plus prestigieux au monde.' },
  'petrus': { name: 'Pétrus', region: 'Pomerol', description: 'Icône de Pomerol, produit sur un sol argileux unique.' },
  'sancerre': { name: 'Sancerre', region: 'Loire', description: 'Sauvignon Blanc de référence, minéral et élégant.' },
  'chablis': { name: 'Chablis', region: 'Bourgogne', description: 'Chardonnay pur et minéral, élevé sans bois.' },
  'champagne-brut': { name: 'Champagne Brut', region: 'Champagne', description: 'La référence des bulles françaises.' },
  'saint-emilion': { name: 'Saint-Émilion', region: 'Bordeaux', description: 'Merlot dominant, vins ronds et généreux.' },
  'chateauneuf-du-pape': { name: 'Châteauneuf-du-Pape', region: 'Rhône', description: 'Assemblage puissant et complexe du Sud de la France.' },
};

export default function WinePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  console.log('WinePage rendu, slug:', slug);

  const wine = WINES[slug || ''] || {
    name: slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Vin',
    region: 'France',
    description: 'Scannez ce vin avec Sommely pour obtenir votre score personnalisé.',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#FAF9F6',
        color: '#2C1810',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#722F37',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: 20 }}
        >
          ←
        </button>
        <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: 18 }}>Sommely</span>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 20px', maxWidth: 480, margin: '0 auto' }}>
        {/* Wine name */}
        <div
          style={{
            backgroundColor: '#722F37',
            borderRadius: 16,
            padding: '24px',
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>🍷</div>
          <h1
            style={{
              color: 'white',
              fontSize: 24,
              fontWeight: 700,
              margin: '0 0 8px',
            }}
          >
            {wine.name}
          </h1>
          <span
            style={{
              backgroundColor: '#D4AF37',
              color: '#2C1810',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {wine.region}
          </span>
        </div>

        {/* Description */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            border: '1px solid #E8E0D8',
          }}
        >
          <p style={{ color: '#6B5D56', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
            {wine.description}
          </p>
        </div>

        {/* CTA Principal */}
        <button
          onClick={() => navigate('/scan')}
          style={{
            width: '100%',
            backgroundColor: '#722F37',
            color: 'white',
            border: 'none',
            borderRadius: 14,
            padding: '16px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 12,
          }}
        >
          🍷 Scanner ce vin — Score gratuit
        </button>

        {/* CTA Secondaire */}
        <button
          onClick={() => navigate('/premium')}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            color: '#722F37',
            border: '2px solid #722F37',
            borderRadius: 14,
            padding: '14px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Essai gratuit 7 jours — Sans carte bancaire
        </button>

        {/* SEO text */}
        <p
          style={{
            color: '#9E9E9E',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 24,
            lineHeight: 1.5,
          }}
        >
          Sommely analyse {wine.name} selon VOS goûts.
          <br />
          Pas le score générique de 2 millions d'inconnus.
        </p>
      </div>
    </div>
  );
}
