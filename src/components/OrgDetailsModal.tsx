import React, { useState, useEffect } from 'react';
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
  Save,
  CheckCircle2,
  FileText,
  HelpCircle,
  Activity
} from 'lucide-react';
import { DerivedPortfolioRecord, OrgFullProfile } from '../types';
import { INR } from '../utils/formatters';
import { getOrgFullProfile, getSavedOrgNotes, saveOrgNotes } from '../utils/spocIntelligence';
import { AiIntelligenceFace } from './AiIntelligenceFace';
import { CompanyLogo } from './CompanyLogo';

interface OrgDetailsModalProps {
  record: DerivedPortfolioRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenAiAssistant?: (record: DerivedPortfolioRecord) => void;
}

type TabType = 'strategy' | 'spocs' | 'outreach' | 'telemetry';

export const OrgDetailsModal: React.FC<OrgDetailsModalProps> = ({
  record,
  isOpen,
  onClose,
  onOpenAiAssistant
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('strategy');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userNotes, setUserNotes] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<boolean>(false);

  useEffect(() => {
    if (record) {
      setUserNotes(getSavedOrgNotes(record.org));
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
  const { strategy, spocs, lastTouchpoint } = profile;

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const handleSaveNotes = () => {
    saveOrgNotes(record.org, userNotes);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const primarySpoc = spocs.find((s) => s.roleType === 'Primary SPOC') || spocs[0];
  const financeSpoc = spocs.find((s) => s.roleType === 'Finance / CFO') || spocs[1];
  const adminSpoc = spocs.find((s) => s.roleType === 'Travel Desk Admin') || spocs[2];

  // Email draft
  const emailSubject = `NiXant Corporate Travel Update: ${record.orgname || record.domain} Q3 Portfolio & Savings`;
  const emailBody = `Hi ${primarySpoc.name.split(' ')[0]},\n\n` +
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="org-details-modal"
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[var(--panel-solid)] border border-[var(--line)] rounded-3xl shadow-2xl overflow-hidden transition-all text-[var(--text)]"
      >
        {/* Header */}
        <div className="relative p-5 sm:p-6 border-b border-[var(--line)] bg-gradient-to-r from-[var(--panel-2)]/80 via-[var(--panel)] to-[var(--panel-2)]/80 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30 uppercase tracking-wide">
                  <Building2 className="w-3 h-3" />
                  Org 360° Profile
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[var(--muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded-md border border-[var(--line)]">
                  Org ID: {record.org}
                  <button
                    onClick={() => handleCopy(record.org, 'orgId')}
                    className="hover:text-[var(--text)] ml-1 cursor-pointer"
                    title="Copy Org ID"
                  >
                    {copiedField === 'orgId' ? (
                      <Check className="w-3 h-3 text-[#4ade80]" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md border border-[var(--line)] bg-[var(--panel-2)] text-[var(--muted)]">
                  Channel: <strong className="text-[var(--text)]">{record.channel}</strong>
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 border text-[11px] font-extrabold ${record.actionClass}`}
                >
                  {record.actionBucket}
                </span>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <CompanyLogo
                  domain={record.domain}
                  orgName={record.orgname}
                  size="lg"
                  className="rounded-xl shadow-xs flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] truncate flex items-center gap-2">
                    <span>{record.orgname || record.domain}</span>
                  </h2>

                  <div className="flex items-center gap-3 text-xs text-[var(--muted)] flex-wrap pt-0.5">
                    {record.domain && record.domain !== '—' && (
                      <a
                        href={`https://${record.domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#FFC600] hover:underline font-mono"
                      >
                        <span>{record.domain}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    <span className="text-[var(--line)]">•</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[var(--muted)]" />
                      {profile.headquarters}
                    </span>
                    <span className="text-[var(--line)]">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-[var(--muted)]" />
                      {profile.industry}
                    </span>
                    <span className="text-[var(--line)]">•</span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-3 h-3 text-[var(--muted)]" />
                      {profile.employeeTier}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Group */}
            <div className="flex items-center gap-2 self-start flex-shrink-0">
              {onOpenAiAssistant && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAiAssistant(record);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FFC600] to-[#e5a700] text-[#111111] font-extrabold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                  title="Ask Radar AI Intelligence about this account"
                >
                  <AiIntelligenceFace size="xs" mood="idle" interactive={false} showStatusDot={false} />
                  <span>Ask AI Analyst</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] hover:bg-[var(--panel)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4 pt-3 border-t border-[var(--line)]/60 text-center">
            <div className="p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">July Baseline</div>
              <div className="text-sm font-black font-mono mt-0.5 text-[var(--text)]">{INR(record.jul)}</div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">August GMV</div>
              <div className="text-sm font-black font-mono mt-0.5 text-[var(--text)]">
                {record.aug !== null ? INR(record.aug) : <span className="text-[var(--muted)] italic text-xs">Unmatched</span>}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">September MTD</div>
              <div className="text-sm font-black font-mono mt-0.5 text-[var(--text)]">
                {record.sep !== null ? INR(record.sep) : <span className="text-[var(--muted)] italic text-xs">Unmatched</span>}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)]">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">Mom Growth</div>
              <div className="text-sm font-black font-mono mt-0.5 flex items-center justify-center gap-0.5">
                {record.deltaPct !== null ? (
                  record.deltaPct >= 0 ? (
                    <span className="text-[#4ade80] flex items-center gap-0.5">
                      <TrendingUp className="w-3 h-3" /> +{record.deltaPct.toFixed(0)}%
                    </span>
                  ) : (
                    <span className="text-[#f87171] flex items-center gap-0.5">
                      <TrendingDown className="w-3 h-3" /> {record.deltaPct.toFixed(0)}%
                    </span>
                  )
                ) : (
                  <span className="text-[var(--muted)]">—</span>
                )}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)] flex flex-col items-center justify-center">
              <div className="text-[10px] uppercase font-bold text-[var(--muted)] tracking-wider">Health Score</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-sm font-black font-mono ${
                    strategy.healthScore >= 75
                      ? 'text-[#4ade80]'
                      : strategy.healthScore >= 50
                      ? 'text-[#FFC600]'
                      : 'text-[#f87171]'
                  }`}
                >
                  {strategy.healthScore}/100
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${strategy.urgencyColor}`}>
                  {strategy.urgency.split(' ')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 px-5 border-b border-[var(--line)] bg-[var(--panel-2)]/50 overflow-x-auto flex-shrink-0">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'strategy'
                ? 'border-[#FFC600] text-[#FFC600]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Best Commercial Approach</span>
          </button>

          <button
            onClick={() => setActiveTab('spocs')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'spocs'
                ? 'border-[#FFC600] text-[#FFC600]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>SPOC & Contacts ({spocs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outreach')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'outreach'
                ? 'border-[#FFC600] text-[#FFC600]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Outreach Drafter</span>
          </button>

          <button
            onClick={() => setActiveTab('telemetry')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'telemetry'
                ? 'border-[#FFC600] text-[#FFC600]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry & Audit</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ============================================================ */}
          {/* TAB 1: BEST COMMERCIAL APPROACH & STRATEGY                   */}
          {/* ============================================================ */}
          {activeTab === 'strategy' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Strategy Hero Banner */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[var(--panel-2)] to-[var(--panel)] shadow-sm">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${strategy.urgencyColor}`}>
                        {strategy.urgency}
                      </span>
                      <span className="text-xs font-mono text-[var(--muted)]">
                        Target Cadence: {strategy.recommendedMeetingCadence}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-[var(--text)] mt-1.5">
                      {strategy.approachTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <AiIntelligenceFace size="sm" mood="analyzing" interactive={false} showStatusDot={false} />
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed mt-2.5">
                  {strategy.approachSummary}
                </p>
              </div>

              {/* Pitch Angle Script */}
              <div className="p-4 rounded-2xl border border-[#FFC600]/30 bg-[#FFC600]/5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-wider text-[#FFC600] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Recommended 2-Minute Call Pitch Angle</span>
                  </div>
                  <button
                    onClick={() => handleCopy(strategy.recommendedPitch, 'pitch')}
                    className="p-1 px-2 rounded-lg border border-[#FFC600]/30 hover:border-[#FFC600] bg-[var(--panel)] text-xs font-semibold text-[#FFC600] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedField === 'pitch' ? (
                      <>
                        <Check className="w-3 h-3 text-[#4ade80]" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-[var(--panel-2)]/90 border border-[var(--line)] text-xs text-[var(--text)] font-sans italic leading-relaxed">
                  {strategy.recommendedPitch}
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

              {/* Commercial Offer Box */}
              <div className="p-4 rounded-2xl border border-[#FFC600]/40 bg-[var(--panel-2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-black uppercase text-[#FFC600] tracking-wider">
                    Recommended Commercial Incentive
                  </div>
                  <div className="text-xs text-[var(--text)] font-semibold mt-0.5">
                    {strategy.commercialOffer}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('outreach')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FFC600] text-[#111111] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer hover:bg-[#ffcd1a] transition-all flex-shrink-0 shadow-sm"
                >
                  <span>Draft Proposal Email</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: SPOC & CONTACTS                                       */}
          {/* ============================================================ */}
          {activeTab === 'spocs' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider">
                    Designated Single Points of Contact (SPOC)
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-0.5">
                    Key decision-makers for travel policy, monthly reconciliation, and emergency bookings
                  </p>
                </div>
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

                  <p className="text-[10px] text-[var(--muted)] italic pt-1 border-t border-[var(--line)]">
                    Prefers: <strong>{primarySpoc.preferredChannel}</strong> • {primarySpoc.notes}
                  </p>
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

                  <p className="text-[10px] text-[var(--muted)] italic pt-1 border-t border-[var(--line)]">
                    {financeSpoc.notes}
                  </p>
                </div>

                {/* Travel Desk Admin */}
                <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--panel-2)] text-[var(--muted)] border border-[var(--line)] uppercase">
                      Operations Desk
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">Day-to-Day</span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-[var(--text)]">{adminSpoc.name}</h4>
                    <p className="text-xs text-[var(--muted)] font-medium leading-tight mt-0.5">
                      {adminSpoc.title}
                    </p>
                    <p className="text-[10px] text-[var(--muted)] font-mono mt-0.5">
                      {adminSpoc.department}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs font-mono">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)]">
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
                        <span className="truncate text-[11px]">{adminSpoc.email}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(adminSpoc.email, 'aEmail')}
                        className="p-1 hover:text-[#FFC600] cursor-pointer"
                        title="Copy email"
                      >
                        {copiedField === 'aEmail' ? (
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-3 h-3 text-[var(--muted)]" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)]">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[var(--muted)] flex-shrink-0" />
                        <span className="text-[11px]">{adminSpoc.phone}</span>
                      </div>
                      <button
                        onClick={() => handleCopy(adminSpoc.phone, 'aPhone')}
                        className="p-1 hover:text-[#FFC600] cursor-pointer"
                        title="Copy phone"
                      >
                        {copiedField === 'aPhone' ? (
                          <Check className="w-3 h-3 text-[#4ade80]" />
                        ) : (
                          <Copy className="w-3 h-3 text-[var(--muted)]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-[var(--muted)] italic pt-1 border-t border-[var(--line)]">
                    {adminSpoc.notes}
                  </p>
                </div>
              </div>

              {/* Relationship History & Custom Notes Logger */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Last Touchpoint Log */}
                <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-2">
                  <div className="text-xs font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#FFC600]" />
                    <span>Last Recorded Touchpoint</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)]">
                      <span>Date: {lastTouchpoint.date}</span>
                      <span className="text-[#FFC600]">{lastTouchpoint.channel}</span>
                    </div>
                    <p className="text-xs text-[var(--text)] leading-relaxed">
                      "{lastTouchpoint.summary}"
                    </p>
                  </div>
                </div>

                {/* Rep's Editable Notes */}
                <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black uppercase tracking-wider text-[var(--text)] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#FFC600]" />
                      <span>Account Executive Notes</span>
                    </div>
                    {saveStatus && (
                      <span className="text-[11px] font-bold text-[#4ade80] flex items-center gap-1">
                        <Check className="w-3 h-3" /> Saved!
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    placeholder="Log recent conversation with SPOC, key blockers, next steps, or specific requests..."
                    className="w-full p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] focus:outline-none focus:border-[#FFC600] leading-relaxed resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNotes}
                      className="px-3 py-1 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] hover:border-[#FFC600] text-xs font-bold text-[var(--text)] flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Save className="w-3 h-3 text-[#FFC600]" />
                      <span>Save Notes</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: 1-CLICK OUTREACH DRAFTER                              */}
          {/* ============================================================ */}
          {activeTab === 'outreach' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider">
                  1-Click Tailored Outreach Drafter
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Pre-configured commercial communications populated with account metrics and strategy
                </p>
              </div>

              {/* Email Drafter Box */}
              <div className="p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-[#FFC600]/15 text-[#FFC600]">
                      <Mail className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs font-black text-[var(--text)]">Official Executive Email</div>
                      <div className="text-[10px] text-[var(--muted)] font-mono">To: {primarySpoc.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(emailBody, 'email')}
                      className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] hover:border-[#FFC600] text-xs font-bold text-[var(--text)] flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      {copiedField === 'email' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#4ade80]" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`mailto:${primarySpoc.email}?subject=${encodeURIComponent(
                        emailSubject
                      )}&body=${encodeURIComponent(emailBody)}`}
                      className="px-3 py-1.5 rounded-xl bg-[#FFC600] text-[#111111] font-bold text-xs flex items-center gap-1.5 hover:bg-[#ffcd1a] cursor-pointer shadow-sm"
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
                  rows={10}
                  value={emailBody}
                  className="w-full p-3.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] font-mono leading-relaxed resize-none select-all"
                />
              </div>

              {/* WhatsApp Drafter Box */}
              <div className="p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel)] space-y-3">
                <div className="flex items-center justify-between">
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
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: TELEMETRY & AUDIT                                     */}
          {/* ============================================================ */}
          {activeTab === 'telemetry' && (
            <div className="space-y-5 animate-fadeIn">
              <div>
                <h3 className="text-sm font-black text-[var(--text)] uppercase tracking-wider">
                  Portfolio Data Mapping & Telemetry Audit
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
                      <td className="p-3 font-sans font-bold text-[var(--text)]">Cumulative Total</td>
                      <td className="p-3 text-[var(--text)] font-bold">
                        {record.total !== null ? INR(record.total) : '—'}
                      </td>
                      <td className="p-3 font-sans text-[var(--muted)]">Total matched GMV across cohort.</td>
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--panel-2)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Radar 365 Account Intelligence Engine</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--line)] hover:bg-[var(--panel)] text-xs font-bold text-[var(--text)] cursor-pointer transition-colors"
            >
              Close Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
