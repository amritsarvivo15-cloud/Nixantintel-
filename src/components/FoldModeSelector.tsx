import React from 'react';
import { Smartphone, BookOpen, Monitor, SlidersHorizontal, Layers } from 'lucide-react';
import { DeviceDisplayMode } from '../types';

interface FoldModeSelectorProps {
  mode: DeviceDisplayMode;
  onModeChange: (mode: DeviceDisplayMode) => void;
  showDeviceFrame?: boolean;
  onToggleDeviceFrame?: () => void;
  showHingeGuide?: boolean;
  onToggleHingeGuide?: () => void;
  unfoldedLayout?: 'split' | 'expanded';
  onToggleUnfoldedLayout?: () => void;
  className?: string;
}

export const FoldModeSelector: React.FC<FoldModeSelectorProps> = ({
  mode,
  onModeChange,
  showDeviceFrame = true,
  onToggleDeviceFrame,
  showHingeGuide = true,
  onToggleHingeGuide,
  unfoldedLayout = 'split',
  onToggleUnfoldedLayout,
  className = '',
}) => {
  return (
    <div
      id="fold-mode-selector"
      className={`inline-flex items-center gap-1.5 p-1 rounded-2xl border border-[var(--line)] bg-[var(--panel-solid)]/90 backdrop-blur-md shadow-md flex-wrap ${className}`}
    >
      {/* Device Label */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 border-r border-[var(--line)] text-[11px] font-bold text-[var(--muted)]">
        <span className="w-2 h-2 rounded-full bg-[#FFC600] animate-pulse" />
        <span className="text-[var(--text)] font-semibold">Galaxy Z Fold Ultra</span>
      </div>

      {/* Mode 1: Single Mobile Screen (Fold Cover) */}
      <button
        onClick={() => onModeChange('fold-cover')}
        id="btn-mode-fold-cover"
        title="Samsung Fold Ultra 8 — Single Mobile Screen (Cover 21.6:9)"
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
          mode === 'fold-cover'
            ? 'bg-[#FFC600] text-[#111111] shadow-sm font-extrabold'
            : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5" />
        <span>Single Mobile Screen</span>
        <span className="text-[10px] opacity-75 font-mono hidden md:inline">(Cover)</span>
      </button>

      {/* Mode 2: Double Open Full Screen (Fold Unfolded) */}
      <button
        onClick={() => onModeChange('fold-unfolded')}
        id="btn-mode-fold-unfolded"
        title="Samsung Fold Ultra 8 — Double Open Full Screen (Dual-Pane 7.6-8.0 AMOLED)"
        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
          mode === 'fold-unfolded'
            ? 'bg-[#FFC600] text-[#111111] shadow-sm font-extrabold'
            : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]'
        }`}
      >
        <BookOpen className="w-3.5 h-3.5" />
        <span>Double Open Full Screen</span>
        <span className="text-[10px] opacity-75 font-mono hidden md:inline">(Dual)</span>
      </button>

      {/* Mode 3: Adaptive / Desktop */}
      <button
        onClick={() => onModeChange('auto')}
        id="btn-mode-auto"
        title="Standard responsive desktop layout"
        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1 ${
          mode === 'auto'
            ? 'bg-[var(--panel-2)] text-[var(--text)] border border-[var(--line)] shadow-sm'
            : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]'
        }`}
      >
        <Monitor className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Adaptive</span>
      </button>

      {/* Sub-controls when in Cover mode */}
      {mode === 'fold-cover' && onToggleDeviceFrame && (
        <div className="hidden sm:flex items-center pl-1 border-l border-[var(--line)]">
          <button
            onClick={onToggleDeviceFrame}
            id="btn-toggle-device-frame"
            className="px-2 py-1 text-[11px] rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition-colors flex items-center gap-1 cursor-pointer font-medium"
            title="Toggle Samsung Galaxy Z Fold Hardware Mockup Chassis"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{showDeviceFrame ? 'Frame: ON' : 'Frame: OFF'}</span>
          </button>
        </div>
      )}

      {/* Sub-controls when in Unfolded mode */}
      {mode === 'fold-unfolded' && (
        <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-[var(--line)]">
          {onToggleUnfoldedLayout && (
            <button
              onClick={onToggleUnfoldedLayout}
              id="btn-toggle-unfolded-layout"
              className="px-2 py-1 text-[11px] rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition-colors flex items-center gap-1 cursor-pointer font-medium"
              title="Toggle between Split Dual-Pane and Expansive Cockpit"
            >
              <Layers className="w-3 h-3" />
              <span>{unfoldedLayout === 'split' ? 'Split Pane' : 'Full Canvas'}</span>
            </button>
          )}

          {onToggleHingeGuide && unfoldedLayout === 'split' && (
            <button
              onClick={onToggleHingeGuide}
              id="btn-toggle-hinge-guide"
              className="px-2 py-1 text-[11px] rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] transition-colors cursor-pointer font-medium"
              title="Toggle Center Fold Crease Line & Hinge Guide"
            >
              {showHingeGuide ? 'Hinge: ON' : 'Hinge: OFF'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
