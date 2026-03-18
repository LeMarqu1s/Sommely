import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler(req) {
  const { searchParams } = new URL(req.url);
  const wine = searchParams.get('wine') || 'Vin inconnu';
  const score = searchParams.get('score') || '—';
  const region = searchParams.get('region') || '';
  const type = searchParams.get('type') || '';
  const year = searchParams.get('year') || '';
  const scoreNum = parseInt(score, 10);
  const scoreColor = scoreNum >= 85 ? '#2E7D32' : scoreNum >= 70 ? '#F57C00' : scoreNum >= 50 ? '#1976D2' : '#C62828';
  const scoreLabel = scoreNum >= 85 ? 'Coup de cœur' : scoreNum >= 70 ? 'Excellent' : scoreNum >= 50 ? 'Correct' : 'Pas mon style';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #2C1810 0%, #1a0508 50%, #0d0608 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(212,175,55,0.2)',
              border: '1px solid rgba(212,175,55,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            🍷
          </div>
          <span
            style={{
              color: 'rgba(212,175,55,0.9)',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Sommely
          </span>
        </div>
        <div
          style={{
            fontSize: '52px',
            fontWeight: 900,
            color: '#FAF9F6',
            lineHeight: 1.1,
            marginBottom: '8px',
            maxWidth: '700px',
            display: 'flex',
          }}
        >
          {wine}
          {year ? ` · ${year}` : ''}
        </div>
        {region && (
          <div
            style={{
              fontSize: '22px',
              color: 'rgba(250,249,246,0.55)',
              marginBottom: '40px',
              display: 'flex',
            }}
          >
            📍 {region}
            {type ? ` · ${type}` : ''}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span
              style={{
                fontSize: '96px',
                fontWeight: 900,
                color: scoreColor,
                lineHeight: 1,
                display: 'flex',
              }}
            >
              {score}
            </span>
            <span
              style={{
                fontSize: '32px',
                color: 'rgba(250,249,246,0.4)',
                display: 'flex',
              }}
            >
              /100
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                background: scoreColor,
                borderRadius: '999px',
                padding: '8px 20px',
                fontSize: '18px',
                fontWeight: 700,
                color: 'white',
                display: 'flex',
              }}
            >
              {scoreLabel}
            </div>
            <div
              style={{
                fontSize: '16px',
                color: 'rgba(250,249,246,0.4)',
                display: 'flex',
              }}
            >
              Score personnalisé Sommely
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            right: '80px',
            fontSize: '18px',
            color: 'rgba(212,175,55,0.6)',
            display: 'flex',
          }}
        >
          sommely.shop
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
