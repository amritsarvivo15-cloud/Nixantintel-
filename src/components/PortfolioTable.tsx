import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Minus,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CheckSquare,
  Square,
  Download,
  X,
  Building2,
  MessageCircle,
  Printer,
  Search,
  RotateCcw,
  RotateCw,
  Columns,
  MoreHorizontal,
  Flame,
  AlertTriangle,
  Zap,
  TrendingUp,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { DerivedPortfolioRecord, SortKey, SortDir, FilterOptions } from '../types';
import { INR, compact, uniqueRows } from '../utils/formatters';
import { getOrgFullProfile } from '../utils/spocIntelligence';
import { CompanyLogo } from './CompanyLogo';

export interface PortfolioTableProps {
  rows: DerivedPortfolioRecord[];
  totalRowsCount: number;
  onCopyAccount: (r: DerivedPortfolioRecord) => void;
  onAskAi?: (r: DerivedPortfolioRecord) => void;
  onSelectOrg?: (r: DerivedPortfolioRecord) => void;
  density?: 'comfortable' | 'compact';
  onToggleDensity?: () => void;
  viewMode?: 'smart' | 'grid';
  onToggleViewMode?: () => void;
  filters?: FilterOptions;
  onFilterChange?: <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => void;
  onResetFilters?: () => void;
  onExportCsv?: () => void;
  onOpenDataHub?: (tab?: 'smart' | 'paste' | 'single' | 'history') => void;
  dataThroughDate?: string;
}

/**
 * Compact Trend Indicator Component
 * Growth = soft green with up arrow / percentage
 * Decline = soft red with down arrow / percentage
 * Active MTD = sky blue badge
 * Neutral / Base = amber dash
 */
