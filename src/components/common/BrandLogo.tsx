import React from 'react';
import { useTheme } from '../../context/ThemeContext';

export interface BrandLogoProps {
  variant?: 'full' | 'emblem' | 'horizontal' | 'compact' | 'text';
  theme?: 'dark' | 'light' | 'gold';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Watch Emblem Component: Faithful reproduction of the clock dial from the brand identity
 */
export const WatchEmblem: React.FC<{
  size?: number;
  theme?: 'dark' | 'light' | 'gold';
  className?: string;
}> = ({ size = 40, theme = 'dark', className = '' }) => {
  const isLight = theme === 'light';
  const ringColor = isLight ? '#D4AF37' : '#D4AF37';
  const tickColor = isLight ? '#1A1A1A' : '#D4AF37';
  const handColor = isLight ? '#111111' : '#F5F5F0';
  const hubColor = '#D4AF37';
  const hubBorder = isLight ? '#111111' : '#0A0A0A';

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer subtle bezel rings */}
      <circle cx="50" cy="50" r="47" stroke={ringColor} strokeWidth="2.2" />
      <circle cx="50" cy="50" r="43.5" stroke={ringColor} strokeWidth="0.75" strokeOpacity="0.6" />

      {/* 12, 3, 6, 9 Hour Index Batons */}
      <line x1="50" y1="9" x2="50" y2="19" stroke={tickColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="91" y1="50" x2="81" y2="50" stroke={tickColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="91" x2="50" y2="81" stroke={tickColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="9" y1="50" x2="19" y2="50" stroke={tickColor} strokeWidth="2" strokeLinecap="round" />

      {/* Hour hand (points towards 10 o'clock) */}
      <line x1="50" y1="50" x2="33" y2="29" stroke={handColor} strokeWidth="2.4" strokeLinecap="round" />

      {/* Minute hand (points towards 2 o'clock / 10 past) */}
      <line x1="50" y1="50" x2="74" y2="40" stroke={handColor} strokeWidth="1.9" strokeLinecap="round" />

      {/* Center pentagonal faceted pinion & pivot */}
      <polygon
        points="50,46 54,49 52.5,54 47.5,54 46,49"
        fill={hubColor}
        stroke={hubBorder}
        strokeWidth="0.75"
      />
      <circle cx="50" cy="50" r="1.2" fill={hubBorder} />
    </svg>
  );
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  theme,
  size = 'md',
  showSubtitle = true,
  className = '',
  onClick
}) => {
  let contextTheme: 'dark' | 'light' = 'dark';
  try {
    const context = useTheme();
    contextTheme = context.isLight ? 'light' : 'dark';
  } catch {
    contextTheme = 'dark';
  }
  const effectiveTheme = theme || contextTheme;
  const isLight = effectiveTheme === 'light';
  const textColor = isLight ? 'text-[#111111]' : 'text-[#F5F5F0]';
  const goldColor = 'text-[#D4AF37]';
  const subtextColor = isLight ? 'text-[#333333]' : 'text-[#D4AF37]';

  // Size mapping for emblem
  const emblemSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 52,
    xl: 68,
    '2xl': 96
  };

