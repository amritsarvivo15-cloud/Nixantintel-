import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  CornerDownLeft,
  Copy,
  Check,
  AlertTriangle,
  TrendingUp,
  Mail,
  UserCheck,
  Zap,
  Target,
  ArrowRight,
  FileText,
  Search,
  Cpu,
  DollarSign
} from 'lucide-react';
import Markdown from 'react-markdown';
import { DerivedPortfolioRecord, Lead } from '../types';
import { copyText, INR } from '../utils/formatters';
import { getOrgFullProfile, getAccountQuickNote, getAccountIntelligenceStatus } from '../utils/spocIntelligence';
import { ZetaCharacter } from './AiIntelligenceFace';
import { ZetaState } from './ZetaCharacter';
import { CompanyLogo } from './CompanyLogo';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  providerNotice?: string;
  zetaState?: ZetaState;
}

interface ApiCheckData {
  status?: string;
  service?: string;
  activeProvider?: string;
  providers?: {
    nvidia?: { configured: boolean; model?: string | null; status: string; hint: string };
    gemini?: { configured: boolean; model?: string; status: string; hint: string };
    groundedEngine?: { configured: boolean; status: string; description: string };
  };
}

export interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount?: DerivedPortfolioRecord | null;
  selectedLead?: Lead | null;
  initialPrompt?: string;
}

// Exact Contextual Prompts requested for Zeta (Lead Funnel)
const ZETA_LEAD_PROMPTS = [
  {
    id: 'research',
    label: 'Research this company.',
    icon: Search,
    zetaState: 'research' as ZetaState,
    color: 'hover:border-sky-500/60 hover:bg-sky-500/10 text-sky-300'
  },
  {
    id: 'spoc',
    label: 'Who should I contact?',
    icon: UserCheck,
    zetaState: 'research' as ZetaState,
    color: 'hover:border-indigo-500/60 hover:bg-indigo-500/10 text-indigo-300'
  },
  {
    id: 'demo_brief',
    label: 'Prepare my demo brief.',
    icon: Zap,
    zetaState: 'thinking' as ZetaState,
    color: 'hover:border-amber-500/60 hover:bg-amber-500/10 text-amber-300'
  },
  {
    id: 'pitch',
    label: 'What should I pitch?',
    icon: Sparkles,
    zetaState: 'opportunity' as ZetaState,
    color: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-300'
  },
  {
    id: 'followup',
    label: 'Draft my follow-up.',
    icon: Mail,
    zetaState: 'opportunity' as ZetaState,
    color: 'hover:border-purple-500/60 hover:bg-purple-500/10 text-purple-300'
  },
  {
    id: 'next_action',
    label: "What's my next action?",
    icon: Target,
    zetaState: 'opportunity' as ZetaState,
    color: 'hover:border-[#FFC600]/60 hover:bg-[#FFC600]/10 text-[#FFC600]'
  },
  {
    id: 'portfolio_check',
    label: 'Is this company already in my portfolio?',
    icon: AlertTriangle,
    zetaState: 'risk' as ZetaState,
    color: 'hover:border-rose-500/60 hover:bg-rose-500/10 text-rose-300'
  },
  {
    id: 'opportunity_estimate',
    label: 'Estimate the opportunity.',
    icon: DollarSign,
    zetaState: 'thinking' as ZetaState,
    color: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-300'
  },
  {
    id: 'call_summary',
    label: 'Summarise everything before my call.',
    icon: FileText,
    zetaState: 'thinking' as ZetaState,
    color: 'hover:border-blue-500/60 hover:bg-blue-500/10 text-blue-300'
  }
];

