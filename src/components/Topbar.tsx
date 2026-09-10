import React from 'react';
import { Sun, Moon, Copy, Download, RefreshCw } from 'lucide-react';
import { RadarLogo } from './RadarLogo';
import { FoldModeSelector } from './FoldModeSelector';
import { DeviceDisplayMode, FreshnessState, ImportSession } from '../types';
import { AiIntelligenceFace } from './AiIntelligenceFace';
import { FreshnessBadge } from './FreshnessBadge';

interface TopbarProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onCopySummary: () => void;
  onExportCsv: () => void;
  onOpenAi: () => void;
  foldMode: DeviceDisplayMode;
  onFoldModeChange: (mode: DeviceDisplayMode) => void;
  showDeviceFrame?: boolean;
  onToggleDeviceFrame?: () => void;
  showHingeGuide?: boolean;
  onToggleHingeGuide?: () => void;
  unfoldedLayout?: 'split' | 'expanded';
  onToggleUnfoldedLayout?: () => void;
  freshness?: FreshnessState;
  history?: ImportSession[];
  onOpenDataHub?: (initialTab?: 'smart' | 'paste' | 'single' | 'history') => void;
  onRollback?: (session: ImportSession) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  theme,
  onToggleTheme,
  onCopySummary,
  onExportCsv,
  onOpenAi,
  foldMode,
  onFoldModeChange,
  showDeviceFrame,
  onToggleDeviceFrame,
  showHingeGuide,
  onToggleHingeGuide,
  unfoldedLayout,
  onToggleUnfoldedLayout,
  freshness,
  history = [],
  onOpenDataHub,
  onRollback
}) => {
  return (
    <header id="topbar" className="flex flex-col md:flex-row justify-between gap-3 items-start md:items-center mb-5">
      {/* Left: Official Radar 365 Brand Lockup */}
      <div className="flex items-center gap-3">
        <RadarLogo variant="horizontal" size="md" theme={theme} animated />
        <div className="hidden xl:block h-6 w-[1px] bg-[var(--line)] mx-1" />
        <span className="hidden xl:inline text-[11px] text-[var(--muted)] font-medium">
          GMV Portfolio Cockpit • Non-RAM / KAM
        </span>
      </div>

      {/* Center: Fold Mode Switcher */}
      <FoldModeSelector
        mode={foldMode}
        onModeChange={onFoldModeChange}
        showDeviceFrame={showDeviceFrame}
        onToggleDeviceFrame={onToggleDeviceFrame}
        showHingeGuide={showHingeGuide}
        onToggleHingeGuide={onToggleHingeGuide}
        unfoldedLayout={unfoldedLayout}
        onToggleUnfoldedLayout={onToggleUnfoldedLayout}
      />

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
        {/* Freshness Status Indicator Pill */}
        {freshness && onOpenDataHub && (
          <FreshnessBadge
            freshness={freshness}
            history={history}
            onOpenDataHub={onOpenDataHub}
            onRollback={onRollback}
          />
        )}

        {/* Primary Action: Refresh GMV */}
        {onOpenDataHub && (
          <button
            onClick={() => onOpenDataHub('smart')}
            id="btn-refresh-gmv"
            className="px-3 py-1.5 bg-[#FFC600] hover:bg-[#e6b200] text-black font-black rounded-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs shadow-sm shadow-[#FFC600]/20"
            title="Refresh GMV: Upload CSV/XLSX, Paste Data, or Single Account entry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh GMV</span>
          </button>
        )}

        <button
          onClick={onOpenAi}
          id="btn-open-ai"
          className="group px-3 py-1.5 border border-[#FFC600]/40 bg-gradient-to-r from-[#FFC600]/20 via-[#FFC600]/10 to-transparent hover:from-[#FFC600]/30 hover:to-[#FFC600]/15 text-[var(--text)] backdrop-blur-md rounded-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-2 text-xs font-bold shadow-sm shadow-[#FFC600]/10 ring-1 ring-[#FFC600]/30"
          title="Open Radar 365 AI Revenue Intelligence Assistant"
        >
          <AiIntelligenceFace size="xs" mood="idle" interactive={false} showStatusDot={true} />
          <div className="flex flex-col text-left leading-none">
            <span className="flex items-center gap-1">
              <span>Ask AI</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-[9px] text-[#FFC600] font-medium hidden sm:inline">Intelligence</span>
          </div>
        </button>

        <button
          onClick={onToggleTheme}
          id="btn-toggle-theme"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 sm:px-3 sm:py-2 border border-[var(--line)] bg-[var(--panel)] backdrop-blur-md rounded-xl text-[var(--text)] hover:border-[#FFC600]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#FFC600]" />
          ) : (
            <Moon className="w-4 h-4 text-[#111111]" />
          )}
          <span className="hidden sm:inline">
            {theme === 'dark' ? 'Light' : 'Dark'}
          </span>
        </button>

        <button
          onClick={onCopySummary}
          id="btn-copy-summary"
          className="px-3 py-2 border border-[var(--line)] bg-[var(--panel)] backdrop-blur-md rounded-xl text-[var(--text)] hover:border-[#FFC600]/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold hidden lg:flex"
        >
          <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span className="hidden sm:inline">Copy</span> Summary
        </button>

        <button
          onClick={onExportCsv}
          id="btn-export-csv"
          className="px-3 py-2 border border-[var(--line)] bg-[var(--panel)] hover:border-[#FFC600]/60 text-[var(--text)] backdrop-blur-md rounded-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold hidden lg:flex"
        >
          <Download className="w-3.5 h-3.5 text-[var(--muted)]" />
          <span>Export CSV</span>
        </button>
      </div>
    </header>
  );
};

