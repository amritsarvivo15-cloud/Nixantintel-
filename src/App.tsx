import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PORTFOLIO_DATA } from './data/portfolioData';
import {
  deriveRecord,
  computeTotals,
  copyText,
  exportToCsv,
  INR
} from './utils/formatters';
import {
  PortfolioRecord,
  DerivedPortfolioRecord,
  FilterOptions,
  DeviceDisplayMode,
  FreshnessState,
  ImportSession,
  QuickNotesMap,
  Lead,
  MatchStatus
} from './types';
import { Topbar } from './components/Topbar';
import { HeroSection } from './components/HeroSection';
import { KpiGrid } from './components/KpiGrid';
import { AnalyticsSection } from './components/AnalyticsSection';
import { PortfolioTable } from './components/PortfolioTable';
import { Toast } from './components/Toast';
import { AiAssistantModal } from './components/AiAssistantModal';
import { OrgDetailsModal } from './components/OrgDetailsModal';
import { FoldMobileView } from './components/FoldMobileView';
import { FoldDoubleOpenView } from './components/FoldDoubleOpenView';
import { FoldDeviceFrame } from './components/FoldDeviceFrame';
import { EnterpriseFooter } from './components/EnterpriseFooter';
import { GmvDataHubModal } from './components/GmvDataHubModal';
import { LeadFunnelCockpit } from './components/LeadFunnelCockpit';
import { AddLeadModal } from './components/AddLeadModal';
import { ConvertLeadModal } from './components/ConvertLeadModal';
import { getStoredLeads, saveStoredLeads } from './data/leadFunnelData';
import { todayIso, toIsoDate } from './utils/dates';

