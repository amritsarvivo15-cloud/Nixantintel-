import React, { useState, useMemo, useRef } from 'react';
import {
  PortfolioRecord,
  ImportSession,
  ImportSourceType,
  ImportedRowPreview,
  RowMatchStatus,
  FreshnessState
} from '../types';
import {
  buildImportPreview,
  commitImportedRows,
  parsePastedOrCsvText,
  parseExcelArrayBuffer
} from '../utils/dataIngestionEngine';
import { CompanyLogo } from './CompanyLogo';
import { ZetaCharacter } from './ZetaCharacter';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Clipboard,
  UserCheck,
  History,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Search,
  Check,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface GmvDataHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioRecord[];
  onCommitUpdates: (updatedPortfolio: PortfolioRecord[], session: ImportSession) => void;
  freshness: FreshnessState;
  history: ImportSession[];
  onRollback: (session: ImportSession) => void;
  initialTab?: 'smart' | 'paste' | 'single' | 'history';
}

export const GmvDataHubModal: React.FC<GmvDataHubModalProps> = ({
  isOpen,
  onClose,
  portfolio,
  onCommitUpdates,
  freshness,
  history,
  onRollback,
  initialTab = 'smart'
}) => {
  if (!isOpen) return null;

  // Tabs: 'smart' | 'paste' | 'single' | 'history'
  const [activeTab, setActiveTab] = useState<'smart' | 'paste' | 'single' | 'history'>(initialTab);

  // Workflow steps: 'input' | 'preview' | 'committed'
  const [step, setStep] = useState<'input' | 'preview' | 'committed'>('input');
  // Zeta Ingestion Phases: 'idle' | 'analyzing' | 'processing' | 'success'
  const [ingestionState, setIngestionState] = useState<'idle' | 'analyzing' | 'processing' | 'success'>('idle');
  const [committedSession, setCommittedSession] = useState<ImportSession | null>(null);

  const [sourceFileName, setSourceFileName] = useState<string>('Pasted_GMV_Data.txt');
  const [sourceType, setSourceType] = useState<ImportSourceType>('CSV');
  const [isLoadingOcr, setIsLoadingOcr] = useState<boolean>(false);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Default target month & data-through date
  const [targetMonth, setTargetMonth] = useState<string>('sep');
  const [customDataThroughDate, setCustomDataThroughDate] = useState<string>('10 Sep 2026');

  // Preview state
  const [previews, setPreviews] = useState<ImportedRowPreview[]>([]);
  const [previewFilter, setPreviewFilter] = useState<string>('all');
  const [searchPreview, setSearchPreview] = useState<string>('');

  // Paste mode text
  const [pasteText, setPasteText] = useState<string>('');

  // Single Account mode state
  const [singleSearch, setSingleSearch] = useState<string>('');
  const [selectedSingleAccount, setSelectedSingleAccount] = useState<PortfolioRecord | null>(null);
  const [singleMonth, setSingleMonth] = useState<string>('sep');
  const [singleGmv, setSingleGmv] = useState<string>('');
  const [singleDate, setSingleDate] = useState<string>('10 Sep 2026');
  const [singleNote, setSingleNote] = useState<string>('');

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered preview rows
  const filteredPreviews = useMemo(() => {
    let list = previews;
    if (previewFilter !== 'all') {
      if (previewFilter === 'conflicts') list = list.filter((p) => p.status === 'Conflict');
      else if (previewFilter === 'review') list = list.filter((p) => p.status === 'Review Required');
      else if (previewFilter === 'updated') list = list.filter((p) => p.status === 'Updated' || p.status === 'Ready');
      else if (previewFilter === 'unmatched') list = list.filter((p) => p.status === 'Unmatched');
      else if (previewFilter === 'invalid') list = list.filter((p) => p.status === 'Invalid');
    }
    if (searchPreview.trim()) {
      const q = searchPreview.toLowerCase();
      list = list.filter(
        (p) =>
          p.rawOrgId.toLowerCase().includes(q) ||
          p.rawOrgName.toLowerCase().includes(q) ||
          p.rawDomain.toLowerCase().includes(q) ||
          (p.matchedRecord && p.matchedRecord.orgname.toLowerCase().includes(q))
      );
    }
    return list;
  }, [previews, previewFilter, searchPreview]);

  // Preview Summary Stats
  const previewSummary = useMemo(() => {
    const total = previews.length;
    const matched = previews.filter((p) => p.matchedRecord && p.status !== 'Unmatched' && p.status !== 'Invalid').length;
    const conflicts = previews.filter((p) => p.status === 'Conflict').length;
    const review = previews.filter((p) => p.status === 'Review Required').length;
    const unmatched = previews.filter((p) => p.status === 'Unmatched').length;
    const invalid = previews.filter((p) => p.status === 'Invalid').length;
    return { total, matched, conflicts, review, unmatched, invalid };
  }, [previews]);

  // Process rows into Preview
  const generatePreview = (rows: any[], fileName: string, srcType: ImportSourceType, defaultDate = customDataThroughDate) => {
    setSourceFileName(fileName);
    setSourceType(srcType);

    const { previews: builtPreviews, summary } = buildImportPreview(
      rows,
      portfolio,
      targetMonth,
      defaultDate
    );

    setPreviews(builtPreviews);
    setCustomDataThroughDate(summary.dataThroughDate);
    setStep('preview');
  };

  // Handle File Upload (CSV, XLSX, Image, PDF, JSON)
  const handleFileUpload = async (file: File) => {
    const fileName = file.name;
    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';

    setIngestionState('analyzing');

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      try {
        const buffer = await file.arrayBuffer();
        setTimeout(() => {
          const rows = parseExcelArrayBuffer(buffer);
          if (rows.length === 0) {
            setIngestionState('idle');
            alert('No tabular rows detected in Excel workbook.');
            return;
          }
          generatePreview(rows, fileName, 'Excel / XLSX');
          setIngestionState('idle');
        }, 500);
      } catch (err: any) {
        setIngestionState('idle');
        alert('Error reading Excel file: ' + err.message);
      }
    } else if (fileExt === 'csv' || fileExt === 'tsv' || fileExt === 'txt') {
      try {
        const text = await file.text();
        setTimeout(() => {
          const rows = parsePastedOrCsvText(text);
          if (rows.length === 0) {
            setIngestionState('idle');
            alert('No tabular rows detected in file.');
            return;
          }
          generatePreview(rows, fileName, 'CSV');
          setIngestionState('idle');
        }, 500);
      } catch (err: any) {
        setIngestionState('idle');
        alert('Error reading CSV file: ' + err.message);
      }
    } else if (fileExt === 'json') {
      try {
        const text = await file.text();
        setTimeout(() => {
          const parsed = JSON.parse(text);
          const rows = Array.isArray(parsed) ? parsed : [parsed];
          generatePreview(rows, fileName, 'JSON');
          setIngestionState('idle');
        }, 500);
      } catch (err: any) {
        setIngestionState('idle');
        alert('Error reading JSON file: ' + err.message);
      }
    } else if (['png', 'jpg', 'jpeg', 'webp', 'pdf'].includes(fileExt)) {
      // Multimodal Vision / OCR via server
      setIsLoadingOcr(true);
      setOcrError(null);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const res = await fetch('/api/extract-image-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imageBase64: base64,
                mimeType: file.type || 'image/png',
                fileName
              })
            });

            if (!res.ok) {
              const errJson = await res.json();
              throw new Error(errJson.error || 'Server failed to process image');
            }

            const data = await res.json();
            if (!data.rows || data.rows.length === 0) {
              throw new Error('Gemini Vision did not detect readable sales tables in this screenshot.');
            }

            const detectedDate = data.detectedDate || customDataThroughDate;
            generatePreview(data.rows, fileName, fileExt === 'pdf' ? 'PDF' : 'Screenshot / Image', detectedDate);
          } catch (serverErr: any) {
            setOcrError(serverErr.message || 'Failed to extract data');
          } finally {
            setIsLoadingOcr(false);
            setIngestionState('idle');
          }
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        setIsLoadingOcr(false);
        setIngestionState('idle');
        setOcrError(err.message);
      }
    } else {
      setIngestionState('idle');
      alert('Unsupported file type. Please upload CSV, XLSX, JSON, PDF, or image screenshot.');
    }
  };

  // Handle Paste Data submission
  const handleProcessPaste = () => {
    if (!pasteText.trim()) {
      alert('Please paste some data or click "Load Sample" first.');
      return;
    }
    setIngestionState('analyzing');
    setTimeout(() => {
      const rows = parsePastedOrCsvText(pasteText);
      if (rows.length === 0) {
        setIngestionState('idle');
        alert('Could not parse any rows from the pasted text.');
        return;
      }
      generatePreview(rows, 'Pasted_Data_Batch.txt', 'Pasted Text');
      setIngestionState('idle');
    }, 450);
  };

  // Handle Single Account submission
  const handleProcessSingle = () => {
    if (!selectedSingleAccount) {
      alert('Please search and select a corporate account.');
      return;
    }
    const gmvNum = parseFloat(singleGmv.replace(/[^0-9.]/g, ''));
    if (isNaN(gmvNum)) {
      alert('Please enter a valid numeric GMV value.');
      return;
    }

    setIngestionState('analyzing');
    setTimeout(() => {
      const row = {
        org: selectedSingleAccount.org,
        orgname: selectedSingleAccount.orgname,
        domain: selectedSingleAccount.domain,
        gmv: gmvNum,
        month: singleMonth,
        date: singleDate
      };

      generatePreview([row], `Single_Entry_${selectedSingleAccount.org}.entry`, 'Manual Single', singleDate);
      setIngestionState('idle');
    }, 400);
  };

  // Handle Conflict Resolution Toggle in preview
  const handleConflictResolution = (rowId: string, resolution: 'Replace' | 'Keep Existing' | 'Add / Merge') => {
    setPreviews((prev) =>
      prev.map((p) => {
        if (p.id === rowId && p.conflictDetails) {
          return {
            ...p,
            conflictDetails: {
              ...p.conflictDetails,
              resolution
            }
          };
        }
        return p;
      })
    );
  };

  // Handle Manual Link for Review Required rows
  const handleManualMapOrg = (rowId: string, orgId: string) => {
    const matched = portfolio.find((r) => r.org === orgId);
    if (!matched) return;

    setPreviews((prev) =>
      prev.map((p) => {
        if (p.id === rowId) {
          return {
            ...p,
            matchedRecord: matched,
            matchStrategy: 'Org ID' as const,
            confidenceScore: 100,
            status: 'Ready' as RowMatchStatus,
            statusReason: `Manually linked to ${matched.orgname}`
          };
        }
        return p;
      })
    );
  };

  // Confirm and Commit Updates with Zeta Processing & Celebratory Success
  const handleConfirmCommit = () => {
    setIngestionState('processing');

    setTimeout(() => {
      const { updatedPortfolio, session } = commitImportedRows(
        portfolio,
        previews,
        customDataThroughDate,
        sourceFileName,
        sourceType
      );

      setCommittedSession(session);
      onCommitUpdates(updatedPortfolio, session);
      setIngestionState('success');
      setStep('committed');
    }, 850);
  };

  // Load sample data for quick demonstration
  const handleLoadSamplePaste = () => {
    const sample = `599324 | ORO SOFTWARE PRIVATE LIMITED | orolabs.ai | 556169 | Sep 2026
226888 | Greenchef Appliances Ltd | greenchef.in | 461959 | Sep 2026
451940 | Skydo Technologies Pvt Ltd | skydo.com | 439752 | Sep 2026
781204 | TransUnion CIBIL Ltd | transunion.com | 382100 | Sep 2026
630911 | PerkinElmer Health Sciences | perkinelmer.com | 295000 | Sep 2026
918231 | Nestasia Lifestyle Home | nestasia.in | 185000 | Sep 2026
551290 | Festo Controls Corp | festo.com | 210000 | Sep 2026`;
    setPasteText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-[#0f1115] shadow-2xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ZetaCharacter
                size="sm"
                state={
                  ingestionState === 'analyzing'
                    ? 'research'
                    : ingestionState === 'processing'
                    ? 'thinking'
                    : step === 'committed'
                    ? 'success'
                    : step === 'preview'
                    ? 'opportunity'
                    : 'default'
                }
                interactive={false}
                showStatusDot={true}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-[var(--text)]">
                  Auto GMV Refresh & Data Ingestion
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30 font-mono">
                  {ingestionState === 'analyzing'
                    ? 'Zeta Analyzing'
                    : ingestionState === 'processing'
                    ? 'Zeta Processing'
                    : step === 'committed'
                    ? 'Zeta Celebrating'
                    : 'Zeta Engine'}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Update monthly GMV safely without modifying core account mapping or zeroing missing accounts. Current baseline: <strong className="text-[var(--text)]">{freshness.dataThroughDate}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Step Breadcrumb with Zeta Ingestion States */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono font-medium px-3 py-1 rounded-xl bg-gray-100 dark:bg-zinc-800/80 text-[var(--muted)]">
              <span className={ingestionState === 'analyzing' || (step === 'input' && ingestionState === 'idle') ? 'text-[#FFC600] font-bold' : 'text-[var(--text)]'}>
                {ingestionState === 'analyzing' ? '1. Analyzing' : '1. Source'}
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className={step === 'preview' && ingestionState === 'idle' ? 'text-[#FFC600] font-bold' : ''}>
                2. Preview & Validate
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className={ingestionState === 'processing' ? 'text-[#FFC600] font-bold animate-pulse' : step === 'committed' ? 'text-emerald-500 font-bold' : ''}>
                {ingestionState === 'processing' ? '3. Processing...' : step === 'committed' ? '3. Succeeded ✓' : '3. Commit'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--text)] hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* STATE: ANALYZING (Zeta Inspecting Telemetry) */}
          {ingestionState === 'analyzing' && (
            <div className="py-12 sm:py-16 px-6 text-center space-y-5 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-center mb-1">
                <ZetaCharacter
                  size="xl"
                  state="research"
                  interactive={false}
                  showStatusDot={true}
                  withSpeech="Inspecting columns & corporate domain matches..."
                  speechPosition="top"
                />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC600]/15 border border-[#FFC600]/30 text-[#FFC600] text-xs font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#FFC600] animate-ping" />
                  <span>ZETA ANALYZING TELEMETRY</span>
                </div>
                <h3 className="text-lg font-black text-[var(--text)] tracking-tight">
                  Scanning Sales Data & Org Mappings
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Zeta is cross-referencing Org IDs, domains, and currency numbers against your 113 corporate accounts...
                </p>
              </div>

              {/* Animated scanning bar */}
              <div className="w-56 h-1.5 bg-gray-200 dark:bg-zinc-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#FFC600] to-[#E5A700] rounded-full animate-pulse w-4/5" />
              </div>

              <div className="text-[11px] text-[var(--muted)] font-mono">
                Source: {sourceFileName}
              </div>
            </div>
          )}

          {/* STATE: PROCESSING (Zeta Calculating Recalculations) */}
          {ingestionState === 'processing' && (
            <div className="py-12 sm:py-16 px-6 text-center space-y-5 max-w-md mx-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-center mb-1">
                <ZetaCharacter
                  size="xl"
                  state="thinking"
                  interactive={false}
                  showStatusDot={true}
                  withSpeech="Recalculating monthly GMVs & updating trends..."
                  speechPosition="top"
                />
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>ZETA PROCESSING REFRESH</span>
                </div>
                <h3 className="text-lg font-black text-[var(--text)] tracking-tight">
                  Applying Portfolio Updates
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Recalculating matched account deltas, updating health trends, and securing rollback snapshot...
                </p>
              </div>

              {/* Live step checklist */}
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-[var(--line)] text-left space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Validated {previewSummary.matched} matched accounts</span>
                </div>
                <div className="flex items-center gap-2 text-[#FFC600] font-medium text-[11px]">
                  <span className="w-3 h-3 rounded-full border-2 border-[#FFC600] border-t-transparent animate-spin flex-shrink-0" />
                  <span>Committing {targetMonth.toUpperCase()} figures through {customDataThroughDate}...</span>
                </div>
                <div className="flex items-center gap-2 text-[var(--muted)] text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Generating immutable rollback snapshot</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: INPUT & SOURCE SELECTION */}
          {step === 'input' && ingestionState === 'idle' && (
            <div>
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-gray-200 dark:border-zinc-800 pb-3 mb-5 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('smart')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'smart'
                      ? 'bg-[#FFC600] text-black font-bold shadow'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Smart Import / Upload</span>
                </button>

                <button
                  onClick={() => setActiveTab('paste')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'paste'
                      ? 'bg-[#FFC600] text-black font-bold shadow'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <Clipboard className="w-4 h-4" />
                  <span>Paste Data / Table</span>
                </button>

                <button
                  onClick={() => setActiveTab('single')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'single'
                      ? 'bg-[#FFC600] text-black font-bold shadow'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Single Account</span>
                </button>

                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'history'
                      ? 'bg-[#FFC600] text-black font-bold shadow'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-gray-100 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <History className="w-4 h-4" />
                  <span>Audit Trail & Rollback</span>
                </button>
              </div>

              {/* TAB: SMART IMPORT (DRAG & DROP) */}
              {activeTab === 'smart' && (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-[#FFC600] bg-[#FFC600]/10 scale-[0.99]'
                        : 'border-gray-200 dark:border-zinc-700/80 hover:border-[#FFC600]/60 bg-gray-50/50 dark:bg-zinc-900/30'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".csv,.xlsx,.xls,.json,.pdf,.png,.jpg,.jpeg,.webp,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FFC600]/15 flex items-center justify-center text-[#FFC600] mb-4">
                      {isLoadingOcr ? (
                        <ZetaCharacter size="sm" state="research" interactive={false} showStatusDot={true} />
                      ) : (
                        <UploadCloud className="w-8 h-8" />
                      )}
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-[var(--text)] mb-1">
                      {isLoadingOcr
                        ? 'Extracting Tabular GMV with Gemini Vision OCR...'
                        : 'Drag & Drop files here, or click to browse'}
                    </h3>
                    <p className="text-xs text-[var(--muted)] max-w-md mx-auto mb-4">
                      Supports Excel (<strong className="text-[var(--text)]">.xlsx, .xls</strong>), CSV, JSON,
                      PDF reports, or screenshot captures (<strong className="text-[var(--text)]">PNG, JPG</strong>).
                    </p>

                    <div className="flex items-center justify-center gap-3 text-xs text-[var(--muted)] flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> Excel / CSV
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-sky-500" /> Screenshot OCR
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-amber-500" /> PDF Document
                      </span>
                    </div>

                    {ocrError && (
                      <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs text-left max-w-lg mx-auto">
                        <strong>Extraction notice:</strong> {ocrError}
                      </div>
                    )}
                  </div>

                  {/* Target Month & Data-Through Settings */}
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-[var(--muted)] font-semibold mb-1.5">
                        Default Month Target:
                      </label>
                      <select
                        value={targetMonth}
                        onChange={(e) => setTargetMonth(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] font-medium cursor-pointer"
                      >
                        <option value="sep">September 2026 (MTD)</option>
                        <option value="aug">August 2026</option>
                        <option value="jul">July 2026 (Baseline)</option>
                        <option value="oct">October 2026 (New Month)</option>
                        <option value="nov">November 2026 (New Month)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[var(--muted)] font-semibold mb-1.5">
                        Fallback "Data Through" Date:
                      </label>
                      <input
                        type="text"
                        value={customDataThroughDate}
                        onChange={(e) => setCustomDataThroughDate(e.target.value)}
                        placeholder="e.g. 10 Sep 2026"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] font-medium"
                      />
                      <p className="text-[11px] text-[var(--muted)] mt-1">
                        Auto-overwritten if a fresher date is identified in your source.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB: PASTE DATA */}
              {activeTab === 'paste' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text)]">
                      Paste Tabular Data (Pipe |, Tab, or Comma Separated):
                    </label>
                    <button
                      onClick={handleLoadSamplePaste}
                      className="text-xs text-[#FFC600] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Load Sample Rows</span>
                    </button>
                  </div>

                  <textarea
                    rows={8}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`599324 | ORO SOFTWARE PRIVATE LIMITED | orolabs.ai | 556169 | Sep 2026\n226888 | Greenchef Appliances Ltd | greenchef.in | 461959 | Sep 2026\n451940 | Skydo Technologies Pvt Ltd | skydo.com | 439752 | Sep 2026`}
                    className="w-full p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-[var(--text)] font-mono text-xs focus:outline-none focus:border-[#FFC600] leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-[var(--muted)]">
                      Supports Org ID, Name, Domain, GMV, and Period in any column arrangement.
                    </span>

                    <button
                      onClick={handleProcessPaste}
                      className="px-5 py-2.5 rounded-xl bg-[#FFC600] hover:bg-[#e6b200] text-black font-bold text-xs shadow transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Analyze & Preview Rows</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: SINGLE ACCOUNT ENTRY */}
              {activeTab === 'single' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 space-y-4">
                    {/* Account Search */}
                    <div>
                      <label className="block text-xs font-bold text-[var(--text)] mb-1.5">
                        Select Target Organisation:
                      </label>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--muted)]" />
                        <input
                          type="text"
                          value={singleSearch}
                          onChange={(e) => setSingleSearch(e.target.value)}
                          placeholder="Search Org ID (e.g. 599324), domain, or company name..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs focus:outline-none focus:border-[#FFC600]"
                        />
                      </div>

                      {/* Dropdown search match suggestions */}
                      {singleSearch.trim().length >= 2 && (
                        <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 divide-y divide-gray-100 dark:divide-zinc-800">
                          {portfolio
                            .filter(
                              (r) =>
                                r.org.includes(singleSearch) ||
                                r.orgname.toLowerCase().includes(singleSearch.toLowerCase()) ||
                                r.domain.toLowerCase().includes(singleSearch.toLowerCase())
                            )
                            .slice(0, 5)
                            .map((acc) => (
                              <div
                                key={acc.org + acc.domain}
                                onClick={() => {
                                  setSelectedSingleAccount(acc);
                                  setSingleSearch('');
                                }}
                                className="p-2.5 hover:bg-gray-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <CompanyLogo domain={acc.domain} companyName={acc.orgname} size={28} />
                                  <div>
                                    <div className="font-semibold text-[var(--text)]">{acc.orgname}</div>
                                    <div className="text-[11px] text-[var(--muted)]">
                                      Org ID: {acc.org} • {acc.domain}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-mono font-medium text-[var(--text)]">
                                    Jul: ₹{(acc.jul || 0).toLocaleString('en-IN')}
                                  </div>
                                  <div className="text-[10px] text-[var(--muted)]">
                                    Sep: {acc.sep ? '₹' + acc.sep.toLocaleString('en-IN') : '—'}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Account Card */}
                    {selectedSingleAccount && (
                      <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CompanyLogo
                            domain={selectedSingleAccount.domain}
                            companyName={selectedSingleAccount.orgname}
                            size={36}
                          />
                          <div>
                            <div className="font-bold text-xs text-[var(--text)]">
                              {selectedSingleAccount.orgname}
                            </div>
                            <div className="text-[11px] text-[var(--muted)]">
                              Org ID: {selectedSingleAccount.org} • Domain: {selectedSingleAccount.domain}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedSingleAccount(null)}
                          className="text-xs text-[var(--muted)] hover:text-rose-500 underline"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    {/* Form Fields: Month, Amount, Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                          Reporting Month:
                        </label>
                        <select
                          value={singleMonth}
                          onChange={(e) => setSingleMonth(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs font-medium cursor-pointer"
                        >
                          <option value="sep">September 2026 MTD</option>
                          <option value="aug">August 2026</option>
                          <option value="oct">October 2026</option>
                          <option value="jul">July 2026</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                          Fresh GMV Amount (₹):
                        </label>
                        <input
                          type="text"
                          value={singleGmv}
                          onChange={(e) => setSingleGmv(e.target.value)}
                          placeholder="e.g. 556169"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                          Data-Through Date:
                        </label>
                        <input
                          type="text"
                          value={singleDate}
                          onChange={(e) => setSingleDate(e.target.value)}
                          placeholder="10 Sep 2026"
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--muted)] mb-1">
                        Optional Audit Note / Source Reference:
                      </label>
                      <input
                        type="text"
                        value={singleNote}
                        onChange={(e) => setSingleNote(e.target.value)}
                        placeholder="e.g. Confirmed via SPOC booking report"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleProcessSingle}
                      disabled={!selectedSingleAccount || !singleGmv}
                      className="px-5 py-2.5 rounded-xl bg-[#FFC600] disabled:opacity-50 hover:bg-[#e6b200] text-black font-bold text-xs shadow transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Preview Account Update</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB: AUDIT HISTORY & ROLLBACK */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text)]">
                        Portfolio Ingestion Audit Trail
                      </h4>
                      <p className="text-xs text-[var(--muted)]">
                        Historical refresh sessions with one-click snapshot rollback support.
                      </p>
                    </div>

                    <span className="text-xs font-mono text-[var(--muted)]">
                      {history.length} recorded session{history.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {history.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-gray-200 dark:border-zinc-800 rounded-2xl text-[var(--muted)] text-xs">
                      No external ingestion sessions recorded yet. Currently operating on the standard baseline (08 Sep 2026).
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                      {history.map((sess) => (
                        <div
                          key={sess.importId}
                          className="p-3.5 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2 font-bold text-[var(--text)]">
                              <span>{sess.fileName}</span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-200 dark:bg-zinc-800 text-[var(--muted)]">
                                {sess.sourceType}
                              </span>
                            </div>
                            <div className="text-[11px] text-[var(--muted)] mt-1 flex items-center gap-3 flex-wrap">
                              <span>Data through: <strong className="text-[var(--text)]">{sess.dataThroughDate}</strong></span>
                              <span>•</span>
                              <span>Processed: {sess.importedAt}</span>
                              <span>•</span>
                              <span>Updated by: {sess.importedBy}</span>
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
                              {sess.successfulMatches} matches applied • {sess.valuesChanged} GMV values altered
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to rollback changes from ${sess.fileName}? This will revert portfolio numbers back to their exact state prior to this import.`)) {
                                onRollback(sess);
                                alert('Portfolio successfully reverted to prior snapshot.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Rollback Snapshot</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Data Safety Notice Banner */}
              <div className="mt-6 p-3.5 rounded-2xl border border-[#FFC600]/30 bg-[#FFC600]/10 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#FFC600] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-[var(--text)]">
                  <strong className="text-[#FFC600] font-bold">Radar365 Data Safety Guarantee:</strong> Absence
                  in an imported dataset means <em>“not present in this source”</em>, never ₹0 GMV. Existing
                  unmatched accounts will not be deleted or zeroed out, preventing false churn alarms.
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & VALIDATION TABLE */}
          {step === 'preview' && ingestionState === 'idle' && (
            <div className="space-y-4">
              {/* Zeta Preview Intelligence Banner */}
              <div className="p-3.5 rounded-2xl border border-[#FFC600]/30 bg-gradient-to-r from-gray-50 via-gray-50 to-[#FFC600]/10 dark:from-zinc-900 dark:via-zinc-900 dark:to-[#FFC600]/10 flex items-center gap-3.5">
                <ZetaCharacter
                  size="sm"
                  state={previewSummary.conflicts > 0 ? 'risk' : 'opportunity'}
                  interactive={false}
                  showStatusDot={true}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[var(--text)]">Zeta Validation Intelligence</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFC600]/20 text-[#FFC600] font-mono border border-[#FFC600]/30">
                      {previewSummary.matched} / {previewSummary.total} MATCHED
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-relaxed">
                    {previewSummary.conflicts > 0
                      ? `Detected ${previewSummary.conflicts} conflict(s) against existing ${targetMonth.toUpperCase()} baselines. You can select Replace, Keep Existing, or Add / Merge per row before committing.`
                      : `All ${previewSummary.matched} accounts matched cleanly against your 113 KAM corporate accounts with zero baseline regressions.`}
                  </p>
                </div>
              </div>

              {/* Summary KPI Pills Ribbon */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-900/80 border border-gray-200 dark:border-zinc-800">
                  <div className="text-[10px] text-[var(--muted)] font-semibold">Detected</div>
                  <div className="text-base font-bold font-mono text-[var(--text)]">
                    {previewSummary.total} rows
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                  <div className="text-[10px] font-semibold">Matched</div>
                  <div className="text-base font-bold font-mono">
                    {previewSummary.matched}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                  <div className="text-[10px] font-semibold">Conflicts</div>
                  <div className="text-base font-bold font-mono">
                    {previewSummary.conflicts}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-700 dark:text-purple-400">
                  <div className="text-[10px] font-semibold">Review Req.</div>
                  <div className="text-base font-bold font-mono">
                    {previewSummary.review}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400">
                  <div className="text-[10px] font-semibold">Unmatched</div>
                  <div className="text-base font-bold font-mono">
                    {previewSummary.unmatched}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400">
                  <div className="text-[10px] font-semibold">Data Through</div>
                  <div className="text-xs font-bold font-mono truncate">
                    {customDataThroughDate}
                  </div>
                </div>
              </div>

              {/* Filter Bar & Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto text-xs">
                  <button
                    onClick={() => setPreviewFilter('all')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                      previewFilter === 'all'
                        ? 'bg-[#FFC600] text-black font-bold'
                        : 'bg-gray-100 dark:bg-zinc-800 text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    All ({previews.length})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('conflicts')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                      previewFilter === 'conflicts'
                        ? 'bg-amber-400 text-black font-bold'
                        : 'bg-gray-100 dark:bg-zinc-800 text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Conflicts ({previewSummary.conflicts})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('review')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                      previewFilter === 'review'
                        ? 'bg-purple-400 text-black font-bold'
                        : 'bg-gray-100 dark:bg-zinc-800 text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Review ({previewSummary.review})
                  </button>
                  <button
                    onClick={() => setPreviewFilter('unmatched')}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors ${
                      previewFilter === 'unmatched'
                        ? 'bg-orange-400 text-black font-bold'
                        : 'bg-gray-100 dark:bg-zinc-800 text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    Unmatched ({previewSummary.unmatched})
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--muted)]" />
                  <input
                    type="text"
                    value={searchPreview}
                    onChange={(e) => setSearchPreview(e.target.value)}
                    placeholder="Filter preview accounts..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-[var(--text)] text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Table of Previews */}
              <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 text-[11px] font-bold text-[var(--muted)] uppercase">
                    <tr>
                      <th className="p-3">Status</th>
                      <th className="p-3">Incoming Account</th>
                      <th className="p-3">Matched Radar365 Org</th>
                      <th className="p-3 text-right">Existing</th>
                      <th className="p-3 text-right">Incoming</th>
                      <th className="p-3 text-right">Difference</th>
                      <th className="p-3">Resolution / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80 font-sans">
                    {filteredPreviews.map((p) => {
                      const isConflict = p.status === 'Conflict';
                      const isReview = p.status === 'Review Required';

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-gray-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                p.status === 'Conflict'
                                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : p.status === 'Review Required'
                                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                                  : p.status === 'Unmatched'
                                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30'
                                  : p.status === 'Invalid'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                                  : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-[var(--text)]">
                              {p.rawOrgName || '—'}
                            </div>
                            <div className="text-[11px] text-[var(--muted)] flex items-center gap-1.5">
                              {p.rawOrgId && (
                                <span className="font-mono bg-gray-100 dark:bg-zinc-800 px-1 rounded text-[10px]">
                                  #{p.rawOrgId}
                                </span>
                              )}
                              <span>{p.rawDomain || ''}</span>
                            </div>
                          </td>

                          <td className="p-3">
                            {p.matchedRecord ? (
                              <div className="flex items-center gap-2">
                                <CompanyLogo
                                  domain={p.matchedRecord.domain}
                                  companyName={p.matchedRecord.orgname}
                                  size={24}
                                />
                                <div>
                                  <div className="font-medium text-[var(--text)] truncate max-w-[180px]">
                                    {p.matchedRecord.orgname}
                                  </div>
                                  <div className="text-[10px] text-[var(--muted)]">
                                    Matched via {p.matchStrategy} ({p.confidenceScore}%)
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[var(--muted)] italic text-[11px]">
                                No existing match
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right font-mono text-[var(--muted)]">
                            {p.conflictDetails?.existingGmv != null
                              ? '₹' + p.conflictDetails.existingGmv.toLocaleString('en-IN')
                              : '—'}
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-[var(--text)]">
                            {p.rawGmv != null
                              ? '₹' + p.rawGmv.toLocaleString('en-IN')
                              : '—'}
                          </td>

                          <td className="p-3 text-right font-mono">
                            {p.conflictDetails ? (
                              <span
                                className={
                                  p.conflictDetails.diff >= 0
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-rose-600 dark:text-rose-400 font-bold'
                                }
                              >
                                {p.conflictDetails.diff >= 0 ? '+' : ''}
                                ₹{p.conflictDetails.diff.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-[var(--muted)]">—</span>
                            )}
                          </td>

                          <td className="p-3">
                            {isConflict && p.conflictDetails && (
                              <div className="flex items-center gap-1">
                                <select
                                  value={p.conflictDetails.resolution}
                                  onChange={(e: any) =>
                                    handleConflictResolution(p.id, e.target.value)
                                  }
                                  className="h-7 px-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-medium cursor-pointer"
                                >
                                  <option value="Replace">Replace (Default)</option>
                                  <option value="Keep Existing">Keep Existing</option>
                                  <option value="Add / Merge">Add / Merge</option>
                                </select>
                              </div>
                            )}

                            {isReview && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    if (p.matchedRecord) {
                                      handleManualMapOrg(p.id, p.matchedRecord.org);
                                    }
                                  }}
                                  className="px-2 py-1 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold text-[11px] hover:bg-purple-500/25 cursor-pointer"
                                >
                                  Accept Match
                                </button>
                              </div>
                            )}

                            {!isConflict && !isReview && (
                              <span className="text-[11px] text-[var(--muted)]">
                                {p.statusReason}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom Actions for Preview */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-zinc-800">
                <button
                  onClick={() => setStep('input')}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 text-xs font-semibold text-[var(--text)] hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  ← Back to Source
                </button>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--muted)] hidden sm:inline">
                    Ready to update {previewSummary.matched} accounts for {customDataThroughDate}
                  </span>

                  <button
                    onClick={handleConfirmCommit}
                    className="px-6 py-2.5 rounded-xl bg-[#FFC600] hover:bg-[#e6b200] text-black font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirm & Commit Updates</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: COMMITTED SUCCESS STATE */}
          {step === 'committed' && (
            <div className="py-8 sm:py-12 px-6 text-center space-y-6 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-300">
              {/* Celebrating Zeta Avatar */}
              <div className="relative flex justify-center pt-2">
                <div className="absolute inset-0 max-w-[220px] h-36 mx-auto bg-gradient-to-b from-[#FFC600]/25 to-transparent blur-2xl pointer-events-none rounded-full" />
                <ZetaCharacter
                  size="2xl"
                  state="success"
                  interactive={true}
                  showStatusDot={false}
                  withSpeech="Woohoo! Portfolio refresh is complete and live!"
                  speechPosition="top"
                />
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono">
                  <Check className="w-3.5 h-3.5" />
                  <span>GMV REFRESH COMMITTED</span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-[var(--text)] tracking-tight">
                  Data Ingestion Complete!
                </h3>

                <p className="text-xs text-[var(--muted)] leading-relaxed max-w-md mx-auto">
                  Radar365 portfolio intelligence has been recalculated with fresh revenue through{' '}
                  <strong className="text-[var(--text)]">{customDataThroughDate}</strong>. All trends, action categories, and KAM health scores are immediately live.
                </p>
              </div>

              {/* Summary Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Accounts Updated</div>
                  <div className="text-lg font-black text-[var(--text)] font-mono mt-0.5">
                    {committedSession?.valuesChanged ?? previewSummary.matched}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Rows Processed</div>
                  <div className="text-lg font-black text-[var(--text)] font-mono mt-0.5">
                    {committedSession?.totalRows ?? previewSummary.total}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Data Through</div>
                  <div className="text-xs font-black text-[#FFC600] font-mono mt-1.5 truncate">
                    {customDataThroughDate}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-zinc-900/60 border border-gray-200 dark:border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-[var(--muted)]">Audit Snapshot</div>
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Recorded</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#FFC600] hover:bg-[#e6b200] text-black font-black text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Return to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setStep('input');
                    setActiveTab('history');
                    setIngestionState('idle');
                  }}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-[var(--text)] hover:bg-gray-50 dark:hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>View Ingestion History</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
