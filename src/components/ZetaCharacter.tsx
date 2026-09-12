import React from 'react';

export type ZetaState =
  | 'default'
  | 'thinking'
  | 'research'
  | 'risk'
  | 'opportunity'
  | 'success'
  | 'empty';

export type ZetaSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ZetaCharacterProps {
  state?: ZetaState;
  size?: ZetaSize;
  showStatusDot?: boolean;
  interactive?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
  withSpeech?: string;
  speechPosition?: 'top' | 'right';
}

const SIZE_MAP: Record<ZetaSize, { px: number; ring: string; text: string }> = {
  xs: { px: 28, ring: 'ring-1 sm:ring-1.5', text: 'text-[9px]' },
  sm: { px: 36, ring: 'ring-1.5', text: 'text-[10px]' },
  md: { px: 46, ring: 'ring-2', text: 'text-xs' },
  lg: { px: 64, ring: 'ring-2', text: 'text-sm' },
  xl: { px: 96, ring: 'ring-2', text: 'text-base' },
  '2xl': { px: 130, ring: 'ring-4', text: 'text-lg' }
};

/**
 * Zeta: Official AI Copilot Mascot for Radar365.
 * Features:
 * - Friendly 3D panda with white & charcoal fur and spherical depth
 * - Signature thick circular yellow glasses (#FFC600) with glossy sheen
 * - Radar365 yellow hoodie with hood drawstrings
 * - Small black "Z" badge on chest
 * - Multi-state support: default, thinking, research, risk, opportunity, success, empty
 */