// Exact Contextual Prompts requested for Zeta (Account Portfolio)
const ZETA_ACCOUNT_PROMPTS = [
  {
    id: 'decline',
    label: 'Why is this account declining?',
    icon: AlertTriangle,
    zetaState: 'risk' as ZetaState,
    color: 'hover:border-rose-500/60 hover:bg-rose-500/10 text-rose-300'
  },
  {
    id: 'gmv_change',
    label: 'What changed in its GMV?',
    icon: TrendingUp,
    zetaState: 'thinking' as ZetaState,
    color: 'hover:border-amber-500/60 hover:bg-amber-500/10 text-amber-300'
  },
  {
    id: 'spoc',
    label: 'Who should I contact?',
    icon: UserCheck,
    zetaState: 'research' as ZetaState,
    color: 'hover:border-sky-500/60 hover:bg-sky-500/10 text-sky-300'
  },
  {
    id: 'next_action',
    label: 'Give me the next best action',
    icon: Target,
    zetaState: 'opportunity' as ZetaState,
    color: 'hover:border-[#FFC600]/60 hover:bg-[#FFC600]/10 text-[#FFC600]'
  },
  {
    id: 'call_brief',
    label: 'Prepare a 30-second call brief',
    icon: Zap,
    zetaState: 'thinking' as ZetaState,
    color: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-300'
  },
  {
    id: 'lsq_followup',
    label: 'Draft LSQ follow-up',
    icon: Mail,
    zetaState: 'opportunity' as ZetaState,
    color: 'hover:border-purple-500/60 hover:bg-purple-500/10 text-purple-300'
  },
  {
    id: 'growth',
    label: 'Find growth opportunities',
    icon: Sparkles,
    zetaState: 'opportunity' as ZetaState,
    color: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-300'
  },
  {
    id: 'summary',
    label: 'Summarise this account',
    icon: FileText,
    zetaState: 'thinking' as ZetaState,
    color: 'hover:border-blue-500/60 hover:bg-blue-500/10 text-blue-300'
  }
];

