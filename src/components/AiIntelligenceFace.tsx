import React, { useState } from 'react';

export type AiFaceVariant = 'avatar' | 'badge' | 'card' | 'laptop' | 'bubble';
export type AiFaceMood = 'happy' | 'thinking' | 'analyzing' | 'speaking' | 'idle';

interface AiIntelligenceFaceProps {
  variant?: AiFaceVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  mood?: AiFaceMood;
  showStatusDot?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
  interactive?: boolean;
}

/**
 * Radar 365 / NiXant AI Intelligence Mascot Face:
 * The signature Panda in round yellow glasses & yellow hoodie.
 * Tries loading the user-provided 3D render asset first;
 * gracefully falls back to the high-fidelity animated SVG character.
 */
export const AiIntelligenceFace: React.FC<AiIntelligenceFaceProps> = ({
  variant = 'avatar',
  size = 'md',
  mood = 'idle',
  showStatusDot = true,
  className = '',
  onClick,
  title = 'Radar AI • Portfolio Intelligence',
  interactive = true
}) => {
  const [imageError, setImageError] = useState(false);
  const [laptopImageError, setLaptopImageError] = useState(false);

  // Pixel dimension map
  const sizeMap = {
    xs: { px: 24, ring: 'ring-1' },
    sm: { px: 32, ring: 'ring-1.5' },
    md: { px: 44, ring: 'ring-2' },
    lg: { px: 64, ring: 'ring-2' },
    xl: { px: 96, ring: 'ring-3' }
  };

  const { px, ring } = sizeMap[size];

  // Render High-Fidelity SVG Vector of the Yellow-Glasses Yellow-Hoodie Panda
  const renderPandaSvg = (isWorkingOnLaptop = false) => {
    const isThinking = mood === 'thinking' || mood === 'analyzing';

    if (isWorkingOnLaptop) {
      return (
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-md select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <radialGradient id="panda-bg-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFC600" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#FFC600" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hoodie-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD426" />
              <stop offset="100%" stopColor="#E5A700" />
            </linearGradient>
            <linearGradient id="laptop-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#94A3B8" />
            </linearGradient>
            <filter id="soft-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Ambient glow */}
          <circle cx="100" cy="100" r="95" fill="url(#panda-bg-glow)" />

          {/* Ground shadow */}
          <ellipse cx="100" cy="180" rx="65" ry="10" fill="#000000" fillOpacity="0.12" />

          {/* Black Feet */}
          <ellipse cx="65" cy="165" rx="22" ry="14" fill="#1E2229" transform="rotate(-15 65 165)" />
          <ellipse cx="135" cy="165" rx="22" ry="14" fill="#1E2229" transform="rotate(15 135 165)" />
          {/* Foot pads */}
          <ellipse cx="63" cy="164" rx="10" ry="7" fill="#333A45" transform="rotate(-15 63 164)" />
          <ellipse cx="137" cy="164" rx="10" ry="7" fill="#333A45" transform="rotate(15 137 164)" />

          {/* Yellow Hoodie Body */}
          <path
            d="M 52 145 C 50 110, 68 95, 100 95 C 132 95, 150 110, 148 145 C 145 165, 128 170, 100 170 C 72 170, 55 165, 52 145 Z"
            fill="url(#hoodie-grad)"
            filter="url(#soft-shadow)"
          />
          {/* Hoodie Pocket */}
          <path
            d="M 75 142 C 85 140, 115 140, 125 142 C 122 155, 78 155, 75 142 Z"
            fill="#D99B00"
            fillOpacity="0.6"
          />

          {/* Panda Head */}
          {/* Ears */}
          <circle cx="58" cy="46" r="22" fill="#1E2229" />
          <circle cx="58" cy="46" r="13" fill="#2D333F" />
          <circle cx="142" cy="46" r="22" fill="#1E2229" />
          <circle cx="142" cy="46" r="13" fill="#2D333F" />

          {/* White Head */}
          <ellipse cx="100" cy="74" rx="46" ry="40" fill="#FFFFFF" filter="url(#soft-shadow)" />

          {/* Black Eye Patches */}
          <ellipse cx="76" cy="72" rx="16" ry="20" fill="#1E2229" transform="rotate(-18 76 72)" />
          <ellipse cx="124" cy="72" rx="16" ry="20" fill="#1E2229" transform="rotate(18 124 72)" />

          {/* Big Warm Eyes */}
          <circle cx="80" cy="71" r="7.5" fill="#1A0F07" />
          <circle cx="82" cy="69" r="2.8" fill="#FFFFFF" />
          <circle cx="78" cy="73" r="1.2" fill="#FFFFFF" />

          <circle cx="120" cy="71" r="7.5" fill="#1A0F07" />
          <circle cx="122" cy="69" r="2.8" fill="#FFFFFF" />
          <circle cx="118" cy="73" r="1.2" fill="#FFFFFF" />

          {/* Cheeks Blush */}
          <ellipse cx="64" cy="85" rx="8" ry="5" fill="#F472B6" fillOpacity="0.4" />
          <ellipse cx="136" cy="85" rx="8" ry="5" fill="#F472B6" fillOpacity="0.4" />

          {/* Nose & Mouth */}
          <path d="M 96 82 C 97 80, 103 80, 104 82 C 105 85, 95 85, 96 82 Z" fill="#1E2229" />
          <path d="M 100 84 Q 100 90, 100 92" stroke="#1E2229" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 94 90 Q 100 95, 106 90" stroke="#1E2229" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Signature Round Yellow Eyeglasses */}
          <g className={isThinking ? 'animate-pulse' : ''}>
            {/* Left Glass Rim */}
            <circle cx="78" cy="71" r="18" stroke="#FFC600" strokeWidth="4.5" fill="none" />
            <circle cx="78" cy="71" r="18" stroke="#FFE785" strokeWidth="1.2" fill="#FFC600" fillOpacity="0.08" />
            {/* Right Glass Rim */}
            <circle cx="122" cy="71" r="18" stroke="#FFC600" strokeWidth="4.5" fill="none" />
            <circle cx="122" cy="71" r="18" stroke="#FFE785" strokeWidth="1.2" fill="#FFC600" fillOpacity="0.08" />
            {/* Glasses Bridge */}
            <path d="M 96 68 Q 100 66, 104 68" stroke="#FFC600" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            {/* Temple arms */}
            <path d="M 60 70 L 48 68" stroke="#FFC600" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 140 70 L 152 68" stroke="#FFC600" strokeWidth="3.5" strokeLinecap="round" />
          </g>

          {/* Hoodie Drawstrings */}
          <path d="M 91 106 Q 90 120, 89 128" stroke="#FFF59D" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="89" cy="129" r="2" fill="#FFF59D" />
          <path d="M 109 106 Q 110 120, 111 128" stroke="#FFF59D" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="111" cy="129" r="2" fill="#FFF59D" />

          {/* Laptop & Typing Paws */}
          <g transform="translate(0, 5)">
            {/* Laptop Base */}
            <path
              d="M 62 152 L 138 152 L 148 160 L 52 160 Z"
              fill="url(#laptop-grad)"
              stroke="#64748B"
              strokeWidth="0.8"
            />
            {/* Laptop Screen Lid */}
            <path
              d="M 68 122 L 132 122 L 138 152 L 62 152 Z"
              fill="#E2E8F0"
              stroke="#94A3B8"
              strokeWidth="1"
            />
            {/* Yellow 'Z' / Lightning Logo on Laptop lid */}
            <path
              d="M 97 131 L 104 131 L 96 142 L 105 142"
              stroke="#FFC600"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Black Panda Paws typing on keys */}
            <ellipse cx="67" cy="148" rx="9" ry="6" fill="#1E2229" transform="rotate(-10 67 148)" />
            <ellipse cx="133" cy="148" rx="9" ry="6" fill="#1E2229" transform="rotate(10 133 148)" />
          </g>
        </svg>
      );
    }

    // Default Portrait Headshot
    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="face-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFC600" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFC600" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="hoodie-grad-face" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFC600" />
            <stop offset="100%" stopColor="#D99B00" />
          </linearGradient>
        </defs>

        {/* Ambient background aura */}
        <circle cx="50" cy="50" r="48" fill="url(#face-glow)" />

        {/* Yellow Hoodie Shoulders */}
        <path
          d="M 12 96 C 18 78, 32 74, 50 74 C 68 74, 82 78, 88 96 Z"
          fill="url(#hoodie-grad-face)"
        />
        {/* Drawstrings */}
        <path d="M 44 82 L 44 94" stroke="#FFF59D" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 56 82 L 56 94" stroke="#FFF59D" strokeWidth="1.8" strokeLinecap="round" />

        {/* Black Ears */}
        <circle cx="26" cy="26" r="14" fill="#1E2229" />
        <circle cx="26" cy="26" r="8" fill="#2E3440" />
        <circle cx="74" cy="26" r="14" fill="#1E2229" />
        <circle cx="74" cy="26" r="8" fill="#2E3440" />

        {/* White Fluffy Head */}
        <ellipse cx="50" cy="46" rx="35" ry="30" fill="#FFFFFF" />

        {/* Black Eye Patches */}
        <ellipse cx="34" cy="44" rx="12" ry="14" fill="#1E2229" transform="rotate(-16 34 44)" />
        <ellipse cx="66" cy="44" rx="12" ry="14" fill="#1E2229" transform="rotate(16 66 44)" />

        {/* Sparkly Eyes */}
        <circle cx="37" cy="43" r="5.2" fill="#111111" />
        <circle cx="38.5" cy="41.5" r="2" fill="#FFFFFF" />
        <circle cx="35.5" cy="44.5" r="0.9" fill="#FFFFFF" />

        <circle cx="63" cy="43" r="5.2" fill="#111111" />
        <circle cx="64.5" cy="41.5" r="2" fill="#FFFFFF" />
        <circle cx="61.5" cy="44.5" r="0.9" fill="#FFFFFF" />

        {/* Rosy Blush */}
        <ellipse cx="25" cy="54" rx="6" ry="3.5" fill="#F472B6" fillOpacity="0.45" />
        <ellipse cx="75" cy="54" rx="6" ry="3.5" fill="#F472B6" fillOpacity="0.45" />

        {/* Nose & Smile */}
        <path d="M 47 51 C 48 49, 52 49, 53 51 C 54 53, 46 53, 47 51 Z" fill="#1E2229" />
        <path d="M 50 52.5 L 50 54.5" stroke="#1E2229" strokeWidth="1.2" strokeLinecap="round" />
        <path
          d="M 44 55 Q 50 59, 56 55"
          stroke="#1E2229"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Tongue smile */}
        <path d="M 47 56.5 Q 50 58.5, 53 56.5 Z" fill="#FB7185" />

        {/* Round Yellow Eyeglasses */}
        <g className={isThinking ? 'animate-pulse' : ''}>
          <circle cx="35" cy="43" r="13" stroke="#FFC600" strokeWidth="3.2" fill="#FFC600" fillOpacity="0.08" />
          <circle cx="65" cy="43" r="13" stroke="#FFC600" strokeWidth="3.2" fill="#FFC600" fillOpacity="0.08" />
          <path d="M 48 41 Q 50 39.5, 52 41" stroke="#FFC600" strokeWidth="3.2" strokeLinecap="round" fill="none" />
          <path d="M 22 42 L 14 41" stroke="#FFC600" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 78 42 L 86 41" stroke="#FFC600" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  };

  // Status indicator ring/color
  const statusColor =
    mood === 'thinking' || mood === 'analyzing'
      ? 'bg-amber-400 animate-ping'
      : mood === 'speaking'
      ? 'bg-emerald-400 animate-pulse'
      : 'bg-emerald-500';

  // --------------------------------------------------------------------------
  // VARIANT: LAPTOP / DESK (FULL INTELLIGENCE ANALYST)
  // --------------------------------------------------------------------------
  if (variant === 'laptop') {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className} ${
          interactive ? 'cursor-pointer group' : ''
        }`}
        onClick={onClick}
        title={title}
      >
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
          {!laptopImageError ? (
            <img
              src="0623c81d-568e-4e87-a747-bf4f44219e10.png"
              alt="Radar AI Intelligence Analyst Panda"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain filter drop-shadow-xl group-hover:scale-105 transition-transform duration-300"
              onError={() => setLaptopImageError(true)}
            />
          ) : (
            <div className="w-full h-full p-2 group-hover:scale-105 transition-transform duration-300">
              {renderPandaSvg(true)}
            </div>
          )}

          {/* Thinking overlay */}
          {(mood === 'thinking' || mood === 'analyzing') && (
            <div className="absolute top-2 right-2 bg-[#111111]/90 backdrop-blur-md border border-[#FFC600]/50 text-[#FFC600] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-bounce">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC600] animate-ping" />
              <span>Analyzing...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VARIANT: CARD BADGE (WITH TITLE & STATUS)
  // --------------------------------------------------------------------------
  if (variant === 'card') {
    return (
      <div
        className={`flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm hover:border-[#FFC600]/40 transition-all ${className} ${
          interactive ? 'cursor-pointer hover:-translate-y-0.5' : ''
        }`}
        onClick={onClick}
        title={title}
      >
        <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-b from-[#1E2229] to-[#0A0D12] ring-2 ring-[#FFC600]/40 flex items-center justify-center shadow-md">
          {!imageError ? (
            <img
              src="f5d5d23f-c933-47a9-8a53-511364ddc334.png"
              alt="Radar AI Face"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            renderPandaSvg(false)
          )}
          {showStatusDot && (
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#111111]" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text)] truncate">Radar AI Face</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30">
              Active
            </span>
          </div>
          <span className="text-[10px] text-[var(--muted)] truncate">
            {mood === 'thinking' ? 'Crunching GMV variance...' : 'Portfolio Intelligence Copilot'}
          </span>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VARIANT: SPEECH BUBBLE / PROMPT HERO
  // --------------------------------------------------------------------------
  if (variant === 'bubble') {
    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-2xl bg-gradient-to-r from-[var(--panel)] to-[#FFC600]/5 border border-[#FFC600]/30 shadow-md ${className} ${
          interactive ? 'cursor-pointer hover:border-[#FFC600]/60' : ''
        }`}
        onClick={onClick}
      >
        <div className="relative flex-shrink-0 w-11 h-11 rounded-xl overflow-hidden bg-[#111111] ring-2 ring-[#FFC600]/50 shadow-md flex items-center justify-center">
          {!imageError ? (
            <img
              src="f5d5d23f-c933-47a9-8a53-511364ddc334.png"
              alt="Radar AI Mascot"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            renderPandaSvg(false)
          )}
          <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-1.5 ring-[#111111]" />
        </div>
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text)]">
            <span>Radar AI Intelligence</span>
            <span className="text-[9px] text-[#FFC600] bg-[#FFC600]/10 px-1.5 py-0.5 rounded border border-[#FFC600]/20">
              NiXant OS
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
            Tap to analyze churn risk across July, August & September.
          </p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // DEFAULT VARIANT: AVATAR / ICON (HEADER, CHAT, ROW BUTTON)
  // --------------------------------------------------------------------------
  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 ${className} ${
        interactive ? 'cursor-pointer group hover:scale-105 transition-transform duration-150' : ''
      }`}
      onClick={onClick}
      title={title}
      style={{ width: px, height: px }}
    >
      <div
        className={`w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#1E2229] to-[#0B0D11] ${ring} ring-[#FFC600]/50 group-hover:ring-[#FFC600] shadow-sm flex items-center justify-center transition-all duration-200`}
      >
        {!imageError ? (
          <img
            src="f5d5d23f-c933-47a9-8a53-511364ddc334.png"
            alt="Radar AI Face"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover select-none"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full p-0.5">{renderPandaSvg(false)}</div>
        )}
      </div>

      {showStatusDot && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-1.5 ring-[var(--panel-solid)] ${statusColor}`}
          style={{
            width: Math.max(7, Math.round(px * 0.22)),
            height: Math.max(7, Math.round(px * 0.22))
          }}
        />
      )}
    </div>
  );
};
