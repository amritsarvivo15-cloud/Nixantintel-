import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  DollarSign,
  Sparkles,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { Lead, PortfolioRecord, MatchStatus } from '../types';
import { INR } from '../utils/formatters';

interface ConvertLeadModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onConvert: (
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
  ) => void;
  portfolioAccounts: PortfolioRecord[];
}

export const ConvertLeadModal: React.FC<ConvertLeadModalProps> = ({
  lead,
  isOpen,
  onClose,
  onConvert,
  portfolioAccounts
}) => {
  if (!isOpen || !lead) return null;

  // Generate a plausible unique 6-digit Org ID if none exists
  const defaultOrgId = lead.existingOrgId || lead.convertedOrgId || `${Math.floor(460000 + Math.random() * 9000)}`;

  const [orgId, setOrgId] = useState(defaultOrgId);
  const [orgName, setOrgName] = useState(lead.companyName);
  const [domain, setDomain] = useState(lead.domain);
  const [channel, setChannel] = useState(lead.channel || 'SME+');
  const [activationDate, setActivationDate] = useState('2026-09-10');
  const [initialSepGmv, setInitialSepGmv] = useState<string>('0');
  const [augGmv, setAugGmv] = useState<string>('');
  const [julGmv, setJulGmv] = useState<string>('');

  // Collision check for Org ID
  const isOrgIdTaken = portfolioAccounts.some((p) => p.org.trim() === orgId.trim());

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId.trim()) {
      alert('Org ID is required for active portfolio conversion.');
      return;
    }
    if (isOrgIdTaken) {
      alert(`Org ID #${orgId} is already taken in the portfolio. Please assign a distinct Org ID.`);
      return;
    }

    const sepNum = parseFloat(initialSepGmv.replace(/[^0-9.]/g, '')) || 0;
    const augNum = augGmv.trim() ? parseFloat(augGmv.replace(/[^0-9.]/g, '')) : null;
    const julNum = julGmv.trim() ? parseFloat(julGmv.replace(/[^0-9.]/g, '')) : 0;
    const totalGmv = (julNum || 0) + (augNum || 0) + (sepNum || 0);

    onConvert(lead, {
      org: orgId.trim(),
      orgname: orgName.trim() || lead.companyName,
      domain: domain.trim().toLowerCase() || lead.domain,
      channel,
      jul: julNum,
      aug: augNum,
      sep: sepNum,
      status: 'Matched',
      total: totalGmv > 0 ? totalGmv : sepNum,
      activationDate
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[var(--panel-solid)] border border-[var(--line)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--panel-2)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <span>Convert Lead to Account Portfolio</span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Promote from sales funnel to active GMV monitoring
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--line)] text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form id="convert-lead-form" onSubmit={handleConfirm} className="p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          
          {/* Target Lead Badge */}
          <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/60 flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-wider">
                Converting Prospect
              </span>
              <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                <span>{lead.companyName}</span>
                <span className="text-xs text-[var(--muted)] font-mono">({lead.domain})</span>
              </h3>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                Contact: {lead.contactName || 'Primary Travel SPOC'} ({lead.designation || 'Travel Desk'})
              </p>
            </div>
            <div className="text-right">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#FFC600]/20 text-[#FFC600]">
                Est. {INR(lead.expectedGmv || lead.estimatedMonthlySpend)}/mo
              </span>
            </div>
          </div>

          {/* Org ID & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Assign Org ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className={`w-full px-3 py-2 bg-[var(--panel-2)] border rounded-xl text-xs font-mono font-bold text-[var(--text)] focus:outline-none ${
                  isOrgIdTaken ? 'border-rose-500 focus:border-rose-500' : 'border-[var(--line)] focus:border-[#FFC600]'
                }`}
                placeholder="e.g. 462990"
              />
              {isOrgIdTaken && (
                <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Org ID already in use. Pick a unique Org ID.</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Portfolio Channel
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
              >
                <option value="SME+">SME+</option>
                <option value="SEM">SEM</option>
                <option value="SMEV">SMEV</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Org Name & Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Portfolio Org Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                Primary Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
              />
            </div>
          </div>

          {/* Activation Date */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text)] mb-1">
              Activation Date
            </label>
            <input
              type="date"
              value={activationDate}
              onChange={(e) => setActivationDate(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
            />
          </div>

          {/* Initial GMV Data */}
          <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-[#FFC600]" />
                <span>Initial GMV Setup (INR)</span>
              </label>
              <span className="text-[11px] text-[var(--muted)]">September MTD transacting volume</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] text-[var(--muted)] mb-1 font-mono">July</label>
                <input
                  type="text"
                  placeholder="₹0"
                  value={julGmv}
                  onChange={(e) => setJulGmv(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[var(--panel-solid)] border border-[var(--line)] rounded-lg text-xs font-mono text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--muted)] mb-1 font-mono">August</label>
                <input
                  type="text"
                  placeholder="₹0"
                  value={augGmv}
                  onChange={(e) => setAugGmv(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[var(--panel-solid)] border border-[var(--line)] rounded-lg text-xs font-mono text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[#FFC600] mb-1 font-mono font-bold">Sep MTD</label>
                <input
                  type="text"
                  value={initialSepGmv}
                  onChange={(e) => setInitialSepGmv(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[var(--panel-solid)] border border-[#FFC600]/60 rounded-lg text-xs font-mono font-bold text-[#FFC600] focus:border-[#FFC600] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Preservation Guarantee Checklist */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Full Audit Trail & History Preserved:</span>
            </div>
            <ul className="text-[11px] space-y-1 pl-5 list-disc text-emerald-300/90">
              <li>Lead history ({lead.history.length} timeline entries) saved to Account notes</li>
              <li>Contact {lead.contactName} ({lead.mobile}, {lead.email}) mapped as Primary SPOC</li>
              <li>Commercial discussion notes, demo records, and lead source retained</li>
              <li>Immediately enters 3-Month GMV Intelligence and Portfolio tables</li>
            </ul>
          </div>

        </form>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--line)] bg-[var(--panel-2)]/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--line)] hover:bg-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="convert-lead-form"
            disabled={isOrgIdTaken || !orgId.trim()}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold text-xs shadow-md shadow-emerald-500/25 transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Confirm & Move to Portfolio</span>
          </button>
        </div>

      </div>
    </div>
  );
};