const ZETA_PORTFOLIO_PROMPTS = [
  {
    id: 'attn',
    label: 'Show 5 accounts needing attention today',
    icon: AlertTriangle,
    zetaState: 'risk' as ZetaState,
    color: 'hover:border-amber-500/60 hover:bg-amber-500/10 text-amber-300'
  },
  {
    id: 'rec',
    label: 'Which 3 accounts show recovery potential?',
    icon: Target,
    zetaState: 'opportunity' as ZetaState,
    color: 'hover:border-rose-500/60 hover:bg-rose-500/10 text-rose-300'
  },
  {
    id: 'sep_growth',
    label: 'Summarize accounts with September activity',
    icon: TrendingUp,
    zetaState: 'opportunity' as ZetaState,
    color: 'hover:border-emerald-500/60 hover:bg-emerald-500/10 text-emerald-300'
  },
  {
    id: 'unmapped',
    label: 'How should I handle unmapped baseline accounts?',
    icon: Search,
    zetaState: 'research' as ZetaState,
    color: 'hover:border-sky-500/60 hover:bg-sky-500/10 text-sky-300'
  }
];

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  selectedAccount,
  selectedLead,
  initialPrompt
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [apiCheck, setApiCheck] = useState<ApiCheckData | null>(null);
  const [currentZetaState, setCurrentZetaState] = useState<ZetaState>('default');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const executedPromptRef = useRef<string | null>(null);

  // Fetch API status on open
  const fetchApiStatus = async () => {
    try {
      const res = await fetch('/api/check');
      if (res.ok) {
        const data = await res.json();
        setApiCheck(data);
      }
    } catch (e) {
      console.warn('Failed to fetch API status:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApiStatus();
    }
  }, [isOpen]);

  // Derive rich account intelligence context when selectedAccount is present
  const accountProfile = selectedAccount ? getOrgFullProfile(selectedAccount) : null;
  const accountIntelStatus = selectedAccount ? getAccountIntelligenceStatus(selectedAccount) : null;
  const quickNoteObj = selectedAccount ? getAccountQuickNote(selectedAccount.org) : null;

  // Reset/initialize conversation when opened or selectedAccount / selectedLead changes
  useEffect(() => {
    if (!isOpen) {
      executedPromptRef.current = null;
      return;
    }

    if (selectedLead) {
      const initialContent =
        `### 🎯 Zeta Copilot Loaded: ${selectedLead.companyName}\n` +
        `Hi! I'm **Zeta**, your AI sales intelligence assistant. I've preloaded the prospective lead data for **${selectedLead.companyName}** (${selectedLead.domain}) — Funnel Stage: \`${selectedLead.stage}\`, Est. Travel Spend: \`${INR(selectedLead.estimatedMonthlySpend)}/mo\`.\n\n` +
        `Select any pre-call question below or ask me anything to prep your outreach, demo brief, or duplicate check!`;

      setMessages([
        {
          id: `welcome-lead-${selectedLead.id}`,
          role: 'assistant',
          content: initialContent,
          provider: 'grounded_engine',
          zetaState: 'default'
        }
      ]);
      setCurrentZetaState('default');
    } else if (selectedAccount && accountProfile) {
      const accName = selectedAccount.orgname || selectedAccount.domain;
      const initialContent = `### 🎯 Zeta Copilot Loaded: ${accName}\n` +
        `Hi! I'm **Zeta**, your AI copilot. I've preloaded the telemetry, SPOC contacts, and GMV baseline for **${accName}** (Org ID: \`${selectedAccount.org}\`).\n\n` +
        `Ask me anything about this account, select a quick action below, or request an executive call brief.`;

      setMessages([
        {
          id: `welcome-${selectedAccount.org}`,
          role: 'assistant',
          content: initialContent,
          provider: 'grounded_engine',
          zetaState: 'default'
        }
      ]);
      setCurrentZetaState('default');
    } else {
      setMessages([
        {
          id: 'welcome-portfolio',
          role: 'assistant',
          content:
            "Hi, I'm **Zeta**! I'm your official Radar 365 AI Copilot.\n\nI can analyze your 113 accounts, uncover recovery opportunities, benchmark GMV deltas, and draft custom client follow-ups. What would you like to explore today?",
          provider: 'grounded_engine',
          zetaState: 'default'
        }
      ]);
      setCurrentZetaState('default');
    }
  }, [isOpen, selectedAccount?.org, selectedLead?.id]);

  // Auto-execute initialPrompt if provided
  useEffect(() => {
    if (isOpen && initialPrompt && initialPrompt !== executedPromptRef.current) {
      executedPromptRef.current = initialPrompt;
      const timer = setTimeout(() => {
        handleAsk(initialPrompt);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleAsk = async (queryText: string, suggestedState?: ZetaState) => {
    if (!queryText.trim() || loading) return;

    // Resolve optimal character state
    let targetState: ZetaState = suggestedState || 'thinking';
    const qLower = queryText.toLowerCase();
    if (!suggestedState) {
      if (qLower.includes('contact') || qLower.includes('spoc') || qLower.includes('search') || qLower.includes('unmapped')) {
        targetState = 'research';
      } else if (qLower.includes('drop') || qLower.includes('decline') || qLower.includes('risk') || qLower.includes('attention')) {
        targetState = 'risk';
      } else if (qLower.includes('growth') || qLower.includes('opportunity') || qLower.includes('upside') || qLower.includes('recovery')) {
        targetState = 'opportunity';
      }
    }

    setCurrentZetaState(targetState);

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: queryText
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText,
          selectedAccount: selectedAccount || null,
          selectedLead: selectedLead || null
        })
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.answer || "I've processed the intelligence request.",
        provider: data.provider,
        providerNotice: data.providerNotice,
        zetaState: 'success'
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setCurrentZetaState('success');
      setTimeout(() => setCurrentZetaState('default'), 3000);
    } catch (err: any) {
      console.error('Error asking Zeta:', err);
      const errorMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: `### ⚠️ Zeta Processing Notice\n\nI encountered an issue connecting to the inference engine. You can retry with a different prompt or view the account's telemetry directly in the Org 360 profile.`,
        provider: 'grounded_engine',
        zetaState: 'risk'
      };
      setMessages((prev) => [...prev, errorMsg]);
      setCurrentZetaState('risk');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    copyText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  const promptOptions = selectedLead
    ? ZETA_LEAD_PROMPTS
    : selectedAccount
    ? ZETA_ACCOUNT_PROMPTS
    : ZETA_PORTFOLIO_PROMPTS;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-end p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="ai-assistant-modal"
        className="w-full sm:max-w-xl h-full sm:h-[94vh] flex flex-col bg-[var(--panel-solid)] border-l sm:border border-[var(--line)] sm:rounded-3xl shadow-2xl overflow-hidden transition-all text-[var(--text)]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--line)] bg-[var(--panel-2)]/80 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFC600] to-[#e5a700] p-0.5 shadow-md flex-shrink-0 flex items-center justify-center">
              <ZetaCharacter
                size="sm"
                state={loading ? 'thinking' : currentZetaState}
                interactive={false}
                showStatusDot={true}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-tight text-[var(--text)] flex items-center gap-1.5">
                  <span>Zeta Copilot</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFC600]/20 text-[#FFC600] border border-[#FFC600]/30 font-mono uppercase">
                  {loading
                    ? 'ANALYZING'
                    : currentZetaState !== 'default'
                    ? currentZetaState.toUpperCase()
                    : apiCheck?.activeProvider
                    ? `${apiCheck.activeProvider.toUpperCase()}`
                    : 'RADAR365'}
                </span>
              </div>
              <p className="text-[11px] text-[var(--muted)] truncate">
                {selectedLead
                  ? `Focusing on Lead: ${selectedLead.companyName} (${selectedLead.stage} • ${INR(selectedLead.expectedGmv || selectedLead.estimatedMonthlySpend)}/mo)`
                  : selectedAccount
                  ? `Focusing on ${selectedAccount.orgname || selectedAccount.domain} (Org #${selectedAccount.org})`
                  : 'Portfolio Revenue Intelligence • 113 KAM Accounts'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl border border-[var(--line)] bg-[var(--panel)] hover:bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer flex-shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Welcome Mascot Introduction Banner */}
          {messages.length <= 1 && !selectedAccount && (
            <div className="p-3 rounded-2xl border border-[#FFC600]/30 bg-gradient-to-r from-[var(--panel-2)] via-[var(--panel-2)] to-[#FFC600]/10 flex items-center gap-3 shadow-xs">
              <ZetaCharacter size="sm" state="default" interactive={true} showStatusDot={true} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-[var(--text)]">Meet Zeta</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#FFC600]/20 text-[#FFC600] border border-[#FFC600]/30">
                    Radar365 Mascot
                  </span>
                </div>
                <p className="text-[11px] text-[var(--muted)] mt-0.5 leading-snug">
                  Your 3D Revenue Copilot for 113 Non-RAM / KAM accounts. Ask about August spend drops, unmapped cohorts, or generate follow-up emails.
                </p>
              </div>
            </div>
          )}
          {/* Preloaded Account Intelligence Context Card (When an account is in focus) */}
          {selectedAccount && accountProfile && (
            <div className="p-4 rounded-2xl border border-[var(--line)] bg-gradient-to-b from-[var(--panel-2)] to-[var(--panel)] shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <CompanyLogo
                    domain={selectedAccount.domain}
                    orgName={selectedAccount.orgname}
                    size="md"
                    className="rounded-lg shadow-xs flex-shrink-0 mt-0.5"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-black text-[var(--text)] truncate">
                        {selectedAccount.orgname || selectedAccount.domain}
                      </h4>
                      <span className="text-[10px] font-mono text-[var(--muted)] bg-[var(--panel)] px-1.5 py-0.2 rounded border border-[var(--line)]">
                        Org #{selectedAccount.org}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[var(--panel)] border border-[var(--line)] text-[var(--muted)]">
                        {selectedAccount.channel}
                      </span>
                    </div>

                    <div className="text-[11px] text-[var(--muted)] flex items-center gap-2 mt-0.5 flex-wrap">
                      <span>{accountProfile.headquarters}</span>
                      <span>•</span>
                      <span>{accountProfile.industry}</span>
                      <span>•</span>
                      <span>{accountProfile.employeeTier}</span>
                    </div>
                  </div>
                </div>

                {accountIntelStatus && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap flex-shrink-0 ${accountIntelStatus.badgeClass}`}
                    title={accountIntelStatus.reason}
                  >
                    {accountIntelStatus.status}
                  </span>
                )}
              </div>

              {/* GMV Telemetry Metrics */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--line)]/60 text-center">
                <div className="p-1.5 rounded-lg bg-[var(--panel)] border border-[var(--line)]">
                  <div className="text-[9px] uppercase font-bold text-[var(--muted)]">July</div>
                  <div className="text-xs font-black font-mono mt-0.5 text-[var(--text)]">
                    {INR(selectedAccount.jul)}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-[var(--panel)] border border-[var(--line)]">
                  <div className="text-[9px] uppercase font-bold text-[var(--muted)]">August</div>
                  <div className="text-xs font-black font-mono mt-0.5 text-[var(--text)]">
                    {selectedAccount.aug !== null ? INR(selectedAccount.aug) : <span className="text-[var(--muted)] italic text-[10px]">Unmapped</span>}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-[var(--panel)] border border-[var(--line)]">
                  <div className="text-[9px] uppercase font-bold text-[var(--muted)]">Sep MTD</div>
                  <div className="text-xs font-black font-mono mt-0.5 text-[var(--text)]">
                    {selectedAccount.sep !== null ? INR(selectedAccount.sep) : <span className="text-[var(--muted)] italic text-[10px]">No match</span>}
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-[var(--panel)] border border-[var(--line)]">
                  <div className="text-[9px] uppercase font-bold text-[var(--muted)]">Health</div>
                  <div className="text-xs font-black font-mono mt-0.5 text-[#FFC600]">
                    {accountProfile.strategy.healthScore}/100
                  </div>
                </div>
              </div>

              {/* Quick Note & Follow-up strip if logged */}
              {(quickNoteObj?.note || quickNoteObj?.followUpDate) && (
                <div className="p-2 rounded-xl bg-[var(--panel)] border border-[var(--line)] text-xs flex items-center justify-between gap-2 flex-wrap">
                  {quickNoteObj?.note && (
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-[#FFC600]">Note:</span>
                      <span className="text-[11px] text-[var(--text)] truncate italic">
                        "{quickNoteObj.note}"
                      </span>
                    </div>
                  )}
                  {quickNoteObj?.followUpDate && (
                    <div className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                      <span>Follow-up:</span>
                      <span className="font-semibold text-[var(--text)]">{quickNoteObj.followUpDate}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Contextual Action Prompts Section */}
          {messages.length <= 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[var(--muted)] px-1">
                <span className="flex items-center gap-1.5 text-[var(--text)]">
                  <Sparkles className="w-3 h-3 text-[#FFC600]" />
                  <span>Suggested Prompts for Zeta</span>
                </span>
                <span className="text-[10px] text-[var(--muted)]">Click to ask</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {promptOptions.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleAsk(item.label, item.zetaState)}
                      className={`p-2.5 rounded-xl border border-[var(--line)] bg-[var(--panel)] text-left transition-all text-xs flex items-center justify-between gap-2 group cursor-pointer ${item.color}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] flex-shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-[var(--text)] text-[11px] truncate">
                          {item.label}
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 opacity-40 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="flex-shrink-0 mt-0.5">
                  <ZetaCharacter
                    size="xs"
                    state={loading ? 'thinking' : m.zetaState || 'default'}
                    interactive={false}
                    showStatusDot={false}
                  />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 ${
                  m.role === 'user'
                    ? 'bg-[#FFC600] text-[#111111] font-semibold shadow-md'
                    : 'bg-[var(--panel)] border border-[var(--line)] text-[var(--text)] shadow-sm'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="relative group">
                    <div className="markdown-body prose prose-invert max-w-none text-xs leading-relaxed space-y-2">
                      <Markdown>{m.content}</Markdown>
                    </div>
                    {m.provider && (
                      <div className="mt-2.5 pt-2 border-t border-[var(--line)] flex items-center justify-between text-[10px] text-[var(--muted)]">
                        <span className="flex items-center gap-1 font-mono">
                          <Cpu className="w-2.5 h-2.5 text-[#FFC600]" />
                          {m.provider === 'nvidia'
                            ? 'Powered by NVIDIA AI'
                            : m.provider === 'gemini'
                            ? 'Powered by Gemini 3.8 Flash'
                            : 'Zeta Grounded Revenue Intelligence'}
                        </span>
                        <button
                          onClick={() => handleCopy(m.id, m.content)}
                          className="flex items-center gap-1 hover:text-[var(--text)] transition-colors cursor-pointer px-1.5 py-0.5 rounded bg-[var(--panel-2)] border border-[var(--line)]"
                          title="Copy response"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>{m.content}</div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Thinking State */}
          {loading && (
            <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
              <ZetaCharacter size="xs" state="thinking" showStatusDot={true} />
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[var(--panel)] border border-[var(--line)]">
                <span className="w-2 h-2 rounded-full bg-[#FFC600] animate-ping" />
                <span>Zeta is analyzing GMV telemetry & records...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-[var(--line)] bg-[var(--panel)] flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk(input);
            }}
            className="relative flex items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                selectedAccount
                  ? `Ask Zeta about ${selectedAccount.orgname || selectedAccount.domain} (Org #${selectedAccount.org})…`
                  : 'Ask Zeta anything about accounts, drops, or draft an email…'
              }
              disabled={loading}
              className="w-full h-11 pl-4 pr-11 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] focus:ring-2 focus:ring-[#FFC600]/20 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 rounded-lg bg-[#FFC600] text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#ffcd1a] transition-all cursor-pointer font-bold shadow-sm"
              title="Send to Zeta"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
