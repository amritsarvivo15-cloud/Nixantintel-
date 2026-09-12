import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  MapPin,
  Briefcase,
  Users,
  CheckCircle2,
  FileText,
  HelpCircle,
  Activity,
  Calendar,
  Zap,
  Target,
  AlertCircle,
  Tag,
  Edit3,
  Sparkles,
  Trash2,
  Plus
} from 'lucide-react';
import { DerivedPortfolioRecord, OrgFullProfile, PriorityActionClassification } from '../types';
import { INR, copyText } from '../utils/formatters';
import {
  getOrgFullProfile,
  getAccountQuickNote,
  saveAccountQuickNote,
  getAccountIntelligenceStatus,
  getCustomTagTaxonomy,
  saveCustomTagTaxonomy
} from '../utils/spocIntelligence';
import { AiIntelligenceFace } from './AiIntelligenceFace';
import { CompanyLogo } from './CompanyLogo';

interface OrgDetailsModalProps {
  record: DerivedPortfolioRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAiAssistant?: (record: DerivedPortfolioRecord, initialPrompt?: string) => void;
}

type TabType = 'strategy' | 'spocs' | 'telemetry' | 'activity';

const PRIORITY_OPTIONS: PriorityActionClassification[] = [
  'Priority Follow-up',
  'Recovery',
  'Upside',
  'Active MTD',
  'Normal'
];