export const ZetaCharacter: React.FC<ZetaCharacterProps> = ({
  state = 'default',
  size = 'md',
  showStatusDot = false,
  interactive = false,
  className = '',
  onClick,
  title = 'Zeta • Radar365 AI Intelligence Copilot',
  withSpeech,
  speechPosition = 'right'
}) => {
  const { px, ring } = SIZE_MAP[size] || SIZE_MAP.md;

  const isThinking = state === 'thinking';
  const isResearch = state === 'research';
  const isRisk = state === 'risk';
  const isOpportunity = state === 'opportunity';
  const isSuccess = state === 'success';
  const isEmpty = state === 'empty';

  // Status dot color depending on state
  const statusBg =
    isRisk
      ? 'bg-rose-500 ring-rose-300'
      : isThinking
      ? 'bg-amber-400 animate-ping'
      : isOpportunity
      ? 'bg-[#FFC600] animate-pulse'
      : 'bg-emerald-400 animate-pulse';

  const renderSvg = () => {
    return (
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full select-none overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle Ambient Radial Glow */}
          <radialGradient id={`zeta-ambient-${state}`} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#FFC600" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFC600" stopOpacity="0" />
          </radialGradient>

          {/* 3D Shading for Yellow Hoodie */}
          <linearGradient id={`zeta-hoodie-grad-${state}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE566" />
            <stop offset="35%" stopColor="#FFC600" />
            <stop offset="80%" stopColor="#D99400" />
            <stop offset="100%" stopColor="#996300" />
          </linearGradient>

          {/* 3D Fur Shading for White Face (Light from top-left) */}
          <radialGradient id={`zeta-head-grad-${state}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F8FAFC" />
            <stop offset="80%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </radialGradient>

          {/* 3D Shading for Charcoal Ears */}
          <radialGradient id={`zeta-ear-grad-${state}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#2E384A" />
            <stop offset="60%" stopColor="#181E29" />
            <stop offset="100%" stopColor="#0D1117" />
          </radialGradient>

          {/* Inner Ear Warm Velvet Shading */}
          <radialGradient id={`zeta-ear-inner-${state}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#55444D" />
            <stop offset="70%" stopColor="#362C32" />
            <stop offset="100%" stopColor="#1E171B" />
          </radialGradient>

          {/* Eye Patch 3D Shading */}
          <radialGradient id={`zeta-eyepatch-grad-${state}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#252D3A" />
            <stop offset="75%" stopColor="#151A22" />
            <stop offset="100%" stopColor="#0B0E14" />
          </radialGradient>

          {/* 3D Yellow Glasses Frame Gradient */}
          <linearGradient id={`zeta-glasses-frame-${state}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF48A" />
            <stop offset="25%" stopColor="#FFC600" />
            <stop offset="70%" stopColor="#E09900" />
            <stop offset="100%" stopColor="#9E6800" />
          </linearGradient>

          {/* Glasses Lens Sheen Reflection */}
          <linearGradient id={`zeta-lens-sheen-${state}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="55%" stopColor="#FFC600" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFC600" stopOpacity="0.01" />
          </linearGradient>

          {/* Soft Drop Shadow for Depth */}
          <filter id={`zeta-shadow-${state}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2.5" stdDeviation="2" floodColor="#0A0F1D" floodOpacity="0.3" />
          </filter>

          {/* Soft Blur for Blush */}
          <filter id={`zeta-blur-${state}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {/* Ambient Halo Glow */}
        <circle cx="60" cy="56" r="54" fill={`url(#zeta-ambient-${state})`} />

        {/* ============================================================ */}
        {/* 1. HOODIE BODY & CHEST                                       */}
        {/* ============================================================ */}
        <path
          d="M 18 116 C 24 92, 38 84, 60 84 C 82 84, 96 92, 102 116 Z"
          fill={`url(#zeta-hoodie-grad-${state})`}
          filter={`url(#zeta-shadow-${state})`}
        />

        {/* Hoodie Shoulder Highlight */}
        <path
          d="M 28 102 C 34 89, 46 86, 60 86 C 74 86, 86 89, 92 102"
          stroke="#FFF099"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Hoodie Collar Fold */}
        <path
          d="M 38 85 C 48 94, 72 94, 82 85 C 76 98, 44 98, 38 85 Z"
          fill="#A36B00"
          fillOpacity="0.45"
        />

        {/* Drawstrings */}
        <path d="M 52 92 L 51 106" stroke="#FFFDE7" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="51" cy="107" r="1.8" fill="#FFC600" stroke="#FFFDE7" strokeWidth="0.8" />
        <path d="M 68 92 L 69 106" stroke="#FFFDE7" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="69" cy="107" r="1.8" fill="#FFC600" stroke="#FFFDE7" strokeWidth="0.8" />

        {/* ============================================================ */}
        {/* OFFICIAL BLACK "Z" BADGE ON HOODIE CHEST                     */}
        {/* ============================================================ */}
        <g transform="translate(52.5, 97.5)">
          {/* Black Rounded Rect Badge with Metallic Gold Rim */}
          <rect
            x="0"
            y="0"
            width="15"
            height="15"
            rx="4"
            fill="#0F131A"
            stroke="#FFC600"
            strokeWidth="0.9"
            filter={`url(#zeta-shadow-${state})`}
          />
          {/* Yellow "Z" Letter */}
          <path
            d="M 4 4 L 11 4 L 4.8 11 L 11 11"
            stroke="#FFC600"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* ============================================================ */}
        {/* 2. PANDA HEAD & EARS                                         */}
        {/* ============================================================ */}
        {/* Left Ear */}
        <circle
          cx="33"
          cy="28"
          r="15"
          fill={`url(#zeta-ear-grad-${state})`}
          filter={`url(#zeta-shadow-${state})`}
        />
        <circle cx="33" cy="28" r="8.5" fill={`url(#zeta-ear-inner-${state})`} />
        {/* Left Ear Rim Highlight */}
        <path d="M 22 25 A 15 15 0 0 1 38 15" stroke="#4A5568" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

        {/* Right Ear */}
        <circle
          cx="87"
          cy="28"
          r="15"
          fill={`url(#zeta-ear-grad-${state})`}
          filter={`url(#zeta-shadow-${state})`}
        />
        <circle cx="87" cy="28" r="8.5" fill={`url(#zeta-ear-inner-${state})`} />
        {/* Right Ear Rim Highlight */}
        <path d="M 82 15 A 15 15 0 0 1 98 25" stroke="#4A5568" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />

        {/* Fluffy 3D White Head */}
        <ellipse
          cx="60"
          cy="53"
          rx="41"
          ry="35"
          fill={`url(#zeta-head-grad-${state})`}
          filter={`url(#zeta-shadow-${state})`}
        />

        {/* Black Eye Patches */}
        <ellipse
          cx="42"
          cy="51"
          rx="14"
          ry="16"
          fill={`url(#zeta-eyepatch-grad-${state})`}
          transform="rotate(-15 42 51)"
        />
        <ellipse
          cx="78"
          cy="51"
          rx="14"
          ry="16"
          fill={`url(#zeta-eyepatch-grad-${state})`}
          transform="rotate(15 78 51)"
        />

        {/* Rosy Cheeks Blush */}
        <ellipse
          cx="31"
          cy="64"
          rx="7.5"
          ry="4.5"
          fill="#FB7185"
          fillOpacity="0.4"
          filter={`url(#zeta-blur-${state})`}
        />
        <ellipse
          cx="89"
          cy="64"
          rx="7.5"
          ry="4.5"
          fill="#FB7185"
          fillOpacity="0.4"
          filter={`url(#zeta-blur-${state})`}
        />

        {/* 3D Elevated Snout Muzzle */}
        <ellipse
          cx="60"
          cy="62"
          rx="16"
          ry="11"
          fill="#FFFFFF"
          filter={`url(#zeta-shadow-${state})`}
        />

        {/* Lively Eyes (with Iris depth) */}
        <circle cx="45" cy="50" r="6.2" fill="#0C1017" />
        <circle cx="45" cy="50" r="5.2" fill="#3D2617" />
        <circle cx="45" cy="50" r="3.6" fill="#090D13" />
        {/* Specular Catchlights */}
        <circle cx="47" cy="48" r="2.2" fill="#FFFFFF" />
        <circle cx="43.5" cy="52" r="1.1" fill="#FFFFFF" />

        <circle cx="75" cy="50" r="6.2" fill="#0C1017" />
        <circle cx="75" cy="50" r="5.2" fill="#3D2617" />
        <circle cx="75" cy="50" r="3.6" fill="#090D13" />
        {/* Specular Catchlights */}
        <circle cx="77" cy="48" r="2.2" fill="#FFFFFF" />
        <circle cx="73.5" cy="52" r="1.1" fill="#FFFFFF" />

        {/* Snout: 3D Cute Nose & Mouth */}
        <path
          d="M 56.5 59 C 57.5 57, 62.5 57, 63.5 59 C 64.5 61.5, 55.5 61.5, 56.5 59 Z"
          fill="#131822"
        />
        <circle cx="59" cy="58.5" r="0.8" fill="#FFFFFF" opacity="0.8" />
        <path d="M 60 61 L 60 63.5" stroke="#131822" strokeWidth="1.6" strokeLinecap="round" />

        {/* Expression Mouth depending on State */}
        {isSuccess || isOpportunity ? (
          // Big Happy Open Smile
          <path
            d="M 53 64 Q 60 72, 67 64 Z"
            fill="#FB7185"
            stroke="#131822"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        ) : isRisk ? (
          // Mildly concerned mouth
          <path
            d="M 54 67 Q 60 64, 66 67"
            stroke="#131822"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        ) : (
          // Warm Friendly Smile
          <path
            d="M 53 63.5 Q 60 68.5, 67 63.5"
            stroke="#131822"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* ============================================================ */}
        {/* 3. SIGNATURE ROUND 3D YELLOW GLASSES (#FFC600)               */}
        {/* ============================================================ */}
        <g className={isThinking ? 'animate-pulse' : ''}>
          {/* Left Round Frame (Tubular 3D Bevel) */}
          <circle
            cx="43"
            cy="50"
            r="16"
            stroke={`url(#zeta-glasses-frame-${state})`}
            strokeWidth="3.8"
            fill={`url(#zeta-lens-sheen-${state})`}
            filter={`url(#zeta-shadow-${state})`}
          />
          {/* Left Frame Inner Bevel Highlight */}
          <circle cx="43" cy="50" r="16.5" stroke="#FFF699" strokeWidth="0.8" opacity="0.6" fill="none" />
          {/* Left Lens Specular Highlight Streak */}
          <path
            d="M 33 43 Q 41 36, 49 43"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.65"
          />

          {/* Right Round Frame (Tubular 3D Bevel) */}
          <circle
            cx="77"
            cy="50"
            r="16"
            stroke={`url(#zeta-glasses-frame-${state})`}
            strokeWidth="3.8"
            fill={`url(#zeta-lens-sheen-${state})`}
            filter={`url(#zeta-shadow-${state})`}
          />
          {/* Right Frame Inner Bevel Highlight */}
          <circle cx="77" cy="50" r="16.5" stroke="#FFF699" strokeWidth="0.8" opacity="0.6" fill="none" />
          {/* Right Lens Specular Highlight Streak */}
          <path
            d="M 67 43 Q 75 36, 83 43"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.65"
          />

          {/* 3D Glasses Bridge */}
          <path
            d="M 59 48 Q 60 46, 61 48"
            stroke={`url(#zeta-glasses-frame-${state})`}
            strokeWidth="3.8"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 59.2 47.2 Q 60 45.8, 60.8 47.2"
            stroke="#FFF699"
            strokeWidth="1"
            strokeLinecap="round"
            fill="none"
            opacity="0.7"
          />

          {/* Temple arms */}
          <path d="M 27 49 L 16 47" stroke={`url(#zeta-glasses-frame-${state})`} strokeWidth="3" strokeLinecap="round" />
          <path d="M 93 49 L 104 47" stroke={`url(#zeta-glasses-frame-${state})`} strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* ============================================================ */}
        {/* 4. STATE-SPECIFIC ACCESSORIES / OVERLAYS                     */}
        {/* ============================================================ */}

        {/* THINKING: Laptop / Paws typing + data pulse */}
        {isThinking && (
          <g transform="translate(25, 82)">
            {/* Laptop Base */}
            <path d="M 12 24 L 58 24 L 66 32 L 4 32 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
            {/* Laptop Screen */}
            <path d="M 18 4 L 52 4 L 58 24 L 12 24 Z" fill="#0F172A" stroke="#475569" strokeWidth="1.2" />
            {/* Screen Content: Mini yellow radar graph */}
            <path d="M 24 16 L 30 11 L 37 14 L 46 8" stroke="#FFC600" strokeWidth="1.6" strokeLinecap="round" />
            {/* Panda Paws on Keyboard */}
            <ellipse cx="14" cy="23" rx="7" ry="4.5" fill="#181D26" transform="rotate(-8 14 23)" />
            <ellipse cx="56" cy="23" rx="7" ry="4.5" fill="#181D26" transform="rotate(8 56 23)" />
          </g>
        )}

        {/* RESEARCH: Sleek Magnifying Glass inspecting intelligence */}
        {isResearch && (
          <g transform="translate(74, 58)">
            {/* Handle */}
            <path d="M 24 24 L 36 36" stroke="#B87D00" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 24 24 L 36 36" stroke="#FFC600" strokeWidth="2.5" strokeLinecap="round" />
            {/* Lens Rim */}
            <circle cx="16" cy="16" r="13" stroke="#FFC600" strokeWidth="3" fill="#0D1524" fillOpacity="0.8" />
            {/* Inner Sparkle / Target */}
            <path d="M 11 16 L 21 16 M 16 11 L 16 21" stroke="#FFC600" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="16" cy="16" r="4" stroke="#4ADE80" strokeWidth="1.5" fill="none" />
            {/* Panda Paw holding handle */}
            <ellipse cx="28" cy="28" rx="6" ry="4" fill="#181D26" transform="rotate(-30 28 28)" />
          </g>
        )}

        {/* RISK: Subtle warning alert pill on shoulder */}
        {isRisk && (
          <g transform="translate(82, 16)">
            {/* Alert Badge */}
            <polygon
              points="14,2 26,24 2,24"
              fill="#F43F5E"
              stroke="#FFE4E6"
              strokeWidth="1.5"
              filter={`url(#zeta-shadow-${state})`}
            />
            {/* Exclamation mark */}
            <line x1="14" y1="9" x2="14" y2="16" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
            <circle cx="14" cy="20" r="1.2" fill="#FFFFFF" />
          </g>
        )}

        {/* OPPORTUNITY: Glowing Lightbulb / Upward Growth Spark */}
        {isOpportunity && (
          <g transform="translate(80, 12)">
            {/* Lightbulb Glow */}
            <circle cx="14" cy="14" r="10" fill="#FFC600" fillOpacity="0.3" className="animate-pulse" />
            {/* Bulb */}
            <path
              d="M 9 13 C 9 10, 11 7, 14 7 C 17 7, 19 10, 19 13 C 19 15, 17 16, 17 18 L 11 18 C 11 16, 9 15, 9 13 Z"
              fill="#FFD600"
              stroke="#FFFFFF"
              strokeWidth="1"
            />
            {/* Base */}
            <rect x="12" y="19" width="4" height="2" fill="#94A3B8" rx="0.5" />
            {/* Upward green trend arrow */}
            <path d="M 23 18 L 29 11 M 29 11 L 24 11 M 29 11 L 29 16" stroke="#4ADE80" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        )}

        {/* SUCCESS: Celebrating Thumbs Up & Golden Stars */}
        {isSuccess && (
          <g>
            {/* Golden Star 1 */}
            <path
              d="M 20 20 L 22 25 L 27 25 L 23 28 L 25 33 L 20 30 L 15 33 L 17 28 L 13 25 L 18 25 Z"
              fill="#FFC600"
              filter={`url(#zeta-shadow-${state})`}
            />
            {/* Golden Star 2 */}
            <path
              d="M 98 22 L 99.5 26 L 103 26 L 100 28.5 L 101.5 32.5 L 98 30 L 94.5 32.5 L 96 28.5 L 93 26 L 96.5 26 Z"
              fill="#FFC600"
            />
            {/* Thumbs Up Paw */}
            <g transform="translate(86, 70)">
              <ellipse cx="10" cy="14" rx="8" ry="6" fill="#181D26" />
              {/* Thumb Pointing Up */}
              <path d="M 6 12 C 6 6, 11 4, 13 6 C 14 8, 14 12, 14 14 Z" fill="#181D26" />
            </g>
          </g>
        )}

        {/* EMPTY STATE: Friendly Waving Paw */}
        {isEmpty && (
          <g transform="translate(86, 60)">
            {/* Waving Paw */}
            <ellipse cx="12" cy="14" rx="9" ry="7" fill="#181D26" transform="rotate(25 12 14)" />
            {/* Paw Pads */}
            <ellipse cx="12" cy="14" rx="3.5" ry="2.5" fill="#334155" />
            <circle cx="8" cy="9" r="1" fill="#334155" />
            <circle cx="12" cy="8" r="1" fill="#334155" />
            <circle cx="16" cy="9" r="1" fill="#334155" />
          </g>
        )}
      </svg>
    );
  };

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
        className={`w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-[#1E2229] to-[#0A0D12] ${ring} ring-[#FFC600]/50 group-hover:ring-[#FFC600] shadow-md flex items-center justify-center transition-all duration-200`}
      >
        <div className="w-full h-full p-0.5">{renderSvg()}</div>
      </div>

      {/* Live Status Indicator */}
      {showStatusDot && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-[var(--panel-solid)] ${statusBg}`}
          style={{
            width: Math.max(7, Math.round(px * 0.24)),
            height: Math.max(7, Math.round(px * 0.24))
          }}
        />
      )}

      {/* Optional Speech Bubble for prompts */}
      {withSpeech && (
        <div
          className={`absolute z-20 pointer-events-none whitespace-nowrap px-2.5 py-1 rounded-xl border border-[#FFC600]/40 bg-[#0F1420]/95 text-[var(--text)] font-semibold shadow-lg text-[10px] flex items-center gap-1.5 ${
            speechPosition === 'top'
              ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
              : 'left-full ml-2 top-1/2 -translate-y-1/2'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#FFC600] animate-pulse" />
          <span>{withSpeech}</span>
        </div>
      )}
    </div>
  );
};