  // 1. EMBLEM ONLY VARIANT
  if (variant === 'emblem') {
    return (
      <div
        className={`inline-flex items-center justify-center ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        <WatchEmblem size={emblemSizes[size]} theme={theme} />
      </div>
    );
  }

  // 2. FULL VECTOR BRAND MARK (Faithful to the original artwork with the watch face in 'C')
  if (variant === 'full') {
    const fullSizes = {
      xs: 'w-36',
      sm: 'w-48',
      md: 'w-64',
      lg: 'w-80',
      xl: 'w-96',
      '2xl': 'w-full max-w-[480px]'
    };

    return (
      <div
        className={`flex flex-col items-center text-center select-none ${fullSizes[size]} ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        {/* SVG vector rendering of L'ECRIN DU TEMPS with embedded watch 'C' */}
        <svg
          viewBox="0 0 500 240"
          className="w-full h-auto drop-shadow-sm"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* L'E */}
          <text
            x="48"
            y="108"
            fill={isLight ? '#111111' : '#D4AF37'}
            fontFamily="'Cinzel', Georgia, serif"
            fontSize="84"
            fontWeight="600"
            letterSpacing="3"
          >
            L'E
          </text>

          {/* Embedded Watch Bezel 'C' */}
          <g transform="translate(225, 72)">
            {/* The 'C' curve */}
            <path
              d="M 28,-30 A 42,42 0 1,0 30,24"
              fill="none"
              stroke={isLight ? '#111111' : '#D4AF37'}
              strokeWidth="4.8"
              strokeLinecap="round"
            />
            {/* Inner gold precision dial ring */}
            <circle cx="0" cy="0" r="37" fill="none" stroke="#D4AF37" strokeWidth="1" strokeOpacity="0.8" />
            
            {/* 12, 3, 6, 9 ticks */}
            <line x1="0" y1="-37" x2="0" y2="-28" stroke={isLight ? '#111111' : '#D4AF37'} strokeWidth="1.6" strokeLinecap="round" />
            <line x1="37" y1="0" x2="28" y2="0" stroke={isLight ? '#111111' : '#D4AF37'} strokeWidth="1.6" strokeLinecap="round" />
            <line x1="0" y1="37" x2="0" y2="28" stroke={isLight ? '#111111' : '#D4AF37'} strokeWidth="1.6" strokeLinecap="round" />
            <line x1="-37" y1="0" x2="-28" y2="0" stroke={isLight ? '#111111' : '#D4AF37'} strokeWidth="1.6" strokeLinecap="round" />

            {/* Hands at 10:10 */}
            <line x1="0" y1="0" x2="-14" y2="-17" stroke={isLight ? '#111111' : '#F5F5F0'} strokeWidth="2.2" strokeLinecap="round" />
            <line x1="0" y1="0" x2="20" y2="-7" stroke={isLight ? '#111111' : '#F5F5F0'} strokeWidth="1.8" strokeLinecap="round" />

            {/* Hub */}
            <polygon points="0,-3.5 3.5,-1 2.2,3 -2.2,3 -3.5,-1" fill="#D4AF37" stroke={isLight ? '#111111' : '#0A0A0A'} strokeWidth="0.6" />
            <circle cx="0" cy="0" r="1" fill={isLight ? '#111111' : '#0A0A0A'} />
          </g>

          {/* RIN */}
          <text
            x="280"
            y="108"
            fill={isLight ? '#111111' : '#D4AF37'}
            fontFamily="'Cinzel', Georgia, serif"
            fontSize="84"
            fontWeight="600"
            letterSpacing="3"
          >
            RIN
          </text>

          {/* DU TEMPS */}
          <text
            x="250"
            y="170"
            fill={isLight ? '#111111' : '#D4AF37'}
            fontFamily="'Cinzel', Georgia, serif"
            fontSize="46"
            fontWeight="500"
            letterSpacing="12"
            textAnchor="middle"
          >
            DU TEMPS
          </text>

          {/* Golden Divider ─── ✦ ─── */}
          {showSubtitle && (
            <>
              <g transform="translate(250, 198)">
                <line x1="-110" y1="0" x2="-18" y2="0" stroke="#D4AF37" strokeWidth="1" opacity="0.85" />
                <path d="M 0,-5.5 L 2.2,-1.2 L 6.5,0 L 2.2,1.2 L 0,5.5 L -2.2,1.2 L -6.5,0 L -2.2,-1.2 Z" fill="#D4AF37" />
                <line x1="18" y1="0" x2="110" y2="0" stroke="#D4AF37" strokeWidth="1" opacity="0.85" />
              </g>

              {/* HORLOGERIE D'EXCEPTION */}
              <text
                x="250"
                y="228"
                fill={isLight ? '#222222' : '#D4AF37'}
                fontFamily="'Cinzel', Georgia, serif"
                fontSize="14.5"
                fontWeight="500"
                letterSpacing="4"
                textAnchor="middle"
              >
                HORLOGERIE D'EXCEPTION
              </text>
            </>
          )}
        </svg>
      </div>
    );
  }

  // 3. COMPACT & HORIZONTAL NAVBAR / HEADER VARIANT
  const titleSizes = {
    xs: 'text-xs sm:text-sm',
    sm: 'text-sm sm:text-base',
    md: 'text-base sm:text-lg lg:text-xl',
    lg: 'text-lg sm:text-xl lg:text-2xl',
    xl: 'text-xl sm:text-2xl lg:text-3xl',
    '2xl': 'text-2xl sm:text-3xl lg:text-4xl'
  };

  const subtitleSizes = {
    xs: 'text-[7px] tracking-[0.2em]',
    sm: 'text-[8px] tracking-[0.25em]',
    md: 'text-[8px] sm:text-[9px] tracking-[0.3em]',
    lg: 'text-[9px] sm:text-[10px] tracking-[0.35em]',
    xl: 'text-[10px] sm:text-xs tracking-[0.38em]',
    '2xl': 'text-xs sm:text-sm tracking-[0.4em]'
  };

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 select-none ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {/* Precision Watch Emblem */}
      <WatchEmblem size={emblemSizes[size]} theme={theme} />

      {/* Brand Typography */}
      <div className="flex flex-col text-left justify-center min-w-0">
        <span
          className={`font-serif font-bold tracking-[0.12em] sm:tracking-[0.14em] uppercase leading-tight whitespace-nowrap ${titleSizes[size]} ${goldColor}`}
          style={{ fontFamily: "'Cinzel', Georgia, serif" }}
        >
          L'Écrin du Temps
        </span>
        {showSubtitle && (
          <span
            className={`font-serif uppercase font-medium leading-none mt-0.5 whitespace-nowrap ${subtitleSizes[size]} ${subtextColor}`}
            style={{ fontFamily: "'Cinzel', Georgia, serif" }}
          >
            Horlogerie d'Exception
          </span>
        )}
      </div>
    </div>
  );
};