function formatEditedDate(isoString?: string): string {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return `Edited ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
}

function checkFollowUpStatus(dateStr?: string | null): { isOverdue: boolean; label: string } {
  if (!dateStr) return { isOverdue: false, label: '' };
  const target = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  const isOverdue = target.getTime() < now.getTime();
  const d = new Date(dateStr + 'T12:00:00');
  const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return {
    isOverdue,
    label: isOverdue ? `Overdue · ${formatted}` : formatted
  };
}

function getZetaTakeInsight(record: DerivedPortfolioRecord): string {
  if (record.deltaPct !== null && record.deltaPct < -25) {
    return `This account is down ${Math.abs(record.deltaPct).toFixed(0)}% from July benchmark. Recent activity suggests dormant bookings—I found two recovery actions worth checking.`;
  }
  if (record.deltaPct !== null && record.deltaPct > 20) {
    return `Strong revenue momentum detected (+${record.deltaPct.toFixed(0)}% August growth). Commercial volume is expanding—recommend offering multi-city route tiers.`;
  }
  if (record.actionBucket === 'Priority follow-up' || record.aug === null) {
    return `This account is showing recovery potential based on recent GMV activity. July baseline was ${INR(record.jul)}. I found two actions worth checking.`;
  }
  if (record.actionBucket === 'Active MTD' || (record.sep ?? 0) > 0) {
    return `September active bookings detected (${INR(record.sep || 0)} MTD). Account is re-engaging; prime timing to lock in corporate travel volume.`;
  }
  return `Steady enterprise baseline (${INR(record.jul)}). Proactive touchpoint with the lead SPOC recommended to secure Q3 corporate travel.`;
}

export const OrgDetailsModal: React.FC<OrgDetailsModalProps> = ({
  record,
  isOpen,
  onClose,
  onOpenAiAssistant
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('strategy');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Account Action state
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [currentNote, setCurrentNote] = useState<string>('');
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [priority, setPriority] = useState<PriorityActionClassification>('Priority Follow-up');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [actionSaveNotice, setActionSaveNotice] = useState<string | null>(null);

  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTaxonomyTag, setNewTaxonomyTag] = useState('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editTagValue, setEditTagValue] = useState('');

  useEffect(() => {
    setAvailableTags(getCustomTagTaxonomy());
  }, [isOpen]);

  const handleCreateTaxonomyTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTaxonomyTag.trim();
    if (!trimmed) return;
    if (availableTags.map(t => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setNewTaxonomyTag('');
      return;
    }
    const updated = [...availableTags, trimmed];
    setAvailableTags(updated);
    saveCustomTagTaxonomy(updated);
    setNewTaxonomyTag('');
    setActionSaveNotice(`Created new tag: ${trimmed}`);
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const handleRenameTaxonomyTag = (oldTag: string, newTag: string) => {
    const trimmed = newTag.trim();
    if (!trimmed || trimmed === oldTag) {
      setEditingTagIndex(null);
      return;
    }
    const updated = availableTags.map(t => (t === oldTag ? trimmed : t));
    setAvailableTags(updated);
    saveCustomTagTaxonomy(updated);
    setEditingTagIndex(null);
    setActionSaveNotice(`Renamed tag "${oldTag}" to "${trimmed}"`);
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const handleDeleteTaxonomyTag = (tagToDelete: string) => {
    const updated = availableTags.filter(t => t !== tagToDelete);
    setAvailableTags(updated);
    saveCustomTagTaxonomy(updated);
    setActionSaveNotice(`Deleted tag from taxonomy: ${tagToDelete}`);
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  // Modal continuous scroll container and tab tracking refs
  const modalScrollRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Record<TabType, HTMLButtonElement | null>>({
    strategy: null,
    spocs: null,
    telemetry: null,
    activity: null,
  });

  // Tab scroll indicators
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check tab scroll overflow
  const checkTabScroll = () => {
    const el = tabsScrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 6);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
    }
  };

  useEffect(() => {
    checkTabScroll();
    window.addEventListener('resize', checkTabScroll);
    return () => window.removeEventListener('resize', checkTabScroll);
  }, [isOpen]);

  // Synchronize activeTab as the user scrolls naturally through continuous sections
  useEffect(() => {
    const container = modalScrollRef.current;
    if (!container || !isOpen) return;

    let isScheduled = false;
    const handleScroll = () => {
      if (isScheduled) return;
      isScheduled = true;
      requestAnimationFrame(() => {
        isScheduled = false;
        const sections: TabType[] = ['strategy', 'spocs', 'telemetry', 'activity'];
        const containerRect = container.getBoundingClientRect();
        const triggerThreshold = containerRect.top + 100; // Just below sticky navigation

        let currentSection: TabType = 'strategy';
        for (const sec of sections) {
          const el = document.getElementById(`section-${sec}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= triggerThreshold) {
              currentSection = sec;
            }
          }
        }
        setActiveTab(currentSection);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isOpen]);

  // Load account action state when record changes
  useEffect(() => {
    if (record) {
      const savedNote = getAccountQuickNote(record.org);
      setCurrentNote(savedNote?.note || '');
      setNoteDraft(savedNote?.note || '');
      setNoteUpdatedAt(savedNote?.updatedAt || '');
      setFollowUpDate(savedNote?.followUpDate || '');
      setTags(savedNote?.tags || []);

      // Priority defaults to saved priority, then record's action bucket
      if (savedNote?.priority) {
        setPriority(savedNote.priority as PriorityActionClassification);
      } else if (record.actionBucket === 'Priority follow-up') {
        setPriority('Priority Follow-up');
      } else if (record.actionBucket === 'Maintain') {
        setPriority('Normal');
      } else if (record.actionBucket) {
        setPriority(record.actionBucket as PriorityActionClassification);
      } else {
        setPriority('Priority Follow-up');
      }

      setIsEditingNote(false);
      setActiveTab('strategy');
    }
  }, [record]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !record) return null;

  const profile: OrgFullProfile = getOrgFullProfile(record);
  const intelStatus = getAccountIntelligenceStatus(record);
  const { strategy, spocs } = profile;

  const handleCopy = async (text: string, fieldName: string) => {
    copyText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveNote = () => {
    const trimmed = noteDraft.trim();
    saveAccountQuickNote(record.org, trimmed, followUpDate || null, priority, tags);
    setCurrentNote(trimmed);
    setNoteUpdatedAt(new Date().toISOString());
    setIsEditingNote(false);
    setActionSaveNotice('Quick Note updated');
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const handleFollowUpChange = (newDate: string) => {
    setFollowUpDate(newDate);
    saveAccountQuickNote(record.org, currentNote, newDate || null, priority, tags);
    setActionSaveNotice(newDate ? `Follow-up set: ${newDate}` : 'Follow-up cleared');
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const handleMarkFollowUpDone = () => {
    setFollowUpDate('');
    saveAccountQuickNote(record.org, currentNote, null, priority, tags);
    setActionSaveNotice('Follow-up marked Done');
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const handlePriorityChange = (newPriority: PriorityActionClassification) => {
    setPriority(newPriority);
    saveAccountQuickNote(record.org, currentNote, followUpDate || null, newPriority, tags);
    setActionSaveNotice(`Priority updated: ${newPriority}`);
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const handleToggleTag = (tagToAdd: string) => {
    const updated = tags.includes(tagToAdd)
      ? tags.filter((t) => t !== tagToAdd)
      : [...tags, tagToAdd];
    setTags(updated);
    saveAccountQuickNote(record.org, currentNote, followUpDate || null, priority, updated);
    setActionSaveNotice(`Tag updated: ${tagToAdd}`);
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (tags.map((t) => t.toLowerCase()).includes(trimmed.toLowerCase())) {
      setCustomTagInput('');
      return;
    }
    const updated = [...tags, trimmed];
    setTags(updated);
    setCustomTagInput('');
    saveAccountQuickNote(record.org, currentNote, followUpDate || null, priority, updated);
    setActionSaveNotice(`Custom tag added: ${trimmed}`);
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    saveAccountQuickNote(record.org, currentNote, followUpDate || null, priority, updated);
    setActionSaveNotice(`Tag removed: ${tagToRemove}`);
    setTimeout(() => setActionSaveNotice(null), 2500);
  };

  const primarySpoc = spocs.find((s) => s.roleType === 'Primary SPOC') || spocs[0];
  const financeSpoc = spocs.find((s) => s.roleType === 'Finance / CFO') || spocs[1];

  // Email draft
  const emailSubject = `NiXant Corporate Travel Update: ${record.orgname || record.domain} Q3 Portfolio & Savings`;
  const emailBody =
    `Hi ${primarySpoc.name.split(' ')[0]},\n\n` +
    `I hope your week is going well.\n\n` +
    `I am following up from the NiXant Corporate Travel team regarding ${record.orgname || record.domain}'s account (${record.org !== 'NA' ? 'Org ID: ' + record.org : 'Domain: ' + record.domain}).\n\n` +
    `${strategy.approachSummary}\n\n` +
    `Recommended Action Plan:\n` +
    strategy.talkingPoints.map((tp, i) => `${i + 1}. ${tp}`).join('\n') +
    `\n\nCommercial Incentive for Q3:\n` +
    `${strategy.commercialOffer}\n\n` +
    `Could we schedule a brief 10-minute cadence call this week? I have open availability on Thursday or Friday morning.\n\n` +
    `Best regards,\n` +
    `NiXant Portfolio Management Desk\n` +
    `Radar 365 Intelligence System`;

  // WhatsApp quick text
  const waText = encodeURIComponent(
    `Hi ${primarySpoc.name.split(' ')[0]}, this is regarding ${record.orgname || record.domain}'s corporate travel desk on NiXant. We have updated your Q3 volume rates and prepared a dedicated ${strategy.commercialOffer}. Let me know when you have 5 mins for a quick connect!`
  );

  const followUpInfo = checkFollowUpStatus(followUpDate);

  const handleTabClick = (tab: TabType, e?: React.MouseEvent<HTMLButtonElement>) => {
    setActiveTab(tab);
    e?.currentTarget?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    const targetEl = document.getElementById(`section-${tab}`);
    if (targetEl && modalScrollRef.current) {
      const container = modalScrollRef.current;
      const containerRect = container.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const relativeTop = targetRect.top - containerRect.top + container.scrollTop - 46;
      container.scrollTo({ top: Math.max(0, relativeTop), behavior: 'smooth' });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="org-details-modal"
        ref={modalScrollRef}
        className="w-full max-w-4xl max-h-[94vh] sm:max-h-[96vh] overflow-y-auto bg-[var(--panel-solid)] border border-[var(--line)] rounded-3xl shadow-2xl text-[var(--text)] relative scroll-smooth focus:outline-none"
        tabIndex={-1}
      >
        {/* ============================================================ */}
        {/* COMPACT UPPER PROFILE HEADER (ROWS 1, 2, 3)                  */}
        {/* ============================================================ */}
        <div className="p-3 sm:p-4 border-b border-[var(--line)]/60 bg-gradient-to-r from-[var(--panel-2)]/50 via-[var(--panel)] to-[var(--panel-2)]/50 space-y-2.5">
          {/* ROW 1: Actions / ID line */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30 uppercase tracking-wide">
                <Building2 className="w-2.5 h-2.5" />
                Org 360° Profile
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--muted)] bg-[var(--panel-2)] px-1.5 py-0.5 rounded border border-[var(--line)]">
                Org ID: {record.org}
                <button
                  onClick={() => handleCopy(record.org, 'orgId')}
                  className="hover:text-[var(--text)] ml-0.5 cursor-pointer"
                  title="Copy Org ID"
                >
                  {copiedField === 'orgId' ? (
                    <Check className="w-2.5 h-2.5 text-[#4ade80]" />
                  ) : (
                    <Copy className="w-2.5 h-2.5" />
                  )}
                </button>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-[var(--line)] bg-[var(--panel-2)] text-[var(--muted)]">
                Channel: <strong className="text-[var(--text)]">{record.channel}</strong>
              </span>

              {/* Compound Intelligence Status */}
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 border text-[10px] font-extrabold cursor-help transition-all ${intelStatus.badgeClass}`}
                title={intelStatus.reason}
              >
                {intelStatus.status}
              </span>

              {/* Assigned Business Segment Tags */}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-[#FFC600]/20 text-[#FFC600] border border-[#FFC600]/40"
                >
                  <Tag className="w-2 h-2" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>

            {/* Top-Right Quick Action Group */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onOpenAiAssistant && (
                <button
                  onClick={() => onOpenAiAssistant(record)}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#FFC600] to-[#e5a700] text-[#111111] font-extrabold text-[11px] flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  title="Ask Zeta about this account"
                >
                  <AiIntelligenceFace size="xs" mood="idle" interactive={false} showStatusDot={false} />
                  <span>Ask Zeta</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                title="Close Profile (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ROW 2: Company Logo + Company Name + domain + location + industry + employee count */}
          <div className="flex items-center gap-3 py-0.5">
            <CompanyLogo
              domain={record.domain}
              orgName={record.orgname}
              size="lg"
              className="rounded-xl shadow-xs shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-[var(--text)] truncate">
                  {record.orgname || record.domain}
                </h2>
                {record.domain && record.domain !== '—' && (
                  <a
                    href={`https://${record.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#FFC600] hover:underline font-mono"
                  >
                    <span>{record.domain}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] flex-wrap pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-[var(--muted)]" />
                  {profile.headquarters}
                </span>
                <span className="text-[var(--line)]">•</span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase className="w-2.5 h-2.5 text-[var(--muted)]" />
                  {profile.industry}
                </span>
                <span className="text-[var(--line)]">•</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="w-2.5 h-2.5 text-[var(--muted)]" />
                  {profile.employeeTier}
                </span>
              </div>
            </div>
          </div>

          {/* ROW 3: July Baseline · August GMV · September MTD · MoM Growth · Health Score */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-1 text-center">
            <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
              <div className="text-[9px] uppercase font-bold text-[var(--muted)] tracking-wider">July Baseline</div>
              <div className="text-xs sm:text-sm font-black font-mono mt-0.5 text-[var(--text)]">{INR(record.jul)}</div>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
              <div className="text-[9px] uppercase font-bold text-[var(--muted)] tracking-wider">August GMV</div>
              <div className="text-xs sm:text-sm font-black font-mono mt-0.5 text-[var(--text)]">
                {record.aug !== null ? INR(record.aug) : <span className="text-[var(--muted)] italic text-[10px]">Unmatched</span>}
              </div>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
              <div className="text-[9px] uppercase font-bold text-[var(--muted)] tracking-wider">September MTD</div>
              <div className="text-xs sm:text-sm font-black font-mono mt-0.5 text-[var(--text)]">
                {record.sep !== null ? INR(record.sep) : <span className="text-[var(--muted)] italic text-[10px]">No match</span>}
              </div>
            </div>
            <div className="p-1.5 sm:p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
              <div className="text-[9px] uppercase font-bold text-[var(--muted)] tracking-wider">MoM Growth</div>
              <div className="text-xs sm:text-sm font-black font-mono mt-0.5 flex items-center justify-center gap-0.5">
                {record.deltaPct !== null ? (
                  record.deltaPct >= 0 ? (
                    <span className="text-[#4ade80] flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> +{record.deltaPct.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-[#f87171] flex items-center gap-0.5">
                      <TrendingDown className="w-2.5 h-2.5" /> {record.deltaPct.toFixed(0)}%
                    </span>
                  )
                ) : (
                  <span className="text-[var(--muted)]">—</span>
                )}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-1.5 sm:p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)] flex flex-col items-center justify-center">
              <div className="text-[9px] uppercase font-bold text-[var(--muted)] tracking-wider">Health Score</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-xs sm:text-sm font-black font-mono ${
                    strategy.healthScore >= 75
                      ? 'text-[#4ade80]'
                      : strategy.healthScore >= 50
                      ? 'text-[#FFC600]'
                      : 'text-[#f87171]'
                  }`}
                >
                  {strategy.healthScore}/100
                </span>
                <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${strategy.urgencyColor}`}>
                  {strategy.urgency.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* ACTIONABLE ACCOUNT ACTION CARD & ZETA'S TAKE (Normal flow)   */}
        {/* ============================================================ */}
        <div className="p-3 sm:p-4 space-y-3 bg-[var(--panel-solid)]">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--panel-2)]/90 via-[var(--panel)] to-[var(--panel-2)]/90 border border-[var(--line)] shadow-xs space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#FFC600] flex items-center gap-1">
                  <Zap className="w-3 h-3 text-[#FFC600]" />
                  <span>Account Action Hub</span>
                </span>
                {actionSaveNotice && (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1 animate-fadeIn">
                    <CheckCircle2 className="w-3 h-3" />
                    {actionSaveNotice}
                  </span>
                )}
              </div>

              {/* Priority Classification Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-bold text-[var(--muted)]">Priority:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handlePriorityChange(opt)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer border ${
                        priority === opt
                          ? 'bg-[#FFC600] text-[#111111] border-[#FFC600] shadow-xs'
                          : 'bg-[var(--panel)] text-[var(--muted)] border-[var(--line)] hover:border-[#FFC600]/40 hover:text-[var(--text)]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Note & Follow-up Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
              {/* Quick Note Block (Span 8) */}
              <div className="md:col-span-8 p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#FFC600]" />
                    <span>Quick Note</span>
                  </span>
                  {!isEditingNote ? (
                    <button
                      onClick={() => {
                        setNoteDraft(currentNote);
                        setIsEditingNote(true);
                      }}
                      className="text-[10px] font-bold text-[#FFC600] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{currentNote ? 'Edit' : 'Add Note'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsEditingNote(false)}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNote}
                        className="px-2.5 py-0.5 rounded bg-[#FFC600] text-[#111111] text-[10px] font-bold cursor-pointer hover:bg-[#ffcd1a]"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {isEditingNote ? (
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Add account context, follow-up or next action…"
                    rows={2}
                    autoFocus
                    className="w-full text-xs p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] text-[var(--text)] focus:outline-none focus:border-[#FFC600] leading-relaxed resize-none"
                  />
                ) : (
                  <div>
                    {currentNote ? (
                      <p className="text-xs text-[var(--text)] font-medium line-clamp-2 leading-relaxed">
                        "{currentNote}"
                      </p>
                    ) : (
                      <p className="text-xs text-[var(--muted)] italic">
                        No note logged yet. Add account context or next steps…
                      </p>
                    )}
                    {noteUpdatedAt && (
                      <div className="text-[10px] text-[var(--muted)] font-mono mt-1">
                        {formatEditedDate(noteUpdatedAt)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Next Follow-up Block (Span 4) */}
              <div className="md:col-span-4 p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#FFC600]" />
                    <span>Next Follow-up</span>
                  </span>
                  {followUpDate && (
                    <button
                      onClick={handleMarkFollowUpDone}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 cursor-pointer"
                      title="Mark follow-up completed"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Done</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => handleFollowUpChange(e.target.value)}
                    className="w-full h-8 px-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] font-mono focus:outline-none focus:border-[#FFC600]"
                  />
                </div>

                {followUpDate && (
                  <div className="flex items-center justify-between text-[10px]">
                    <span
                      className={`font-semibold ${
                        followUpInfo.isOverdue ? 'text-amber-400 font-bold' : 'text-[var(--muted)]'
                      }`}
                    >
                      {followUpInfo.label}
                    </span>
                    <button
                      onClick={() => handleFollowUpChange('')}
                      className="text-[10px] text-[var(--muted)] hover:text-[var(--text)] underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Business Segment Tags Section */}
            <div className="p-2.5 rounded-xl bg-[var(--panel)] border border-[var(--line)] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                  <Tag className="w-3 h-3 text-[#FFC600]" />
                  <span>Business Segment Tags</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsManagingTags(true)}
                    className="px-2 py-0.5 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] hover:border-[#FFC600] text-[var(--text)] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Manage available business segment tags taxonomy (create, rename, delete)"
                  >
                    <span>⚙️ Manage Taxonomy</span>
                  </button>
                  <span className="text-[10px] text-[var(--muted)] hidden sm:inline">
                    Categorize account
                  </span>
                </div>
              </div>

              {/* Active assigned tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.length === 0 ? (
                  <span className="text-xs text-[var(--muted)] italic">
                    No custom business segment tags assigned yet. Select presets or add a custom tag below.
                  </span>
                ) : (
                  tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FFC600]/15 text-[var(--text)] border border-[#FFC600]/40 shadow-xs"
                    >
                      <Tag className="w-3 h-3 text-[#FFC600]" />
                      <span>{tag}</span>
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-400 cursor-pointer p-0.5"
                        title={`Remove tag ${tag}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Presets & Custom Tag Add */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[var(--line)]/60">
                <div className="flex items-center gap-1.5 flex-wrap max-w-lg">
                  <span className="text-[10px] font-bold text-[var(--muted)]">Presets:</span>
                  {availableTags.map((preset) => {
                    const isActive = tags.includes(preset);
                    return (
                      <button
                        key={preset}
                        onClick={() => handleToggleTag(preset)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                          isActive
                            ? 'bg-[#FFC600] text-[#111111] border-[#FFC600]'
                            : 'bg-[var(--panel-2)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--text)] hover:border-[#FFC600]/40'
                        }`}
                      >
                        {isActive ? '✓ ' : '+ '}
                        {preset}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Tag Input */}
                <form onSubmit={handleAddCustomTag} className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Add custom tag..."
                    className="h-7 px-2.5 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] placeholder-[var(--muted)]/60 focus:outline-none focus:border-[#FFC600] w-36"
                  />
                  <button
                    type="submit"
                    disabled={!customTagInput.trim()}
                    className="px-2.5 h-7 rounded-lg bg-[#FFC600] text-[#111111] text-xs font-bold disabled:opacity-50 cursor-pointer hover:bg-[#ffcd1a] transition-colors"
                  >
                    Add Tag
                  </button>
                </form>
              </div>
            </div>

            {/* ============================================================ */}
            {/* ZETA'S TAKE: COMPACT CONTEXTUAL INSIGHT CARD & PROMPT CHIPS  */}
            {/* ============================================================ */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[var(--panel)] via-[var(--panel-2)] to-[#FFC600]/10 border border-[#FFC600]/30 shadow-xs space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <AiIntelligenceFace size="xs" mood="idle" interactive={false} showStatusDot={false} />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[var(--text)]">Zeta’s Take</span>
                    <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#FFC600]/20 text-[#FFC600] border border-[#FFC600]/30 uppercase">
                      Copilot
                    </span>
                  </div>
                </div>
                {onOpenAiAssistant && (
                  <button
                    onClick={() => onOpenAiAssistant(record)}
                    className="text-[11px] font-bold text-[#FFC600] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ask Zeta</span>
                    <span>&rarr;</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-[var(--text)] leading-relaxed font-medium">
                {getZetaTakeInsight(record)}
              </p>

              {/* Contextual Prompts List */}
              <div className="pt-2 border-t border-[var(--line)]/60">
                <div className="text-[10px] uppercase font-bold text-[var(--muted)] mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#FFC600]" />
                  <span>Contextual Prompts for Zeta</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    'Why is this account declining?',
                    'What changed in its GMV?',
                    'Who should I contact?',
                    'Give me the next best action.',
                    'Prepare a 30-second call brief.',
                    'Draft LSQ follow-up.',
                    'Find growth opportunities.',
                    'Summarise this account.'
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      onClick={() => onOpenAiAssistant && onOpenAiAssistant(record, promptText)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--panel)] hover:bg-[#FFC600]/20 border border-[var(--line)] hover:border-[#FFC600]/60 text-[11px] text-[var(--text)] hover:text-[#FFC600] font-medium transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>{promptText}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* STICKY SECTION NAVIGATION BAR                                */}
        {/* ============================================================ */}
        <div className="sticky top-0 z-30 border-y border-[var(--line)] bg-[var(--panel-solid)]/95 backdrop-blur-md shadow-xs">
          {/* Subtle Left Edge Fade */}
          {canScrollLeft && (
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--panel-solid)] to-transparent z-10 transition-opacity" />
          )}

          {/* Subtle Right Edge Fade */}
          {canScrollRight && (
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--panel-solid)] to-transparent z-10 transition-opacity" />
          )}

          <div
            ref={tabsScrollRef}
            onScroll={checkTabScroll}
            className="flex items-center gap-2 px-3 sm:px-5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap"
          >
            <button
              ref={(el) => { tabButtonRefs.current['strategy'] = el; }}
              onClick={(e) => handleTabClick('strategy', e)}
              className={`min-h-[44px] py-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                activeTab === 'strategy'
                  ? 'border-[#FFC600] text-[#FFC600]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>Commercial Approach</span>
            </button>

            <button
              ref={(el) => { tabButtonRefs.current['spocs'] = el; }}
              onClick={(e) => handleTabClick('spocs', e)}
              className={`min-h-[44px] py-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                activeTab === 'spocs'
                  ? 'border-[#FFC600] text-[#FFC600]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>SPOC & Contacts ({spocs.length})</span>
            </button>

            <button
              ref={(el) => { tabButtonRefs.current['telemetry'] = el; }}
              onClick={(e) => handleTabClick('telemetry', e)}
              className={`min-h-[44px] py-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                activeTab === 'telemetry'
                  ? 'border-[#FFC600] text-[#FFC600]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>GMV Intelligence</span>
            </button>

            <button
              ref={(el) => { tabButtonRefs.current['activity'] = el; }}
              onClick={(e) => handleTabClick('activity', e)}
              className={`min-h-[44px] py-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                activeTab === 'activity'
                  ? 'border-[#FFC600] text-[#FFC600]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Activity & Outreach</span>
            </button>
          </div>
        </div>

        {/* Modal Continuous Content Flow (Single natural vertical scroll) */}
        <div className="p-4 sm:p-6 space-y-8">
          {/* ============================================================ */}
          {/* SECTION 1: ACTIONABLE COMMERCIAL APPROACH                    */}
          {/* ============================================================ */}
          <section id="section-strategy" className="scroll-mt-14 space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--line)]/50">
              <h3 className="text-xs sm:text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FFC600]" />
                <span>Commercial Approach & Strategy</span>
              </h3>
            </div>

            {/* Account Situation & Compound Status Reason */}
            <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-[#FFC600] flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-[var(--text)] flex items-center gap-2">
                    <span>Account Intelligence: {intelStatus.status}</span>
                    <span className="font-mono text-[10px] text-[var(--muted)]">Org #{record.org}</span>
                  </div>
                  <p className="text-[var(--muted)] leading-relaxed">
                    {intelStatus.reason}
                  </p>
                </div>
              </div>

              {/* Actionable Battlecard Grid (6 Short Pre-Call Sections) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Opportunity */}
                <div className="p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Opportunity</span>
                  </div>
                  <p className="text-xs text-[var(--text)] font-semibold leading-relaxed">
                    {strategy.opportunity}
                  </p>
                </div>

                {/* 2. Why Now */}
                <div className="p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Why Now</span>
                  </div>
                  <p className="text-xs text-[var(--text)] font-semibold leading-relaxed">
                    {strategy.whyNow}
                  </p>
                </div>

                {/* 3. Recommended Pitch (Full Width or 2-col) */}
                <div className="md:col-span-2 p-3.5 rounded-2xl border border-[#FFC600]/40 bg-gradient-to-r from-[#FFC600]/5 via-[var(--panel)] to-[var(--panel)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-black uppercase tracking-wider text-[#FFC600] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#FFC600]" />
                      <span>Recommended Pitch</span>
                    </div>
                    <button
                      onClick={() => handleCopy(strategy.recommendedPitch, 'pitch')}
                      className="px-2 py-0.5 rounded bg-[var(--panel-2)] border border-[var(--line)] text-[10px] font-bold text-[var(--muted)] hover:text-[var(--text)] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'pitch' ? (
                        <>
                          <Check className="w-3 h-3 text-[#4ade80]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Pitch</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text)] font-medium leading-relaxed italic border-l-2 border-[#FFC600] pl-3 py-0.5">
                    "{strategy.recommendedPitch}"
                  </p>
                </div>

                {/* 4. Commercial Lever */}
                <div className="p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-sky-400" />
                    <span>Commercial Lever</span>
                  </div>
                  <p className="text-xs text-[var(--text)] font-semibold leading-relaxed">
                    {strategy.commercialLever}
                  </p>
                </div>

                {/* 5. Risk / Objection */}
                <div className="p-3.5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-[#f87171] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#f87171]" />
                    <span>Risk / Objection</span>
                  </div>
                  <p className="text-xs text-[var(--text)] font-semibold leading-relaxed">
                    {strategy.riskObjection}
                  </p>
                </div>

                {/* 6. Next Best Action */}
                <div className="md:col-span-2 p-3.5 rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 space-y-1.5">
                  <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Next Best Action</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--text)] font-bold leading-relaxed">
                    {strategy.nextBestAction}
                  </p>
                </div>
              </div>

              {/* Talking Points & Key Risks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Talking Points */}
                <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4ade80]" />
                    <span>Key Value Talking Points</span>
                  </div>
                  <ul className="space-y-2.5">
                    {strategy.talkingPoints.map((tp, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)] leading-relaxed">
                        <span className="w-4 h-4 rounded-full bg-[#4ade80]/15 text-[#4ade80] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{tp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Risk Factors */}
                <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                  <div className="text-xs font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#f87171]" />
                    <span>Identified Risk Factors</span>
                  </div>
                  <ul className="space-y-2.5">
                    {strategy.keyRiskFactors.map((rf, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[var(--muted)] leading-relaxed">
                        <span className="w-4 h-4 rounded-full bg-[#f87171]/15 text-[#f87171] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          !
                        </span>
                        <span>{rf}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 2: SPOC & CONTACTS                                   */}
          {/* ============================================================ */}
          <section id="section-spocs" className="scroll-mt-14 space-y-4 pt-2">
            <div>
              <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#FFC600]" />
                <span>Designated Single Points of Contact (SPOC)</span>
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Key decision-makers for travel policy, monthly reconciliation, and emergency bookings
              </p>
            </div>

              {/* SPOC Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Primary SPOC */}
                <div className="p-4 rounded-2xl border-2 border-[#FFC600]/40 bg-gradient-to-b from-[#FFC600]/5 to-[var(--panel)] relative space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFC600] text-[#111111] uppercase tracking-wide">
                      Primary SPOC
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Verified
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-[var(--text)]">{primarySpoc.name}</h4>
                    <p className="text-xs text-[var(--muted)] font-medium leading-tight mt-0.5">
                      {primarySpoc.title}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                      {primarySpoc.department}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)]">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-[#FFC600] flex-shrink-0" />
                        <span className="truncate text-[11px]">{primarySpoc.email}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(primarySpoc.email, 'pEmail')}
                        className="p-1 hover:text-[#FFC600] cursor-pointer"
                        title="Copy email"
                      >
                        {copiedField === 'pEmail' ? (
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-3 h-3 text-[var(--muted)]" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)]">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[#FFC600] flex-shrink-0" />
                        <span className="text-[11px]">{primarySpoc.phone}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(primarySpoc.phone, 'pPhone')}
                        className="p-1 hover:text-[#FFC600] cursor-pointer"
                        title="Copy phone"
                      >
                        {copiedField === 'pPhone' ? (
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-3 h-3 text-[var(--muted)]" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 1-click communications */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <a
                      href={`mailto:${primarySpoc.email}?subject=${encodeURIComponent(emailSubject)}`}
                      className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[#FFC600] text-center text-[11px] font-bold text-[var(--text)] flex items-center justify-center gap-1 transition-all"
                    >
                      <Mail className="w-3 h-3 text-[#FFC600]" />
                      <span>Email</span>
                    </a>
                    <a
                      href={`tel:${primarySpoc.phone}`}
                      className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[#FFC600] text-center text-[11px] font-bold text-[var(--text)] flex items-center justify-center gap-1 transition-all"
                    >
                      <Phone className="w-3 h-3 text-[#4ade80]" />
                      <span>Call</span>
                    </a>
                    <a
                      href={`https://wa.me/${primarySpoc.phone.replace(/[^0-9]/g, '')}?text=${waText}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[#FFC600] text-center text-[11px] font-bold text-[var(--text)] flex items-center justify-center gap-1 transition-all"
                    >
                      <MessageSquare className="w-3 h-3 text-[#25D366]" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>

                {/* Secondary SPOC - Finance / CFO */}
                <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--panel-2)] text-[var(--muted)] border border-[var(--line)] uppercase">
                      Finance & Escalation
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">Rebates & Commercials</span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-[var(--text)]">{financeSpoc.name}</h4>
                    <p className="text-xs text-[var(--muted)] font-medium leading-tight mt-0.5">
                      {financeSpoc.title}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                      {financeSpoc.department}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)]">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
                        <span className="truncate text-[11px]">{financeSpoc.email}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(financeSpoc.email, 'fEmail')}
                        className="p-1 hover:text-[#FFC600] cursor-pointer"
                        title="Copy email"
                      >
                        {copiedField === 'fEmail' ? (
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-3 h-3 text-[var(--muted)]" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)]">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
                        <span className="text-[11px]">{financeSpoc.phone}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(financeSpoc.phone, 'fPhone')}
                        className="p-1 hover:text-[#FFC600] cursor-pointer"
                        title="Copy phone"
                      >
                        {copiedField === 'fPhone' ? (
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-3 h-3 text-[var(--muted)]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <a
                      href={`mailto:${financeSpoc.email}?subject=${encodeURIComponent(emailSubject)}`}
                      className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[#FFC600] text-center text-[11px] font-bold text-[var(--text)] flex items-center justify-center gap-1 transition-all"
                    >
                      <Mail className="w-3 h-3 text-[var(--muted)]" />
                      <span>Email</span>
                    </a>
                    <a
                      href={`tel:${financeSpoc.phone}`}
                      className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[#FFC600] text-center text-[11px] font-bold text-[var(--text)] flex items-center justify-center gap-1 transition-all"
                    >
                      <Phone className="w-3 h-3 text-[var(--muted)]" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>

                {/* Third SPOC - Operations / Desk */}
                {spocs[2] && (
                  <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                    <div className="flex items-start justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--panel-2)] text-[var(--muted)] border border-[var(--line)] uppercase">
                        Operations Desk
                      </span>
                      <span className="text-[10px] text-[var(--muted)] font-mono">Day-to-day Bookings</span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-[var(--text)]">{spocs[2].name}</h4>
                      <p className="text-xs text-[var(--muted)] font-medium leading-tight mt-0.5">
                        {spocs[2].title}
                      </p>
                      <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                        {spocs[2].department}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1 text-xs font-mono">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)]">
                        <div className="flex items-center gap-2 truncate">
                          <Mail className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
                          <span className="truncate text-[11px]">{spocs[2].email}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(spocs[2].email, 'oEmail')}
                          className="p-1 hover:text-[#FFC600] cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-[var(--muted)]" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)]">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
                          <span className="text-[11px]">{spocs[2].phone}</span>
                        </div>
                        <button
                          onClick={() => handleCopy(spocs[2].phone, 'oPhone')}
                          className="p-1 hover:text-[#FFC600] cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-[var(--muted)]" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <a
                        href={`mailto:${spocs[2].email}?subject=${encodeURIComponent(emailSubject)}`}
                        className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[#FFC600] text-center text-[11px] font-bold text-[var(--text)] flex items-center justify-center gap-1 transition-all"
                      >
                        <Mail className="w-3 h-3 text-[var(--muted)]" />
                        <span>Email</span>
                      </a>
                      <a
                        href={`tel:${spocs[2].phone}`}
                        className="p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] hover:border-[#FFC600] text-center text-[11px] font-bold text-[var(--text)] flex items-center justify-center gap-1 transition-all"
                      >
                        <Phone className="w-3 h-3 text-[var(--muted)]" />
                        <span>Call</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 3: GMV INTELLIGENCE (TELEMETRY & AUDIT)              */}
          {/* ============================================================ */}
          <section id="section-telemetry" className="scroll-mt-14 space-y-4 pt-2">
            <div>
              <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FFC600]" />
                <span>Portfolio Data Mapping & Telemetry Audit</span>
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Detailed reconciliation of July baseline vs August & September actuals
              </p>
            </div>

              {/* Data Table */}
              <div className="overflow-x-auto rounded-2xl border border-[var(--line)] bg-[var(--panel)]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--line)] bg-[var(--panel-2)] text-[10px] uppercase tracking-wider text-[var(--muted)]">
                      <th className="p-3">Metric</th>
                      <th className="p-3">Recorded Value</th>
                      <th className="p-3">Audit Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line)] font-mono text-[11px]">
                    <tr>
                      <td className="p-3 font-sans font-bold text-[var(--text)]">Org ID</td>
                      <td className="p-3">{record.org}</td>
                      <td className="p-3 font-sans text-[var(--muted)]">
                        {record.org === 'NA' ? 'Unmapped in CRM. Needs manual ERP reconciliation.' : 'Confirmed unique Org ID.'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-bold text-[var(--text)]">Channel Cohort</td>
                      <td className="p-3">{record.channel}</td>
                      <td className="p-3 font-sans text-[var(--muted)]">
                        Cohort classification (SME+, SEM, SMEV).
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-bold text-[var(--text)]">July Baseline</td>
                      <td className="p-3 text-[var(--text)] font-bold">{INR(record.jul)}</td>
                      <td className="p-3 font-sans text-[var(--muted)]">Full month certified baseline GMV.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-bold text-[var(--text)]">August Spend</td>
                      <td className="p-3 text-[var(--text)] font-bold">
                        {record.aug !== null ? INR(record.aug) : 'No match recorded'}
                      </td>
                      <td className="p-3 font-sans text-[var(--muted)]">
                        {record.aug === null ? 'Not matched against August GMV master.' : 'Full month August GMV.'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-bold text-[var(--text)]">September MTD</td>
                      <td className="p-3 text-[var(--text)] font-bold">
                        {record.sep !== null ? INR(record.sep) : 'No match recorded'}
                      </td>
                      <td className="p-3 font-sans text-[var(--muted)]">
                        Data through 8 September (8 days MTD, not full month).
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans font-bold text-[var(--text)]">Compound Status</td>
                      <td className="p-3 text-[#FFC600] font-bold">{intelStatus.status}</td>
                      <td className="p-3 font-sans text-[var(--muted)]">{intelStatus.reason}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Data Hygiene Advice */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel-2)]/80 flex items-start gap-3">
                <HelpCircle className="w-4 h-4 text-[#FFC600] flex-shrink-0 mt-0.5" />
                <div className="text-xs text-[var(--muted)] leading-relaxed space-y-1">
                  <strong className="text-[var(--text)]">Reconciliation Notice for Sales Reps:</strong>
                  <p>
                    If an account shows as "Unmatched", do not assume zero bookings immediately. Ensure the company is not booking under a sister brand domain, alternate GSTIN, or direct corporate credit card that hasn't been merged under Org ID {record.org}.
                  </p>
                </div>
              </div>
          </section>

          {/* ============================================================ */}
          {/* SECTION 4: ACTIVITY & OUTREACH                               */}
          {/* ============================================================ */}
          <section id="section-activity" className="scroll-mt-14 space-y-4 pt-2">
            <div>
              <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#FFC600]" />
                <span>Executive Activity & Outreach</span>
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Multi-channel communication templates and touchpoint logging
              </p>
            </div>
              {/* Outreach Drafter Box */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#FFC600]/15 text-[#FFC600]">
                      <Mail className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-black text-[var(--text)]">Executive Re-engagement Draft</div>
                      <div className="text-[10px] text-[var(--muted)]">
                        To: {primarySpoc.name} ({primarySpoc.email})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(emailBody, 'email')}
                      className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] hover:border-[#FFC600] text-xs font-bold text-[var(--text)] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[var(--muted)]" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>
                    <a
                      href={`mailto:${primarySpoc.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                      className="px-3 py-1.5 rounded-xl bg-[#FFC600] text-[#111111] font-bold text-xs flex items-center gap-1.5 hover:bg-[#ffcd1a] transition-all cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Mail Client</span>
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-[11px] font-mono text-[var(--muted)] space-y-1">
                  <div>
                    <strong>Subject:</strong> {emailSubject}
                  </div>
                </div>

                <textarea
                  readOnly
                  rows={8}
                  value={emailBody}
                  className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] font-mono leading-relaxed resize-none select-all"
                />
              </div>

              {/* WhatsApp Drafter Box */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#25D366]/15 text-[#25D366]">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                    <div className="text-xs font-black text-[var(--text)]">WhatsApp Executive Quick-Note</div>
                  </div>

                  <a
                    href={`https://wa.me/${primarySpoc.phone.replace(/[^0-9]/g, '')}?text=${waText}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center gap-1.5 hover:brightness-105 cursor-pointer shadow-sm"
                  >
                    <span>Launch WhatsApp Web</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] leading-relaxed font-sans">
                  "Hi {primarySpoc.name.split(' ')[0]}, this is regarding {record.orgname || record.domain}'s corporate travel desk on NiXant. We have updated your Q3 volume rates and prepared a dedicated {strategy.commercialOffer}. Let me know when you have 5 mins for a quick connect!"
                </div>
              </div>
          </section>

          {/* Natural Non-fixed End of Page Footer */}
          <div className="pt-6 pb-2 border-t border-[var(--line)]/60 flex items-center justify-between flex-wrap gap-3 text-xs text-[var(--muted)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold">Radar 365 Account Intelligence Engine</span>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--line)] hover:bg-[var(--panel-2)] text-xs font-bold text-[var(--text)] cursor-pointer transition-colors shadow-xs"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>

      {/* Manage Business Segment Tags Taxonomy Modal */}
      {isManagingTags && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--panel-solid)] border border-[var(--line)] rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#FFC600]" />
                <h3 className="text-sm font-bold text-[var(--text)]">Manage Business Segment Tags</h3>
              </div>
              <button
                onClick={() => setIsManagingTags(false)}
                className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[var(--muted)]">
              Create, rename, or delete available custom business segment tags to keep your portfolio tagging taxonomy clean across all accounts.
            </div>

            {/* Add new tag form */}
            <form onSubmit={handleCreateTaxonomyTag} className="flex items-center gap-2">
              <input
                type="text"
                value={newTaxonomyTag}
                onChange={(e) => setNewTaxonomyTag(e.target.value)}
                placeholder="New tag name (e.g. Key Account)"
                className="flex-1 h-8 px-3 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] text-xs text-[var(--text)] placeholder-[var(--muted)] focus:outline-none focus:border-[#FFC600]"
              />
              <button
                type="submit"
                disabled={!newTaxonomyTag.trim()}
                className="px-3 h-8 rounded-xl bg-[#FFC600] text-black font-bold text-xs hover:bg-[#ffb000] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </form>

            {/* List of tags */}
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {availableTags.map((tag, idx) => (
                <div
                  key={tag}
                  className="flex items-center justify-between p-2 rounded-xl bg-[var(--panel-2)] border border-[var(--line)]"
                >
                  {editingTagIndex === idx ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        autoFocus
                        value={editTagValue}
                        onChange={(e) => setEditTagValue(e.target.value)}
                        className="h-7 px-2 rounded-lg bg-[var(--panel-solid)] border border-[#FFC600] text-xs text-[var(--text)] flex-1 focus:outline-none"
                      />
                      <button
                        onClick={() => handleRenameTaxonomyTag(tag, editTagValue)}
                        className="px-2 py-1 bg-[#FFC600] text-black font-bold text-[10px] rounded-lg cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTagIndex(null)}
                        className="px-2 py-1 text-[var(--muted)] text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-bold text-[var(--text)] px-1.5 py-0.5 rounded bg-[var(--panel-solid)] border border-[var(--line)]">
                        {tag}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingTagIndex(idx);
                            setEditTagValue(tag);
                          }}
                          className="px-2 py-1 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-[#FFC600] text-[10px] font-semibold cursor-pointer"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => handleDeleteTaxonomyTag(tag)}
                          className="p-1 rounded-lg border border-[var(--line)] text-[var(--muted)] hover:text-rose-400 text-[10px] cursor-pointer"
                          title={`Delete "${tag}" from taxonomy`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-[var(--line)]">
              <button
                onClick={() => setIsManagingTags(false)}
                className="px-4 py-1.5 rounded-xl bg-[var(--panel-2)] text-[var(--text)] border border-[var(--line)] text-xs font-bold hover:border-[#FFC600] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
