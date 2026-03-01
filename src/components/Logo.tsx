interface LogoProps {
  variant?: 'default' | 'white';
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({ variant = 'default', size = 32, className = '', showText = false }: LogoProps) {
  const isWhite = variant === 'white';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/Logo%20Sommely.jpeg"
        alt="Sommely"
        width={size}
        height={size}
        className="object-contain"
        style={{
          filter: isWhite ? 'brightness(0) invert(1)' : 'none'
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
