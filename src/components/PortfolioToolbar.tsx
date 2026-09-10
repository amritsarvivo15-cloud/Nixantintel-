import React, { useRef, useEffect } from 'react';
import {
  Search,
  RotateCcw,
  X,
  Download,
  Flame,
  AlertTriangle,
  Zap,
  Crown,
  LayoutList,
  SlidersHorizontal,
  Printer
} from 'lucide-react';
import { FilterOptions } from '../types';

interface PortfolioToolbarProps {
  filters: FilterOptions;
  onFilterChange: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
  onExportCsv?: () => void;
  onPrintReport?: () => void;
  density?: 'comfortable' | 'compact';
  onToggleDensity?: () => void;
  viewMode?: 'smart' | 'grid';
  onToggleViewMode?: () => void;
}

export const PortfolioToolbar: React.FC<PortfolioToolbarProps> = ({
  filters,
  onFilterChange,
  onReset,
  totalCount,
  filteredCount,
  onExportCsv,
  onPrintReport,
  density = 'comfortable',
  onToggleDensity,
  viewMode = 'smart',
  onToggleViewMode
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Press "/" to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Count active filters
  const activeFiltersCount =
    (filters.search ? 1 : 0) +
    (filters.channel ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.action ? 1 : 0) +
    (filters.gmvfilter ? 1 : 0);

  // Preset segments
  const currentPreset =
    filters.action === 'Priority follow-up'
      ? 'priority'
      : filters.action === 'Recovery'
      ? 'recovery'
      : filters.action === 'Active MTD'
      ? 'active'
      : filters.gmvfilter === '100k'
      ? 'top-gmv'
      : filters.status === 'Unmatched'
      ? 'unmatched'
      : !activeFiltersCount
      ? 'all'
      : 'custom';

  const handleApplyPreset = (preset: string) => {
    if (preset === 'all') {
      onReset();
    } else if (preset === 'priority') {
      onReset();
      onFilterChange('action', 'Priority follow-up');
    } else if (preset === 'recovery') {
      onReset();
      onFilterChange('action', 'Recovery');
    } else if (preset === 'active') {
      onReset();
      onFilterChange('action', 'Active MTD');
    } else if (preset === 'top-gmv') {
      onReset();
      onFilterChange('gmvfilter', '100k');
    } else if (preset === 'unmatched') {
      onReset();
      onFilterChange('status', 'Unmatched');
    }
  };

  return (
    <div
      id="portfolio-toolbar"
      className="p-3.5 border border-[var(--line)] rounded-2xl bg-[var(--panel-solid)]/95 backdrop-blur-xl shadow-md space-y-3 mb-3 no-print"
    >
      {/* Row 1: Instant Productivity Presets & View Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Preset quick tabs */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-0.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--muted)] mr-1 hidden sm:inline">
            Quick Views:
          </span>

          <button
            onClick={() => handleApplyPreset('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all border ${
              currentPreset === 'all'
                ? 'bg-[#FFC600] text-[#111111] border-[#FFC600] shadow-xs'
                : 'bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--text)] border-[var(--line)]'
            }`}
          >
            All Accounts ({totalCount})
          </button>

          <button
            onClick={() => handleApplyPreset('priority')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 border ${
              currentPreset === 'priority'
                ? 'bg-[#f59e0b] text-white border-[#f59e0b] shadow-xs'
                : 'bg-[var(--panel-2)] text-[var(--muted)] hover:text-[#f59e0b] border-[var(--line)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Priority Follow-up</span>
          </button>

          <button
            onClick={() => handleApplyPreset('recovery')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 border ${
              currentPreset === 'recovery'
                ? 'bg-[#ff7f91] text-white border-[#ff7f91] shadow-xs'
                : 'bg-[var(--panel-2)] text-[var(--muted)] hover:text-[#ff7f91] border-[var(--line)]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#ff7f91]" />
            <span>Churn Recovery</span>
          </button>

          <button
            onClick={() => handleApplyPreset('active')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 border ${
              currentPreset === 'active'
                ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] shadow-xs'
                : 'bg-[var(--panel-2)] text-[var(--muted)] hover:text-[#0ea5e9] border-[var(--line)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#0ea5e9]" />
            <span>Active MTD</span>
          </button>

          <button
            onClick={() => handleApplyPreset('top-gmv')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 border ${
              currentPreset === 'top-gmv'
                ? 'bg-[#10b981] text-white border-[#10b981] shadow-xs'
                : 'bg-[var(--panel-2)] text-[var(--muted)] hover:text-[#10b981] border-[var(--line)]'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-[#10b981]" />
            <span>₹1L+ Enterprise</span>
          </button>
        </div>

        {/* Right side productivity tools: Density, View Mode, Export CSV */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* View mode toggle (Smart Clean vs Extended Grid) */}
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="h-8 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] hover:border-[#FFC600]/50 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer"
              title={viewMode === 'smart' ? 'Switch to Extended Multi-Column Grid' : 'Switch to Clean Smart View'}
            >
              <LayoutList className="w-3.5 h-3.5 text-[#FFC600]" />
              <span className="hidden sm:inline font-medium">
                {viewMode === 'smart' ? 'Smart View' : 'Extended Grid'}
              </span>
            </button>
          )}

          {/* Density toggle */}
          {onToggleDensity && (
            <button
              onClick={onToggleDensity}
              className="h-8 px-2.5 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] hover:border-[#FFC600]/50 text-xs text-[var(--muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1.5 cursor-pointer"
              title={density === 'compact' ? 'Switch to Comfortable Density' : 'Switch to Compact High-Density'}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--muted)]" />
              <span className="hidden md:inline capitalize font-medium">{density}</span>
            </button>
          )}

          {/* Export to CSV */}
          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="h-8 px-3 rounded-lg border border-[#FFC600]/40 bg-[#FFC600]/10 hover:bg-[#FFC600]/20 text-[#FFC600] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Export visible accounts to CSV for Excel / Google Sheets"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {/* Print or Save PDF Report */}
          {onPrintReport && (
            <button
              onClick={onPrintReport}
              className="h-8 px-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] hover:border-[#FFC600]/50 hover:text-[var(--text)] text-[var(--muted)] text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Print or Save PDF Report of visible portfolio accounts"
            >
              <Printer className="w-3.5 h-3.5 text-[#FFC600]" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Search input + Precision filter dropdowns + Active reset */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search box with hotkey & clear button */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            id="search-input"
            type="text"
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Search Org ID, domain or organisation (Press '/' to focus)…"
            className="w-full h-9 pl-9 pr-14 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)] text-xs placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600]/70 focus:ring-2 focus:ring-[#FFC600]/20 transition-all font-medium"
          />
          {filters.search ? (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] p-0.5 rounded cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono border border-[var(--line)] bg-[var(--panel)] px-1.5 py-0.5 rounded text-[var(--muted)] pointer-events-none">
              /
            </span>
          )}
        </div>

        {/* Channel dropdown */}
        <select
          id="select-channel"
          value={filters.channel}
          onChange={(e) => onFilterChange('channel', e.target.value)}
          className={`h-9 px-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#FFC600]/20 transition-all cursor-pointer font-medium ${
            filters.channel
              ? 'border-[#FFC600] bg-[#FFC600]/10 text-[var(--text)] font-semibold'
              : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)]'
          }`}
        >
          <option value="">Channel: All</option>
          <option value="SME+">SME+</option>
          <option value="SEM">SEM</option>
          <option value="SMEV">SMEV</option>
          <option value="—">Unassigned (—)</option>
        </select>

        {/* Match status dropdown */}
        <select
          id="select-status"
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className={`h-9 px-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#FFC600]/20 transition-all cursor-pointer font-medium ${
            filters.status
              ? 'border-[#FFC600] bg-[#FFC600]/10 text-[var(--text)] font-semibold'
              : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)]'
          }`}
        >
          <option value="">Status: All</option>
          <option value="Matched">Matched</option>
          <option value="Unmatched">Unmatched</option>
          <option value="No Org ID">No Org ID</option>
        </select>

        {/* Action bucket dropdown */}
        <select
          id="select-action"
          value={filters.action}
          onChange={(e) => onFilterChange('action', e.target.value)}
          className={`h-9 px-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#FFC600]/20 transition-all cursor-pointer font-medium ${
            filters.action
              ? 'border-[#FFC600] bg-[#FFC600]/10 text-[var(--text)] font-semibold'
              : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)]'
          }`}
        >
          <option value="">Action: All</option>
          <option value="Priority follow-up">Priority follow-up</option>
          <option value="Recovery">Recovery</option>
          <option value="Upside">Upside</option>
          <option value="Active MTD">Active MTD</option>
          <option value="Maintain">Maintain</option>
        </select>

        {/* July GMV filter dropdown */}
        <select
          id="select-gmvfilter"
          value={filters.gmvfilter}
          onChange={(e) => onFilterChange('gmvfilter', e.target.value as FilterOptions['gmvfilter'])}
          className={`h-9 px-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#FFC600]/20 transition-all cursor-pointer font-medium ${
            filters.gmvfilter
              ? 'border-[#FFC600] bg-[#FFC600]/10 text-[var(--text)] font-semibold'
              : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)]'
          }`}
        >
          <option value="">Spend: All</option>
          <option value="100k">₹1L+ July</option>
          <option value="250k">₹2.5L+ July</option>
          <option value="zero">July = ₹0</option>
        </select>

        {/* Reset / Clear filters button */}
        {activeFiltersCount > 0 && (
          <button
            id="btn-reset-filters"
            onClick={onReset}
            className="h-9 px-3 rounded-xl border border-red-400/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Reset all active filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear ({activeFiltersCount})</span>
          </button>
        )}

        {/* Live filtered count feedback */}
        <div className="ml-auto text-xs text-[var(--muted)] font-medium">
          Showing <strong className="text-[var(--text)] font-mono">{filteredCount}</strong> of {totalCount} accounts
        </div>
      </div>
    </div>
  );
};
