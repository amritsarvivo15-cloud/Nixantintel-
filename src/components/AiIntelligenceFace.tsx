import React from 'react';
import { ZetaCharacter, ZetaState, ZetaSize } from './ZetaCharacter';

export type AiFaceVariant = 'avatar' | 'badge' | 'card' | 'laptop' | 'bubble';
export type AiFaceMood = 'happy' | 'thinking' | 'analyzing' | 'speaking' | 'idle' | 'research' | 'risk' | 'opportunity' | 'success' | 'empty';

export interface AiIntelligenceFaceProps {
  variant?: AiFaceVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  mood?: AiFaceMood;
  zetaState?: ZetaState;
  showStatusDot?: boolean;
  className?: string;
  onClick?: () => void;
  title?: string;
  interactive?: boolean;
  withSpeech?: string;
}

/**
 * Radar365 Zeta AI Intelligence Mascot Component.
 * Powered by ZetaCharacter (Panda with yellow glasses & hoodie with black "Z" badge).
 */
export const AiIntelligenceFace: React.FC<AiIntelligenceFaceProps> = ({
  variant = 'avatar',
  size = 'md',
  mood = 'idle',
  zetaState,
  showStatusDot = true,
  className = '',
  onClick,
  title = 'Ask Zeta • Radar365 Copilot',
  interactive = true,
  withSpeech
}) => {
  // Map mood / props to ZetaState
  const resolveState = (): ZetaState => {
    if (zetaState) return zetaState;
    if (variant === 'laptop') return 'thinking';
    switch (mood) {
      case 'thinking':
      case 'analyzing':
        return 'thinking';
      case 'research':
        return 'research';
      case 'risk':
        return 'risk';
      case 'opportunity':
      case 'speaking':
        return 'opportunity';
      case 'happy':
      case 'success':
        return 'success';
      case 'empty':
        return 'empty';
      default:
        return 'default';
    }
  };

  const state = resolveState();

  // VARIANT: LAPTOP / WORKING
  if (variant === 'laptop') {
    return (
      <div
        className={`relative inline-flex items-center justify-center ${className} ${
          interactive ? 'cursor-pointer group' : ''
        }`}
        onClick={onClick}
        title={title}
      >
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          <ZetaCharacter
            state="thinking"
            size="2xl"
            showStatusDot={showStatusDot}
            interactive={interactive}
            className="w-full h-full"
          />
          {/* Overlay badge */}
          <div className="absolute top-2 right-2 bg-[#0C111C]/90 backdrop-blur-md border border-[#FFC600]/40 text-[#FFC600] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FFC600] animate-ping" />
            <span>Analyzing GMV...</span>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: CARD BADGE
  if (variant === 'card') {
    return (
      <div
        className={`flex items-center gap-3 p-2.5 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-sm hover:border-[#FFC600]/40 transition-all ${className} ${
          interactive ? 'cursor-pointer hover:-translate-y-0.5' : ''
        }`}
        onClick={onClick}
        title={title}
      >
        <ZetaCharacter
          state={state}
          size="md"
          showStatusDot={showStatusDot}
          interactive={false}
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[var(--text)] truncate">Zeta Copilot</span>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30">
              Active
            </span>
          </div>
          <span className="text-[10px] text-[var(--muted)] truncate">
            {state === 'thinking'
              ? 'Analyzing GMV variance...'
              : state === 'risk'
              ? 'Evaluating account churn risk...'
              : 'Radar365 Revenue Intelligence'}
          </span>
        </div>
      </div>
    );
  }

  // VARIANT: SPEECH BUBBLE
  if (variant === 'bubble') {
    return (
      <div
        className={`flex items-start gap-3 p-3 rounded-2xl bg-gradient-to-r from-[var(--panel)] to-[#FFC600]/10 border border-[#FFC600]/30 shadow-md ${className} ${
          interactive ? 'cursor-pointer hover:border-[#FFC600]/60' : ''
        }`}
        onClick={onClick}
      >
        <ZetaCharacter
          state={state}
          size="sm"
          showStatusDot={true}
          interactive={false}
        />
        <div className="flex-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-[var(--text)]">
            <span>Zeta Intelligence</span>
            <span className="text-[9px] text-[#FFC600] bg-[#FFC600]/15 px-1.5 py-0.2 rounded border border-[#FFC600]/30">
              Online
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
            {withSpeech || 'Ask me anything about account trends, GMV recovery, and decision-makers.'}
          </p>
        </div>
      </div>
    );
  }

  // DEFAULT VARIANT: AVATAR
  return (
    <ZetaCharacter
      state={state}
      size={size as ZetaSize}
      showStatusDot={showStatusDot}
      interactive={interactive}
      className={className}
      onClick={onClick}
      title={title}
      withSpeech={withSpeech}
    />
  );
};

export { ZetaCharacter };
