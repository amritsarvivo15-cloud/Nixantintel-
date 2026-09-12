import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  Mail,
  BarChart2,
  Globe,
  Flame,
  Building2,
  ArrowRight,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  DerivedPortfolioRecord,
  PortfolioKPIs
} from '../types';
import { INR, compact } from '../utils/formatters';
import { RadarMark } from './RadarLogo';
import { AiIntelligenceFace } from './AiIntelligenceFace';
import { CompanyLogo } from './CompanyLogo';

interface FoldDoubleOpenViewProps {
  kpis: PortfolioKPIs;
  records: DerivedPortfolioRecord[];
  onOpenAi: (account?: DerivedPortfolioRecord) => void;
  onCopyAccount: (r: DerivedPortfolioRecord) => void;
  onSelectOrg?: (r: DerivedPortfolioRecord) => void;
  showHingeGuide?: boolean;
  unfoldedLayout?: 'split' | 'expanded';
  theme: 'dark' | 'light';
  quickNotes?: Record<string, { note: string; updatedAt: string }>;
  onSaveQuickNote?: (orgId: string, noteText: string) => void;
}

export const FoldDoubleOpenView: React.FC<FoldDoubleOpenViewProps> = ({
  kpis,
  records,
  onOpenAi,
  onCopyAccount,
  onSelectOrg,
  showHingeGuide = true,
  theme,
  quickNotes = {},
  onSaveQuickNote
}) => {
  // Selected account for right pane deep-dive
  const [selectedRecordId, setSelectedRecordId] = useState<string>(() => {
    // Default to the first priority drop account (e.g. Org 13589)
    const priorityFirst = records.find((r) => r.actionBucket === 'Priority follow-up');
    return priorityFirst ? priorityFirst.org + priorityFirst.domain : records[0]?.org + records[0]?.domain;
  });

  // Filters for left pane
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'priority' | 'recovery' | 'matched'>('all');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState('');

  // Filtered rows for left list
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const hay = `${r.org} ${r.domain} ${r.orgname}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (channelFilter && r.channel !== channelFilter) return false;
      if (actionFilter && r.actionBucket !== actionFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;

      if (activeTab === 'priority' && r.actionBucket !== 'Priority follow-up') return false;
      if (activeTab === 'recovery' && r.actionBucket !== 'Recovery') return false;
      if (activeTab === 'matched' && r.status !== 'Matched') return false;

      return true;
    });
  }, [records, search, channelFilter, actionFilter, statusFilter, activeTab]);

  // Currently selected record
  const currentRecord = useMemo(() => {
    return (
      records.find((r) => r.org + r.domain === selectedRecordId) ||
      filteredRows[0] ||
      records[0]
    );
  }, [records, selectedRecordId, filteredRows]);

  const handleCopy = (r: DerivedPortfolioRecord) => {
    onCopyAccount(r);
    setCopiedId(r.org + r.domain);
    setTimeout(() => setCopiedId(null), 1600);
  };

  // Chart data for current account
  const chartData = useMemo(() => {
    if (!currentRecord) return [];
    return [
      { month: 'July Base', gmv: currentRecord.jul, fill: '#6B6B6B' },
      { month: 'Aug Matched', gmv: currentRecord.aug ?? 0, fill: '#FFC600' },
      { month: 'Sep MTD (8d)', gmv: currentRecord.sep ?? 0, fill: '#ffcd1a' }
    ];
  }, [currentRecord]);

  // Quick email draft generator
  const emailDraft = useMemo(() => {
    if (!currentRecord) return '';
    const orgTitle = currentRecord.orgname || currentRecord.domain || `Org #${currentRecord.org}`;
    const julVal = INR(currentRecord.jul);
    const augVal = currentRecord.aug !== null ? INR(currentRecord.aug) : 'unmapped';
    const sepVal = currentRecord.sep !== null ? INR(currentRecord.sep) : 'pending';

    return `Subject: Partnership Check-in: ${orgTitle} Travel Program & Volume Optimization

Hi Team,

I hope you are well.

As part of our quarterly review for ${orgTitle} (Account ID #${currentRecord.org}), I was analyzing your monthly booking volumes on our travel platform. In July, your spend was ${julVal}, shifting to ${augVal} in August and ${sepVal} MTD in September.

We want to ensure your travelers have seamless access to our corporate flight and hotel inventory, policy compliance, and cost-saving tools. 

Could we schedule a 15-minute sync this week to review your current travel pipeline and explore custom enterprise rates?

Warm regards,
Nixant Intelligence Executive Team`;
  }, [currentRecord]);

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(emailDraft);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  return (
    <div
      id="fold-double-open-screen"
      className="relative w-full min-h-[750px] rounded-3xl border border-[var(--line)] bg-[var(--bg)] overflow-hidden shadow-2xl flex flex-col"
    >
      {/* Top Cockpit Header Bar */}
      <div className="px-5 py-3 border-b border-[var(--line)] bg-[var(--panel-solid)]/90 backdrop-blur-md flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <RadarMark size={32} animated={true} theme={theme} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-sm text-[var(--text)] tracking-tight">
                Radar 365
              </span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30 font-mono">
                Double Open Dual-Screen • Fold 8
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)]">
              Samsung Galaxy Z Fold Ultra • 7.6"-8.0" AMOLED Split-View
            </p>
          </div>
        </div>

        {/* Global Mini Stats strip */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/60 flex items-center gap-2">
            <span className="text-[var(--muted)] font-medium text-[11px]">Known GMV:</span>
            <span className="font-mono font-bold text-[var(--text)]">{compact(kpis.knownTotal)}</span>
          </div>
          <div className="px-3 py-1 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/60 flex items-center gap-2">
            <span className="text-[var(--muted)] font-medium text-[11px]">Matched Aug:</span>
            <span className="font-mono font-bold text-[#FFC600]">{compact(kpis.augTotal)}</span>
            <span className="text-[10px] font-bold text-[#4ade80]">(+{(kpis.growth ?? 0).toFixed(1)}%)</span>
          </div>
          <button
            onClick={() => onOpenAi(currentRecord)}
            className="px-3 py-1.5 rounded-xl bg-[#FFC600] text-[#111111] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-[#ffcd1a] transition-all"
            title="Ask Radar AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Radar AI</span>
          </button>
        </div>
      </div>

      {/* DUAL-PANE WORKSPACE */}
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
        {/* ============================================================ */}
        {/* LEFT PANE: MASTER ACCOUNT DIRECTORY & QUEUE NAVIGATOR (5 cols) */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex flex-col border-r border-[var(--line)] bg-[var(--panel)]/50 backdrop-blur-sm">
          {/* Left Top Search & Filter Bar */}
          <div className="p-3.5 border-b border-[var(--line)] bg-[var(--panel-solid)]/40 flex flex-col gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Org ID, client or domain…"
                className="w-full h-9 pl-9 pr-8 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] focus:ring-1 focus:ring-[#FFC600]/30 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-xs text-[var(--muted)] hover:text-[var(--text)]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Queue Segment Tabs */}
            <div className="grid grid-cols-4 gap-1 text-[11px] font-semibold">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-[#FFC600] bg-[#FFC600]/15 text-[var(--text)] font-bold'
                    : 'border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                All ({records.length})
              </button>

              <button
                onClick={() => setActiveTab('priority')}
                className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                  activeTab === 'priority'
                    ? 'border-[#FFC600] bg-[#FFC600] text-[#111111] font-bold'
                    : 'border-[var(--line)] text-[#FFC600] hover:bg-[#FFC600]/10'
                }`}
              >
                Priority (16)
              </button>

              <button
                onClick={() => setActiveTab('recovery')}
                className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                  activeTab === 'recovery'
                    ? 'border-[#f87171] bg-[#f87171] text-white font-bold'
                    : 'border-[var(--line)] text-[#f87171] hover:bg-[#f87171]/10'
                }`}
              >
                Recovery (4)
              </button>

              <button
                onClick={() => setActiveTab('matched')}
                className={`py-1 rounded-lg border text-center transition-all cursor-pointer ${
                  activeTab === 'matched'
                    ? 'border-[#4ade80] bg-[#4ade80] text-[#111111] font-bold'
                    : 'border-[var(--line)] text-[#4ade80] hover:bg-[#4ade80]/10'
                }`}
              >
                Matched (77)
              </button>
            </div>

            {/* Left Header Result Count */}
            <div className="flex items-center justify-between text-[11px] text-[var(--muted)] pt-0.5">
              <span>Showing {filteredRows.length} accounts</span>
              {(search || channelFilter || actionFilter) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setChannelFilter('');
                    setActionFilter('');
                    setStatusFilter('');
                    setActiveTab('all');
                  }}
                  className="text-[#FFC600] hover:underline font-medium text-[10px]"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Account Interactive List */}
          <div className="flex-1 overflow-y-auto max-h-[580px] divide-y divide-[var(--line)]/50 p-2">
            {filteredRows.length === 0 ? (
              <div className="py-16 text-center text-xs text-[var(--muted)]">
                No accounts match the current filters.
              </div>
            ) : (
              filteredRows.map((r, idx) => {
                const isSelected = currentRecord && currentRecord.org + currentRecord.domain === r.org + r.domain;
                const hasDrop = r.deltaPct !== null && r.deltaPct < -10;
                const hasGrowth = r.deltaPct !== null && r.deltaPct > 0;

                return (
                  <div
                    key={`${r.org}-${r.domain}-${idx}`}
                    onClick={() => setSelectedRecordId(r.org + r.domain)}
                    className={`p-3 rounded-2xl transition-all duration-150 cursor-pointer mb-1.5 ${
                      isSelected
                        ? 'border-2 border-[#FFC600] bg-[#FFC600]/10 shadow-md ring-1 ring-[#FFC600]/30'
                        : 'border border-[var(--line)] bg-[var(--panel)] hover:border-[#FFC600]/40 hover:bg-[var(--panel-2)]/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <CompanyLogo
                          domain={r.domain}
                          orgName={r.orgname}
                          size="sm"
                          title={`Dossier for ${r.orgname || r.domain}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--panel-2)] text-[var(--muted)]">
                              #{r.org}
                            </span>
                            <span className="text-[10px] font-semibold text-[var(--muted)] truncate max-w-[100px]">
                              {r.channel}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${r.actionClass}`}
                            >
                              {r.actionBucket}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-[var(--text)] truncate">
                            {r.orgname || r.domain || 'Unnamed Account'}
                          </h4>
                          <p className="text-[10px] text-[var(--muted)] truncate font-mono">
                            {r.domain}
                          </p>
                        </div>
                      </div>

                      {/* Right column: GMV & delta */}
                      <div className="text-right flex-shrink-0">
                        <div className="font-mono font-bold text-xs text-[var(--text)]">
                          {INR(r.aug ?? r.jul)}
                        </div>
                        <div className="text-[10px] font-mono">
                          {r.deltaPct !== null ? (
                            <span
                              className={`font-bold ${
                                hasDrop ? 'text-[#f87171]' : hasGrowth ? 'text-[#4ade80]' : 'text-[var(--muted)]'
                              }`}
                            >
                              {r.deltaPct > 0 ? '+' : ''}
                              {r.deltaPct.toFixed(0)}%
                            </span>
                          ) : (
                            <span className="text-[var(--muted)] text-[9px]">Base</span>
                          )}
                        </div>
                        {isSelected && (
                          <span className="inline-block mt-1 text-[9px] font-bold text-[#FFC600] uppercase tracking-wider">
                            ● Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* CENTER FOLD HINGE CREASE GUIDE (Samsung Fold Physical Crease) */}
        {/* ============================================================ */}
        {showHingeGuide && (
          <div
            id="fold-hinge-crease"
            className="hidden lg:flex absolute left-[41.66%] -top-0 bottom-0 w-[8px] -ml-[4px] pointer-events-none z-20 flex-col items-center justify-center opacity-65"
          >
            {/* Center Spine Shadow */}
            <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-[#FFC600]/30 to-transparent" />
            <div className="w-[4px] h-full bg-gradient-to-r from-black/20 via-transparent to-black/20" />
            <div className="absolute top-4 px-1.5 py-0.5 rounded-full bg-black/80 border border-[#FFC600]/40 text-[#FFC600] text-[8px] font-mono font-bold tracking-widest uppercase rotate-90">
              FOLD 180°
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* RIGHT PANE: 360° ACCOUNT INTELLIGENCE COCKPIT (7 cols)       */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col bg-[var(--panel-2)]/30 backdrop-blur-md overflow-y-auto max-h-[720px] p-5">
          {currentRecord ? (
            <div className="flex flex-col gap-4 animate-fadeIn">
              {/* Account Header Hero Card */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <CompanyLogo
                      domain={currentRecord.domain}
                      orgName={currentRecord.orgname}
                      size="md"
                      className="rounded-xl shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-[var(--panel-2)] text-[#FFC600] border border-[#FFC600]/30">
                          Org ID #{currentRecord.org}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[var(--panel-2)] text-[var(--text)]">
                          {currentRecord.channel}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${currentRecord.actionClass}`}
                        >
                          {currentRecord.actionBucket}
                        </span>
                      </div>

                      <h2 className="text-lg font-black text-[var(--text)] tracking-tight">
                        {currentRecord.orgname || currentRecord.domain || 'Unnamed Account'}
                      </h2>
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-0.5 font-mono">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{currentRecord.domain}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Header Toolbar */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenAi(currentRecord)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFC600] to-[#E5A700] text-[#111111] font-extrabold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-105 transition-all cursor-pointer"
                      title="Run Zeta Strategic Analysis"
                    >
                      <AiIntelligenceFace size="xs" mood="idle" interactive={false} showStatusDot={false} />
                      <span>Ask Zeta</span>
                    </button>

                    <button
                      onClick={() => handleCopy(currentRecord)}
                      className="p-2 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)] hover:border-[#FFC600]/40 transition-all cursor-pointer text-xs"
                      title="Copy Org ID & Details"
                    >
                      {copiedId === currentRecord.org + currentRecord.domain ? (
                        <Check className="w-4 h-4 text-[#4ade80]" />
                      ) : (
                        <Copy className="w-4 h-4 text-[var(--muted)]" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 3-Month GMV Metrics Strip */}
                <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-[var(--line)]">
                  <div className="p-2.5 rounded-xl bg-[var(--panel-2)]/70 text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                      July Baseline
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--text)] mt-0.5 block">
                      {INR(currentRecord.jul)}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--panel-2)]/70 text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                      August GMV
                    </span>
                    <span className="text-sm font-mono font-bold text-[#FFC600] mt-0.5 block">
                      {currentRecord.aug !== null ? INR(currentRecord.aug) : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--panel-2)]/70 text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                      September MTD
                    </span>
                    <span className="text-sm font-mono font-bold text-[#ffcd1a] mt-0.5 block">
                      {currentRecord.sep !== null ? INR(currentRecord.sep) : '—'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[var(--panel-2)]/70 text-center">
                    <span className="text-[10px] uppercase font-bold text-[var(--muted)] block">
                      Known Total
                    </span>
                    <span className="text-sm font-mono font-bold text-[var(--text)] mt-0.5 block">
                      {INR(currentRecord.total ?? currentRecord.jul)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Per-Account Persistent Quick Note */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#FFC600]" />
                    <h3 className="font-bold text-xs text-[var(--text)]">
                      Account Quick Note
                    </h3>
                  </div>
                  {quickNotes[currentRecord.org]?.updatedAt && (
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      Last edited {new Date(quickNotes[currentRecord.org].updatedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  )}
                </div>

                {editingNote ? (
                  <div className="flex flex-col gap-2 mt-2">
                    <textarea
                      autoFocus
                      value={draftNote}
                      onChange={(e) => setDraftNote(e.target.value)}
                      placeholder="Record account status, SPOC updates, or next steps…"
                      rows={3}
                      className="w-full p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingNote(false)}
                        className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onSaveQuickNote?.(currentRecord.org, draftNote);
                          setEditingNote(false);
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#FFC600] text-black font-bold text-xs hover:bg-[#FFD700] cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/60 flex items-start justify-between gap-3">
                    <p className="text-xs text-[var(--text)] leading-relaxed italic flex-1">
                      {quickNotes[currentRecord.org]?.note?.trim()
                        ? `"${quickNotes[currentRecord.org].note}"`
                        : 'No quick note recorded for this account.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftNote(quickNotes[currentRecord.org]?.note || '');
                        setEditingNote(true);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-[#FFC600]/40 hover:border-[#FFC600] text-[#FFC600] text-xs font-semibold cursor-pointer shrink-0"
                    >
                      {quickNotes[currentRecord.org]?.note?.trim() ? 'Edit Note' : '+ Add Note'}
                    </button>
                  </div>
                )}
              </div>

              {/* 360° SPOC & Strategy Dossier Launch Button */}
              {onSelectOrg && (
                <button
                  onClick={() => onSelectOrg(currentRecord)}
                  className="w-full p-3 rounded-2xl bg-gradient-to-r from-[#FFC600]/15 via-[#FFC600]/10 to-[var(--panel-2)] border border-[#FFC600]/50 hover:border-[#FFC600] text-[var(--text)] text-xs font-black flex items-center justify-between cursor-pointer shadow-sm hover:brightness-105 active:scale-[0.99] transition-all group"
                  title="Open full SPOC contacts, decision-maker details, and tailored approach"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-[#FFC600] text-[#111111] shadow-xs">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <div className="text-left">
                      <div className="text-xs font-black text-[var(--text)] group-hover:text-[#FFC600] transition-colors">
                        Open 360° SPOC & Approach Dossier
                      </div>
                      <div className="text-[10px] text-[var(--muted)] font-medium">
                        Direct travel desk & procurement leads, risk factors & tailored pitch
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#FFC600] font-bold text-xs">
                    <span>View SPOC</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              )}

              {/* Monthly Trajectory Bar Chart */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-[#FFC600]" />
                    <h3 className="font-bold text-xs text-[var(--text)]">
                      Monthly Spend Trajectory
                    </h3>
                  </div>
                  {currentRecord.deltaPct !== null && (
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        currentRecord.deltaPct < 0
                          ? 'bg-[#f87171]/20 text-[#f87171]'
                          : 'bg-[#4ade80]/20 text-[#4ade80]'
                      }`}
                    >
                      {currentRecord.deltaPct > 0 ? '+' : ''}
                      {currentRecord.deltaPct.toFixed(1)}% Aug vs Jul
                    </span>
                  )}
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <XAxis
                        dataKey="month"
                        stroke="var(--muted)"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--line)' }}
                      />
                      <YAxis
                        stroke="var(--muted)"
                        fontSize={10}
                        tickFormatter={(v) => compact(v)}
                        tickLine={false}
                        axisLine={{ stroke: 'var(--line)' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--panel-solid)',
                          borderColor: 'var(--line)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: 'var(--text)'
                        }}
                        formatter={(val: any) => [INR(Number(val)), 'GMV']}
                      />
                      <Bar dataKey="gmv" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Radar AI Mascot Intelligence Copilot Card */}
              <div className="p-4 rounded-2xl border border-[#FFC600]/30 bg-gradient-to-r from-[var(--panel)] via-[var(--panel)] to-[#FFC600]/10 flex items-center gap-3.5 shadow-sm">
                <AiIntelligenceFace
                  size="md"
                  mood="happy"
                  showStatusDot={true}
                  onClick={() => onOpenAi(currentRecord)}
                  title="Click to open Zeta Deep Intelligence"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-xs text-[var(--text)] truncate">
                        Zeta Portfolio Analyst
                      </h3>
                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-[#FFC600]/20 text-[#FFC600] border border-[#FFC600]/30">
                        Active
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenAi(currentRecord)}
                      className="text-[11px] font-bold text-[#FFC600] hover:underline flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <span>Deep Strategy &rarr;</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                    {currentRecord.actionBucket === 'Priority follow-up'
                      ? 'Detected steep drop against July baseline. Recommend dispatching executive retention touchpoint.'
                      : currentRecord.actionBucket === 'Recovery'
                      ? 'Critical churn risk alert: Zero spend registered in August. Urgent re-activation suggested.'
                      : currentRecord.actionBucket === 'Upside'
                      ? 'Strong expansion pace detected (+6.3% portfolio uplift). Prime candidate for volume tiering.'
                      : 'Account is pacing steadily with active September bookings. Support SLA maintained.'}
                  </p>
                </div>
              </div>

              {/* Action Recommendation & Sales Strategy */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-4 h-4 text-[#FFC600]" />
                  <h3 className="font-bold text-xs text-[var(--text)]">
                    Commercial Action Playbook
                  </h3>
                </div>
                <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/60 text-xs leading-relaxed text-[var(--text)]">
                  {currentRecord.actionBucket === 'Priority follow-up' && (
                    <div>
                      <strong className="text-[#FFC600] block mb-1">
                        Priority Drop Alert (Action Required):
                      </strong>
                      This account recorded a noticeable dip between July baseline ({INR(currentRecord.jul)}) and August ({currentRecord.aug !== null ? INR(currentRecord.aug) : 'unmapped'}). Contact their corporate travel administrator or procurement lead to verify whether this represents a temporary seasonal travel pause, travel policy compliance leakage, or alternative booking channels.
                    </div>
                  )}

                  {currentRecord.actionBucket === 'Recovery' && (
                    <div>
                      <strong className="text-[#f87171] block mb-1">
                        High Churn Risk (Recovery Queue):
                      </strong>
                      Spend collapsed near zero after a substantial July baseline. Immediate executive re-engagement or account review recommended.
                    </div>
                  )}

                  {currentRecord.actionBucket === 'Upside' && (
                    <div>
                      <strong className="text-[#4ade80] block mb-1">
                        Expanding Account (Upside Opportunity):
                      </strong>
                      Account demonstrates robust growth between July and August. Propose quarterly rebate tiers or expanded team user onboarding.
                    </div>
                  )}

                  {currentRecord.actionBucket === 'Active MTD' && (
                    <div>
                      <strong className="text-[var(--text)] block mb-1">
                        Active September Pacing:
                      </strong>
                      Account is logging consistent booking volume in September ({INR(currentRecord.sep ?? 0)} in 8 days). Ensure dedicated operational support.
                    </div>
                  )}

                  {currentRecord.actionBucket === 'Maintain' && (
                    <div>
                      <strong className="text-[var(--muted)] block mb-1">
                        Stable Performance:
                      </strong>
                      Volume is consistent with historic benchmarks. Maintain standard relationship rhythm.
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click Executive Email Drafter */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#FFC600]" />
                    <h3 className="font-bold text-xs text-[var(--text)]">
                      Instant Executive Outreach Email
                    </h3>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="px-3 py-1 rounded-xl bg-[#FFC600] text-[#111111] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-[#ffcd1a] transition-all"
                  >
                    {emailCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/80 text-xs font-mono text-[var(--text)] whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto select-all">
                  {emailDraft}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-xs text-[var(--muted)] p-8 max-w-sm mx-auto">
              <AiIntelligenceFace
                variant="laptop"
                mood="happy"
                className="mb-2"
                title="Zeta Copilot Ready"
              />
              <span className="font-bold text-sm text-[var(--text)] mb-1">
                Zeta Copilot Intelligence Ready
              </span>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Select an account from the left pane to view 360° revenue telemetry, monthly spend trajectories, and instant executive outreach drafts.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
