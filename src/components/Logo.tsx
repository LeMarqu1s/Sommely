import { useState } from 'react';

interface LogoProps {
  variant?: 'default' | 'white';
  size?: number;
  className?: string;
  showText?: boolean;
}

// Version transparente pour fonds clairs ET sombres (évite le carré blanc)
const LOGO_PNG = '/IMG_1639-transparent.png';
const LOGO_FALLBACK = '/Logo%20Sommely.jpeg';

export function Logo({ variant = 'default', size = 32, className = '', showText = false }: LogoProps) {
  const isWhite = variant === 'white';
  const [src, setSrc] = useState(LOGO_PNG);

  const handleError = () => setSrc(LOGO_FALLBACK);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={src}
        alt="Sommely"
        width={size}
        height={size}
        className="object-contain flex-shrink-0"
        onError={handleError}
        style={{
          // Fond clair (default) : logo bordeaux visible, multiply retire le fond blanc du PNG
          mixBlendMode: isWhite ? undefined : 'multiply',
          // Fond sombre (white) : logo blanc
          filter: isWhite ? 'brightness(0) invert(1)' : undefined,
          minWidth: size,
          minHeight: size,
        }}
      />

      {showText && (
        <span className={`font-display font-bold text-2xl ${isWhite ? 'text-white' : 'text-burgundy-dark'}`}>
          Sommely
        </span>
      )}
    </div>
  );
}
