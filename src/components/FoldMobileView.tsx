import React, { useState, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Copy,
  Check,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Mail,
  Layers,
  BarChart3,
  X,
  Building2,
  FileText
} from 'lucide-react';
import {
  DerivedPortfolioRecord,
  PortfolioKPIs
} from '../types';
import { INR, compact } from '../utils/formatters';
import { RadarMark } from './RadarLogo';
import { AiIntelligenceFace } from './AiIntelligenceFace';
import { CompanyLogo } from './CompanyLogo';

interface FoldMobileViewProps {
  kpis: PortfolioKPIs;
  records: DerivedPortfolioRecord[];
  onOpenAi: (account?: DerivedPortfolioRecord) => void;
  onCopyAccount: (r: DerivedPortfolioRecord) => void;
  onSelectOrg?: (r: DerivedPortfolioRecord) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  quickNotes?: Record<string, { note: string; updatedAt: string }>;
  onSaveQuickNote?: (orgId: string, noteText: string) => void;
}

export const FoldMobileView: React.FC<FoldMobileViewProps> = ({
  kpis,
  records,
  onOpenAi,
  onCopyAccount,
  onSelectOrg,
  theme,
  onToggleTheme,
  quickNotes = {},
  onSaveQuickNote
}) => {
  // Mobile active tab: 'accounts' | 'queues' | 'insights' | 'assistant'
  const [activeTab, setActiveTab] = useState<'accounts' | 'queues' | 'insights'>('accounts');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedNoteFilter, setSelectedNoteFilter] = useState<'all' | 'has-note' | 'no-note'>('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [emailModalAccount, setEmailModalAccount] = useState<DerivedPortfolioRecord | null>(null);
  const [editingOrgNote, setEditingOrgNote] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const hay = `${r.org} ${r.domain} ${r.orgname}`.toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (selectedChannel && r.channel !== selectedChannel) return false;
      if (selectedAction && r.actionBucket !== selectedAction) return false;
      if (selectedStatus && r.status !== selectedStatus) return false;
      if (selectedNoteFilter === 'has-note' && !quickNotes[r.org]?.note?.trim()) return false;
      if (selectedNoteFilter === 'no-note' && quickNotes[r.org]?.note?.trim()) return false;
      return true;
    });
  }, [records, search, selectedChannel, selectedAction, selectedStatus, selectedNoteFilter, quickNotes]);

  // Priority accounts
  const priorityAccounts = useMemo(() => {
    return records.filter(
      (r) => r.actionBucket === 'Priority follow-up' || r.actionBucket === 'Recovery'
    );
  }, [records]);

  // Unmapped accounts
  const unmappedAccounts = useMemo(() => {
    return records.filter((r) => r.status === 'No Org ID' || r.status === 'Unmatched');
  }, [records]);

  const handleCopy = (r: DerivedPortfolioRecord) => {
    onCopyAccount(r);
    setCopiedId(r.org + r.domain);
    setTimeout(() => setCopiedId(null), 1600);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedChannel('');
    setSelectedAction('');
    setSelectedStatus('');
    setSelectedNoteFilter('all');
  };

  // Draft quick email text
  const generateEmailDraft = (r: DerivedPortfolioRecord) => {
    const orgTitle = r.orgname || r.domain || `Org #${r.org}`;
    const julVal = INR(r.jul);
    const augVal = r.aug !== null ? INR(r.aug) : 'No recorded activity';
    const sepVal = r.sep !== null ? INR(r.sep) : 'Pending';

    return `Subject: Follow-up regarding ${orgTitle} travel spend & partnership

Hi Team,

I hope you're having a productive week.

I was reviewing our travel spend trajectory for ${orgTitle} (Account #${r.org}). In July, spend was recorded at ${julVal}, compared with ${augVal} in August and ${sepVal} MTD in September.

We want to make sure your team has everything needed to maximize travel efficiencies this quarter. Are you available for a brief 10-minute catch-up this Thursday or Friday to discuss booking volume and any upcoming travel initiatives?

Best regards,
Nixant Intelligence Sales Lead`;
  };

  return (
    <div id="fold-mobile-screen" className="flex flex-col min-h-full bg-[var(--bg)] text-[var(--text)] pb-20">
      {/* Mobile Sticky Header */}
      <header className="sticky top-0 z-20 px-3.5 py-2.5 bg-[var(--panel-solid)]/95 backdrop-blur-md border-b border-[var(--line)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RadarMark size={30} animated={true} theme={theme} />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs tracking-tight">Radar 365</span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30 font-mono">
                Fold 8 Cover
              </span>
            </div>
            <p className="text-[10px] text-[var(--muted)] font-medium leading-none">
              Non-RAM / KAM Cockpit
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onOpenAi()}
            id="btn-mobile-ai"
            className="px-2 py-1 rounded-xl bg-gradient-to-r from-[#FFC600]/25 to-[#FFC600]/10 border border-[#FFC600]/40 text-[var(--text)] hover:brightness-105 transition-all text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Ask Zeta • Radar365 AI Copilot"
          >
            <AiIntelligenceFace size="xs" mood="idle" interactive={false} showStatusDot={true} />
            <span>Ask Zeta</span>
          </button>

          <button
            onClick={onToggleTheme}
            id="btn-mobile-theme"
            className="p-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-[var(--text)] hover:border-[#FFC600]/40 transition-all cursor-pointer text-xs"
            title="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* KPI Highlights Bar (Swipeable / Compact Grid) */}
      <section className="px-3.5 pt-3 pb-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Card 1: Total Known GMV */}
          <div className="p-2.5 rounded-2xl border border-[#FFC600]/30 bg-gradient-to-br from-[#FFC600]/10 to-transparent">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider block">
              Known 3-Mo GMV
            </span>
            <div className="text-base font-black text-[var(--text)] font-mono mt-0.5">
              {compact(kpis.knownTotal)}
            </div>
            <span className="text-[10px] text-[var(--muted)]">113 portfolio rows</span>
          </div>

          {/* Card 2: August Matched & Growth */}
          <div className="p-2.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
            <span className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider block">
              Aug Matched
            </span>
            <div className="text-base font-black text-[var(--text)] font-mono mt-0.5">
              {compact(kpis.augTotal)}
            </div>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#4ade80]">
              <TrendingUp className="w-3 h-3" />
              +{(kpis.growth ?? 0).toFixed(1)}% vs Jul
            </span>
          </div>

          {/* Card 3: July Baseline */}
          <div className="p-2 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/60">
            <div className="flex justify-between items-center text-[10px] text-[var(--muted)] font-medium">
              <span>Jul Baseline</span>
              <span className="font-mono font-bold text-[var(--text)]">{compact(kpis.julTotal)}</span>
            </div>
          </div>

          {/* Card 4: Sep MTD */}
          <div className="p-2 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/60">
            <div className="flex justify-between items-center text-[10px] text-[var(--muted)] font-medium">
              <span>Sep MTD (8d)</span>
              <span className="font-mono font-bold text-[#FFC600]">{compact(kpis.sepTotal)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tab Switcher */}
      <nav className="px-3.5 py-1.5 flex gap-1 border-b border-[var(--line)] bg-[var(--panel-solid)]/70">
        <button
          onClick={() => setActiveTab('accounts')}
          id="btn-tab-accounts"
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'accounts'
              ? 'bg-[#FFC600] text-[#111111] shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]'
          }`}
        >
          <span>Accounts</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10">
            {filteredRows.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('queues')}
          id="btn-tab-queues"
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'queues'
              ? 'bg-[#FFC600] text-[#111111] shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]'
          }`}
        >
          <span>Queues</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#f87171]/20 text-[#f87171] font-mono">
            {priorityAccounts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          id="btn-tab-insights"
          className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'insights'
              ? 'bg-[#FFC600] text-[#111111] shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Insights</span>
        </button>
      </nav>

      {/* TAB 1: ACCOUNTS STREAM */}
      {activeTab === 'accounts' && (
        <div className="px-3.5 pt-2.5 flex flex-col gap-2.5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[var(--muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Org ID, domain or client…"
              className="w-full h-9 pl-8 pr-7 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] focus:ring-1 focus:ring-[#FFC600]/30"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-[var(--muted)] hover:text-[var(--text)] text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Chips (Horizontal Scroll) */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            <button
              onClick={handleResetFilters}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all ${
                !selectedAction && !selectedChannel && !selectedStatus && selectedNoteFilter === 'all'
                  ? 'border-[#FFC600] bg-[#FFC600]/15 text-[var(--text)] font-bold'
                  : 'border-[var(--line)] text-[var(--muted)] bg-[var(--panel)]'
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setSelectedNoteFilter((f) => (f === 'has-note' ? 'all' : 'has-note'))}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all flex items-center gap-1 ${
                selectedNoteFilter === 'has-note'
                  ? 'border-[#FFC600] bg-[#FFC600] text-[#111111] font-bold'
                  : 'border-[var(--line)] text-[#FFC600] bg-[var(--panel)]'
              }`}
            >
              <FileText className="w-3 h-3" />
              <span>Notes ({Object.values(quickNotes).filter((n) => n?.note?.trim()).length})</span>
            </button>
            <button
              onClick={() => setSelectedAction(selectedAction === 'Priority follow-up' ? '' : 'Priority follow-up')}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all ${
                selectedAction === 'Priority follow-up'
                  ? 'border-[#FFC600] bg-[#FFC600] text-[#111111] font-bold'
                  : 'border-[var(--line)] text-[#FFC600] bg-[var(--panel)]'
              }`}
            >
              Priority (16)
            </button>
            <button
              onClick={() => setSelectedAction(selectedAction === 'Recovery' ? '' : 'Recovery')}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all ${
                selectedAction === 'Recovery'
                  ? 'border-[#f87171] bg-[#f87171] text-white font-bold'
                  : 'border-[var(--line)] text-[#f87171] bg-[var(--panel)]'
              }`}
            >
              Recovery (4)
            </button>
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'Matched' ? '' : 'Matched')}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all ${
                selectedStatus === 'Matched'
                  ? 'border-[#4ade80] bg-[#4ade80] text-[#111111] font-bold'
                  : 'border-[var(--line)] text-[#4ade80] bg-[var(--panel)]'
              }`}
            >
              Matched (77)
            </button>
            <button
              onClick={() => setSelectedChannel(selectedChannel === 'SME+' ? '' : 'SME+')}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all ${
                selectedChannel === 'SME+'
                  ? 'border-[#FFC600] bg-[#FFC600]/20 text-[var(--text)] font-bold'
                  : 'border-[var(--line)] text-[var(--muted)] bg-[var(--panel)]'
              }`}
            >
              SME+
            </button>
            <button
              onClick={() => setSelectedChannel(selectedChannel === 'Mid Market' ? '' : 'Mid Market')}
              className={`px-2.5 py-1 rounded-lg border whitespace-nowrap font-medium transition-all ${
                selectedChannel === 'Mid Market'
                  ? 'border-[#FFC600] bg-[#FFC600]/20 text-[var(--text)] font-bold'
                  : 'border-[var(--line)] text-[var(--muted)] bg-[var(--panel)]'
              }`}
            >
              Mid Market
            </button>
          </div>

          {/* Account Cards Stream */}
          <div className="flex flex-col gap-2 mt-1">
            {filteredRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--line)] rounded-2xl">
                No accounts match this search filter.
                <button
                  onClick={handleResetFilters}
                  className="block mx-auto mt-2 text-[#FFC600] font-bold underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              filteredRows.map((r, idx) => {
                const isExpanded = expandedRowId === `${r.org}-${r.domain}-${idx}`;
                const isCopied = copiedId === r.org + r.domain;
                const hasDrop = r.deltaPct !== null && r.deltaPct < -10;
                const hasGrowth = r.deltaPct !== null && r.deltaPct > 0;

                return (
                  <div
                    key={`${r.org}-${r.domain}-${idx}`}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-[var(--panel)] ${
                      isExpanded
                        ? 'border-[#FFC600]/60 ring-1 ring-[#FFC600]/20 shadow-md'
                        : 'border-[var(--line)] hover:border-[#FFC600]/30'
                    }`}
                  >
                    {/* Card Summary Header */}
                    <div
                      onClick={() =>
                        setExpandedRowId(isExpanded ? null : `${r.org}-${r.domain}-${idx}`)
                      }
                      className="p-3 cursor-pointer select-none"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <CompanyLogo
                            domain={r.domain}
                            orgName={r.orgname}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectOrg?.(r);
                            }}
                            title={`Open 360° dossier for ${r.orgname || r.domain}`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--panel-2)] text-[var(--muted)]">
                                #{r.org}
                              </span>
                              <span className="text-[10px] font-bold text-[var(--muted)] truncate max-w-[110px]">
                                {r.channel}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full border ${r.actionClass}`}
                              >
                                {r.actionBucket}
                              </span>
                            </div>

                            <h3
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectOrg?.(r);
                              }}
                              className="font-bold text-xs text-[var(--text)] mt-1 truncate hover:text-[#FFC600] transition-colors"
                            >
                              {r.orgname || r.domain || 'Unnamed Account'}
                            </h3>
                            <p className="text-[10px] text-[var(--muted)] truncate font-mono">
                              {r.domain}
                            </p>
                            {quickNotes[r.org]?.note?.trim() && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-500/10 border border-amber-500/25 rounded-md px-1.5 py-0.5 max-w-full">
                                <FileText className="w-2.5 h-2.5 shrink-0 text-[#FFC600]" />
                                <span className="truncate">{quickNotes[r.org].note}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* GMV Highlight & Delta */}
                        <div className="text-right flex-shrink-0">
                          <div className="font-mono font-bold text-xs text-[var(--text)]">
                            {INR(r.aug ?? r.jul)}
                          </div>
                          <div className="text-[10px]">
                            {r.deltaPct !== null ? (
                              <span
                                className={`inline-flex items-center font-mono font-bold ${
                                  hasDrop ? 'text-[#f87171]' : hasGrowth ? 'text-[#4ade80]' : 'text-[var(--muted)]'
                                }`}
                              >
                                {r.deltaPct > 0 ? '+' : ''}
                                {r.deltaPct.toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-[var(--muted)] text-[9px]">Baseline</span>
                            )}
                          </div>
                          <div className="text-[var(--muted)] mt-0.5 flex justify-end">
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mini GMV Track */}
                      <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t border-[var(--line)]/50 text-center">
                        <div className="bg-[var(--panel-2)]/60 rounded-lg p-1">
                          <span className="text-[8px] uppercase tracking-wider text-[var(--muted)] block">
                            Jul Base
                          </span>
                          <span className="font-mono font-semibold text-[10px] text-[var(--text)]">
                            {compact(r.jul)}
                          </span>
                        </div>
                        <div className="bg-[var(--panel-2)]/60 rounded-lg p-1">
                          <span className="text-[8px] uppercase tracking-wider text-[var(--muted)] block">
                            Aug GMV
                          </span>
                          <span className="font-mono font-semibold text-[10px] text-[var(--text)]">
                            {r.aug !== null ? compact(r.aug) : '—'}
                          </span>
                        </div>
                        <div className="bg-[var(--panel-2)]/60 rounded-lg p-1">
                          <span className="text-[8px] uppercase tracking-wider text-[var(--muted)] block">
                            Sep MTD
                          </span>
                          <span className="font-mono font-semibold text-[10px] text-[#FFC600]">
                            {r.sep !== null ? compact(r.sep) : '—'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Action Drawer */}
                    {isExpanded && (
                      <div className="p-3 bg-[var(--panel-2)]/80 border-t border-[var(--line)] text-xs flex flex-col gap-2.5 animate-fadeIn">
                        {/* 3-Month Summary */}
                        <div className="flex justify-between items-center text-[11px] text-[var(--muted)]">
                          <span>Known 3-Month Spend:</span>
                          <strong className="text-[var(--text)] font-mono">
                            {INR(r.total ?? r.jul)}
                          </strong>
                        </div>

                        {/* Action diagnosis */}
                        <div className="p-2 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] text-[11px]">
                          <strong className="text-[var(--text)] block mb-0.5">
                            Recommended Action:
                          </strong>
                          <p className="text-[var(--muted)] leading-relaxed">
                            {r.actionBucket === 'Priority follow-up' &&
                              'Significant volume dip detected between July and August. Contact primary travel admin to review booking freeze, renewal, or leakage.'}
                            {r.actionBucket === 'Recovery' &&
                              'Account spend dropped near zero after a substantial July baseline. Immediate sales intervention required.'}
                            {r.actionBucket === 'Upside' &&
                              'Account demonstrates growth. Review enterprise contract tier or expanded team onboarding.'}
                            {r.actionBucket === 'Active MTD' &&
                              'Consistent spend pace in September. Verify standard billing support.'}
                            {r.actionBucket === 'Maintain' &&
                              'Stable baseline. Schedule standard monthly check-in.'}
                          </p>
                        </div>

                        {/* Account Quick Note */}
                        <div className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel-solid)] text-[11px]">
                          <div className="flex items-center justify-between gap-1 mb-1 pb-1 border-b border-[var(--line)]/50">
                            <span className="font-bold text-[var(--text)] flex items-center gap-1.5 text-[11px]">
                              <FileText className="w-3.5 h-3.5 text-[#FFC600]" />
                              <span>Account Quick Note</span>
                            </span>
                            {quickNotes[r.org]?.updatedAt && (
                              <span className="text-[9px] text-[var(--muted)] font-mono">
                                {new Date(quickNotes[r.org].updatedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            )}
                          </div>

                          {editingOrgNote === r.org ? (
                            <div className="flex flex-col gap-2 mt-1.5">
                              <textarea
                                autoFocus
                                value={draftNote}
                                onChange={(e) => setDraftNote(e.target.value)}
                                placeholder="Add account note, SPOC context, or next action..."
                                rows={3}
                                className="w-full p-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] resize-none"
                              />
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setEditingOrgNote(null)}
                                  className="px-2.5 py-1 rounded-lg border border-[var(--line)] text-[var(--muted)] text-[11px] hover:text-[var(--text)] cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSaveQuickNote?.(r.org, draftNote);
                                    setEditingOrgNote(null);
                                  }}
                                  className="px-3 py-1 rounded-lg bg-[#FFC600] text-black font-bold text-[11px] hover:bg-[#FFD700] cursor-pointer"
                                >
                                  Save Note
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2 mt-1">
                              <p className="text-[11px] text-[var(--text)] leading-relaxed italic flex-1">
                                {quickNotes[r.org]?.note?.trim()
                                  ? `"${quickNotes[r.org].note}"`
                                  : 'No note recorded yet for this account.'}
                              </p>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingOrgNote(r.org);
                                  setDraftNote(quickNotes[r.org]?.note || '');
                                }}
                                className="px-2 py-0.5 rounded border border-[#FFC600]/40 hover:border-[#FFC600] text-[#FFC600] text-[10px] font-semibold shrink-0 cursor-pointer"
                              >
                                {quickNotes[r.org]?.note?.trim() ? 'Edit' : '+ Add Note'}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* 360° SPOC & Approach Dossier Button */}
                        {onSelectOrg && (
                          <button
                            onClick={() => onSelectOrg(r)}
                            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-[#FFC600]/15 via-[#FFC600]/10 to-[var(--panel-2)] border border-[#FFC600]/40 hover:border-[#FFC600] text-[var(--text)] text-xs font-bold flex items-center justify-between cursor-pointer shadow-xs transition-all"
                            title="Open full SPOC contacts and strategic pitch"
                          >
                            <span className="flex items-center gap-1.5 text-[var(--text)]">
                              <Building2 className="w-3.5 h-3.5 text-[#FFC600]" />
                              <span>View SPOC Details & Strategy</span>
                            </span>
                            <span className="text-[10px] text-[#FFC600] font-mono font-bold flex items-center gap-0.5">
                              Open 360° &rarr;
                            </span>
                          </button>
                        )}

                        {/* Quick Mobile Action Buttons */}
                        <div className="grid grid-cols-3 gap-1.5 pt-1">
                          <button
                            onClick={() => onOpenAi(r)}
                            className="p-2 rounded-xl bg-gradient-to-r from-[#FFC600] to-[#E5A700] text-[#111111] font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-105 transition-all text-[11px] shadow-sm"
                            title="Ask Zeta about this account"
                          >
                            <AiIntelligenceFace size="xs" mood="idle" interactive={false} showStatusDot={false} />
                            <span>Ask Zeta</span>
                          </button>

                          <button
                            onClick={() => setEmailModalAccount(r)}
                            className="p-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#FFC600]/40 font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all text-[11px]"
                            title="Draft email"
                          >
                            <Mail className="w-3 h-3 text-[#FFC600]" />
                            <span>Email</span>
                          </button>

                          <button
                            onClick={() => handleCopy(r)}
                            className="p-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-[var(--text)] hover:border-[#FFC600]/40 font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all text-[11px]"
                            title="Copy Account Org ID"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3 h-3 text-[#4ade80]" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-[var(--muted)]" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PRIORITY ACTION QUEUES */}
      {activeTab === 'queues' && (
        <div className="px-3.5 pt-2.5 flex flex-col gap-3">
          {/* Priority Follow-up Queue */}
          <div className="rounded-2xl border border-[#FFC600]/40 bg-[var(--panel)] p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#FFC600]" />
                <h3 className="font-bold text-xs text-[var(--text)]">
                  Priority Follow-Up Queue
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FFC600]/15 text-[#FFC600]">
                {priorityAccounts.length} Accounts
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed mb-3">
              These accounts recorded steep drops between July baseline and August/September.
              Direct sales contact recommended.
            </p>

            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {priorityAccounts.map((r, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/70 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-xs text-[var(--text)] truncate">
                      {r.orgname || r.domain}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] font-mono">
                      <span>#{r.org}</span>
                      <span>•</span>
                      <span>Jul: {compact(r.jul)}</span>
                      <span>→</span>
                      <span className="text-[#f87171] font-bold">
                        Aug: {r.aug !== null ? compact(r.aug) : '—'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenAi(r)}
                    className="p-1.5 rounded-lg bg-[#FFC600] text-[#111111] text-[10px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                    title="Draft recovery strategy with AI"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Triage</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Unmapped Reconciliation Queue */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[var(--muted)]" />
                <h3 className="font-bold text-xs text-[var(--text)]">
                  Unmapped Org IDs
                </h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--panel-2)] text-[var(--muted)]">
                {unmappedAccounts.length}
              </span>
            </div>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed">
              Rows missing August or September match are kept as unmapped so revenue is not mistakenly treated as zero.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: INSIGHTS & CHARTS */}
      {activeTab === 'insights' && (
        <div className="px-3.5 pt-2.5 flex flex-col gap-3">
          {/* Monthly Trajectory Card */}
          <div className="p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
            <h3 className="font-bold text-xs text-[var(--text)] mb-1">
              Monthly GMV Trajectory
            </h3>
            <p className="text-[10px] text-[var(--muted)] mb-3">
              July baseline vs August matched vs September MTD (8 days)
            </p>

            <div className="flex items-end justify-between gap-3 h-36 px-4 pb-2 pt-4 bg-[var(--panel-2)]/40 rounded-xl border border-[var(--line)]/50">
              {/* July */}
              <div className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="font-mono text-[10px] font-bold text-[var(--text)] mb-1">
                  {compact(kpis.julTotal)}
                </span>
                <div className="w-full bg-[#6B6B6B] rounded-t-lg h-[92%] transition-all" />
                <span className="text-[10px] font-bold text-[var(--muted)] mt-1.5">July</span>
              </div>

              {/* August */}
              <div className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="font-mono text-[10px] font-bold text-[#FFC600] mb-1">
                  {compact(kpis.augTotal)}
                </span>
                <div className="w-full bg-[#FFC600] rounded-t-lg h-[64%] shadow-sm shadow-[#FFC600]/20 transition-all" />
                <span className="text-[10px] font-bold text-[#FFC600] mt-1.5">Aug</span>
              </div>

              {/* September MTD */}
              <div className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="font-mono text-[10px] font-bold text-[#ffcd1a] mb-1">
                  {compact(kpis.sepTotal)}
                </span>
                <div className="w-full bg-[#ffcd1a]/60 rounded-t-lg h-[18%] transition-all" />
                <span className="text-[10px] font-bold text-[var(--muted)] mt-1.5">Sep (8d)</span>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-[var(--muted)] font-medium">
              <span>Matched Aug vs Jul Cohort:</span>
              <strong className="text-[#4ade80] font-mono">
                +{(kpis.growth ?? 0).toFixed(1)}%
              </strong>
            </div>
          </div>

          {/* Channel Share */}
          <div className="p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
            <h3 className="font-bold text-xs text-[var(--text)] mb-2">
              Top Channel Distribution
            </h3>
            <div className="flex flex-col gap-2">
              {[
                { name: 'SME+', count: 54, pct: 48 },
                { name: 'Mid Market', count: 32, pct: 28 },
                { name: 'Enterprise', count: 18, pct: 16 },
                { name: 'Other / Unassigned', count: 9, pct: 8 }
              ].map((c) => (
                <div key={c.name} className="text-xs">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="font-semibold text-[var(--text)]">{c.name}</span>
                    <span className="text-[var(--muted)] font-mono">{c.count} accounts</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--panel-2)] overflow-hidden">
                    <div
                      style={{ width: `${c.pct}%` }}
                      className="h-full rounded-full bg-[#FFC600]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Radar AI Intelligence Summoner for Samsung Fold */}
      <div className="fixed bottom-20 right-4 z-30">
        <button
          onClick={() => onOpenAi()}
          id="fab-mobile-ai-face"
          className="group flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-[#111111]/95 text-white border-2 border-[#FFC600] shadow-xl shadow-[#FFC600]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          title="Summon Zeta • Radar365 AI Copilot"
        >
          <AiIntelligenceFace size="sm" mood="idle" interactive={false} showStatusDot={true} />
          <span className="text-[11px] font-extrabold text-[#FFC600] pr-0.5">Ask Zeta</span>
        </button>
      </div>

      {/* Quick Email Draft Modal */}
      {emailModalAccount && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--panel-solid)] border border-[var(--line)] p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-[var(--line)] pb-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#FFC600]" />
                <h3 className="font-bold text-xs text-[var(--text)]">
                  Draft Outreach Email
                </h3>
              </div>
              <button
                onClick={() => setEmailModalAccount(null)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              readOnly
              rows={8}
              value={generateEmailDraft(emailModalAccount)}
              className="w-full p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] font-mono leading-relaxed resize-none select-all"
            />

            <div className="mt-3 flex gap-2">
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(generateEmailDraft(emailModalAccount));
                  setEmailModalAccount(null);
                }}
                className="flex-1 py-2 rounded-xl bg-[#FFC600] text-[#111111] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:bg-[#ffcd1a]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Email Text</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
