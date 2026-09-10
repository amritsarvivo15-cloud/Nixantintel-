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
  ImportSession
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

export const App: React.FC = () => {
  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('gmv-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

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

  // 360° Org Details & SPOC modal state
  const [selectedOrgModalRecord, setSelectedOrgModalRecord] = useState<DerivedPortfolioRecord | null>(null);

  // Table display settings: density ('comfortable' | 'compact') and viewMode ('smart' | 'grid')
  const [tableDensity, setTableDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [tableViewMode, setTableViewMode] = useState<'smart' | 'grid'>('smart');

  const handleOpenAi = (account?: DerivedPortfolioRecord) => {
    setAiSelectedAccount(account || null);
    setIsAiOpen(true);
  };

  const handleOpenOrgDetails = (account: DerivedPortfolioRecord) => {
    setSelectedOrgModalRecord(account);
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('gmv-theme', theme);
  }, [theme]);

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

  // Toast notification state
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 3000);
  }, []);

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

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    channel: '',
    status: '',
    action: '',
    gmvfilter: ''
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
      gmvfilter: ''
    });
    showToast('Filters reset');
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const ch = filters.channel;
    const st = filters.status;
    const ac = filters.action;
    const gf = filters.gmvfilter;

    return derivedRecords.filter((r) => {
      const hay = (r.org + ' ' + r.domain + ' ' + r.orgname).toLowerCase();
      if (q && !hay.includes(q)) return false;
      if (ch && r.channel !== ch) return false;
      if (st && r.status !== st) return false;
      if (ac && r.actionBucket !== ac) return false;
      if (gf === '100k' && r.jul < 100000) return false;
      if (gf === '250k' && r.jul < 250000) return false;
      if (gf === 'zero' && r.jul !== 0) return false;
      return true;
    });
  }, [derivedRecords, filters]);

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
        />

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
              />
            </section>
          </div>
        )}

        {/* Sophisticated Enterprise SaaS Footer */}
        <EnterpriseFooter
          rowCount={derivedRecords.length}
          uniqueOrgCount={110}
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
