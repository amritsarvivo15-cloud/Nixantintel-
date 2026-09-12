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
  Sparkles,
  FileText,
  Plus,
  Clock,
  Tag
} from 'lucide-react';
import {
  DerivedPortfolioRecord,
  SortKey,
  SortDir,
  FilterOptions,
  QuickNotesMap
} from '../types';
import { INR, compact, uniqueRows, formatNoteDate, getOrgDisplayName } from '../utils/formatters';
import { getOrgFullProfile, getAccountQuickNote, saveAccountQuickNote } from '../utils/spocIntelligence';
import {
  getDynamicMonthMeta,
  calculateAccount3MStats,
  Account3MStats,
  ThreeMonthSignalType
} from '../utils/gmv3MonthIntelligence';
import { ThreeMonthSparkline } from './ThreeMonthSparkline';
import { CompanyLogo } from './CompanyLogo';

export interface PortfolioTableProps {
  rows: DerivedPortfolioRecord[];
  totalRowsCount: number;
  onCopyAccount: (r: DerivedPortfolioRecord) => void;
  onAskAi?: (r: DerivedPortfolioRecord, initialPrompt?: string) => void;
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
  quickNotes?: QuickNotesMap;
  onSaveQuickNote?: (orgId: string, noteText: string) => void;
}

