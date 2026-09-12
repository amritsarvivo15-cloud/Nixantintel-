import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Building2,
  Globe,
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  AlertTriangle,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Info,
  ShieldAlert
} from 'lucide-react';
import { Lead, LeadPriority, FunnelStage, PortfolioRecord } from '../types';
import { checkLeadDuplicate } from '../utils/leadDuplicateChecker';
import { INR } from '../utils/formatters';
import { todayIso } from '../utils/dates';
import { formatDateThrough } from '../utils/dataIngestionEngine';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: Lead) => void;
  onAddBulkLeads: (leads: Lead[]) => void;
  existingLeads: Lead[];
  portfolioAccounts: PortfolioRecord[];
  initialDomain?: string;
  initialCompanyName?: string;
}

const CHANNELS = ['SME+', 'SEM', 'SMEV', 'Enterprise'];
const SOURCES = ['Outbound', 'Inbound', 'Referral', 'Event', 'Cold Outreach', 'LinkedIn', 'Partner'];
const PRIORITIES: LeadPriority[] = ['Hot', 'Warm', 'Normal', 'Low'];

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onAddLead,
  onAddBulkLeads,
  existingLeads,
  portfolioAccounts,
  initialDomain = '',
  initialCompanyName = ''
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single form state
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [domain, setDomain] = useState(initialDomain);
  const [contactName, setContactName] = useState('');
  const [designation, setDesignation] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [industry, setIndustry] = useState('');
  const [estimatedMonthlySpend, setEstimatedMonthlySpend] = useState<string>('');
  const [expectedGmv, setExpectedGmv] = useState<string>('');
  const [channel, setChannel] = useState('SME+');
  const [leadSource, setLeadSource] = useState('Outbound');
  const [demoDate, setDemoDate] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState(() => todayIso());
  const [priority, setPriority] = useState<LeadPriority>('Warm');
  const [owner, setOwner] = useState('Nishant Chawla');
  const [quickNote, setQuickNote] = useState('');
  const [stage, setStage] = useState<FunnelStage>('NEW LEAD');

  // Optional fields
  const [existingOrgId, setExistingOrgId] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [ignoreDuplicateWarning, setIgnoreDuplicateWarning] = useState(false);

  // Bulk paste state
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Real-time Duplicate Check
  const duplicateCheck = useMemo(() => {
    if (!companyName.trim() && !domain.trim() && !email.trim() && !existingOrgId.trim() && !gstin.trim()) {
      return { hasDuplicate: false, matches: [] };
    }
    return checkLeadDuplicate(
      {
        companyName: companyName.trim(),
        domain: domain.trim(),
        email: email.trim(),
        existingOrgId: existingOrgId.trim(),
        gstin: gstin.trim()
      },
      existingLeads,
      portfolioAccounts
    );
  }, [companyName, domain, email, existingOrgId, gstin, existingLeads, portfolioAccounts]);

  if (!isOpen) return null;

  const handleQuickFollowUpPreset = (days: number) => {
    const base = new Date('2026-09-10T10:00:00');
    base.setDate(base.getDate() + days);
    const yyyy = base.getFullYear();
    const mm = String(base.getMonth() + 1).padStart(2, '0');
    const dd = String(base.getDate()).padStart(2, '0');
    setNextFollowUpDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('Company Name is required.');
      return;
    }

    if (duplicateCheck.hasDuplicate && !ignoreDuplicateWarning) {
      alert('Duplicate detected! Please review the warning or check "Proceed anyway despite duplicate warning".');
      return;
    }

    const spendNum = parseFloat(estimatedMonthlySpend.replace(/[^0-9.]/g, '')) || 0;
    const gmvNum = parseFloat(expectedGmv.replace(/[^0-9.]/g, '')) || Math.round(spendNum * 0.9);

    // AI Recommendation logic for Priority
    let aiRecPriority: LeadPriority = 'Normal';
    let aiRecReason = 'Standard pipeline account based on initial profile.';
    if (spendNum >= 2000000 || gmvNum >= 1800000) {
      aiRecPriority = 'Hot';
      aiRecReason = `High estimated monthly spend (${INR(spendNum)}). Key enterprise tier account.`;
    } else if (spendNum >= 800000) {
      aiRecPriority = 'Warm';
      aiRecReason = `Solid mid-market volume (${INR(spendNum)}/mo). Good conversion candidate.`;
    } else if (stage === 'DEMO DONE' || stage === 'INTERESTED' || stage === 'COMMERCIAL / CREDIT DISCUSSION') {
      aiRecPriority = 'Hot';
      aiRecReason = 'Advanced pipeline stage with verified commercial interest.';
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      companyName: companyName.trim(),
      domain: domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
      contactName: contactName.trim(),
      designation: designation.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      city: city.trim(),
      industry: industry.trim(),
      estimatedMonthlySpend: spendNum,
      expectedGmv: gmvNum,
      channel,
      leadSource,
      demoDate: demoDate || undefined,
      nextFollowUpDate,
      priority,
      owner: owner.trim() || 'Nishant Chawla',
      quickNote: quickNote.trim(),
      existingOrgId: existingOrgId.trim() || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      pan: pan.trim().toUpperCase() || undefined,
      linkedinUrl: linkedinUrl.trim() || undefined,
      stage,
      history: [
        {
          id: `h-${Date.now()}-1`,
          stage,
          date: '10 Sep 2026',
          timestamp: Date.now(),
          note: quickNote.trim() ? `Lead added: ${quickNote.trim()}` : 'Lead created in Radar365 sales pipeline.',
          author: owner.trim() || 'Nishant Chawla'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      aiRecommendedPriority: aiRecPriority,
      aiRecommendationReason: aiRecReason
    };

    onAddLead(newLead);
    onClose();
  };

  const handleBulkImport = () => {
    setBulkError(null);
    if (!bulkText.trim()) {
      setBulkError('Please paste some data or rows to import.');
      return;
    }

    const lines = bulkText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      setBulkError('No valid rows found.');
      return;
    }

    const parsedLeads: Lead[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if header row
      if (i === 0 && (line.toLowerCase().includes('company') || line.toLowerCase().includes('domain'))) {
        continue;
      }

      // Split by tab or comma
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const cleanParts = parts.map((p) => p.trim().replace(/^["']|["']$/g, ''));

      if (cleanParts.length < 1 || !cleanParts[0]) continue;

      const compName = cleanParts[0];
      const dom = cleanParts[1] || '';
      const contact = cleanParts[2] || '';
      const desig = cleanParts[3] || '';
      const mob = cleanParts[4] || '';
      const em = cleanParts[5] || '';
      const spend = parseFloat(cleanParts[6]?.replace(/[^0-9.]/g, '') || '0') || 500000;
      const ch = cleanParts[7] || 'SME+';
      const cityVal = cleanParts[8] || 'Bengaluru';
      const note = cleanParts[9] || 'Bulk imported prospective lead';

      const lead: Lead = {
        id: `lead-bulk-${Date.now()}-${i}-${Math.floor(Math.random() * 1000)}`,
        companyName: compName,
        domain: dom.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0],
        contactName: contact,
        designation: desig,
        mobile: mob,
        email: em,
        city: cityVal,
        industry: 'Corporate Travel',
        estimatedMonthlySpend: spend,
        expectedGmv: Math.round(spend * 0.9),
        channel: ch,
        leadSource: 'Bulk Upload',
        nextFollowUpDate: todayIso(),
        priority: spend >= 1500000 ? 'Hot' : 'Warm',
        owner: 'Nishant Chawla',
        quickNote: note,
        stage: 'NEW LEAD',
        history: [
          {
            id: `h-bulk-${Date.now()}-${i}`,
            stage: 'NEW LEAD',
            date: formatDateThrough(new Date()),
            timestamp: Date.now(),
            note: 'Bulk imported into pipeline.',
            author: 'Nishant Chawla'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      parsedLeads.push(lead);
    }

    if (parsedLeads.length === 0) {
      setBulkError('Could not parse any valid leads from the pasted text.');
      return;
    }

    onAddBulkLeads(parsedLeads);
    onClose();
  };

  const handleFillSample = () => {
    setBulkText(
      `Company Name\tDomain\tContact\tDesignation\tMobile\tEmail\tMonthly Spend\tChannel\tCity\tNote\n` +
      `Swiggy Corporate Hub\tswiggy.in\tAnand Verma\tProcurement Lead\t9845011990\tanand.v@swiggy.in\t3500000\tEnterprise\tBengaluru\tHigh travel demand for kitchen expansion\n` +
      `Groww Investment Tech\tgroww.in\tPooja Reddy\tVP Admin\t9880199234\tpooja@groww.in\t1800000\tSME+\tBengaluru\tEvaluating new corporate travel partner\n` +
      `Urban Company Operations\turbancompany.com\tSiddharth Roy\tCity Ops Head\t9920088112\tsiddharth@urbancompany.com\t1200000\tSME+\tGurugram\tRequested hotel rate benchmarking`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[var(--panel-solid)] border border-[var(--line)] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--panel-2)]/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#FFC600]/15 border border-[#FFC600]/40 text-[#FFC600]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)] flex items-center gap-2">
                <span>Add Prospective Lead</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFC600]/20 text-[#FFC600] font-mono font-bold uppercase tracking-wider">
                  Lead Funnel
                </span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Track corporate accounts in pre-conversion pipeline before portfolio activation
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

        {/* Mode Selector Tabs */}
        <div className="px-5 py-2 border-b border-[var(--line)] bg-[var(--panel-solid)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'single'
                  ? 'bg-[#FFC600] text-black shadow-sm shadow-[#FFC600]/30'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Single Lead Entry</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bulk'
                  ? 'bg-[#FFC600] text-black shadow-sm shadow-[#FFC600]/30'
                  : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel-2)]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Bulk Upload / Pasted Text</span>
            </button>
          </div>

          <span className="text-[11px] text-[var(--muted)] hidden sm:inline font-mono">
            {existingLeads.length} active leads in pipeline
          </span>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Real-Time Duplicate Warning Alert */}
          {duplicateCheck.hasDuplicate && (
            <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 animate-fadeIn">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-amber-200">
                    Probable Duplicate Detected ({duplicateCheck.matches.length} matches):
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {duplicateCheck.matches.map((m, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-amber-300">
                        <span className="font-semibold underline">[{m.type}]</span>
                        <span>Matched on {m.matchedOn}:</span>
                        <span className="font-mono font-bold text-white">{m.recordName}</span>
                        <span className="text-[11px] text-amber-400/80">({m.details})</span>
                      </li>
                    ))}
                  </ul>
                  <label className="mt-2.5 flex items-center gap-2 cursor-pointer select-none text-amber-200 hover:text-white">
                    <input
                      type="checkbox"
                      checked={ignoreDuplicateWarning}
                      onChange={(e) => setIgnoreDuplicateWarning(e.target.checked)}
                      className="rounded accent-[#FFC600] cursor-pointer"
                    />
                    <span className="text-[11px] font-semibold">
                      I understand this may be an existing lead/account. Proceed anyway.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'single' ? (
            <form id="add-lead-form" onSubmit={handleSubmitSingle} className="space-y-4">
              
              {/* Row 1: Company & Domain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Company Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Swiggy India Pvt Ltd"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Domain
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="e.g. swiggy.in"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Contact & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Contact Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Designation
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="e.g. Head of Travel & Procurement"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Mobile / Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="e.g. +91 98450 12345"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Work Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
                    <input
                      type="email"
                      placeholder="e.g. travel@swiggy.in"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: City & Industry */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    City / HQ
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-[var(--muted)]" />
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru, Mumbai, Gurugram"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Industry Sector
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Fintech, Quick Comm, SaaS, Manufacturing"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 5: Spend & Expected GMV */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Estimated Monthly Travel Spend (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-[#FFC600]">₹</span>
                    <input
                      type="text"
                      placeholder="e.g. 1500000 (15 Lakhs)"
                      value={estimatedMonthlySpend}
                      onChange={(e) => setEstimatedMonthlySpend(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Expected GMV (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-bold text-[#FFC600]">₹</span>
                    <input
                      type="text"
                      placeholder="e.g. 1200000"
                      value={expectedGmv}
                      onChange={(e) => setExpectedGmv(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Channel & Lead Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Channel
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
                  >
                    {CHANNELS.map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Lead Source
                  </label>
                  <select
                    value={leadSource}
                    onChange={(e) => setLeadSource(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
                  >
                    {SOURCES.map((src) => (
                      <option key={src} value={src}>
                        {src}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 7: Priority & Initial Stage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          priority === p
                            ? p === 'Hot'
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                              : p === 'Warm'
                              ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                              : p === 'Normal'
                              ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                              : 'bg-slate-500/20 border-slate-500 text-slate-300'
                            : 'border-[var(--line)] bg-[var(--panel-2)] text-[var(--muted)] hover:border-[#FFC600]/40'
                        }`}
                      >
                        {p === 'Hot' ? '🔥 Hot' : p === 'Warm' ? '⚡ Warm' : p === 'Normal' ? 'Normal' : 'Low'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Pipeline Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as FunnelStage)}
                    className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
                  >
                    <option value="NEW LEAD">NEW LEAD</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="CONNECTED">CONNECTED</option>
                    <option value="DEMO SCHEDULED">DEMO SCHEDULED</option>
                    <option value="DEMO DONE">DEMO DONE</option>
                    <option value="FOLLOW-UP">FOLLOW-UP</option>
                    <option value="INTERESTED">INTERESTED</option>
                    <option value="COMMERCIAL / CREDIT DISCUSSION">COMMERCIAL / CREDIT DISCUSSION</option>
                    <option value="ONBOARDING">ONBOARDING</option>
                    <option value="ORG CREATED">ORG CREATED</option>
                    <option value="ACTIVATED">ACTIVATED</option>
                    <option value="ON HOLD">ON HOLD</option>
                  </select>
                </div>
              </div>

              {/* Row 8: Next Follow-up & Quick Presets */}
              <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--panel-2)]/40 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FFC600]" />
                    <span>Next Follow-up Date</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleQuickFollowUpPreset(0)}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFC600]/20 text-[#FFC600] border border-[#FFC600]/40 hover:bg-[#FFC600]/30 cursor-pointer"
                    >
                      🔥 Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFollowUpPreset(1)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--panel-solid)] text-[var(--text)] border border-[var(--line)] hover:border-[#FFC600]/60 cursor-pointer"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFollowUpPreset(3)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--panel-solid)] text-[var(--text)] border border-[var(--line)] hover:border-[#FFC600]/60 cursor-pointer"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFollowUpPreset(7)}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[var(--panel-solid)] text-[var(--text)] border border-[var(--line)] hover:border-[#FFC600]/60 cursor-pointer"
                    >
                      Next Week
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="date"
                    required
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-[var(--panel-solid)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none font-mono"
                  />
                  <div>
                    <input
                      type="date"
                      placeholder="Demo Date (if scheduled)"
                      value={demoDate}
                      onChange={(e) => setDemoDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[var(--panel-solid)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none font-mono"
                      title="Demo Date"
                    />
                  </div>
                </div>
              </div>

              {/* Row 9: Quick Note & Owner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Quick Note & Action Context
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Met at Bangalore tech summit. Interested in automated credit settlement and hotel GST billing."
                    value={quickNote}
                    onChange={(e) => setQuickNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                    Lead Owner
                  </label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Section: Legal & Identifiers (Accordion-like) */}
              <div className="pt-2 border-t border-[var(--line)]">
                <details className="text-xs group">
                  <summary className="font-semibold text-[var(--muted)] hover:text-[#FFC600] cursor-pointer py-1 flex items-center gap-1.5 select-none">
                    <span>Optional Identifiers (Org ID, GSTIN, PAN, LinkedIn)</span>
                  </summary>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2.5">
                    <div>
                      <label className="block text-[11px] text-[var(--muted)] mb-1">Existing Org ID</label>
                      <input
                        type="text"
                        placeholder="e.g. 462910"
                        value={existingOrgId}
                        onChange={(e) => setExistingOrgId(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg text-xs font-mono text-[var(--text)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--muted)] mb-1">GSTIN</label>
                      <input
                        type="text"
                        placeholder="29AABC..."
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg text-xs font-mono text-[var(--text)] uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--muted)] mb-1">PAN</label>
                      <input
                        type="text"
                        placeholder="ABCDE1234F"
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        className="w-full px-2.5 py-1.5 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg text-xs font-mono text-[var(--text)] uppercase"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-[var(--muted)] mb-1">LinkedIn URL</label>
                      <input
                        type="text"
                        placeholder="linkedin.com/company/..."
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg text-xs text-[var(--text)]"
                      />
                    </div>
                  </div>
                </details>
              </div>

            </form>
          ) : (
            /* Bulk / Pasted Text Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text)]">
                    Paste Tab-Separated or CSV Data
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    Supports pasting straight from Excel, Google Sheets, or CSV exports
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFillSample}
                  className="px-2.5 py-1 rounded-lg border border-[var(--line)] hover:border-[#FFC600] bg-[var(--panel-2)] text-[11px] text-[#FFC600] font-semibold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Load Sample Rows</span>
                </button>
              </div>

              {bulkError && (
                <div className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              <textarea
                rows={10}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder="Company Name [tab] Domain [tab] Contact [tab] Designation [tab] Mobile [tab] Email [tab] Monthly Spend [tab] Channel [tab] City [tab] Note"
                className="w-full p-3 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs font-mono text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none leading-relaxed"
              />

              <div className="p-3 rounded-xl bg-[var(--panel-2)]/50 border border-[var(--line)] text-xs text-[var(--muted)] flex items-start gap-2">
                <Info className="w-4 h-4 text-[#FFC600] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[var(--text)]">Expected Column Order:</p>
                  <p className="font-mono text-[11px] mt-0.5">
                    Company Name, Domain, Contact, Designation, Mobile, Email, Monthly Spend, Channel, City, Note
                  </p>
                  <p className="mt-1 text-[11px]">
                    Automatic duplicate checking will run across all active portfolio accounts and current leads during ingestion.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[var(--line)] bg-[var(--panel-2)]/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[var(--line)] hover:bg-[var(--line)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {activeTab === 'single' ? (
            <button
              type="submit"
              form="add-lead-form"
              className="px-5 py-2 rounded-xl bg-[#FFC600] hover:bg-[#e6b200] text-black font-bold text-xs shadow-md shadow-[#FFC600]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Lead in Funnel</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBulkImport}
              className="px-5 py-2 rounded-xl bg-[#FFC600] hover:bg-[#e6b200] text-black font-bold text-xs shadow-md shadow-[#FFC600]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-4 h-4" />
              <span>Import Leads to Funnel</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