export const App: React.FC = () => {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('gmv-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Top-level navigation: 'portfolio' (active KAM accounts) vs 'funnel' (sales pipeline)
  const [activeNavTab, setActiveNavTab] = useState<'portfolio' | 'funnel'>('portfolio');

  // Leads pipeline state
  const [leads, setLeads] = useState<Lead[]>(() => getStoredLeads());
  const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  // Samsung Fold display mode state: 'fold-cover' | 'fold-unfolded' | 'auto'
  const [foldMode, setFoldMode] = useState<DeviceDisplayMode>(() => {
    const saved = localStorage.getItem('fold-display-mode') as DeviceDisplayMode;
    return saved === 'fold-cover' || saved === 'fold-unfolded' ? saved : 'fold-unfolded';
  });

  const [showDeviceFrame, setShowDeviceFrame] = useState<boolean>(true);
  const [showHingeGuide, setShowHingeGuide] = useState<boolean>(true);
  const [unfoldedLayout, setUnfoldedLayout] = useState<'split' | 'expanded'>('split');

  // AI Assistant modal state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiSelectedAccount, setAiSelectedAccount] = useState<DerivedPortfolioRecord | null>(null);
  const [aiSelectedLead, setAiSelectedLead] = useState<Lead | null>(null);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);

  // 360° Org Details & SPOC modal state
  const [selectedOrgModalRecord, setSelectedOrgModalRecord] = useState<DerivedPortfolioRecord | null>(null);

  // Table display settings: density ('comfortable' | 'compact') and viewMode ('smart' | 'grid')
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [tableViewMode, setTableViewMode] = useState<'smart' | 'grid'>('smart');

  const handleOpenAi = (account?: DerivedPortfolioRecord, prompt?: string) => {
    setAiSelectedLead(null);
    setAiSelectedAccount(account || null);
    setAiInitialPrompt(prompt);
    setIsAiOpen(true);
  };

  const handleOpenAiForLead = useCallback((lead: Lead, prompt?: string) => {
    setAiSelectedAccount(null);
    setAiSelectedLead(lead);
    setAiInitialPrompt(prompt);
    setIsAiOpen(true);
  }, []);

  const handleOpenOrgDetails = (account: DerivedPortfolioRecord) => {
    setSelectedOrgModalRecord(account);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('gmv-theme', theme);
  }, [theme]);

  // Global ⌘K / Ctrl+K keyboard shortcut to summon Zeta
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsAiOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persistent Quick Notes state (keyed by Org ID)
  const QUICK_NOTES_KEY = 'nixant_portfolio_quick_notes_v1';
  const [quickNotes, setQuickNotes] = useState<QuickNotesMap>(() => {
    try {
      const saved = localStorage.getItem('nixant_portfolio_quick_notes_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error('Error loading quick notes from localStorage:', e);
    }
    return {};
  });

  // Toast notification state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3000);
  }, []);

  const handleSaveQuickNote = useCallback((orgId: string, noteText: string) => {
    const trimmed = noteText.trim();
    setQuickNotes((prev) => {
      const next = { ...prev };
      if (!trimmed) {
        delete next[orgId];
        showToast(`Quick Note removed for Org #${orgId}`);
      } else {
        next[orgId] = {
          note: trimmed,
          updatedAt: new Date().toISOString()
        };
        showToast(`Quick Note saved for Org #${orgId}`);
      }
      try {
        localStorage.setItem(QUICK_NOTES_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Error saving quick notes to localStorage:', e);
      }
      return next;
    });
  }, [showToast]);

  const handleFoldModeChange = (mode: DeviceDisplayMode) => {
    setFoldMode(mode);
    localStorage.setItem('fold-display-mode', mode);
    showToast(
      mode === 'fold-cover'
        ? 'Switched to Samsung Fold Ultra: Single Mobile Screen'
        : mode === 'fold-unfolded'
        ? 'Switched to Samsung Fold Ultra: Double Open Full Screen'
        : 'Switched to Adaptive Desktop View'
    );
  };

  // Clean up legacy travel data cache
  useEffect(() => {
    localStorage.removeItem('travel_dashboard_data');
    sessionStorage.removeItem('travel_dashboard_auth');
  }, []);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Portfolio state with localStorage persistence
  const [portfolioData, setPortfolioData] = useState<PortfolioRecord[]>(() => {
    try {
      const saved = localStorage.getItem('radar365_portfolio_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored portfolio:', e);
    }
    return PORTFOLIO_DATA;
  });

  // Freshness state with localStorage persistence
  const [freshness, setFreshness] = useState<FreshnessState>(() => {
    try {
      const saved = localStorage.getItem('radar365_freshness_state');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Error loading freshness state:', e);
    }
    return {
      dataThroughDate: '10 Sep 2026',
      importedAt: '10 Sep 2026, 09:30 IST',
      lastSourceName: 'Consolidated_NonRAM_KAM_Baseline.xlsx',
      lastSourceType: 'Excel / XLSX',
      status: 'fresh'
    };
  });

  // Historical import sessions for audit trail and rollback
  const [importHistory, setImportHistory] = useState<ImportSession[]>(() => {
    try {
      const saved = localStorage.getItem('radar365_import_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading import history:', e);
    }
    return [];
  });

  // Data Hub Modal visibility state
  const [isDataHubOpen, setIsDataHubOpen] = useState<boolean>(false);
  const [dataHubInitialTab, setDataHubInitialTab] = useState<'smart' | 'paste' | 'single' | 'history'>('smart');

  const handleOpenDataHub = (tab: 'smart' | 'paste' | 'single' | 'history' = 'smart') => {
    setDataHubInitialTab(tab);
    setIsDataHubOpen(true);
  };

  const handleCommitUpdates = (updated: PortfolioRecord[], session: ImportSession) => {
    setPortfolioData(updated);
    try {
      localStorage.setItem('radar365_portfolio_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    const nextHistory = [session, ...importHistory];
    setImportHistory(nextHistory);
    try {
      localStorage.setItem('radar365_import_history', JSON.stringify(nextHistory));
    } catch (e) {}

    const nextFreshness: FreshnessState = {
      dataThroughDate: session.dataThroughDate,
      importedAt: session.importedAt,
      lastSourceName: session.fileName,
      lastSourceType: session.sourceType,
      status: 'fresh'
    };
    setFreshness(nextFreshness);
    try {
      localStorage.setItem('radar365_freshness_state', JSON.stringify(nextFreshness));
    } catch (e) {}

    showToast(`GMV refreshed through ${session.dataThroughDate} (${session.valuesChanged} updated)`);
  };

  const handleRollback = (session: ImportSession) => {
    if (session.rollbackSnapshot && Array.isArray(session.rollbackSnapshot)) {
      setPortfolioData(session.rollbackSnapshot);
      try {
        localStorage.setItem('radar365_portfolio_v2', JSON.stringify(session.rollbackSnapshot));
      } catch (e) {}

      const nextHistory = importHistory.filter((s) => s.importId !== session.importId);
      setImportHistory(nextHistory);
      try {
        localStorage.setItem('radar365_import_history', JSON.stringify(nextHistory));
      } catch (e) {}

      showToast(`Reverted portfolio back to snapshot prior to ${session.fileName}`);
    }
  };

  // Base derived records from current portfolioData (auto-recalculates on commit/rollback)
  const derivedRecords: DerivedPortfolioRecord[] = useMemo(() => {
    return portfolioData.map(deriveRecord);
  }, [portfolioData]);

  // Global KPIs based on all records (Org-ID deduped)
  const globalKpis = useMemo(() => {
    return computeTotals(derivedRecords);
  }, [derivedRecords]);

  // Count of leads requiring immediate action today or overdue
  const funnelActionCount = useMemo(() => {
    const today = todayIso();
    return leads.filter((l) => {
      if (l.stage === 'ACTIVATED' || l.stage === 'GMV STARTED' || l.stage === 'LOST') return false;
      const followUp = toIsoDate(l.nextFollowUpDate);
      if (!followUp) return false;
      return followUp <= today;
    }).length;
  }, [leads]);

  const handleCreateLead = useCallback(
    (newLead: Lead) => {
      setLeads((prev) => {
        const updated = [newLead, ...prev];
        saveStoredLeads(updated);
        return updated;
      });
      showToast(`Lead created: ${newLead.companyName}`);
    },
    [showToast]
  );

  const handleBulkCreateLeads = useCallback(
    (newLeads: Lead[]) => {
      setLeads((prev) => {
        const updated = [...newLeads, ...prev];
        saveStoredLeads(updated);
        return updated;
      });
      showToast(`Added ${newLeads.length} leads to funnel`);
    },
    [showToast]
  );

  const handleUpdateLead = useCallback((updatedLead: Lead) => {
    setLeads((prev) => {
      const updated = prev.map((l) => (l.id === updatedLead.id ? updatedLead : l));
      saveStoredLeads(updated);
      return updated;
    });
  }, []);

  const handleDeleteLead = useCallback(
    (leadId: string) => {
      setLeads((prev) => {
        const target = prev.find((l) => l.id === leadId);
        const updated = prev.filter((l) => l.id !== leadId);
        saveStoredLeads(updated);
        if (target) showToast(`Lead removed: ${target.companyName}`);
        return updated;
      });
    },
    [showToast]
  );

  const handleConvertLead = useCallback(
    (
      lead: Lead,
      accountData: {
        org: string;
        orgname: string;
        domain: string;
        channel: string;
        jul: number;
        aug: number | null;
        sep: number | null;
        status: MatchStatus;
        total: number | null;
        activationDate: string;
      }
    ) => {
      const newRecord: PortfolioRecord = {
        org: accountData.org,
        orgname: accountData.orgname,
        domain: accountData.domain,
        channel: accountData.channel,
        status: 'Matched',
        jul: accountData.jul,
        aug: accountData.aug,
        sep: accountData.sep,
        total: (accountData.jul || 0) + (accountData.aug || 0) + (accountData.sep || 0)
      };

      setPortfolioData((prev) => {
        const next = [newRecord, ...prev];
        try {
          localStorage.setItem('radar365_portfolio_v2', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      // 2. Mark lead as ACTIVATED and record history
      const nowIso = new Date().toISOString();
      const nowTs = Date.now();
      const updatedLead: Lead = {
        ...lead,
        stage: 'ACTIVATED',
        convertedOrgId: accountData.org,
        convertedAt: nowIso,
        history: [
          ...lead.history,
          {
            id: `hist-${nowTs}`,
            date: '10 Sep 2026',
            timestamp: nowTs,
            stage: 'ACTIVATED',
            action: 'CONVERTED_TO_ACCOUNT',
            note: `Promoted to active Radar365 Portfolio Account (Org ID: #${accountData.org})`,
            author: 'You'
          }
        ]
      };

      setLeads((prev) => {
        const updated = prev.map((l) => (l.id === lead.id ? updatedLead : l));
        saveStoredLeads(updated);
        return updated;
      });

      // 3. Save initial Quick Note for new account
      const noteText =
        lead.quickNote?.trim() ||
        `Onboarded from Lead Funnel. SPOC: ${lead.contactName} (${lead.designation || 'Lead Contact'}, ${lead.mobile || lead.email})`;

      handleSaveQuickNote(accountData.org, noteText);

      setLeadToConvert(null);
      showToast(`Lead "${lead.companyName}" successfully promoted to Portfolio Account #${accountData.org}!`);
    },
    [handleSaveQuickNote, showToast]
  );

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    channel: '',
    status: '',
    action: '',
    gmvfilter: '',
    noteFilter: '',
    tagFilter: ''
  });

  const handleFilterChange = <K extends keyof FilterOptions>(key: K, value: FilterOptions[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      channel: '',
      status: '',
      action: '',
      gmvfilter: '',
      noteFilter: '',
      tagFilter: ''
    });
    showToast('Filters reset');
  };

  // Filtered rows (joined with persistent Quick Notes by Org ID)
  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const ch = filters.channel;
    const st = filters.status;
    const ac = filters.action;
    const gf = filters.gmvfilter;
    const nf = filters.noteFilter;
    const tf = filters.tagFilter;

    return derivedRecords.filter((r) => {
      const hay = (r.org + ' ' + r.domain + ' ' + r.orgname).toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (ch && r.channel !== ch) return false;
      if (st && r.status !== st) return false;

      // Action filter can be a workflow queue or Quick Note status
      if (ac === 'has_note') {
        if (!quickNotes[r.org]?.note?.trim()) return false;
      } else if (ac === 'no_note') {
        if (quickNotes[r.org]?.note?.trim()) return false;
      } else if (ac && r.actionBucket !== ac) {
        return false;
      }

      // Dedicated note presence filter
      if (nf === 'has_note' && !quickNotes[r.org]?.note?.trim()) return false;
      if (nf === 'no_note' && quickNotes[r.org]?.note?.trim()) return false;

      // Tag filter
      if (tf) {
        const tags = quickNotes[r.org]?.tags || [];
        if (!tags.map((t) => t.toLowerCase()).includes(tf.toLowerCase())) return false;
      }

      if (gf === '100k' && r.jul < 100000) return false;
      if (gf === '250k' && r.jul < 250000) return false;
      if (gf === 'zero' && r.jul !== 0) return false;
      return true;
    });
  }, [derivedRecords, filters, quickNotes]);

  // Copy portfolio summary
  const handleCopySummary = async () => {
    const t = globalKpis;
    const text = `GMV Portfolio V2\nJuly: ${INR(t.julTotal)}\nAugust: ${INR(
      t.augTotal
    )}\nSeptember MTD: ${INR(t.sepTotal)}\nKnown 3-month GMV: ${INR(
      t.knownTotal
    )}\nMatched accounts: ${t.matchedCount}\nAug vs Jul matched cohort: ${
      (t.growth ?? 0) >= 0 ? '+' : ''
    }${(t.growth ?? 0).toFixed(1)}%`;

    await copyText(text);
    showToast('Summary copied');
  };

  // Export filtered rows to CSV
  const handleExportCsv = () => {
    exportToCsv(filteredRows);
    showToast(`Exported ${filteredRows.length} rows to CSV`);
  };

  // Copy individual row
  const handleCopyAccount = async (r: DerivedPortfolioRecord) => {
    const text = `Org ID: ${r.org}\nOrganisation: ${r.orgname}\nDomain: ${r.domain}`;
    await copyText(text);
    showToast('Account copied');
  };

  return (
    <div className="min-h-screen">
      <main className="max-w-[1580px] mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
        {/* Top Header Bar with Galaxy Fold Mode Switcher & Ingestion Hub */}
        <Topbar
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onCopySummary={handleCopySummary}
          onExportCsv={handleExportCsv}
          onOpenAi={() => handleOpenAi()}
          foldMode={foldMode}
          onFoldModeChange={handleFoldModeChange}
          showDeviceFrame={showDeviceFrame}
          onToggleDeviceFrame={() => setShowDeviceFrame((prev) => !prev)}
          showHingeGuide={showHingeGuide}
          onToggleHingeGuide={() => setShowHingeGuide((prev) => !prev)}
          unfoldedLayout={unfoldedLayout}
          onToggleUnfoldedLayout={() =>
            setUnfoldedLayout((prev) => (prev === 'split' ? 'expanded' : 'split'))
          }
          freshness={freshness}
          history={importHistory}
          onOpenDataHub={handleOpenDataHub}
          onRollback={handleRollback}
          activeNavTab={activeNavTab}
          onNavTabChange={setActiveNavTab}
          actionBadgeCount={funnelActionCount}
          portfolioCount={derivedRecords.length}
          leadsCount={leads.length}
        />

        {/* ------------------------------------------------------------------ */}
        {/* VIEW 1: PRE-CONVERSION LEAD FUNNEL COCKPIT                          */}
        {/* ------------------------------------------------------------------ */}
        {activeNavTab === 'funnel' ? (
          <div className="my-2 animate-fadeIn">
            <LeadFunnelCockpit
              leads={leads}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              onOpenAddLeadModal={() => setIsAddLeadModalOpen(true)}
              onOpenConvertModal={(lead) => setLeadToConvert(lead)}
              onOpenZetaWithLead={handleOpenAiForLead}
              onViewPortfolioAccount={(orgId) => {
                setActiveNavTab('portfolio');
                const found = derivedRecords.find((r) => r.org === orgId);
                if (found) handleOpenOrgDetails(found);
              }}
              portfolioAccounts={derivedRecords}
            />
          </div>
        ) : (
          /* ------------------------------------------------------------------ */
          /* VIEW 2: ACTIVE ACCOUNT PORTFOLIO INTELLIGENCE                      */
          /* ------------------------------------------------------------------ */
          <>
            {/* ------------------------------------------------------------------ */}
            {/* MODE 1: SAMSUNG FOLD ULTRA 8 — SINGLE MOBILE SCREEN (COVER DISPLAY) */}
            {/* ------------------------------------------------------------------ */}
            {foldMode === 'fold-cover' && (
              <div className="flex flex-col items-center justify-center my-2">
                <FoldDeviceFrame
                  enabled={showDeviceFrame}
                  onCloseFrame={() => setShowDeviceFrame(false)}
                >
                  <FoldMobileView
                    kpis={globalKpis}
                    records={derivedRecords}
                    onOpenAi={handleOpenAi}
                    onCopyAccount={handleCopyAccount}
                    onSelectOrg={handleOpenOrgDetails}
                    theme={theme}
                    onToggleTheme={handleToggleTheme}
                    quickNotes={quickNotes}
                    onSaveQuickNote={handleSaveQuickNote}
                  />
                </FoldDeviceFrame>
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* MODE 2: SAMSUNG FOLD ULTRA 8 — DOUBLE OPEN FULL SCREEN (UNFOLDED)   */}
            {/* ------------------------------------------------------------------ */}
            {foldMode === 'fold-unfolded' && (
              <div className="my-2">
                {unfoldedLayout === 'split' ? (
                  <FoldDoubleOpenView
                    kpis={globalKpis}
                    records={derivedRecords}
                    onOpenAi={handleOpenAi}
                    onCopyAccount={handleCopyAccount}
                    onSelectOrg={handleOpenOrgDetails}
                    showHingeGuide={showHingeGuide}
                    unfoldedLayout={unfoldedLayout}
                    theme={theme}
                    quickNotes={quickNotes}
                    onSaveQuickNote={handleSaveQuickNote}
                  />
                ) : (
                  <div>
                    {/* Expansive Full Canvas View */}
                    <HeroSection
                      kpis={globalKpis}
                      onOpenAi={() => handleOpenAi()}
                      dataThroughDate={freshness.dataThroughDate}
                    />
                    <KpiGrid kpis={globalKpis} />
                    <AnalyticsSection
                      kpis={globalKpis}
                      rows={derivedRecords}
                      selectedAction={filters.action}
                      selectedChannel={filters.channel}
                      onSelectAction={(action) => handleFilterChange('action', action)}
                      onSelectChannel={(channel) => handleFilterChange('channel', channel)}
                    />
                    <section id="workspace-section" className="mt-4">
                      <PortfolioTable
                        rows={filteredRows}
                        totalRowsCount={derivedRecords.length}
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        onResetFilters={handleResetFilters}
                        onExportCsv={handleExportCsv}
                        onCopyAccount={handleCopyAccount}
                        onAskAi={(r) => handleOpenAi(r)}
                        onSelectOrg={handleOpenOrgDetails}
                        density={tableDensity}
                        onToggleDensity={() =>
                          setTableDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))
                        }
                        viewMode={tableViewMode}
                        onToggleViewMode={() =>
                          setTableViewMode((v) => (v === 'smart' ? 'grid' : 'smart'))
                        }
                        onOpenDataHub={handleOpenDataHub}
                        dataThroughDate={freshness.dataThroughDate}
                        quickNotes={quickNotes}
                        onSaveQuickNote={handleSaveQuickNote}
                      />
                    </section>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------------ */}
            {/* MODE 3: ADAPTIVE DESKTOP COCKPIT                                   */}
            {/* ------------------------------------------------------------------ */}
            {foldMode === 'auto' && (
              <div>
                <HeroSection
                  kpis={globalKpis}
                  onOpenAi={() => handleOpenAi()}
                  onOpenAiWithPrompt={(prompt) => handleOpenAi(undefined, prompt)}
                  dataThroughDate={freshness.dataThroughDate}
                />
                <KpiGrid kpis={globalKpis} />
                <AnalyticsSection
                  kpis={globalKpis}
                  rows={derivedRecords}
                  selectedAction={filters.action}
                  selectedChannel={filters.channel}
                  onSelectAction={(action) => handleFilterChange('action', action)}
                  onSelectChannel={(channel) => handleFilterChange('channel', channel)}
                />
                <section id="workspace-section" className="mt-4">
                  <PortfolioTable
                    rows={filteredRows}
                    totalRowsCount={derivedRecords.length}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onResetFilters={handleResetFilters}
                    onExportCsv={handleExportCsv}
                    onCopyAccount={handleCopyAccount}
                    onAskAi={(r) => handleOpenAi(r)}
                    onSelectOrg={handleOpenOrgDetails}
                    density={tableDensity}
                    onToggleDensity={() =>
                      setTableDensity((d) => (d === 'comfortable' ? 'compact' : 'comfortable'))
                    }
                    viewMode={tableViewMode}
                    onToggleViewMode={() =>
                      setTableViewMode((v) => (v === 'smart' ? 'grid' : 'smart'))
                    }
                    onOpenDataHub={handleOpenDataHub}
                    dataThroughDate={freshness.dataThroughDate}
                    quickNotes={quickNotes}
                    onSaveQuickNote={handleSaveQuickNote}
                  />
                </section>
              </div>
            )}
          </>
        )}

        {/* Sophisticated Enterprise SaaS Footer */}
        <EnterpriseFooter
          rowCount={derivedRecords.length}
          uniqueOrgCount={globalKpis.uniqueOrgCount}
          lastUpdated={freshness.dataThroughDate}
        />
      </main>

      {/* 360° Org Details & SPOC Modal */}
      <OrgDetailsModal
        record={selectedOrgModalRecord}
        isOpen={!!selectedOrgModalRecord}
        onClose={() => setSelectedOrgModalRecord(null)}
        onOpenAiAssistant={handleOpenAi}
      />

      {/* Radar AI Assistant Drawer */}
      <AiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        selectedAccount={aiSelectedAccount}
        selectedLead={aiSelectedLead}
        initialPrompt={aiInitialPrompt}
      />

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddLeadModalOpen}
        onClose={() => setIsAddLeadModalOpen(false)}
        onAddLead={handleCreateLead}
        onAddBulkLeads={handleBulkCreateLeads}
        portfolioAccounts={derivedRecords}
        existingLeads={leads}
      />

      {/* Convert Lead Modal */}
      <ConvertLeadModal
        lead={leadToConvert}
        isOpen={Boolean(leadToConvert)}
        onClose={() => setLeadToConvert(null)}
        onConvert={handleConvertLead}
        portfolioAccounts={derivedRecords}
      />

      {/* Auto GMV Refresh & Data Ingestion Modal */}
      <GmvDataHubModal
        isOpen={isDataHubOpen}
        onClose={() => setIsDataHubOpen(false)}
        portfolio={portfolioData}
        onCommitUpdates={handleCommitUpdates}
        freshness={freshness}
        history={importHistory}
        onRollback={handleRollback}
        initialTab={dataHubInitialTab}
      />

      {/* Floating Toast Notification */}
      <Toast message={toastMsg} />
    </div>
  );
};

export default App;