const getTagBadgeColor = (tag: string) => {
  const lower = tag.toLowerCase();
  if (lower.includes('strategic') || lower.includes('vip')) return 'bg-amber-500/20 text-[#FFC600] border-amber-500/40';
  if (lower.includes('emerging') || lower.includes('enterprise')) return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  if (lower.includes('at-risk')) return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  if (lower.includes('sme') || lower.includes('pilot')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  return 'bg-[var(--panel-2)] text-[var(--text)] border-[var(--line)]';
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
  dataThroughDate = '10 Sep 2026',
  quickNotes,
  onSaveQuickNote
}) => {
  // 1. Resolve dynamic 3-month rolling window metadata from dataThroughDate
  const monthMeta = useMemo(() => getDynamicMonthMeta(dataThroughDate), [dataThroughDate]);

  // 2. Default sorting: Prioritize Current Month (e.g. SEP MTD) descending
  const [sortKey, setSortKey] = useState<SortKey>('sep');
  const [sortDir, setSortDir] = useState<SortDir>(-1);

  // 3. Productivity Quick Filter
  const [productivityFilter, setProductivityFilter] = useState<
    'all' | 'growing' | 'recovery' | 'declining' | 'active_mtd' | 'dormant' | 'follow_up'
  >('all');

  const [copiedOrg, setCopiedOrg] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [activeMenuRowKey, setActiveMenuRowKey] = useState<string | null>(null);

  // Inline Quick Note editor state
  const [expandedNoteOrg, setExpandedNoteOrg] = useState<string | null>(null);
  const [draftNoteText, setDraftNoteText] = useState<string>('');

  const handleToggleNoteEditor = (orgId: string) => {
    if (expandedNoteOrg === orgId) {
      setExpandedNoteOrg(null);
      setDraftNoteText('');
    } else {
      setExpandedNoteOrg(orgId);
      setDraftNoteText(quickNotes?.[orgId]?.note || '');
    }
  };

  const handleSaveInlineNote = (orgId: string) => {
    if (onSaveQuickNote) {
      onSaveQuickNote(orgId, draftNoteText);
    }
    setExpandedNoteOrg(null);
    setDraftNoteText('');
  };

  const handleCancelInlineNote = () => {
    setExpandedNoteOrg(null);
    setDraftNoteText('');
  };

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

  // Compute 3M Stats for all rows
  const statsMap = useMemo(() => {
    const map = new Map<string, Account3MStats>();
    for (const r of rows) {
      const key = `${r.org}-${r.domain}`;
      map.set(key, calculateAccount3MStats(r, monthMeta));
    }
    return map;
  }, [rows, monthMeta]);

  // Productivity signal counts
  const signalCounts = useMemo(() => {
    let growing = 0;
    let recovery = 0;
    let declining = 0;
    let activeMtd = 0;
    let dormant = 0;

    statsMap.forEach((s) => {
      if (s.signal === 'accelerating' || s.signal === 'growth') growing++;
      else if (s.signal === 'recovery') recovery++;
      else if (s.signal === 'declining' || s.signal === 'watch') declining++;
      else if (s.signal === 'active_mtd' || s.signal === 'new_activity') activeMtd++;
      else if (s.signal === 'dormant') dormant++;
    });

    const followUp = rows.filter((r) => r.actionBucket === 'Priority follow-up' || r.actionBucket === 'Recovery').length;

    return { growing, recovery, declining, activeMtd, dormant, followUp };
  }, [statsMap, rows]);

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

  // Filter rows by productivity filter
  const productivityFilteredRows = useMemo(() => {
    if (productivityFilter === 'all') return rows;

    return rows.filter((r) => {
      const s = statsMap.get(`${r.org}-${r.domain}`);
      if (!s) return true;

      switch (productivityFilter) {
        case 'growing':
          return s.signal === 'accelerating' || s.signal === 'growth';
        case 'recovery':
          return s.signal === 'recovery';
        case 'declining':
          return s.signal === 'declining' || s.signal === 'watch';
        case 'active_mtd':
          return s.signal === 'active_mtd' || s.signal === 'new_activity';
        case 'follow_up':
          return r.actionBucket === 'Priority follow-up' || s.signal === 'recovery';
        default:
          return true;
      }
    });
  }, [rows, productivityFilter, statsMap]);

  // Sorting logic
  const sortedRows = useMemo(() => {
    const list = [...productivityFilteredRows];

    const signalRanks: Record<ThreeMonthSignalType, number> = {
      accelerating: 8,
      growth: 7,
      recovery: 6,
      new_activity: 5,
      active_mtd: 4,
      watch: 3,
      declining: 2,
      dormant: 1
    };

    list.sort((a, b) => {
      const statsA = statsMap.get(`${a.org}-${a.domain}`);
      const statsB = statsMap.get(`${b.org}-${b.domain}`);

      let x: any;
      let y: any;

      if (sortKey === 'idx') {
        x = rows.indexOf(a);
        y = rows.indexOf(b);
      } else if (sortKey === 'pace') {
        x = statsA?.paceVsPrevPct ?? -999999;
        y = statsB?.paceVsPrevPct ?? -999999;
      } else if (sortKey === 'signal') {
        x = statsA ? signalRanks[statsA.signal] : 0;
        y = statsB ? signalRanks[statsB.signal] : 0;
      } else if (sortKey === 'sep' || sortKey === monthMeta.currentKey) {
        x = a.sep ?? -1;
        y = b.sep ?? -1;
      } else if (sortKey === 'aug' || sortKey === monthMeta.prevKey) {
        x = a.aug ?? -1;
        y = b.aug ?? -1;
      } else if (sortKey === 'jul' || sortKey === monthMeta.baselineKey) {
        x = a.jul ?? -1;
        y = b.jul ?? -1;
      } else {
        x = (a as any)[sortKey] ?? a.dynamicMonths?.[sortKey];
        y = (b as any)[sortKey] ?? b.dynamicMonths?.[sortKey];
      }

      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;

      if (typeof x === 'string') {
        return x.localeCompare(String(y)) * sortDir;
      }
      return (Number(x) - Number(y)) * sortDir;
    });

    return list;
  }, [productivityFilteredRows, sortKey, sortDir, statsMap, rows, monthMeta]);

  const handleHeaderClick = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(-1); // Default descending for metrics
    }
    setCurrentPage(1);
  };

  // Human-readable active sort label
  const sortColumnLabel = useMemo(() => {
    switch (sortKey) {
      case 'sep':
        return `${monthMeta.currentShort} MTD`;
      case 'aug':
        return `${monthMeta.prevShort} GMV`;
      case 'jul':
        return `${monthMeta.baselineShort} GMV`;
      case 'pace':
        return 'Pace vs Prev';
      case 'signal':
        return '3M Trend';
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
        return `${monthMeta.prevShort} Δ`;
      case 'total':
        return 'Known Total';
      default:
        return 'Default order';
    }
  }, [sortKey, monthMeta]);

  // Pagination calculation
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return sortedRows;
    const start = (currentPage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, currentPage, pageSize]);

  // Summary KPIs for Header
  const currentMonthTotal = useMemo(() => {
    const u = uniqueRows(rows);
    return u.reduce((s, r) => s + (r.sep ?? 0), 0);
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

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkCopyOrgIds = () => {
    const orgs = selectedRecords
      .map((r) => r.org)
      .filter((o) => o && o !== 'NA')
      .join(', ');
    navigator.clipboard?.writeText(orgs);
    setBulkFeedback(`Copied ${selectedRecords.length} Org IDs`);
    setTimeout(() => setBulkFeedback(null), 2500);
  };

  const handleBulkCopyDomains = () => {
    const domains = selectedRecords.map((r) => r.domain).join('\n');
    navigator.clipboard?.writeText(domains);
    setBulkFeedback(`Copied ${selectedRecords.length} domains`);
    setTimeout(() => setBulkFeedback(null), 2500);
  };

  const handleBulkApplyTag = (tagToApply: string) => {
    if (!tagToApply) return;
    selectedRecords.forEach((r) => {
      const orgId = r.org;
      if (!orgId || orgId === 'NA') return;
      const existing = getAccountQuickNote(orgId);
      const currentTags = existing?.tags || [];
      if (!currentTags.map((t) => t.toLowerCase()).includes(tagToApply.toLowerCase())) {
        const newTags = [...currentTags, tagToApply];
        saveAccountQuickNote(
          orgId,
          existing?.note || '',
          existing?.followUpDate || null,
          existing?.priority || null,
          newTags
        );
      }
    });
    setBulkFeedback(`Assigned tag "${tagToApply}" to ${selectedRecords.length} accounts`);
    setTimeout(() => setBulkFeedback(null), 3000);
  };

  const handleBulkExport = () => {
    if (onExportCsv) onExportCsv();
  };

  const handleRowCopy = (r: DerivedPortfolioRecord) => {
    onCopyAccount(r);
    setCopiedOrg(r.org + r.domain);
    setTimeout(() => setCopiedOrg(null), 2000);
  };

  const activeFiltersCount = filters
    ? [
        filters.search,
        filters.channel,
        filters.status,
        filters.action,
        filters.gmvfilter,
        filters.noteFilter,
        filters.tagFilter
      ].filter(Boolean).length
    : 0;

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return (
        <ArrowUpDown className="w-3 h-3 text-[var(--muted)]/40 inline ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortDir === 1 ? (
      <ArrowUp className="w-3 h-3 text-[#FFC600] inline ml-1 stroke-[2.5]" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#FFC600] inline ml-1 stroke-[2.5]" />
    );
  };

  const isSmartView = viewMode === 'smart';
  const showMoreColumns = !isSmartView;
  const colSpanCount = (isSmartView ? 11 : 15) + dynamicMonthKeys.length;

  // Helper for rendering GMV cell respecting strict data rule: ₹0 vs Missing
  const renderGmvValue = (
    val: number | null | undefined,
    isMissing: boolean,
    emphasis: 'primary' | 'secondary' | 'muted' = 'secondary'
  ) => {
    if (isMissing || val === null || val === undefined) {
      return (
        <span
          className="text-[var(--muted)]/40 font-normal select-none"
          title="Data unavailable in source / unmapped"
        >
          —
        </span>
      );
    }
    if (val === 0) {
      return (
        <span
          className="font-mono text-zinc-500 font-semibold"
          title="Confirmed ₹0 activity"
        >
          ₹0
        </span>
      );
    }

    if (emphasis === 'primary') {
      return (
        <span className="font-mono font-bold text-[var(--text)] tracking-tight text-[13px]">
          {INR(val)}
        </span>
      );
    }
    if (emphasis === 'secondary') {
      return (
        <span className="font-mono font-semibold text-[var(--text)]/90">
          {INR(val)}
        </span>
      );
    }
    return (
      <span className="font-mono font-medium text-[var(--muted)]">
        {INR(val)}
      </span>
    );
  };

  return (
    <div
      id="portfolio-intelligence-container"
      className="rounded-2xl border border-[var(--line)] bg-[var(--panel-solid)] shadow-sm overflow-hidden flex flex-col transition-all text-[var(--text)]"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. PORTFOLIO INTELLIGENCE HEADER BAR                          */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3.5 sm:p-4 border-b border-[var(--line)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--panel-2)]/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#FFC600]/10 border border-[#FFC600]/30 flex items-center justify-center shrink-0 shadow-xs">
            <TrendingUp className="w-5 h-5 text-[#FFC600]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-[var(--text)] tracking-tight">
                3-Month GMV Intelligence
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30">
                {monthMeta.currentLabel} vs {monthMeta.prevShort} & {monthMeta.baselineShort}
              </span>
              <span className="text-[11px] text-[var(--muted)] font-mono">
                Through {monthMeta.dataThroughDate}
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Decision engine: Current month run-rate, 3M micro trends, actionable signals & instant Zeta briefing.
            </p>
          </div>
        </div>

        {/* Global KPIs for current visible selection */}
        <div className="flex items-center gap-2 sm:gap-4 self-start md:self-auto text-xs shrink-0 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] flex flex-col">
            <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">
              {monthMeta.currentShort} MTD Total
            </span>
            <span className="font-mono font-bold text-sm text-[var(--text)]">
              {INR(currentMonthTotal)}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] flex flex-col">
            <span className="text-[10px] text-[var(--muted)] uppercase font-semibold">
              Action Queue Focus
            </span>
            <span className="font-mono font-bold text-sm text-amber-500">
              {priorityCount} High Priority
            </span>
          </div>

          {onOpenDataHub && (
            <button
              onClick={() => onOpenDataHub('smart')}
              className="h-8.5 px-3 rounded-xl border border-[#FFC600] bg-[#FFC600] hover:bg-[#e6b200] text-black text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Open GMV Data Hub to ingest new month or refresh data"
            >
              <RotateCw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Data Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DAILY WORKLIST BANNER                                         */}
      {/* ------------------------------------------------------------- */}
      <div className="px-3.5 sm:px-4 py-3 bg-[var(--panel-2)] border-b border-[var(--line)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setProductivityFilter('follow_up')}
          className="p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-left transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">
              ⚡
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text)] group-hover:text-amber-400">Follow up today</div>
              <div className="text-[10px] text-[var(--muted)]">Priority action queue</div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400">
            {signalCounts.followUp}
          </span>
        </button>

        <button
          onClick={() => setProductivityFilter('declining')}
          className="p-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-left transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400 font-bold">
              📉
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text)] group-hover:text-rose-400">Largest GMV decline</div>
              <div className="text-[10px] text-[var(--muted)]">At-risk contract volume</div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">
            {signalCounts.declining}
          </span>
        </button>

        <button
          onClick={() => setProductivityFilter('recovery')}
          className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-left transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
              🔄
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--text)] group-hover:text-emerald-400">Recovery opportunities</div>
              <div className="text-[10px] text-[var(--muted)]">Rebound in progress</div>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
            {signalCounts.recovery}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PRODUCTIVITY QUICK FILTERS (One-Tap AM Decision Filters)    */}
      {/* ------------------------------------------------------------- */}
      <div className="px-3.5 sm:px-4 py-2 border-b border-[var(--line)] bg-[var(--panel-solid)] flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mr-1 shrink-0">
          Signals:
        </span>

        <button
          onClick={() => setProductivityFilter('all')}
          className={`h-7.5 px-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            productivityFilter === 'all'
              ? 'bg-[#FFC600] text-black font-bold shadow-xs'
              : 'border border-[var(--line)] bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[#FFC600]/40'
          }`}
        >
          <span>All Accounts</span>
          <span className="font-mono text-[11px] opacity-80">({rows.length})</span>
        </button>

        <button
          onClick={() => setProductivityFilter('growing')}
          className={`h-7.5 px-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            productivityFilter === 'growing'
              ? 'bg-emerald-500 text-white font-bold shadow-xs'
              : 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
          }`}
          title="Accelerating & Growth: Pacing higher than previous month"
        >
          <span>🔥 Growing</span>
          <span className="font-mono text-[11px] opacity-90">({signalCounts.growing})</span>
        </button>

        <button
          onClick={() => setProductivityFilter('recovery')}
          className={`h-7.5 px-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            productivityFilter === 'recovery'
              ? 'bg-amber-500 text-black font-bold shadow-xs'
              : 'border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
          }`}
          title="Recovery: September pacing improving after previous contraction"
        >
          <span>↗ Recovery</span>
          <span className="font-mono text-[11px] opacity-90">({signalCounts.recovery})</span>
        </button>

        <button
          onClick={() => setProductivityFilter('active_mtd')}
          className={`h-7.5 px-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            productivityFilter === 'active_mtd'
              ? 'bg-sky-500 text-white font-bold shadow-xs'
              : 'border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
          }`}
          title="Active MTD: Current month bookings recorded"
        >
          <span>⚡ Active MTD</span>
          <span className="font-mono text-[11px] opacity-90">({signalCounts.activeMtd})</span>
        </button>

        <button
          onClick={() => setProductivityFilter('declining')}
          className={`h-7.5 px-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            productivityFilter === 'declining'
              ? 'bg-rose-500 text-white font-bold shadow-xs'
              : 'border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
          }`}
          title="Declining & Watch: Pacing below previous comparable period"
        >
          <span>↓ Declining</span>
          <span className="font-mono text-[11px] opacity-90">({signalCounts.declining})</span>
        </button>

        <button
          onClick={() => setProductivityFilter('dormant')}
          className={`h-7.5 px-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            productivityFilter === 'dormant'
              ? 'bg-zinc-700 text-white font-bold shadow-xs'
              : 'border border-zinc-700/50 bg-zinc-800/40 text-zinc-400 hover:bg-zinc-800'
          }`}
          title="Dormant: Zero recent bookings despite past baseline"
        >
          <span>💤 Dormant</span>
          <span className="font-mono text-[11px] opacity-90">({signalCounts.dormant})</span>
        </button>

        {productivityFilter !== 'all' && (
          <button
            onClick={() => setProductivityFilter('all')}
            className="text-[11px] text-[var(--muted)] hover:text-[var(--text)] underline ml-1 cursor-pointer shrink-0"
          >
            Clear signal
          </button>
        )}

        {/* Sort by GMV (High to Low) & Other Sorts */}
        <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
          <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider hidden md:inline">Sort:</span>
          <select
            id="portfolio-sort-select"
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [key, dir] = e.target.value.split(':');
              setSortKey(key);
              setSortDir(Number(dir) as SortDir);
              setCurrentPage(1);
            }}
            className="h-7.5 px-2.5 rounded-lg border border-[#FFC600]/40 bg-[#FFC600]/10 text-[var(--text)] text-xs font-semibold cursor-pointer focus:outline-none focus:border-[#FFC600]"
            title="Sort portfolio accounts as per GMV high to low or other attributes"
          >
            <option value="sep:-1">Sort by GMV: Sep MTD (High → Low)</option>
            <option value="aug:-1">Sort by GMV: August (High → Low)</option>
            <option value="jul:-1">Sort by GMV: July (High → Low)</option>
            <option value="total:-1">Sort by GMV: Known Total (High → Low)</option>
            <option value="pace:-1">Sort by Pace vs Prev (High → Low)</option>
            <option value="orgname:1">Sort by Account Name (A → Z)</option>
          </select>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CONTROLS BAR: SEARCH, VIEWS & FILTERS                      */}
      {/* ------------------------------------------------------------- */}
      {filters && onFilterChange && (
        <div className="p-3 sm:px-4 border-b border-[var(--line)] bg-[var(--panel-solid)] flex flex-col gap-2.5 no-print">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            {/* Search Input with Keyboard Shortcut */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[#FFC600] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                id="portfolio-search-input"
                type="text"
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                placeholder="Search Org ID, domain or organisation (Press '/' to focus)…"
                className="w-full h-8.5 pl-9 pr-8 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)] text-xs placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] focus:ring-1 focus:ring-[#FFC600]/30 transition-all font-medium shadow-xs"
              />
              {filters.search ? (
                <button
                  onClick={() => onFilterChange('search', '')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)] p-0.5 cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono border border-[var(--line)] bg-[var(--panel-solid)] px-1.5 py-0.2 rounded text-[var(--muted)] pointer-events-none hidden sm:inline">
                  /
                </span>
              )}
            </div>

            {/* Quick Actions: Export CSV, View Mode, Density, Page Size */}
            <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-start">
              {onToggleViewMode && (
                <button
                  onClick={onToggleViewMode}
                  className={`h-8.5 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                    isSmartView
                      ? 'border-[#FFC600] bg-[#FFC600]/15 text-[#FFC600]'
                      : 'border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] hover:border-[#FFC600]/60'
                  }`}
                  title={
                    isSmartView
                      ? 'Smart View Active: Hiding metadata (Channel, Domain) to prioritize 3M GMV, Trends & Quick Notes. Click to expand all columns.'
                      : 'All Columns Grid: Showing full metadata (Channel, Domain, Match Status & Totals). Click for Smart View.'
                  }
                >
                  {isSmartView ? (
                    <Sparkles className="w-3.5 h-3.5 text-[#FFC600]" />
                  ) : (
                    <Columns className="w-3.5 h-3.5 text-[var(--muted)]" />
                  )}
                  <span className="hidden sm:inline">
                    {isSmartView ? 'Smart View' : 'All Columns'}
                  </span>
                  {isSmartView && (
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#FFC600]/20 text-[#FFC600] hidden lg:inline">
                      Prioritized
                    </span>
                  )}
                </button>
              )}

              {onExportCsv && (
                <button
                  onClick={onExportCsv}
                  className="h-8.5 px-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] hover:border-[#FFC600]/60 text-[var(--text)] hover:text-[#FFC600] text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Export visible accounts to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-[#FFC600]" />
                  <span className="hidden md:inline">Export</span>
                </button>
              )}

              {/* Rows per page selector */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8.5 px-2 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] text-xs font-mono font-semibold cursor-pointer focus:outline-none focus:border-[#FFC600] shadow-xs"
                title="Rows per page"
              >
                <option value={25} className="bg-[var(--panel-solid)] text-[var(--text)]">25</option>
                <option value={50} className="bg-[var(--panel-solid)] text-[var(--text)]">50</option>
                <option value={100} className="bg-[var(--panel-solid)] text-[var(--text)]">100</option>
                <option value={-1} className="bg-[var(--panel-solid)] text-[var(--text)]">All</option>
              </select>

              {onToggleDensity && (
                <button
                  onClick={onToggleDensity}
                  className="h-8.5 px-2 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] text-[var(--muted)] hover:text-[var(--text)] text-[11px] font-medium transition-colors hidden xl:inline-flex items-center cursor-pointer shadow-xs"
                  title={`Table density: ${density}. Click to toggle.`}
                >
                  {density === 'compact' ? 'Compact' : 'Comfort'}
                </button>
              )}
            </div>
          </div>

          {/* Row B: Secondary Compact Filters */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            {/* Channel filter */}
            <select
              id="filter-channel"
              value={filters.channel}
              onChange={(e) => onFilterChange('channel', e.target.value)}
              className={`h-7.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                filters.channel
                  ? 'border-[#FFC600] bg-[#FFC600]/15 text-[#FFC600]'
                  : 'border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] hover:border-[#FFC600]/50'
              }`}
            >
              <option value="" className="bg-[var(--panel-solid)] text-[var(--text)]">Channel: All</option>
              <option value="SME+" className="bg-[var(--panel-solid)] text-[var(--text)]">SME+</option>
              <option value="SEM" className="bg-[var(--panel-solid)] text-[var(--text)]">SEM</option>
              <option value="SMEV" className="bg-[var(--panel-solid)] text-[var(--text)]">SMEV</option>
              <option value="—" className="bg-[var(--panel-solid)] text-[var(--text)]">Unassigned (—)</option>
            </select>

            {/* Status filter */}
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className={`h-7.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                filters.status
                  ? 'border-[#FFC600] bg-[#FFC600]/15 text-[#FFC600]'
                  : 'border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] hover:border-[#FFC600]/50'
              }`}
            >
              <option value="" className="bg-[var(--panel-solid)] text-[var(--text)]">Status: All</option>
              <option value="Matched" className="bg-[var(--panel-solid)] text-[var(--text)]">Matched</option>
              <option value="Unmatched" className="bg-[var(--panel-solid)] text-[var(--text)]">Unmatched</option>
              <option value="No Org ID" className="bg-[var(--panel-solid)] text-[var(--text)]">No Org ID</option>
            </select>

            {/* Action filter */}
            <select
              id="filter-action"
              value={filters.action}
              onChange={(e) => onFilterChange('action', e.target.value)}
              className={`h-7.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                filters.action
                  ? 'border-[#FFC600] bg-[#FFC600]/15 text-[#FFC600]'
                  : 'border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] hover:border-[#FFC600]/50'
              }`}
            >
              <option value="" className="bg-[var(--panel-solid)] text-[var(--text)]">Action: All</option>
              <option value="Priority follow-up" className="bg-[var(--panel-solid)] text-[var(--text)]">Priority follow-up</option>
              <option value="Recovery" className="bg-[var(--panel-solid)] text-[var(--text)]">Recovery</option>
              <option value="Upside" className="bg-[var(--panel-solid)] text-[var(--text)]">Upside / Growth</option>
              <option value="Active MTD" className="bg-[var(--panel-solid)] text-[var(--text)]">Active MTD</option>
              <option value="Maintain" className="bg-[var(--panel-solid)] text-[var(--text)]">Maintain</option>
            </select>

            {/* Spend filter */}
            <select
              id="filter-spend"
              value={filters.gmvfilter}
              onChange={(e) => onFilterChange('gmvfilter', e.target.value as any)}
              className={`h-7.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                filters.gmvfilter
                  ? 'border-[#FFC600] bg-[#FFC600]/15 text-[#FFC600]'
                  : 'border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] hover:border-[#FFC600]/50'
              }`}
            >
              <option value="" className="bg-[var(--panel-solid)] text-[var(--text)]">Spend: All</option>
              <option value="100k" className="bg-[var(--panel-solid)] text-[var(--text)]">₹1L+ {monthMeta.baselineShort}</option>
              <option value="250k" className="bg-[var(--panel-solid)] text-[var(--text)]">₹2.5L+ {monthMeta.baselineShort}</option>
              <option value="zero" className="bg-[var(--panel-solid)] text-[var(--text)]">{monthMeta.baselineShort} = ₹0</option>
            </select>

            {/* Dedicated Quick Note filter */}
            <select
              id="filter-quick-note"
              value={filters.noteFilter || ''}
              onChange={(e) => onFilterChange('noteFilter', e.target.value as any)}
              className={`h-7.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                filters.noteFilter
                  ? 'border-[#FFC600] bg-[#FFC600]/15 text-[#FFC600]'
                  : 'border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] hover:border-[#FFC600]/50'
              }`}
              title="Filter by presence of Quick Notes"
            >
              <option value="" className="bg-[var(--panel-solid)] text-[var(--text)]">Notes: All</option>
              <option value="has_note" className="bg-[var(--panel-solid)] text-[var(--text)]">📝 Has Quick Note</option>
              <option value="no_note" className="bg-[var(--panel-solid)] text-[var(--text)]">No Quick Note</option>
            </select>

            {/* Business Segment Tag filter */}
            <select
              id="filter-tag"
              value={filters.tagFilter || ''}
              onChange={(e) => onFilterChange('tagFilter', e.target.value)}
              className={`h-7.5 px-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                filters.tagFilter
                  ? 'border-[#FFC600] bg-[#FFC600]/15 text-[#FFC600]'
                  : 'border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] hover:border-[#FFC600]/50'
              }`}
              title="Filter by assigned business segment tag"
            >
              <option value="" className="bg-[var(--panel-solid)] text-[var(--text)]">Tag: All</option>
              <option value="Strategic" className="bg-[var(--panel-solid)] text-[var(--text)]">Strategic</option>
              <option value="Emerging" className="bg-[var(--panel-solid)] text-[var(--text)]">Emerging</option>
              <option value="At-Risk" className="bg-[var(--panel-solid)] text-[var(--text)]">At-Risk</option>
              <option value="VIP" className="bg-[var(--panel-solid)] text-[var(--text)]">VIP</option>
              <option value="Enterprise" className="bg-[var(--panel-solid)] text-[var(--text)]">Enterprise</option>
              <option value="SME" className="bg-[var(--panel-solid)] text-[var(--text)]">SME</option>
              <option value="Pilot" className="bg-[var(--panel-solid)] text-[var(--text)]">Pilot</option>
            </select>

            {/* Reset Filters */}
            {(activeFiltersCount > 0 || productivityFilter !== 'all') && (
              <button
                id="btn-reset-filters"
                onClick={() => {
                  setProductivityFilter('all');
                  if (onResetFilters) onResetFilters();
                }}
                className="h-7.5 px-2.5 rounded-lg text-xs font-bold text-rose-500 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset all active filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}

            {/* Account count indicator & active sort */}
            <div className="ml-auto text-[11px] text-[var(--muted)] font-medium flex items-center gap-2">
              <span className="hidden sm:inline">
                Sorted by <strong className="text-[#FFC600] font-semibold">{sortColumnLabel}</strong> ({sortDir === -1 ? 'Desc' : 'Asc'})
              </span>
              <span>
                Showing <strong className="text-[var(--text)] font-mono">{sortedRows.length}</strong> of {totalRowsCount}
              </span>
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
            className="px-2 py-1 rounded bg-[var(--panel-solid)] border border-[var(--line)] hover:border-[#FFC600] text-[var(--text)] font-medium transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <Copy className="w-3 h-3 text-[#FFC600]" />
            <span>Copy IDs</span>
          </button>

          <button
            onClick={handleBulkCopyDomains}
            className="px-2 py-1 rounded bg-[var(--panel-solid)] border border-[var(--line)] hover:border-[#FFC600] text-[var(--text)] font-medium transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
          >
            <Copy className="w-3 h-3 text-[#FFC600]" />
            <span>Copy Domains</span>
          </button>

          {onExportCsv && (
            <button
              onClick={handleBulkExport}
              className="px-2 py-1 rounded bg-[var(--panel-solid)] border border-[var(--line)] hover:border-[#FFC600] text-[var(--text)] font-medium transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Download className="w-3 h-3 text-[#FFC600]" />
              <span>Export</span>
            </button>
          )}

          <div className="h-3.5 w-px bg-amber-500/30 mx-0.5" />

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[var(--muted)] flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#FFC600]" />
              <span>Bulk Tag:</span>
            </span>
            {['Strategic', 'Emerging', 'At-Risk', 'VIP', 'Enterprise'].map((preset) => (
              <button
                key={preset}
                onClick={() => handleBulkApplyTag(preset)}
                className="px-2 py-1 rounded bg-[var(--panel-solid)] border border-[var(--line)] hover:border-[#FFC600] text-[var(--text)] font-semibold transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                title={`Assign tag "${preset}" to all ${selectedRecords.length} selected accounts`}
              >
                <span>+ {preset}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setSelectedIds(new Set())}
            className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded text-[var(--muted)] hover:text-[var(--text)] cursor-pointer ml-auto"
            title="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {bulkFeedback && (
            <span className="text-[11px] font-bold text-amber-500 ml-1 animate-pulse">
              {bulkFeedback}
            </span>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. MOBILE / COMPACT INTELLIGENCE CARDS (Screens < md)         */}
      {/* ------------------------------------------------------------- */}
      <div className="md:hidden divide-y divide-[var(--line)] max-h-[75vh] overflow-y-auto">
        {paginatedRows.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--muted)]">
            <Building2 className="w-8 h-8 text-[var(--muted)]/40 mx-auto mb-2" />
            <div>No accounts match current filters.</div>
          </div>
        ) : (
          paginatedRows.map((r, idx) => {
            const rowKey = `${r.org}-${r.domain}`;
            const stats = statsMap.get(rowKey)!;
            const profile = getOrgFullProfile(r);
            const primarySpoc = profile.spocs[0];
            const savedNote = quickNotes?.[r.org];
            const isNoteExpanded = expandedNoteOrg === r.org;

            return (
              <div
                key={`mob-${rowKey}-${idx}`}
                className={`p-3 transition-colors ${
                  selectedIds.has(rowKey) ? 'bg-amber-500/[0.08]' : 'hover:bg-[var(--panel-2)]/50'
                }`}
              >
                {/* Mobile Card Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <CompanyLogo
                      domain={r.domain}
                      companyName={getOrgDisplayName(r)}
                      size={32}
                      onClick={() => onSelectOrg?.(r)}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => onSelectOrg?.(r)}
                          className="font-bold text-xs text-[var(--text)] hover:text-[#FFC600] text-left truncate block max-w-[170px]"
                        >
                          {getOrgDisplayName(r)}
                        </button>
                        {savedNote?.tags?.map((tag) => (
                          <span
                            key={tag}
                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold border ${getTagBadgeColor(tag)}`}
                            title={`Business Segment Tag: ${tag}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--muted)] font-mono truncate mt-0.5">
                        {!isSmartView && (
                          <>
                            <span>{r.domain}</span>
                            <span>•</span>
                            <span className="text-[#FFC600] font-bold">{r.channel}</span>
                            <span>•</span>
                          </>
                        )}
                        <span>#{r.org}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3M Trend Micro Sparkline + Signal */}
                  <div className="flex flex-col items-end shrink-0">
                    <ThreeMonthSparkline stats={stats} meta={monthMeta} width={48} height={18} />
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border mt-0.5 ${stats.signalBadgeClass}`}
                    >
                      {stats.signalLabel}
                    </span>
                  </div>
                </div>

                {/* Mobile 3-Month GMV Metrics Row */}
                <div className="grid grid-cols-3 gap-2 mt-2.5 p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] text-center">
                  {/* Current MTD (Highlighted) */}
                  <div className="border-r border-[var(--line)] pr-1">
                    <div className="text-[9px] font-bold text-[#FFC600] uppercase tracking-wider">
                      {monthMeta.currentLabel}
                    </div>
                    <div className="text-xs font-mono font-bold text-[var(--text)] mt-0.5">
                      {renderGmvValue(stats.curVal, stats.isCurMissing, 'primary')}
                    </div>
                  </div>

                  {/* Previous GMV */}
                  <div className="border-r border-[var(--line)] px-1">
                    <div className="text-[9px] font-semibold text-[var(--muted)] uppercase tracking-wider">
                      {monthMeta.prevShort}
                    </div>
                    <div className="text-xs font-mono text-[var(--text)] mt-0.5">
                      {renderGmvValue(stats.prevVal, stats.isPrevMissing, 'secondary')}
                    </div>
                  </div>

                  {/* Baseline GMV */}
                  <div className="pl-1">
                    <div className="text-[9px] font-semibold text-[var(--muted)]/70 uppercase tracking-wider">
                      {monthMeta.baselineShort}
                    </div>
                    <div className="text-xs font-mono text-[var(--muted)] mt-0.5">
                      {renderGmvValue(stats.baseVal, stats.isBaseMissing, 'muted')}
                    </div>
                  </div>
                </div>

                {/* Pace & Diagnostic Subtext */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--muted)]">
                  <span className="font-mono text-[#FFC600]">
                    Pace: {stats.paceLabel}
                  </span>
                  <span className="text-[9px] truncate max-w-[150px]" title={stats.shortReason}>
                    {stats.shortReason}
                  </span>
                </div>

                {/* Mobile Card Action Bar */}
                <div className="mt-2.5 pt-2 border-t border-[var(--line)] flex items-center justify-between gap-1">
                  {/* Compact Ask Zeta */}
                  {onAskAi && (
                    <button
                      onClick={() =>
                        onAskAi(
                          r,
                          `Give me an executive 3-month GMV intelligence analysis for ${r.orgname || r.domain} (Org #${r.org}). Explain its ${stats.signalLabel} trend and recommend the best next action.`
                        )
                      }
                      className="px-2 py-1 rounded-lg border border-[#FFC600]/40 bg-[#FFC600]/10 hover:bg-[#FFC600]/20 text-[#FFC600] text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      title="Ask Zeta for 3M intelligence briefing"
                    >
                      <span className="text-xs">🐼</span>
                      <span>Ask Zeta</span>
                    </button>
                  )}

                  {/* Quick Note Chip */}
                  {savedNote?.note ? (
                    <button
                      onClick={() => handleToggleNoteEditor(r.org)}
                      className="px-2 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 text-[#FFC600] text-[10px] truncate max-w-[120px] cursor-pointer"
                    >
                      📝 {savedNote.note}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleNoteEditor(r.org)}
                      className="px-2 py-1 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[#FFC600] text-[10px] cursor-pointer"
                    >
                      + Note
                    </button>
                  )}

                  {/* WhatsApp */}
                  <a
                    href={`https://wa.me/${primarySpoc.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      `Hi ${primarySpoc.name}, regarding corporate bookings for ${r.orgname || r.domain}...`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-emerald-400"
                    title={`WhatsApp ${primarySpoc.name}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>

                  {/* Account 360 */}
                  {onSelectOrg && (
                    <button
                      onClick={() => onSelectOrg(r)}
                      className="p-1.5 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]"
                      title="Open 360 Dossier"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Mobile Inline Quick Note Editor */}
                {isNoteExpanded && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-[var(--panel-2)] border border-[#FFC600]/40">
                    <textarea
                      autoFocus
                      value={draftNoteText}
                      onChange={(e) => setDraftNoteText(e.target.value)}
                      placeholder="Add account follow-up or next action…"
                      rows={2}
                      className="w-full p-2 text-xs rounded-lg border border-[var(--line)] bg-[var(--panel-solid)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600]"
                    />
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      <button
                        onClick={handleCancelInlineNote}
                        className="px-2.5 py-1 text-[11px] text-[var(--muted)]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveInlineNote(r.org)}
                        className="px-3 py-1 rounded-lg bg-[#FFC600] text-black font-bold text-[11px]"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. DESKTOP & TABLET 3-MONTH INTELLIGENCE TABLE (Screens >= md)*/}
      {/* ------------------------------------------------------------- */}
      <div className="hidden md:block portfolio-table-scroll overflow-x-auto max-h-[70vh] overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="sticky top-0 z-10 bg-[var(--panel-2)]/95 backdrop-blur-xs border-b border-[var(--line)] text-[var(--muted)] uppercase tracking-wider text-[10px] select-none font-semibold">
              {/* Checkbox */}
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

              {/* Account / Organisation (Domain hidden in Smart View) */}
              <th
                onClick={() => handleHeaderClick('orgname')}
                className="py-2.5 px-3 cursor-pointer hover:text-[var(--text)] min-w-[190px] lg:min-w-[220px]"
              >
                {isSmartView ? 'Account' : 'Account / Domain'} {renderSortIcon('orgname')}
              </th>

              {/* Channel (Hidden in Smart View, shown in Expanded Grid) */}
              {!isSmartView && (
                <th
                  onClick={() => handleHeaderClick('channel')}
                  className="py-2.5 px-2.5 cursor-pointer hover:text-[var(--text)] hidden lg:table-cell w-20"
                >
                  Channel {renderSortIcon('channel')}
                </th>
              )}

              {/* 1. CURRENT MONTH MTD (Strongest visual hierarchy) */}
              <th
                onClick={() => handleHeaderClick('sep')}
                className={`py-2.5 px-3 text-right cursor-pointer transition-colors bg-[#FFC600]/[0.06] border-x border-[#FFC600]/20 font-bold ${
                  sortKey === 'sep' ? 'text-[#FFC600]' : 'text-[var(--text)] hover:text-[#FFC600]'
                }`}
                title={`Current Month MTD: Through ${monthMeta.dataThroughDate}. Primary metric.`}
              >
                <div className="flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFC600] animate-pulse" />
                  <span>{monthMeta.currentLabel}</span>
                  {renderSortIcon('sep')}
                </div>
              </th>

              {/* 2. PREVIOUS MONTH GMV (Secondary) */}
              <th
                onClick={() => handleHeaderClick('aug')}
                className={`py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] ${
                  sortKey === 'aug' ? 'text-[#FFC600] font-bold' : ''
                }`}
                title={`Previous month full volume: ${monthMeta.prevLabel}`}
              >
                {monthMeta.prevLabel} {renderSortIcon('aug')}
              </th>

              {/* 3. BASELINE MONTH GMV (Historical / Muted) */}
              <th
                onClick={() => handleHeaderClick('jul')}
                className={`py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] text-[var(--muted)] ${
                  sortKey === 'jul' ? 'text-[#FFC600] font-bold' : ''
                }`}
                title={`Baseline month historical volume: ${monthMeta.baselineLabel}`}
              >
                {monthMeta.baselineLabel} {renderSortIcon('jul')}
              </th>

              {/* Any Dynamic Ingested Months (e.g. Oct, Nov) */}
              {dynamicMonthKeys.map((mKey) => (
                <th
                  key={mKey}
                  onClick={() => handleHeaderClick(mKey as any)}
                  className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] font-bold text-[#FFC600]"
                >
                  {mKey.toUpperCase()} GMV {renderSortIcon(mKey as any)}
                </th>
              ))}

              {/* 4. MOM / PACE COMPARISON */}
              <th
                onClick={() => handleHeaderClick('pace')}
                className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] min-w-[110px]"
                title="Pace vs previous month equivalent elapsed days"
              >
                MoM Pace {renderSortIcon('pace')}
              </th>

              {/* 5. 3M TREND & SIGNAL */}
              <th
                onClick={() => handleHeaderClick('signal')}
                className="py-2.5 px-3 text-center cursor-pointer hover:text-[var(--text)] min-w-[140px]"
                title="3-month micro trend sparkline and intelligent signal"
              >
                3M Trend {renderSortIcon('signal')}
              </th>

              {/* Optional Analytical Columns: Aug Δ, Total & Match */}
              {showMoreColumns && (
                <>
                  <th
                    onClick={() => handleHeaderClick('deltaPct')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] hidden xl:table-cell"
                  >
                    {monthMeta.prevShort} Δ {renderSortIcon('deltaPct')}
                  </th>
                  <th
                    onClick={() => handleHeaderClick('total')}
                    className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text)] hidden xl:table-cell"
                  >
                    Known Total {renderSortIcon('total')}
                  </th>
                  <th
                    onClick={() => handleHeaderClick('status')}
                    className="py-2.5 px-3 cursor-pointer hover:text-[var(--text)] hidden xl:table-cell"
                  >
                    Match {renderSortIcon('status')}
                  </th>
                </>
              )}

              {/* 6. ACTION QUEUE */}
              <th
                onClick={() => handleHeaderClick('actionBucket')}
                className="py-2.5 px-3 cursor-pointer hover:text-[var(--text)] min-w-[125px]"
              >
                Action Queue {renderSortIcon('actionBucket')}
              </th>

              {/* 7. QUICK NOTE (Prioritized in Smart View across desktop & laptop viewports) */}
              <th
                className={`py-2.5 px-3 hover:text-[var(--text)] min-w-[170px] ${
                  isSmartView ? 'hidden md:table-cell' : 'hidden xl:table-cell'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#FFC600]" />
                  <span>Quick Note</span>
                </span>
              </th>

              {/* 8. ACTIONS: ZETA, WHATSAPP & MORE */}
              <th className="py-2.5 px-3 text-center no-print min-w-[130px]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--line)]">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={colSpanCount}
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
                const savedNote = quickNotes?.[r.org];
                const isNoteExpanded = expandedNoteOrg === r.org;
                const stats = statsMap.get(rowKey)!;

                const rowHeightClass = density === 'compact' ? 'h-[52px]' : 'h-[64px]';
                const cellPyClass = density === 'compact' ? 'py-1.5' : 'py-2.5';

                return (
                  <React.Fragment key={`${rowKey}-${idx}`}>
                    <tr
                      className={`transition-colors hover:bg-[var(--panel-2)]/60 ${rowHeightClass} ${
                        isSelected ? 'bg-amber-500/[0.08]' : ''
                      } ${isNoteExpanded ? 'bg-[var(--panel-2)]' : ''}`}
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
                      <td className="py-2.5 px-2 text-[var(--muted)] font-mono text-[11px] hidden sm:table-cell">
                        {globalIndex}
                      </td>

                      {/* Account / Domain */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo
                            domain={r.domain}
                            companyName={r.orgname || r.domain || 'Organisation'}
                            size={32}
                            onClick={() => onSelectOrg?.(r)}
                            title={`Open 360° dossier for ${r.orgname || r.domain}`}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => onSelectOrg?.(r)}
                                className="block truncate text-left font-semibold text-xs sm:text-sm text-[var(--text)] hover:text-[#FFC600] transition-colors cursor-pointer max-w-[200px] lg:max-w-[240px]"
                                title={`Open SPOC & Strategy Dossier for ${r.orgname || r.domain}`}
                              >
                                {r.orgname || r.domain}
                              </button>

                              {savedNote?.tags?.map((tag) => (
                                <span
                                  key={tag}
                                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-extrabold border ${getTagBadgeColor(tag)}`}
                                  title={`Business Segment Tag: ${tag}`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                              {/* In Smart View, hide raw domain string to prioritize clean account focus; show in All Columns mode */}
                              {!isSmartView && (
                                <span
                                  className="truncate text-[11px] text-[var(--muted)] font-mono max-w-[120px]"
                                  title={r.domain}
                                >
                                  {r.domain}
                                </span>
                              )}

                              <span className="rounded border border-[var(--line)] bg-[var(--panel-solid)] px-1 py-0.2 text-[10px] text-[var(--muted)] font-mono font-medium">
                                #{r.org}
                              </span>

                              {/* Inline Quick Note preview on compact screens when note column is hidden */}
                              {savedNote?.note && (!isSmartView || density === 'compact') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleNoteEditor(r.org);
                                  }}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-[#FFC600] text-[10px] font-medium transition-all cursor-pointer truncate max-w-[130px] md:hidden"
                                  title={`Note: "${savedNote.note}" (Click to edit)`}
                                >
                                  <FileText className="w-2.5 h-2.5 shrink-0 text-[#FFC600]" />
                                  <span className="truncate">{savedNote.note}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Channel (Hidden in Smart View, shown in Expanded Grid) */}
                      {!isSmartView && (
                        <td className="py-2.5 px-2.5 text-[var(--muted)] font-medium hidden lg:table-cell">
                          <span className="px-1.5 py-0.5 rounded border border-[var(--line)] bg-[var(--panel-solid)] text-[10px] font-mono">
                            {r.channel}
                          </span>
                        </td>
                      )}

                      {/* 1. CURRENT MONTH MTD (Highest visual emphasis, highlighted background) */}
                      <td className="py-2.5 px-3 text-right bg-[#FFC600]/[0.04] border-x border-[#FFC600]/15">
                        <div className="flex flex-col items-end">
                          {renderGmvValue(stats.curVal, stats.isCurMissing, 'primary')}
                          {stats.curVal != null && stats.curVal > 0 && stats.projectedRunRate != null && (
                            <span
                              className="text-[9px] font-mono text-[var(--muted)]"
                              title={`Projected run-rate: ${INR(stats.projectedRunRate)} full month`}
                            >
                              RR: {compact(stats.projectedRunRate)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. PREVIOUS MONTH GMV (Secondary emphasis) */}
                      <td className="py-2.5 px-3 text-right">
                        {renderGmvValue(stats.prevVal, stats.isPrevMissing, 'secondary')}
                      </td>

                      {/* 3. BASELINE MONTH GMV (Historical / Muted) */}
                      <td className="py-2.5 px-3 text-right">
                        {renderGmvValue(stats.baseVal, stats.isBaseMissing, 'muted')}
                      </td>

                      {/* Dynamic Ingested Months (e.g. Oct, Nov) */}
                      {dynamicMonthKeys.map((mKey) => {
                        const val = r.dynamicMonths ? r.dynamicMonths[mKey] : null;
                        return (
                          <td
                            key={mKey}
                            className="py-2.5 px-3 text-right font-mono font-bold text-[#FFC600]"
                          >
                            {val != null ? (
                              INR(val)
                            ) : (
                              <span className="text-[var(--muted)]/40 font-normal">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* 4. MOM / PACE COMPARISON */}
                      <td className="py-2.5 px-3 text-right">
                        {stats.paceVsPrevPct != null ? (
                          <div
                            className="flex flex-col items-end cursor-help"
                            title={`Current pace vs ${monthMeta.prevShort} equivalent (${monthMeta.daysPassed} days): ${
                              stats.paceVsPrevPct >= 0 ? '+' : ''
                            }${stats.paceVsPrevPct.toFixed(1)}%\nVs full ${monthMeta.prevShort}: ${
                              stats.curVsFullPrevPct != null
                                ? `${stats.curVsFullPrevPct >= 0 ? '+' : ''}${stats.curVsFullPrevPct.toFixed(0)}%`
                                : '—'
                            }`}
                          >
                            <span
                              className={`font-mono font-bold text-xs flex items-center gap-0.5 ${
                                stats.paceVsPrevPct >= 20
                                  ? 'text-emerald-500'
                                  : stats.paceVsPrevPct > 0
                                  ? 'text-emerald-400'
                                  : stats.paceVsPrevPct >= -15
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {stats.paceVsPrevPct > 0 ? (
                                <ArrowUp className="w-3 h-3 stroke-[2.5]" />
                              ) : stats.paceVsPrevPct < 0 ? (
                                <ArrowDown className="w-3 h-3 stroke-[2.5]" />
                              ) : (
                                <Minus className="w-3 h-3" />
                              )}
                              <span>
                                {stats.paceVsPrevPct >= 0 ? '+' : ''}
                                {stats.paceVsPrevPct.toFixed(0)}%
                              </span>
                            </span>
                            <span className="text-[9px] font-mono text-[var(--muted)]">
                              vs {monthMeta.prevShort} pace
                            </span>
                          </div>
                        ) : stats.curVal != null && stats.curVal > 0 ? (
                          <span className="text-[10px] font-mono text-sky-400 font-semibold">
                            Live MTD
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]/40 font-mono">—</span>
                        )}
                      </td>

                      {/* 5. 3M TREND & SIGNAL */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <ThreeMonthSparkline stats={stats} meta={monthMeta} />
                          <span
                            className={`inline-flex items-center px-1.5 py-0.2 rounded border text-[9px] font-bold tracking-tight whitespace-nowrap cursor-help ${stats.signalBadgeClass}`}
                            title={`${stats.signalLabel}: ${stats.detailedExplanation}`}
                          >
                            {stats.signalLabel}
                          </span>
                        </div>
                      </td>

                      {/* Optional Columns: Aug Δ, Known Total & Match */}
                      {showMoreColumns && (
                        <>
                          <td className="py-2.5 px-3 text-right font-mono font-medium hidden xl:table-cell">
                            {r.deltaPct == null ? (
                              <span className="text-[var(--muted)]/40 font-normal">—</span>
                            ) : (
                              <span
                                className={
                                  r.deltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }
                              >
                                {r.deltaPct >= 0 ? '+' : ''}
                                {r.deltaPct.toFixed(0)}%
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-[var(--text)] hidden xl:table-cell">
                            {r.total == null ? (
                              <span className="text-[var(--muted)]/40 font-normal">—</span>
                            ) : (
                              INR(r.total)
                            )}
                          </td>
                          <td className="py-2.5 px-3 hidden xl:table-cell">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 border text-[10px] font-semibold ${
                                r.status === 'Matched'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : r.status === 'Unmatched'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              }`}
                            >
                              {r.status}
                            </span>
                          </td>
                        </>
                      )}

                      {/* 6. ACTION QUEUE */}
                      <td className="py-2.5 px-3">
                        <div className="relative group/action inline-block">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onAskAi) {
                                onAskAi(
                                  r,
                                  `Why is ${r.orgname || r.domain} assigned to '${r.actionBucket}' in the Action Queue? Provide a diagnosis based on its 3-month GMV (${monthMeta.baselineShort}: ${INR(stats.baseVal)}, ${monthMeta.prevShort}: ${INR(stats.prevVal)}, ${monthMeta.currentShort} MTD: ${INR(stats.curVal)}) and suggest next steps.`
                                );
                              }
                            }}
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 border text-[10px] font-medium whitespace-nowrap cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                              r.actionBucket === 'Priority follow-up'
                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:border-amber-400'
                                : r.actionBucket === 'Recovery'
                                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:border-rose-400'
                                : r.actionBucket === 'Active MTD'
                                ? 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:border-sky-400'
                                : r.actionBucket === 'Upside'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
                                : r.actionBucket === 'Dormant'
                                ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'
                                : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/50 hover:border-zinc-500'
                            }`}
                            title={`Action: ${stats.actionRecommendation} (Click to Ask Zeta)`}
                          >
                            {r.actionBucket === 'Priority follow-up' && (
                              <Flame className="w-3 h-3 text-amber-400" />
                            )}
                            {r.actionBucket === 'Recovery' && (
                              <AlertTriangle className="w-3 h-3 text-rose-400" />
                            )}
                            {r.actionBucket === 'Active MTD' && (
                              <Zap className="w-3 h-3 text-sky-400" />
                            )}
                            {r.actionBucket === 'Upside' && (
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                            )}
                            {r.actionBucket === 'Dormant' && (
                              <Clock className="w-3 h-3 text-zinc-400" />
                            )}
                            {r.actionBucket === 'Maintain' && (
                              <ShieldCheck className="w-3 h-3 text-zinc-400" />
                            )}
                            <span>{r.actionBucket}</span>
                          </button>

                          {/* Zeta Explanatory Hover Card */}
                          <div className="pointer-events-none opacity-0 group-hover/action:opacity-100 transition-opacity duration-150 absolute left-0 bottom-full mb-1.5 z-40 w-64 p-2.5 rounded-xl bg-[#0e1420] border border-[#FFC600]/40 text-[#f5f6f8] text-[11px] shadow-2xl">
                            <div className="flex items-center gap-1.5 font-bold text-[#FFC600] mb-1">
                              <Sparkles className="w-3 h-3" />
                              <span>Zeta 3M Action Intelligence</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 leading-snug">
                              {stats.detailedExplanation}
                            </p>
                            <div className="mt-1.5 pt-1.5 border-t border-zinc-800 flex items-center justify-between text-[10px] text-[#FFC600]/90">
                              <span>Next: {stats.actionRecommendation}</span>
                              <span>Ask Zeta →</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 7. QUICK NOTE COLUMN (Prioritized in Smart View across desktop & laptop viewports) */}
                      <td
                        className={`py-2.5 px-3 ${
                          isSmartView ? 'hidden md:table-cell' : 'hidden xl:table-cell'
                        }`}
                      >
                        {savedNote?.note ? (
                          <div
                            onClick={() => handleToggleNoteEditor(r.org)}
                            className="group cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-[#FFC600] p-1.5 transition-all max-w-[210px]"
                            title="Click to edit Quick Note"
                          >
                            <div className="flex items-center justify-between gap-1 text-[10px] text-amber-400 font-semibold mb-0.5">
                              <span className="flex items-center gap-1">
                                <FileText className="w-2.5 h-2.5 text-[#FFC600]" />
                                <span>Note</span>
                              </span>
                              <span className="text-[9px] text-amber-400/80 font-mono">
                                {formatNoteDate(savedNote.updatedAt)}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#e0e6ed] line-clamp-2 leading-tight font-sans">
                              {savedNote.note}
                            </p>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleToggleNoteEditor(r.org)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-[var(--line)] hover:border-[#FFC600]/60 bg-[var(--panel-solid)] hover:bg-[var(--panel-2)] text-[var(--muted)] hover:text-[#FFC600] text-[11px] font-medium transition-all cursor-pointer"
                            title="Add quick note for this account"
                          >
                            <Plus className="w-3 h-3 text-[#FFC600]" />
                            <span>Add note</span>
                          </button>
                        )}
                      </td>

                      {/* 8. ACTIONS: ZETA, WHATSAPP & MORE */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap no-print">
                        <div className="inline-flex items-center gap-1.5 justify-center relative">
                          {/* Compact High-Contrast Ask Zeta Button */}
                          {onAskAi && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAskAi(
                                  r,
                                  `Give me an executive 3-month GMV intelligence analysis for ${r.orgname || r.domain} (Org #${r.org}). Explain its ${stats.signalLabel} trend and recommend the best next action.`
                                );
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[#FFC600]/40 bg-[#FFC600]/10 hover:bg-[#FFC600]/20 hover:border-[#FFC600] text-[#FFC600] text-[11px] font-bold transition-all shadow-xs cursor-pointer group/zeta shrink-0"
                              title={`Ask Zeta for instant 3M analysis of ${r.orgname || r.domain}`}
                            >
                              <span className="text-xs group-hover/zeta:scale-110 transition-transform">🐼</span>
                              <span>Ask Zeta</span>
                            </button>
                          )}

                          {/* WhatsApp SPOC Quick Contact */}
                          <a
                            href={`https://wa.me/${primarySpoc.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hi ${primarySpoc.name}, regarding corporate bookings for ${r.orgname || r.domain}...`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-emerald-950/40 text-[var(--muted)] hover:text-emerald-400 transition-colors cursor-pointer"
                            title={`Message SPOC on WhatsApp: ${primarySpoc.name} (${primarySpoc.phone})`}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>

                          {/* More dropdown */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuRowKey(isMenuOpen ? null : rowKey);
                              }}
                              className="p-1.5 rounded-md hover:bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                              title="More row options"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>

                            {isMenuOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 z-30 w-52 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] shadow-2xl py-1 text-xs text-left animate-fadeIn"
                              >
                                {onSelectOrg && (
                                  <button
                                    onClick={() => {
                                      onSelectOrg(r);
                                      setActiveMenuRowKey(null);
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-[var(--panel-2)] flex items-center gap-2 text-[var(--text)] cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5 text-[#FFC600]" />
                                    <span>Open 360° Dossier</span>
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    handleToggleNoteEditor(r.org);
                                    setActiveMenuRowKey(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-[var(--panel-2)] flex items-center gap-2 text-[var(--text)] cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5 text-[#FFC600]" />
                                  <span>{savedNote?.note ? 'Edit Quick Note' : 'Add Quick Note'}</span>
                                </button>

                                <button
                                  onClick={() => {
                                    handleRowCopy(r);
                                    setActiveMenuRowKey(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-[var(--panel-2)] flex items-center gap-2 text-[var(--text)] cursor-pointer"
                                >
                                  {isCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                                  )}
                                  <span>Copy Account Info</span>
                                </button>

                                {onAskAi && (
                                  <>
                                    <div className="my-1 border-t border-[var(--line)]" />
                                    <button
                                      onClick={() => {
                                        onAskAi(
                                          r,
                                          `Explain the 3-month GMV trend and run-rate for ${r.orgname || r.domain} in detail.`
                                        );
                                        setActiveMenuRowKey(null);
                                      }}
                                      className="w-full px-3 py-1.5 hover:bg-[var(--panel-2)] flex items-center gap-2 text-[#FFC600] font-medium cursor-pointer text-[11px]"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Explain 3M Trend</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        onAskAi(
                                          r,
                                          `Prepare a 30-second executive call brief for ${r.orgname || r.domain} with SPOC contact information and recommended talking points.`
                                        );
                                        setActiveMenuRowKey(null);
                                      }}
                                      className="w-full px-3 py-1.5 hover:bg-[var(--panel-2)] flex items-center gap-2 text-[#FFC600] font-medium cursor-pointer text-[11px]"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      <span>30-Sec Call Brief</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Inline Quick Note Editor Row */}
                    {isNoteExpanded && (
                      <tr className="bg-[var(--panel-2)]/40 border-y border-[#FFC600]/40 animate-fadeIn">
                        <td colSpan={colSpanCount} className="p-3 sm:px-6">
                          <div className="max-w-2xl bg-[var(--panel-solid)] border border-[var(--line)] rounded-xl p-3.5 sm:p-4 shadow-xl">
                            <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[var(--line)]">
                              <div className="flex items-center gap-2 flex-wrap">
                                <FileText className="w-4 h-4 text-[#FFC600]" />
                                <span className="text-xs font-bold text-[var(--text)]">
                                  Quick Note: {r.orgname || r.domain}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[var(--line)] bg-[var(--panel-2)] text-[var(--muted)]">
                                  Org #{r.org}
                                </span>
                                {savedNote?.updatedAt && (
                                  <span className="text-[10px] text-amber-400 font-mono">
                                    Last edited {formatNoteDate(savedNote.updatedAt)}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={handleCancelInlineNote}
                                className="text-[var(--muted)] hover:text-[var(--text)] p-1 cursor-pointer"
                                title="Close note editor"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <textarea
                              autoFocus
                              value={draftNoteText}
                              onChange={(e) => setDraftNoteText(e.target.value)}
                              onKeyDown={(e) => {
                                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveInlineNote(r.org);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  handleCancelInlineNote();
                                }
                              }}
                              placeholder="Add account context, follow-up or next action…"
                              rows={3}
                              className="w-full p-2.5 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)] text-xs placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] focus:ring-1 focus:ring-[#FFC600]/30 transition-all font-sans resize-y min-h-[68px]"
                            />

                            <div className="mt-2.5 flex items-center justify-between gap-2 flex-wrap text-xs">
                              <span className="text-[10px] text-[var(--muted)]">
                                Press <strong className="font-mono text-[var(--text)]">⌘+Enter</strong> to save. Clear text to delete note.
                              </span>

                              <div className="flex items-center gap-2 ml-auto">
                                <button
                                  onClick={handleCancelInlineNote}
                                  className="px-3 py-1 rounded-lg border border-[var(--line)] bg-[var(--panel-solid)] hover:bg-[var(--panel-2)] text-[var(--text)] text-xs font-medium cursor-pointer transition-colors"
                                >
                                  Cancel
                                </button>

                                <button
                                  onClick={() => handleSaveInlineNote(r.org)}
                                  className="px-3.5 py-1 rounded-lg border border-[#FFC600] bg-[#FFC600] hover:bg-[#e6b200] text-black text-xs font-bold shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                                  <span>Save Note</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. PAGINATION & METRICS FOOTER                                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-3 border-t border-[var(--line)] flex items-center justify-between gap-2 text-xs text-[var(--muted)] bg-[var(--panel-2)]/60 no-print">
        <div className="font-normal">
          Showing{' '}
          <span className="text-[var(--text)] font-mono font-medium">
            {sortedRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>
          –
          <span className="text-[var(--text)] font-mono font-medium">
            {pageSize === -1
              ? sortedRows.length
              : Math.min(currentPage * pageSize, sortedRows.length)}
          </span>{' '}
          of{' '}
          <span className="text-[var(--text)] font-mono font-bold">
            {sortedRows.length}
          </span>{' '}
          accounts
          {totalRowsCount > sortedRows.length && (
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
              className="p-1 rounded-md border border-[var(--line)] bg-[var(--panel-solid)] hover:bg-[var(--panel-2)] hover:border-[#FFC600]/60 text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
              className="p-1 rounded-md border border-[var(--line)] bg-[var(--panel-solid)] hover:bg-[var(--panel-2)] hover:border-[#FFC600]/60 text-[var(--text)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