const CompactTrend: React.FC<{
  jul: number;
  aug: number | null;
  sep: number | null;
  deltaPct: number | null;
}> = ({ jul, aug, sep, deltaPct }) => {
  const calcDelta =
    deltaPct != null
      ? deltaPct
      : aug != null && jul > 0
      ? ((aug - jul) / jul) * 100
      : null;

  if (calcDelta != null && calcDelta !== 0) {
    if (calcDelta > 0) {
      return (
        <span
          className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400"
          title={`Aug vs Jul: +${calcDelta.toFixed(0)}%`}
        >
          <ArrowUp className="w-3 h-3 text-emerald-500 stroke-[2.5]" />
          <span>+{calcDelta.toFixed(0)}%</span>
        </span>
      );
    }
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[11px] font-mono font-bold text-rose-600 dark:text-rose-400"
        title={`Aug vs Jul: ${calcDelta.toFixed(0)}%`}
      >
        <ArrowDown className="w-3 h-3 text-rose-500 stroke-[2.5]" />
        <span>{calcDelta.toFixed(0)}%</span>
      </span>
    );
  }

  if (sep != null && sep > 0) {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded"
        title={`Sep MTD: ${INR(sep)}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
        <span>MTD</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center text-[11px] font-mono text-amber-500/80"
      title="Base July baseline"
    >
      <Minus className="w-3.5 h-3.5 text-amber-500" />
    </span>
  );
};

export const PortfolioTable: React.FC<PortfolioTableProps> = ({
  rows,
  totalRowsCount,
  onCopyAccount,
  onAskAi,
  onSelectOrg,
  density = 'comfortable',
  onToggleDensity,
  viewMode = 'smart',
  onToggleViewMode,
  filters,
  onFilterChange,
  onResetFilters,
  onExportCsv,
  onOpenDataHub,
  dataThroughDate = '10 Sep 2026'
}) => {
  const [sortKey, setSortKey] = useState<SortKey>('jul');
  const [sortDir, setSortDir] = useState<SortDir>(-1);
  const [copiedOrg, setCopiedOrg] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeMenuRowKey, setActiveMenuRowKey] = useState<string | null>(null);

  // Identify any non-standard dynamic months present in the data (e.g. 'oct', 'nov')
  const dynamicMonthKeys = useMemo(() => {
    const keys = new Set<string>();
    rows.forEach((r) => {
      if (r.dynamicMonths) {
        Object.keys(r.dynamicMonths).forEach((k) => {
          const lk = k.toLowerCase();
          if (!['jul', 'aug', 'sep'].includes(lk)) {
            keys.add(k);
          }
        });
      }
    });
    return Array.from(keys);
  }, [rows]);

  // Multi-select bulk state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

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

  // Close row more menu when clicked outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuRowKey(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Print & PDF Report Generation Handler
  const handlePrintReport = () => {
    const prevPageSize = pageSize;
    if (prevPageSize !== -1 && rows.length > prevPageSize) {
      setPageSize(-1);
      setTimeout(() => {
        window.print();
        window.addEventListener(
          'afterprint',
          () => {
            setPageSize(prevPageSize);
          },
          { once: true }
        );
      }, 150);
    } else {
      window.print();
    }
  };

  // Sorting logic
  const sortedRows = useMemo(() => {
    const list = [...rows];
    list.sort((a, b) => {
      let x: any =
        sortKey === 'idx'
          ? rows.indexOf(a)
          : (a as any)[sortKey] ?? a.dynamicMonths?.[sortKey];
      let y: any =
        sortKey === 'idx'
          ? rows.indexOf(b)
          : (b as any)[sortKey] ?? b.dynamicMonths?.[sortKey];

      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;

      if (typeof x === 'string') {
        return x.localeCompare(String(y)) * sortDir;
      }
      return (Number(x) - Number(y)) * sortDir;
    });
    return list;
  }, [rows, sortKey, sortDir]);

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
    setCurrentPage(1);
  };

  // Human-readable active sort label
  const sortColumnLabel = useMemo(() => {
    switch (sortKey) {
      case 'jul':
        return 'Jul GMV';
      case 'aug':
        return 'Aug GMV';
      case 'sep':
        return 'Sep MTD';
      case 'orgname':
        return 'Account Name';
      case 'org':
        return 'Org ID';
      case 'domain':
        return 'Domain';
      case 'channel':
        return 'Channel';
      case 'status':
        return 'Match Status';
      case 'actionBucket':
        return 'Action Queue';
      case 'deltaPct':
        return 'Aug Δ';
      case 'total':
        return 'Known Total';
      default:
        return 'Default order';
    }
  }, [sortKey]);

  // Pagination calculation
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Summary KPIs for Header
  const visibleKnownGMV = useMemo(() => {
    const u = uniqueRows(rows);
    return u.reduce((s, r) => s + (r.total ?? r.jul ?? 0), 0);
  }, [rows]);

  const priorityCount = useMemo(() => {
    return rows.filter(
      (r) => r.actionBucket === 'Priority follow-up' || r.actionBucket === 'Recovery'
    ).length;
  }, [rows]);

  // Multi-select helpers
  const selectedRecords = useMemo(() => {
    return rows.filter((r) => selectedIds.has(`${r.org}-${r.domain}`));
  }, [rows, selectedIds]);

  const isAllCurrentPageSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((r) => selectedIds.has(`${r.org}-${r.domain}`));

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllCurrentPageSelected) {
      paginatedRows.forEach((r) => next.delete(`${r.org}-${r.domain}`));
    } else {
      paginatedRows.forEach((r) => next.add(`${r.org}-${r.domain}`));
    }
    setSelectedIds(next);
  };

  const handleToggleRow = (rowKey: string) => {
    const next = new Set(selectedIds);
    if (next.has(rowKey)) {
      next.delete(rowKey);
    } else {
      next.add(rowKey);
    }
    setSelectedIds(next);
  };

  const handleBulkCopyOrgIds = () => {
    const ids = selectedRecords
      .map((r) => r.org)
      .filter((o) => o !== 'NA')
      .join(', ');
    navigator.clipboard.writeText(ids);
    setBulkFeedback(`Copied ${selectedRecords.length} Org IDs!`);
    setTimeout(() => setBulkFeedback(null), 2000);
  };

  const handleBulkCopyDomains = () => {
    const domains = selectedRecords.map((r) => r.domain).join(', ');
    navigator.clipboard.writeText(domains);
    setBulkFeedback(`Copied ${selectedRecords.length} domains!`);
    setTimeout(() => setBulkFeedback(null), 2000);
  };

  const handleBulkExport = () => {
    if (onExportCsv) {
      onExportCsv();
    }
    setBulkFeedback(`Exported ${selectedRecords.length} accounts!`);
    setTimeout(() => setBulkFeedback(null), 2000);
  };

  const handleRowCopy = (r: DerivedPortfolioRecord) => {
    onCopyAccount(r);
    setCopiedOrg(r.org + r.domain);
    setTimeout(() => {
      setCopiedOrg(null);
    }, 1500);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <ArrowUpDown className="w-3 h-3 text-[var(--muted)]/40 inline ml-1" />;
    }
    return sortDir === 1 ? (
      <ArrowUp className="w-3 h-3 text-[#FFC600] inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#FFC600] inline ml-1" />
    );
  };

  // Active filter count
  const activeFiltersCount = filters
    ? (filters.search ? 1 : 0) +
      (filters.channel ? 1 : 0) +
      (filters.status ? 1 : 0) +
      (filters.action ? 1 : 0) +
      (filters.gmvfilter ? 1 : 0)
    : 0;

  // Show extended analytical columns (Aug Δ, Known Total) only if More Columns is toggled
  const showMoreColumns = viewMode === 'grid';

  return (
    <div
      id="portfolio-table-container"
      className="border border-gray-200/80 dark:border-zinc-800/80 rounded-2xl bg-[var(--panel)] shadow-xs overflow-hidden"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. HEADER OF ACCOUNT PORTFOLIO                                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3.5 sm:p-4 border-b border-gray-200/70 dark:border-zinc-800/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 no-print">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[var(--text)] tracking-tight">
            Account Portfolio
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5 font-normal">
            Sorted by <strong className="font-semibold text-[var(--text)]">{sortColumnLabel}</strong> ({sortDir === 1 ? 'ascending' : 'descending'}) · <span className="text-[var(--text)]/80 font-medium">Through {dataThroughDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          {/* 3 Compact KPI Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/80 text-[var(--text)] text-xs font-semibold select-none">
              <span className="font-mono">{rows.length}</span>
              <span className="text-[var(--muted)] ml-1 font-normal">Accounts</span>
            </span>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-gray-200 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/80 text-[var(--text)] text-xs font-semibold select-none">
              <span className="text-[var(--muted)] mr-1 font-normal">Visible GMV:</span>
              <span className="font-mono font-bold">{compact(visibleKnownGMV)}</span>
            </span>

            <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-amber-200/70 dark:border-amber-900/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold select-none">
              <span className="text-[var(--muted)] dark:text-amber-300/80 mr-1 font-normal">Priority Follow-ups:</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{priorityCount}</span>
            </span>
          </div>

          {/* Refresh GMV Hub Trigger */}
          {onOpenDataHub && (
            <button
              onClick={() => onOpenDataHub('smart')}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-[#FFC600]/40 bg-[#FFC600]/15 hover:bg-[#FFC600]/25 text-[var(--text)] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-1 shadow-2xs"
              title="Open Auto GMV Refresh & Data Ingestion Hub"
            >
              <RotateCw className="w-3.5 h-3.5 text-[#FFC600]" />
              <span className="hidden sm:inline">Refresh GMV</span>
            </button>
          )}

          {/* Secondary Print / PDF Icon Button */}
          <button
            id="btn-print-portfolio-table"
            onClick={handlePrintReport}
            className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50/80 dark:bg-zinc-800/80 hover:border-[#FFC600]/60 hover:text-[var(--text)] text-[var(--muted)] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Print or Save PDF Report"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FILTERS COMPACT TOOLBAR                                    */}
      {/* ------------------------------------------------------------- */}
      {filters && onFilterChange && (
        <div className="px-3.5 sm:px-4 py-2 bg-gray-50/50 dark:bg-zinc-900/40 border-b border-gray-200/70 dark:border-zinc-800/70 flex flex-wrap items-center gap-2 text-xs no-print">
          {/* Wider Search Box */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-[var(--muted)] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              placeholder="Search Org ID, domain or organisation…"
              className="w-full h-8 pl-8 pr-7 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] focus:ring-1 focus:ring-[#FFC600]/30 transition-all font-normal"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange('search', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Compact Dropdowns */}
          <select
            value={filters.channel}
            onChange={(e) => onFilterChange('channel', e.target.value)}
            className="h-8 px-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs font-medium focus:outline-none focus:border-[#FFC600] cursor-pointer"
          >
            <option value="">Channel</option>
            <option value="SME+">SME+</option>
            <option value="SEM">SEM</option>
            <option value="SMEV">SMEV</option>
            <option value="—">Unassigned (—)</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="h-8 px-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs font-medium focus:outline-none focus:border-[#FFC600] cursor-pointer"
          >
            <option value="">Status</option>
            <option value="Matched">Matched</option>
            <option value="Unmatched">Unmatched</option>
            <option value="No Org ID">No Org ID</option>
          </select>

          <select
            value={filters.action}
            onChange={(e) => onFilterChange('action', e.target.value)}
            className="h-8 px-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs font-medium focus:outline-none focus:border-[#FFC600] cursor-pointer"
          >
            <option value="">Action</option>
            <option value="Priority follow-up">Priority follow-up</option>
            <option value="Recovery">Recovery</option>
            <option value="Upside">Upside</option>
            <option value="Active MTD">Active MTD</option>
            <option value="Maintain">Maintain</option>
          </select>

          <select
            value={filters.gmvfilter}
            onChange={(e) => onFilterChange('gmvfilter', e.target.value as any)}
            className="h-8 px-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs font-medium focus:outline-none focus:border-[#FFC600] cursor-pointer"
          >
            <option value="">Spend</option>
            <option value="100k">₹1L+ Jul</option>
            <option value="250k">₹2.5L+ Jul</option>
            <option value="zero">Jul = ₹0</option>
          </select>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && onResetFilters && (
            <button
              onClick={onResetFilters}
              className="h-8 px-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset all active filters"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset ({activeFiltersCount})</span>
            </button>
          )}

          {/* Far Right: Smart View / More Columns, Export CSV, Row Selector */}
          <div className="flex items-center gap-1.5 ml-auto">
            {onToggleViewMode && (
              <button
                onClick={onToggleViewMode}
                className={`h-8 px-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  showMoreColumns
                    ? 'border-[#FFC600] bg-[#FFC600]/10 text-[var(--text)]'
                    : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] hover:border-[#FFC600]/60'
                }`}
                title={showMoreColumns ? 'Switch to Clean View' : 'Show More Columns (Aug Δ & Known Total)'}
              >
                <Columns className="w-3.5 h-3.5 text-[#FFC600]" />
                <span className="hidden sm:inline">
                  {showMoreColumns ? 'More Columns' : 'Smart View'}
                </span>
              </button>
            )}

            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="h-8 px-2.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-[#FFC600]/60 text-[var(--text)] text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Export visible accounts to CSV"
              >
                <Download className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="hidden md:inline">Export CSV</span>
              </button>
            )}

            {/* Smaller secondary row-size selector */}
            <div className="flex items-center gap-1 text-[var(--muted)] pl-1">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs font-mono font-medium cursor-pointer focus:outline-none focus:border-[#FFC600]"
                title="Rows per page"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>

              {onToggleDensity && (
                <button
                  onClick={onToggleDensity}
                  className="h-8 px-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--muted)] hover:text-[var(--text)] text-[11px] font-medium transition-colors hidden xl:inline-flex items-center cursor-pointer"
                  title={`Table density: ${density}. Click to toggle.`}
                >
                  {density === 'compact' ? 'Compact' : 'Comfort'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Pill Bar (Shown when rows are selected) */}
      {selectedIds.size > 0 && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2.5 text-xs flex-wrap no-print">
          <span className="font-bold text-[var(--text)] flex items-center gap-1.5 font-mono">
            <CheckSquare className="w-3.5 h-3.5 text-[#FFC600]" />
            <span>{selectedIds.size} Selected</span>
          </span>

          <div className="h-3.5 w-px bg-amber-500/30 mx-0.5" />

          <button
            onClick={handleBulkCopyOrgIds}
            className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-[#FFC600] text-[var(--text)] font-medium transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <Copy className="w-3 h-3 text-[#FFC600]" />
            <span>Copy IDs</span>
          </button>

          <button
            onClick={handleBulkCopyDomains}
            className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-[#FFC600] text-[var(--text)] font-medium transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <Copy className="w-3 h-3 text-[#FFC600]" />
            <span>Copy Domains</span>
          </button>

          {onExportCsv && (
            <button
              onClick={handleBulkExport}
              className="px-2 py-1 rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-[#FFC600] text-[var(--text)] font-medium transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Download className="w-3 h-3 text-[#FFC600]" />
              <span>Export</span>
            </button>
          )}

          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-[var(--muted)] hover:text-[var(--text)] cursor-pointer ml-auto"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {bulkFeedback && (
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 ml-1 animate-pulse">
              {bulkFeedback}
            </span>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. ACCOUNT TABLE                                              */}
      {/* ------------------------------------------------------------- */}
      <div className="portfolio-table-scroll overflow-x-auto max-h-[70vh] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 bg-gray-50/95 dark:bg-zinc-900/95 backdrop-blur-xs border-b border-gray-200/80 dark:border-zinc-800/80 text-[var(--muted)] uppercase tracking-wider text-[10px] select-none font-semibold">
              {/* Checkbox multi-select header */}
              <th className="py-2.5 px-3 w-8 text-center no-print">
                <button
                  onClick={handleToggleSelectAll}
                  className="cursor-pointer text-[var(--muted)] hover:text-[#FFC600] transition-colors"
                  title={isAllCurrentPageSelected ? 'Deselect page' : 'Select page'}
                >
                  {isAllCurrentPageSelected ? (
                    <CheckSquare className="w-3.5 h-3.5 text-[#FFC600]" />
                  ) : (
                    <Square className="w-3.5 h-3.5" />
                  )}
                </button>
              </th>

              {/* Row Index # */}
              <th
                onClick={() => handleHeaderClick('idx')}
                className="py-2.5 px-2 cursor-pointer hover:text-[var(--text)] font-mono w-9 hidden sm:table-cell"
              >
                # {renderSortIcon('idx')}
              </th>

              {/* Account / Domain */}
              <th
                onClick={() => handleHeaderClick('orgname')}
                className="py-2.5 px-3 cursor-pointer hover:text-[var(--text)] min-w-[200px] sm:min-w-[250px]"
              >
                Account / Domain {renderSortIcon('orgname')}
              </th>

              {/* Channel */}
              <th
                onClick={() => handleHeaderClick('channel')}
                className="py-2.5 px-2.5 cursor-pointer hover:text-[var(--text)] hidden sm:table-cell"
              >
                Channel {renderSortIcon('channel')}
              </th>

              {/* Jul GMV (Active sort column, slightly bolder) */}
              <th
                onClick={() => handleHeaderClick('jul')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] font-bold text-[var(--text)]"
              >
                Jul GMV {renderSortIcon('jul')}
              </th>

              {/* Aug GMV */}
              <th
                onClick={() => handleHeaderClick('aug')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] hidden md:table-cell"
              >
                Aug GMV {renderSortIcon('aug')}
              </th>

              {/* Sep MTD */}
              <th
                onClick={() => handleHeaderClick('sep')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] hidden sm:table-cell"
              >
                Sep MTD {renderSortIcon('sep')}
              </th>

              {/* Dynamic Ingested Months (e.g. Oct, Nov) */}
              {dynamicMonthKeys.map((mKey) => (
                <th
                  key={mKey}
                  onClick={() => handleHeaderClick(mKey as any)}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] font-bold text-[#FFC600] hidden sm:table-cell"
                >
                  {mKey.toUpperCase()} GMV {renderSortIcon(mKey as any)}
                </th>
              ))}

              {/* Trend */}
              <th className="py-2.5 px-2.5 text-center hidden lg:table-cell" title="Month-over-month trajectory">
                Trend
              </th>

              {/* Optional Analytical Columns: Aug Δ & Known Total */}
              {showMoreColumns && (
                <>
                  <th
                    onClick={() => handleHeaderClick('deltaPct')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] hidden xl:table-cell"
                  >
                    Aug Δ {renderSortIcon('deltaPct')}
                  </th>
                  <th
                    onClick={() => handleHeaderClick('total')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] hidden xl:table-cell"
                  >
                    Known Total {renderSortIcon('total')}
                  </th>
                </>
              )}

              {/* Match */}
              <th
                onClick={() => handleHeaderClick('status')}
                className="py-2.5 px-3 cursor-pointer hover:text-[var(--text)] hidden lg:table-cell"
              >
                Match {renderSortIcon('status')}
              </th>

              {/* Action Queue */}
              <th
                onClick={() => handleHeaderClick('actionBucket')}
                className="py-2.5 px-3 cursor-pointer hover:text-[var(--text)]"
              >
                Action Queue {renderSortIcon('actionBucket')}
              </th>

              {/* Actions */}
              <th className="py-2.5 px-3 text-center no-print hidden sm:table-cell">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/60">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={showMoreColumns ? 12 : 10}
                  className="py-14 text-center text-sm text-[var(--muted)]"
                >
                  <Building2 className="w-8 h-8 text-[var(--muted)]/40 mx-auto mb-2" />
                  <div>No accounts found matching the current search and filters.</div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((r, idx) => {
                const globalIndex =
                  pageSize === -1 ? idx + 1 : (currentPage - 1) * pageSize + idx + 1;
                const rowKey = `${r.org}-${r.domain}`;
                const isSelected = selectedIds.has(rowKey);
                const isCopied = copiedOrg === r.org + r.domain;
                const profile = getOrgFullProfile(r);
                const primarySpoc = profile.spocs[0];
                const isMenuOpen = activeMenuRowKey === rowKey;

                const rowHeightClass = density === 'compact' ? 'h-[56px]' : 'h-[68px]';
                const cellPyClass = density === 'compact' ? 'py-2' : 'py-3';

                return (
                  <tr
                    key={`${rowKey}-${idx}`}
                    className={`transition-colors hover:bg-gray-50/70 dark:hover:bg-zinc-800/40 ${rowHeightClass} ${
                      isSelected ? 'bg-amber-500/[0.05]' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className={`${cellPyClass} px-3 text-center no-print`}>
                      <button
                        onClick={() => handleToggleRow(rowKey)}
                        className="cursor-pointer text-[var(--muted)] hover:text-[#FFC600] transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#FFC600]" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </td>

                    {/* Row Index # */}
                    <td className="py-3 px-2 text-[var(--muted)] font-mono text-[11px] hidden sm:table-cell">
                      {globalIndex}
                    </td>

                    {/* Account / Domain Cell (64-72px height, logo on left, name in semibold, domain underneath, org id tiny badge) */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <CompanyLogo
                          domain={r.domain}
                          companyName={r.orgname || r.domain || 'Organisation'}
                          size={36}
                          onClick={() => onSelectOrg?.(r)}
                          title={`Open 360° dossier for ${r.orgname || r.domain}`}
                        />

                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => onSelectOrg?.(r)}
                            className="block truncate text-left font-semibold text-sm text-[var(--text)] hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer max-w-[210px] sm:max-w-[270px]"
                            title={`Open SPOC & Strategy Dossier for ${r.orgname || r.domain}`}
                          >
                            {r.orgname || r.domain}
                          </button>

                          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span
                              className="truncate text-xs text-[var(--muted)] font-mono max-w-[130px]"
                              title={r.domain}
                            >
                              {r.domain}
                            </span>

                            <span className="rounded border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] text-[var(--muted)] font-mono font-medium">
                              {r.org}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Channel */}
                    <td className="py-3 px-2.5 text-[var(--muted)] font-medium hidden sm:table-cell">
                      <span className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-[10px] font-mono">
                        {r.channel}
                      </span>
                    </td>

                    {/* Jul GMV (Active sort column, bolder) */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-[var(--text)]">
                      {INR(r.jul)}
                    </td>

                    {/* Aug GMV */}
                    <td className="py-3 px-3 text-right font-mono text-[var(--text)] hidden md:table-cell">
                      {r.aug == null ? (
                        <span className="text-[var(--muted)]/50 font-normal">—</span>
                      ) : (
                        INR(r.aug)
                      )}
                    </td>

                    {/* Sep MTD */}
                    <td className="py-3 px-3 text-right font-mono text-[var(--text)] hidden sm:table-cell">
                      {r.sep == null ? (
                        <span className="text-[var(--muted)]/50 font-normal">—</span>
                      ) : (
                        INR(r.sep)
                      )}
                    </td>

                    {/* Dynamic Ingested Months (e.g. Oct, Nov) */}
                    {dynamicMonthKeys.map((mKey) => {
                      const val = r.dynamicMonths ? r.dynamicMonths[mKey] : null;
                      return (
                        <td
                          key={mKey}
                          className="py-3 px-3 text-right font-mono font-bold text-[#FFC600] hidden sm:table-cell"
                        >
                          {val != null ? (
                            INR(val)
                          ) : (
                            <span className="text-[var(--muted)]/50 font-normal">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Trend Indicator */}
                    <td className="py-3 px-2.5 text-center hidden lg:table-cell">
                      <CompactTrend
                        jul={r.jul}
                        aug={r.aug}
                        sep={r.sep}
                        deltaPct={r.deltaPct}
                      />
                    </td>

                    {/* Optional Columns: Aug Δ & Known Total */}
                    {showMoreColumns && (
                      <>
                        <td className="py-3 px-3 text-right font-mono font-medium hidden xl:table-cell">
                          {r.deltaPct == null ? (
                            <span className="text-[var(--muted)]/50 font-normal">—</span>
                          ) : (
                            <span
                              className={r.deltaPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}
                            >
                              {r.deltaPct >= 0 ? '+' : ''}
                              {r.deltaPct.toFixed(0)}%
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-[var(--text)] hidden xl:table-cell">
                          {r.total == null ? (
                            <span className="text-[var(--muted)]/50 font-normal">—</span>
                          ) : (
                            INR(r.total)
                          )}
                        </td>
                      </>
                    )}

                    {/* Match status */}
                    <td className="py-3 px-3 hidden lg:table-cell">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 border text-[10px] font-semibold ${
                          r.status === 'Matched'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40'
                            : r.status === 'Unmatched'
                            ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40'
                            : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>

                    {/* Action Queue: Compact icon + text */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 border text-[10px] font-medium whitespace-nowrap ${
                          r.actionBucket === 'Priority follow-up'
                            ? 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40'
                            : r.actionBucket === 'Recovery'
                            ? 'bg-rose-50 text-rose-800 border-rose-200/80 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40'
                            : r.actionBucket === 'Active MTD'
                            ? 'bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/40'
                            : r.actionBucket === 'Upside'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
                            : 'bg-gray-100 text-gray-700 border-gray-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/50'
                        }`}
                      >
                        {r.actionBucket === 'Priority follow-up' && <Flame className="w-3 h-3 text-amber-500" />}
                        {r.actionBucket === 'Recovery' && <AlertTriangle className="w-3 h-3 text-rose-500" />}
                        {r.actionBucket === 'Active MTD' && <Zap className="w-3 h-3 text-sky-500" />}
                        {r.actionBucket === 'Upside' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                        {r.actionBucket === 'Maintain' && <ShieldCheck className="w-3 h-3 text-gray-400" />}
                        <span>{r.actionBucket}</span>
                      </span>
                    </td>

                    {/* Actions: Exactly 3 Primary Ghost Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap no-print hidden sm:table-cell">
                      <div className="inline-flex items-center gap-1 justify-center relative">
                        {/* 1. Open Account 360 */}
                        {onSelectOrg && (
                          <button
                            onClick={() => onSelectOrg(r)}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                            title={`Account 360° Profile: ${primarySpoc.name} (${primarySpoc.phone})`}
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* 2. Message / Notes (WhatsApp Contact) */}
                        <a
                          href={`https://wa.me/${primarySpoc.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hi ${primarySpoc.name}, regarding corporate travel booking with ${r.orgname || r.domain}...`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-[var(--muted)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                          title={`Message SPOC on WhatsApp: ${primarySpoc.name} (${primarySpoc.phone})`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>

                        {/* 3. More (Dropdown menu with Copy & Ask AI) */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuRowKey(isMenuOpen ? null : rowKey);
                            }}
                            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                            title="More row actions"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </button>

                          {isMenuOpen && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 z-30 w-44 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1 text-xs text-left animate-fadeIn"
                            >
                              <button
                                onClick={() => {
                                  handleRowCopy(r);
                                  setActiveMenuRowKey(null);
                                }}
                                className="w-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-[var(--text)] cursor-pointer"
                              >
                                {isCopied ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                                )}
                                <span>Copy Details</span>
                              </button>

                              {onAskAi && (
                                <button
                                  onClick={() => {
                                    onAskAi(r);
                                    setActiveMenuRowKey(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-[var(--text)] cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Ask Radar AI</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. MINIMAL FOOTER & PAGINATION                                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 border-t border-gray-200/70 dark:border-zinc-800/70 flex items-center justify-between gap-2 text-xs text-[var(--muted)] bg-gray-50/40 dark:bg-zinc-900/30 no-print">
        <div className="font-normal">
          Showing <span className="text-[var(--text)] font-mono font-medium">{(currentPage - 1) * pageSize + 1}</span>–
          <span className="text-[var(--text)] font-mono font-medium">
            {pageSize === -1 ? rows.length : Math.min(currentPage * pageSize, rows.length)}
          </span> of{' '}
          <span className="text-[var(--text)] font-mono font-bold">{rows.length}</span> accounts
          {totalRowsCount > rows.length && (
            <span className="text-[var(--muted)] text-[11px] ml-1">
              (filtered from {totalRowsCount})
            </span>
          )}
        </div>

        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 font-medium text-[var(--text)] font-mono text-xs">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
