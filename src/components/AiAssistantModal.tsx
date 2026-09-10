import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, User, CornerDownLeft, RefreshCw } from 'lucide-react';
import Markdown from 'react-markdown';
import { DerivedPortfolioRecord } from '../types';
import { copyText } from '../utils/formatters';
import { AiIntelligenceFace } from './AiIntelligenceFace';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAccount?: DerivedPortfolioRecord | null;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  selectedAccount,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Hello! I am **Radar 365 AI**, your portfolio revenue intelligence strategist by **NiXant** Intelligence OS.\n\nI can analyze your 113 accounts, detect churn risks, compare channels, and draft custom follow-up emails for any account. What would you like to explore today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick prompt suggestions
  const suggestions = [
    'Top 5 Recovery Priorities',
    'Which unmapped accounts have high July baseline?',
    'Compare SME+ vs SEM vs SMEV channels',
    selectedAccount
      ? `Analyze risk and draft pitch for ${selectedAccount.orgname || selectedAccount.domain}`
      : 'Accounts with largest drop from July to August',
  ];

  // When selectedAccount changes and modal opens, auto-suggest or analyze
  useEffect(() => {
    if (isOpen && selectedAccount) {
      const prompt = `Provide a full account breakdown and recommended re-engagement strategy for ${
        selectedAccount.orgname || selectedAccount.domain
      } (Org ID: ${selectedAccount.org}, Channel: ${selectedAccount.channel}).`;
      handleAsk(prompt);
    }
  }, [isOpen, selectedAccount]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      content: queryText,
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
          selectedAccount: selectedAccount || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: data.answer || 'No analysis could be generated.',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'assistant',
          content: `⚠️ Failed to get AI response: ${err.message}. Please verify the server connection.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = async (msgId: string, content: string) => {
    await copyText(content);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (!isOpen) return null;

  return (
    <div
      id="radar-ai-drawer"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl h-full bg-[var(--panel-solid)] border-l border-[var(--line)] shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--panel)]">
          <div className="flex items-center gap-3">
            <AiIntelligenceFace
              size="md"
              mood={loading ? 'analyzing' : 'happy'}
              showStatusDot={true}
              title="Radar AI Portfolio Intelligence Mascot"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-[var(--text)]">
                  Radar AI Face
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  NiXant Intelligence
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] truncate max-w-xs">
                {selectedAccount
                  ? `Active Account: ${selectedAccount.orgname || selectedAccount.domain}`
                  : '3-Month GMV Intelligence & Recovery Playbooks'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-[var(--line)] hover:bg-[var(--panel-2)] text-[var(--muted)] hover:text-[var(--text)] transition-all cursor-pointer"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Welcome Mascot Banner if first message */}
          {messages.length <= 1 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFC600]/10 via-[var(--panel)] to-[var(--panel)] border border-[#FFC600]/30 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left shadow-sm">
              <AiIntelligenceFace
                variant="laptop"
                mood={loading ? 'analyzing' : 'happy'}
                title="Radar AI Intelligence Analyst"
                className="flex-shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <span className="text-xs font-bold text-[#FFC600] uppercase tracking-wider">
                    Official AI Intelligence Persona
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#FFC600]/20 text-[#FFC600]">
                    Radar 365
                  </span>
                </div>
                <h4 className="text-sm font-extrabold text-[var(--text)]">
                  Meet Radar — Your AI Portfolio Intelligence Analyst
                </h4>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Equipped with real-time July baseline (₹2.29 Cr), August matched pacing (+6.3%), and September MTD tracking. Ask about any account, drop risks, or recovery drafts.
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="flex-shrink-0 mt-0.5">
                  <AiIntelligenceFace
                    size="xs"
                    mood={loading ? 'thinking' : 'idle'}
                    interactive={false}
                    showStatusDot={false}
                  />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 ${
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
                    <button
                      onClick={() => handleCopyMessage(m.id, m.content)}
                      className="absolute -top-1 -right-1 p-1 rounded bg-[var(--panel-2)] border border-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3 h-3 text-[#4ade80]" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span>{m.content}</span>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] flex-shrink-0 flex items-center justify-center text-[var(--muted)] mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs items-center text-[var(--muted)]">
              <AiIntelligenceFace size="xs" mood="thinking" interactive={false} showStatusDot={false} />
              <div className="flex items-center gap-2">
                <RefreshCw className="w-3 h-3 text-[#FFC600] animate-spin" />
                <span className="font-mono text-[11px] text-[var(--text)]">Radar AI is calculating GMV variance & drafting strategy…</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion prompt chips */}
        <div className="p-3 border-t border-[var(--line)] bg-[var(--panel)]">
          <div className="text-[10px] uppercase font-bold text-[var(--muted)] mb-2 px-1">
            Suggested Queries
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                disabled={loading}
                onClick={() => handleAsk(s)}
                className="text-left text-[11px] px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] hover:border-[#FFC600]/50 text-[var(--text)] transition-all cursor-pointer truncate max-w-full disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-[var(--line)] bg-[var(--panel-solid)]">
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
              placeholder="Ask anything about accounts, drops, or draft an email…"
              disabled={loading}
              className="w-full h-11 pl-4 pr-11 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#FFC600] focus:ring-2 focus:ring-[#FFC600]/20 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 rounded-lg bg-[#FFC600] text-[#111111] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#ffcd1a] transition-all cursor-pointer font-bold shadow-sm"
              title="Send question"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
