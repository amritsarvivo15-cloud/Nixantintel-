import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface FoldDeviceFrameProps {
  children: React.ReactNode;
  enabled?: boolean;
  onCloseFrame?: () => void;
}

export const FoldDeviceFrame: React.FC<FoldDeviceFrameProps> = ({
  children,
  enabled = true,
}) => {
  if (!enabled) {
    return <div className="w-full max-w-md mx-auto">{children}</div>;
  }

  // Realistic time
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col items-center justify-center py-4 px-2 select-none">
      {/* Device Info Badge */}
      <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)] font-mono">
        <span className="inline-block w-2 h-2 rounded-full bg-[#FFC600] animate-ping" />
        <span>Samsung Galaxy Z Fold Ultra 8 • Cover Display (21.6:9)</span>
      </div>

      {/* Titanium Frame Shell */}
      <div
        id="samsung-fold-frame"
        className="relative w-[384px] sm:w-[400px] h-[850px] rounded-[42px] p-[10px] bg-gradient-to-b from-[#2a2d34] via-[#1a1c22] to-[#121418] shadow-[0_25px_70px_rgba(0,0,0,0.65)] ring-1 ring-white/15 border-2 border-[#3d424e]"
      >
        {/* Physical Hinge Spine (left edge accent for Fold) */}
        <div className="absolute -left-[5px] top-28 bottom-28 w-[4px] rounded-l-md bg-gradient-to-b from-[#4a5060] via-[#858e9f] to-[#4a5060] opacity-80" />

        {/* Volume & Power Buttons on right */}
        <div className="absolute -right-[4px] top-32 h-14 w-[3px] rounded-r-md bg-[#4a5060]" />
        <div className="absolute -right-[4px] top-52 h-10 w-[3px] rounded-r-md bg-[#4a5060]" />

        {/* Inner Screen Bezel */}
        <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-[var(--bg)] flex flex-col border border-black/40">
          {/* Top Status Bar with Punch-Hole Camera */}
          <div className="relative h-9 px-6 pt-1 flex items-center justify-between text-[11px] font-semibold text-[var(--text)] bg-[var(--panel-solid)] border-b border-[var(--line)]/50 z-30 select-none">
            {/* Clock */}
            <span>{timeString}</span>

            {/* Front Camera Punch-hole (Centered) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 w-3.5 h-3.5 rounded-full bg-black border border-white/20 flex items-center justify-center shadow-inner">
              <div className="w-1.5 h-1.5 rounded-full bg-[#152a44] opacity-90" />
            </div>

            {/* Icons */}
            <div className="flex items-center gap-1.5 text-[var(--text)]">
              <Signal className="w-3 h-3" />
              <span className="text-[10px] font-mono">5G</span>
              <Wifi className="w-3 h-3" />
              <div className="flex items-center gap-0.5">
                <Battery className="w-3.5 h-3.5 fill-current" />
                <span className="text-[9px] font-mono">98%</span>
              </div>
            </div>
          </div>

          {/* Screen Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/10 relative">
            {children}
          </div>

          {/* Android Gesture Navigation Bar */}
          <div className="h-4 bg-[var(--panel-solid)] flex items-center justify-center z-30 border-t border-[var(--line)]/30">
            <div className="w-28 h-1 rounded-full bg-[var(--text)]/40 hover:bg-[var(--text)]/70 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
};
