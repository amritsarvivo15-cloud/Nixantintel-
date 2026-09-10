import React from 'react';

export interface RadarLogoProps {
  variant?: 'horizontal' | 'stacked' | 'icon' | 'app-icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'dark' | 'light';
  animated?: boolean;
  className?: string;
}

/**
 * Authentic Radar 365 Geometric Radar Mark
 * Handcrafted to match the official brand identity sheet:
 * - Concentric radar target rings
 * - Vibrant gold (#FFC600) inner arcs and sensor beam at 45°
 * - Outer tracking ring with open beam exit
 * - Radar blip indicators
 */
export const RadarMark: React.FC<{
  size?: number;
  theme?: 'dark' | 'light';
  animated?: boolean;
  className?: string;
}> = ({ size = 40, theme = 'dark', animated = false, className = '' }) => {
  const outerColor = theme === 'light' ? '#111111' : '#FFFFFF';
  const gold = '#FFC600';

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Subtle animated radar sweep gradient if animated is true */}
        {animated && (
          <g className="origin-center animate-[spin_4s_linear_infinite]">
            <path
              d="M 50 50 L 80 20 A 42 42 0 0 0 50 8 Z"
              fill="url(#radar-sweep-grad)"
              opacity="0.28"
            />
            <defs>
              <linearGradient id="radar-sweep-grad" x1="50" y1="50" x2="80" y2="20">
                <stop offset="0%" stopColor={gold} stopOpacity="0" />
                <stop offset="100%" stopColor={gold} stopOpacity="0.45" />
              </linearGradient>
            </defs>
          </g>
        )}

        {/* Outer Ring (White/Dark with gap for the 45° sensor beam) */}
        {/* Arc radius 38, from angle ~68° around to ~22° */}
        <path
          d="M 64.2 85.2 A 38 38 0 1 1 85.2 64.2"
          stroke={outerColor}
          strokeWidth="3.6"
          strokeLinecap="round"
        />

        {/* Outer Ring small segment or accent blip */}
        <path
          d="M 86.8 40 A 38 38 0 0 0 76.9 23.1"
          stroke={outerColor}
          strokeWidth="3.6"
          strokeLinecap="round"
          opacity="0.95"
        />

        {/* Middle Arc (Gold #FFC600, radius 26) */}
        <path
          d="M 32 30 A 26 26 0 1 0 68.4 68.4"
          stroke={gold}
          strokeWidth="3.4"
          strokeLinecap="round"
        />

        {/* Middle arc accent blip dot on the right perimeter */}
        <circle cx="76" cy="50" r="2.4" fill={gold} />
        {/* Lower right outer blip dot */}
        <circle cx="82" cy="62" r="2.2" fill={gold} />

        {/* Inner Arc (Gold #FFC600, radius 15) */}
        <path
          d="M 40 38.5 A 15 15 0 1 0 60.6 60.6"
          stroke={gold}
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Scanner Needle / Sensor Beam at ~45° */}
        {/* Beam shaft extending to the outer perimeter */}
        <line
          x1="50"
          y1="50"
          x2="73"
          y2="27"
          stroke={gold}
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Sensor Bulb / Circular Head at tip of beam */}
        <circle
          cx="77"
          cy="23"
          r="6.2"
          fill={gold}
          className={animated ? 'animate-pulse' : ''}
        />

        {/* Center core target dot */}
        <circle cx="50" cy="50" r="4.2" fill={outerColor} />
        <circle cx="50" cy="50" r="1.6" fill={theme === 'light' ? '#ffffff' : '#111111'} />
      </svg>
    </div>
  );
};

/**
 * Official App Icon / Squircle Variant
 * Features the signature black (#111111) rounded squircle and radar mark
 */
export const RadarAppIcon: React.FC<{
  size?: number;
  bg?: 'dark' | 'gold' | 'white';
  className?: string;
}> = ({ size = 44, bg = 'dark', className = '' }) => {
  const bgStyles = {
    dark: 'bg-[#111111] border border-white/10 shadow-lg shadow-black/40',
    gold: 'bg-[#FFC600] border border-[#FFC600] shadow-md shadow-[#FFC600]/30',
    white: 'bg-white border border-slate-200 shadow-md',
  };

  const markTheme = bg === 'white' ? 'light' : 'dark';

  return (
    <div
      className={`rounded-[22%] flex items-center justify-center overflow-hidden transition-transform hover:scale-105 ${bgStyles[bg]} ${className}`}
      style={{ width: size, height: size }}
      title="Radar 365 App Icon"
    >
      <RadarMark size={Math.round(size * 0.72)} theme={markTheme} />
    </div>
  );
};

/**
 * Radar 365 Brand Logo Component
 * Supports Horizontal Lockup (primary), Stacked Lockup, and Icon Only.
 */
export const RadarLogo: React.FC<RadarLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  theme = 'dark',
  animated = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { markSize: 28, titleSize: 'text-base', subSize: 'text-[9.5px]', gap: 'gap-2.5' },
    md: { markSize: 38, titleSize: 'text-xl', subSize: 'text-[11px]', gap: 'gap-3' },
    lg: { markSize: 48, titleSize: 'text-2xl sm:text-3xl', subSize: 'text-xs sm:text-sm', gap: 'gap-3.5' },
    xl: { markSize: 64, titleSize: 'text-3xl sm:text-4xl', subSize: 'text-sm sm:text-base', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size];
  const textColor = theme === 'light' ? 'text-[#111111]' : 'text-white';
  const subtextColor = theme === 'light' ? 'text-[#6B6B6B]' : 'text-[#A3A3A3]';

  if (variant === 'icon') {
    return <RadarMark size={currentSize.markSize} theme={theme} animated={animated} className={className} />;
  }

  if (variant === 'app-icon') {
    return <RadarAppIcon size={currentSize.markSize + 6} className={className} />;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        <RadarMark size={currentSize.markSize * 1.3} theme={theme} animated={animated} />
        <div className="mt-2">
          <div className="flex items-baseline justify-center gap-1 font-extrabold tracking-tight">
            <span className={`${textColor} ${currentSize.titleSize} font-extrabold`}>Radar</span>
            <span className={`text-[#FFC600] ${currentSize.titleSize} font-extrabold`}>365</span>
          </div>
          <div className={`${subtextColor} ${currentSize.subSize} tracking-wide font-medium mt-0.5`}>
            by <strong className={textColor}>Ni</strong>
            <strong className="text-[#FFC600]">Xant</strong> Intelligence OS
          </div>
        </div>
      </div>
    );
  }

  // Horizontal lockup (default)
  return (
    <div className={`flex items-center ${currentSize.gap} select-none ${className}`}>
      <RadarMark size={currentSize.markSize} theme={theme} animated={animated} />
      <div className="leading-none">
        <div className="flex items-baseline gap-1 font-extrabold tracking-tight leading-none">
          <span className={`${textColor} ${currentSize.titleSize} font-black`}>Radar</span>
          <span className={`text-[#FFC600] ${currentSize.titleSize} font-black`}>365</span>
        </div>
        <div className={`${subtextColor} ${currentSize.subSize} font-medium tracking-normal mt-1 leading-none`}>
          by <span className={textColor}>Ni</span>
          <span className="text-[#FFC600] font-bold">Xant</span> Intelligence OS
        </div>
      </div>
    </div>
  );
};
