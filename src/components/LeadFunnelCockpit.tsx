import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Flame,
  AlertTriangle,
  Rocket,
  Moon,
  Trophy,
  Building2,
  DollarSign,
  Download,
  Layers,
  ChevronDown,
  Activity,
  History,
  X
} from 'lucide-react';
import {
  Lead,
  FunnelStage,
  FunnelIntelligenceGroup,
  PortfolioRecord
} from '../types';
import { INR } from '../utils/formatters';
import { todayIso, toIsoDate } from '../utils/dates';
import { CompanyLogo } from './CompanyLogo';
import { ZetaCharacter } from './AiIntelligenceFace';

interface LeadFunnelCockpitProps {
  leads: Lead[];
  onUpdateLead: (updated: Lead) => void;
  onDeleteLead?: (leadId: string) => void;
  onOpenAddLeadModal: () => void;
  onOpenConvertModal: (lead: Lead) => void;
  onOpenZetaWithLead: (lead: Lead, prompt?: string) => void;
  onViewPortfolioAccount?: (orgId: string) => void;
  portfolioAccounts: PortfolioRecord[];
}

const FUNNEL_PIPELINE_STEPS: { stage: FunnelStage; label: string }[] = [
  { stage: 'NEW LEAD', label: 'New' },
  { stage: 'CONNECTED', label: 'Connected' },
  { stage: 'DEMO SCHEDULED', label: 'Demo' },
  { stage: 'INTERESTED', label: 'Interested' },
  { stage: 'ONBOARDING', label: 'Onboarding' },
  { stage: 'ACTIVATED', label: 'Activated' }
];

const STAGE_COLORS: Record<FunnelStage, { bg: string; text: string; border: string }> = {
  'NEW LEAD': { bg: 'bg-sky-500/15', text: 'text-sky-300', border: 'border-sky-500/30' },
  'CONTACTED': { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30' },
  'CONNECTED': { bg: 'bg-blue-500/15', text: 'text-blue-300', border: 'border-blue-500/30' },
  'DEMO SCHEDULED': { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  'DEMO DONE': { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
  'FOLLOW-UP': { bg: 'bg-yellow-500/15', text: 'text-yellow-300', border: 'border-yellow-500/30' },
  'INTERESTED': { bg: 'bg-purple-500/15', text: 'text-purple-300', border: 'border-purple-500/30' },
  'COMMERCIAL / CREDIT DISCUSSION': { bg: 'bg-pink-500/15', text: 'text-pink-300', border: 'border-pink-500/30' },
  'ONBOARDING': { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
  'ORG CREATED': { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30' },
  'ACTIVATED': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40' },
  'GMV STARTED': { bg: 'bg-emerald-500/25', text: 'text-emerald-200', border: 'border-emerald-400' },
  'ON HOLD': { bg: 'bg-slate-500/15', text: 'text-slate-300', border: 'border-slate-500/30' },
  'NOT INTERESTED': { bg: 'bg-rose-500/15', text: 'text-rose-300', border: 'border-rose-500/30' },
  'LOST': { bg: 'bg-red-500/15', text: 'text-red-300', border: 'border-red-500/30' }
};

const ALL_STAGES: FunnelStage[] = [
  'NEW LEAD',
  'CONTACTED',
  'CONNECTED',
  'DEMO SCHEDULED',
  'DEMO DONE',
  'FOLLOW-UP',
  'INTERESTED',
  'COMMERCIAL / CREDIT DISCUSSION',
  'ONBOARDING',
  'ORG CREATED',
  'ACTIVATED',
  'GMV STARTED',
  'ON HOLD',
  'NOT INTERESTED',
  'LOST'
];

export const LeadFunnelCockpit: React.FC<LeadFunnelCockpitProps> = ({
  leads,
  onUpdateLead,
  onOpenAddLeadModal,
  onOpenConvertModal,
  onOpenZetaWithLead,
  onViewPortfolioAccount,
  portfolioAccounts
}) => {
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<FunnelIntelligenceGroup>('all');
  const [selectedPipelineStep, setSelectedPipelineStep] = useState<FunnelStage | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // Timeline & Stage Change modal state
  const [stageChangeLead, setStageChangeLead] = useState<Lead | null>(null);
  const [newStageSelected, setNewStageSelected] = useState<FunnelStage>('CONNECTED');
  const [stageChangeNote, setStageChangeNote] = useState('');
  const [viewHistoryLead, setViewHistoryLead] = useState<Lead | null>(null);

  const TODAY_STR = todayIso();

  const getFollowUpStatus = (dateStr: string) => {
    const dateClean = toIsoDate(dateStr);
    if (!dateClean) return { status: 'no_date', label: 'No date', badgeClass: 'text-[var(--muted)]' };

    if (dateClean === TODAY_STR) {
      return {
        status: 'today',
        label: 'Due Today',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
      };
    }

    if (dateClean < TODAY_STR) {
      return {
        status: 'overdue',
        label: 'Overdue',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
      };
    }

    return {
      status: 'upcoming',
      label: 'Upcoming',
      badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30'
    };
  };

  // Funnel Metrics & KPIs
  const kpis = useMemo(() => {
    let totalExpectedGmv = 0;
    let newLeadsCount = 0;
    let todayCount = 0;
    let overdueCount = 0;
    let upcomingCount = 0;
    let demoScheduledCount = 0;
    let demoDoneCount = 0;
    let onboardingCount = 0;
    let convertedCount = 0;
    let noActivityCount = 0;

    for (const lead of leads) {
      totalExpectedGmv += lead.expectedGmv || lead.estimatedMonthlySpend || 0;

      if (lead.stage === 'NEW LEAD') newLeadsCount++;
      if (lead.stage === 'DEMO SCHEDULED') demoScheduledCount++;
      if (lead.stage === 'DEMO DONE') demoDoneCount++;
      if (lead.stage === 'ONBOARDING' || lead.stage === 'COMMERCIAL / CREDIT DISCUSSION' || lead.stage === 'INTERESTED') {
        onboardingCount++;
      }
      if (lead.stage === 'ACTIVATED' || lead.stage === 'GMV STARTED' || lead.convertedAt) {
        convertedCount++;
      }
      if (lead.stage === 'ON HOLD' || lead.stage === 'NOT INTERESTED' || lead.stage === 'LOST') {
        noActivityCount++;
      }

      const fu = getFollowUpStatus(lead.nextFollowUpDate);
      if (fu.status === 'today') todayCount++;
      else if (fu.status === 'overdue') overdueCount++;
      else if (fu.status === 'upcoming') upcomingCount++;
    }

    return {
      totalLeads: leads.length,
      totalExpectedGmv,
      newLeadsCount,
      todayCount,
      overdueCount,
      upcomingCount,
      demoScheduledCount,
      demoDoneCount,
      onboardingCount,
      convertedCount,
      noActivityCount
    };
  }, [leads]);

  // Counts for the interactive pipeline bar
  const pipelineCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const step of FUNNEL_PIPELINE_STEPS) {
      counts[step.stage] = leads.filter((l) => {
        if (step.stage === 'DEMO SCHEDULED') {
          return l.stage === 'DEMO SCHEDULED' || l.stage === 'DEMO DONE';
        }
        if (step.stage === 'ONBOARDING') {
          return l.stage === 'ONBOARDING' || l.stage === 'COMMERCIAL / CREDIT DISCUSSION' || l.stage === 'ORG CREATED';
        }
        if (step.stage === 'ACTIVATED') {
          return l.stage === 'ACTIVATED' || l.stage === 'GMV STARTED' || !!l.convertedAt;
        }
        return l.stage === step.stage;
      }).length;
    }
    return counts;
  }, [leads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${l.companyName} ${l.domain} ${l.contactName} ${l.city} ${l.industry} ${l.quickNote}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      // Channel
      if (selectedChannel !== 'all' && l.channel !== selectedChannel) return false;

      // Priority
      if (selectedPriority !== 'all' && l.priority !== selectedPriority) return false;

      // Pipeline step clicked
      if (selectedPipelineStep) {
        if (selectedPipelineStep === 'DEMO SCHEDULED') {
          if (l.stage !== 'DEMO SCHEDULED' && l.stage !== 'DEMO DONE') return false;
        } else if (selectedPipelineStep === 'ONBOARDING') {
          if (l.stage !== 'ONBOARDING' && l.stage !== 'COMMERCIAL / CREDIT DISCUSSION' && l.stage !== 'ORG CREATED') {
            return false;
          }
        } else if (selectedPipelineStep === 'ACTIVATED') {
          if (l.stage !== 'ACTIVATED' && l.stage !== 'GMV STARTED' && !l.convertedAt) {
            return false;
          }
        } else if (l.stage !== selectedPipelineStep) {
          return false;
        }
      }

      // Future Monitoring Group
      if (activeGroup !== 'all') {
        const fu = getFollowUpStatus(l.nextFollowUpDate);
        if (activeGroup === 'today' && fu.status !== 'today') return false;
        if (activeGroup === 'overdue' && fu.status !== 'overdue') return false;
        if (activeGroup === 'upcoming' && fu.status !== 'upcoming') return false;
        if (activeGroup === 'demo_pending' && l.stage !== 'DEMO SCHEDULED') return false;
        if (activeGroup === 'demo_done' && l.stage !== 'DEMO DONE') return false;
        if (
          activeGroup === 'ready_onboarding' &&
          l.stage !== 'ONBOARDING' &&
          l.stage !== 'COMMERCIAL / CREDIT DISCUSSION' &&
          l.stage !== 'INTERESTED' &&
          l.stage !== 'ORG CREATED'
        ) {
          return false;
        }
        if (
          activeGroup === 'no_activity' &&
          l.stage !== 'ON HOLD' &&
          l.stage !== 'NOT INTERESTED' &&
          l.stage !== 'LOST'
        ) {
          return false;
        }
        if (activeGroup === 'converted' && l.stage !== 'ACTIVATED' && l.stage !== 'GMV STARTED' && !l.convertedAt) {
          return false;
        }
      }

      return true;
    });
  }, [leads, search, selectedChannel, selectedPriority, selectedPipelineStep, activeGroup]);

  // Handle stage change submit
  const handleConfirmStageChange = () => {
    if (!stageChangeLead) return;
    const prevStage = stageChangeLead.stage;
    const noteText = stageChangeNote.trim()
      ? stageChangeNote.trim()
      : `Stage updated from ${prevStage} to ${newStageSelected}`;

    const newHistoryEntry = {
      id: `h-${Date.now()}`,
      stage: newStageSelected,
      date: '10 Sep 2026',
      timestamp: Date.now(),
      note: noteText,
      author: 'Nishant Chawla'
    };

    const updatedLead: Lead = {
      ...stageChangeLead,
      stage: newStageSelected,
      history: [...stageChangeLead.history, newHistoryEntry],
      updatedAt: new Date().toISOString()
    };

    onUpdateLead(updatedLead);
    setStageChangeLead(null);
    setStageChangeNote('');
  };

  const handleExportLeadsCsv = () => {
    const headers = [
      'Company Name',
      'Domain',
      'Contact',
      'Designation',
      'Mobile',
      'Email',
      'Stage',
      'Priority',
      'Monthly Spend',
      'Expected GMV',
      'Channel',
      'Next Follow-up',
      'Owner',
      'Note'
    ];
    const rows = filteredLeads.map((l) => [
      `"${l.companyName}"`,
      l.domain,
      `"${l.contactName}"`,
      `"${l.designation}"`,
      `"${l.mobile}"`,
      l.email,
      `"${l.stage}"`,
      l.priority,
      l.estimatedMonthlySpend,
      l.expectedGmv,
      l.channel,
      l.nextFollowUpDate,
      `"${l.owner}"`,
      `"${(l.quickNote || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Radar365_Lead_Funnel_${TODAY_STR}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="lead-funnel-cockpit" className="space-y-4">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & METRIC SUMMARY BANNER                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 p-4 bg-[var(--panel-solid)] border border-[var(--line)] rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#FFC600]/15 border border-[#FFC600]/40 text-[#FFC600]">
            <Rocket className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight text-[var(--text)]">
                Lead Funnel & Pipeline Intelligence
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FFC600]/20 text-[#FFC600] border border-[#FFC600]/40">
                Pre-Conversion Sales
              </span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Monitor prospective corporate accounts before they become active transacting accounts in the portfolio
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-end lg:self-auto">
          <button
            onClick={handleExportLeadsCsv}
            className="px-3 py-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] hover:border-[#FFC600]/60 text-xs font-semibold text-[var(--text)] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Export filtered leads to CSV"
          >
            <Download className="w-3.5 h-3.5 text-[var(--muted)]" />
            <span className="hidden sm:inline">Export Leads</span>
          </button>

          <button
            onClick={onOpenAddLeadModal}
            id="btn-add-lead"
            className="px-4 py-1.5 rounded-xl bg-[#FFC600] hover:bg-[#e6b200] text-black font-black text-xs shadow-md shadow-[#FFC600]/25 hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Lead</span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. COMPACT FUNNEL DASHBOARD & METRICS                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        
        {/* Total Leads */}
        <div className="p-3 bg-[var(--panel-solid)] border border-[var(--line)] rounded-xl">
          <span className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-wider block">
            Total Leads
          </span>
          <div className="text-lg font-black text-[var(--text)] mt-0.5 font-mono">
            {kpis.totalLeads}
          </div>
          <span className="text-[10px] text-[var(--muted)]">In sales funnel</span>
        </div>

        {/* Expected Pipeline GMV */}
        <div className="p-3 bg-[var(--panel-solid)] border border-[var(--line)] rounded-xl col-span-2 sm:col-span-2">
          <span className="text-[10px] text-[#FFC600] font-bold uppercase tracking-wider block flex items-center justify-between">
            <span>Pipeline GMV</span>
            <DollarSign className="w-3 h-3" />
          </span>
          <div className="text-lg font-black text-[#FFC600] mt-0.5 font-mono">
            {INR(kpis.totalExpectedGmv)}
          </div>
          <span className="text-[10px] text-[var(--muted)]">Estimated monthly opportunity</span>
        </div>

        {/* Follow-ups Today */}
        <button
          onClick={() => {
            setActiveGroup('today');
            setSelectedPipelineStep(null);
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeGroup === 'today'
              ? 'border-rose-500 bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30'
              : 'bg-[var(--panel-solid)] border-[var(--line)] hover:border-rose-500/50 text-[var(--text)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Today</span>
            </span>
          </div>
          <div className="text-lg font-black text-rose-400 mt-0.5 font-mono flex items-center gap-1">
            <span>{kpis.todayCount}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <span className="text-[10px] text-[var(--muted)]">Follow-ups due</span>
        </button>

        {/* Overdue */}
        <button
          onClick={() => {
            setActiveGroup('overdue');
            setSelectedPipelineStep(null);
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeGroup === 'overdue'
              ? 'border-amber-500 bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
              : 'bg-[var(--panel-solid)] border-[var(--line)] hover:border-amber-500/50 text-[var(--text)]'
          }`}
        >
          <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Overdue</span>
          </span>
          <div className="text-lg font-black text-amber-400 mt-0.5 font-mono">
            {kpis.overdueCount}
          </div>
          <span className="text-[10px] text-[var(--muted)]">Pending action</span>
        </button>

        {/* Demo Scheduled / Done */}
        <button
          onClick={() => {
            setActiveGroup('demo_pending');
            setSelectedPipelineStep(null);
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeGroup === 'demo_pending'
              ? 'border-amber-400 bg-amber-400/15 text-amber-200'
              : 'bg-[var(--panel-solid)] border-[var(--line)] hover:border-amber-400/50 text-[var(--text)]'
          }`}
        >
          <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider block">
            Demo Sched.
          </span>
          <div className="text-lg font-black text-[var(--text)] mt-0.5 font-mono">
            {kpis.demoScheduledCount}
          </div>
          <span className="text-[10px] text-[var(--muted)]">{kpis.demoDoneCount} completed</span>
        </button>

        {/* Onboarding */}
        <button
          onClick={() => {
            setActiveGroup('ready_onboarding');
            setSelectedPipelineStep(null);
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeGroup === 'ready_onboarding'
              ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300'
              : 'bg-[var(--panel-solid)] border-[var(--line)] hover:border-cyan-500/50 text-[var(--text)]'
          }`}
        >
          <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block flex items-center gap-1">
            <Rocket className="w-3 h-3" />
            <span>Onboarding</span>
          </span>
          <div className="text-lg font-black text-cyan-300 mt-0.5 font-mono">
            {kpis.onboardingCount}
          </div>
          <span className="text-[10px] text-[var(--muted)]">Ready / Legal</span>
        </button>

        {/* Converted */}
        <button
          onClick={() => {
            setActiveGroup('converted');
            setSelectedPipelineStep(null);
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeGroup === 'converted'
              ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
              : 'bg-[var(--panel-solid)] border-[var(--line)] hover:border-emerald-500/50 text-[var(--text)]'
          }`}
        >
          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block flex items-center gap-1">
            <Trophy className="w-3 h-3 text-emerald-400" />
            <span>Converted</span>
          </span>
          <div className="text-lg font-black text-emerald-400 mt-0.5 font-mono">
            {kpis.convertedCount}
          </div>
          <span className="text-[10px] text-[var(--muted)]">In Portfolio</span>
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. INTERACTIVE VISUAL FUNNEL BAR                              */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="p-3.5 bg-[var(--panel-solid)] border border-[var(--line)] rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#FFC600]" />
            <span>Pipeline Progression Funnel</span>
          </span>
          {selectedPipelineStep && (
            <button
              onClick={() => setSelectedPipelineStep(null)}
              className="text-[11px] text-[#FFC600] hover:underline font-semibold cursor-pointer"
            >
              Clear stage filter
            </button>
          )}
        </div>

        {/* Funnel Chevron / Stages Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {FUNNEL_PIPELINE_STEPS.map((step, idx) => {
            const count = pipelineCounts[step.stage] || 0;
            const isSelected = selectedPipelineStep === step.stage;

            return (
              <button
                key={step.stage}
                onClick={() => {
                  setSelectedPipelineStep(isSelected ? null : step.stage);
                  setActiveGroup('all');
                }}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#FFC600] bg-[#FFC600]/15 text-[#FFC600] shadow-sm shadow-[#FFC600]/10 ring-1 ring-[#FFC600]/40'
                    : 'border-[var(--line)] bg-[var(--panel-2)]/60 hover:border-[#FFC600]/50 text-[var(--text)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider font-mono">
                    {idx + 1}. {step.label}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold font-mono ${
                      isSelected ? 'bg-[#FFC600] text-black' : 'bg-[var(--panel-solid)] text-[var(--muted)]'
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <div className="mt-2 w-full bg-[var(--line)]/60 h-1 rounded-full overflow-hidden">
                  <div
                    className="bg-[#FFC600] h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(12, (count / Math.max(1, leads.length)) * 100))}%`
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. FUTURE MONITORING INTELLIGENCE TABS                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          
          <button
            onClick={() => {
              setActiveGroup('all');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeGroup === 'all' && !selectedPipelineStep
                ? 'bg-[#FFC600] text-black font-bold shadow-xs shadow-[#FFC600]/30'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[#FFC600]/40'
            }`}
          >
            All Leads ({leads.length})
          </button>

          <button
            onClick={() => {
              setActiveGroup('today');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'today'
                ? 'bg-rose-500 text-white font-bold shadow-xs shadow-rose-500/30'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-rose-400 hover:border-rose-500/60'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Follow-up Today ({kpis.todayCount})</span>
          </button>

          <button
            onClick={() => {
              setActiveGroup('overdue');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'overdue'
                ? 'bg-amber-500 text-black font-bold shadow-xs shadow-amber-500/30'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-amber-400 hover:border-amber-500/60'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Overdue ({kpis.overdueCount})</span>
          </button>

          <button
            onClick={() => {
              setActiveGroup('upcoming');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'upcoming'
                ? 'bg-sky-500 text-white font-bold'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-sky-400 hover:border-sky-500/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming ({kpis.upcomingCount})</span>
          </button>

          <button
            onClick={() => {
              setActiveGroup('demo_pending');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'demo_pending'
                ? 'bg-amber-400 text-black font-bold'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-amber-300 hover:border-amber-400/60'
            }`}
          >
            <span>🟡 Demo Pending ({kpis.demoScheduledCount})</span>
          </button>

          <button
            onClick={() => {
              setActiveGroup('demo_done');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'demo_done'
                ? 'bg-emerald-500 text-white font-bold'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-emerald-400 hover:border-emerald-500/60'
            }`}
          >
            <span>🟢 Demo Done ({kpis.demoDoneCount})</span>
          </button>

          <button
            onClick={() => {
              setActiveGroup('ready_onboarding');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'ready_onboarding'
                ? 'bg-cyan-500 text-white font-bold'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-cyan-400 hover:border-cyan-500/60'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Ready for Onboarding ({kpis.onboardingCount})</span>
          </button>

          <button
            onClick={() => {
              setActiveGroup('no_activity');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'no_activity'
                ? 'bg-slate-600 text-white font-bold'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-slate-400 hover:border-slate-500/60'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>No Activity ({kpis.noActivityCount})</span>
          </button>

          <button
            onClick={() => {
              setActiveGroup('converted');
              setSelectedPipelineStep(null);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeGroup === 'converted'
                ? 'bg-emerald-600 text-white font-bold'
                : 'border border-[var(--line)] bg-[var(--panel-solid)] text-emerald-400 hover:border-emerald-500/60'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Converted ({kpis.convertedCount})</span>
          </button>

        </div>

        {/* Search & Select Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search company, domain, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--panel-solid)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/60 focus:border-[#FFC600] focus:outline-none"
            />
          </div>

          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--panel-solid)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
          >
            <option value="all">All Channels</option>
            <option value="SME+">SME+</option>
            <option value="SEM">SEM</option>
            <option value="SMEV">SMEV</option>
            <option value="Enterprise">Enterprise</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-[var(--panel-solid)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="Hot">🔥 Hot</option>
            <option value="Warm">⚡ Warm</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. LEADS LIST TABLE / CARDS                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-[var(--panel-solid)] border border-[var(--line)] rounded-2xl shadow-sm overflow-hidden">
        
        <div className="p-3 border-b border-[var(--line)] flex items-center justify-between text-xs text-[var(--muted)]">
          <span className="font-semibold text-[var(--text)]">
            Showing {filteredLeads.length} of {leads.length} Leads
          </span>
          <span className="text-[11px] font-mono flex items-center gap-2">
            <span>Radar365 Pre-conversion Pipeline</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
              {portfolioAccounts.length} Active Accounts
            </span>
          </span>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--muted)] space-y-2">
            <Building2 className="w-8 h-8 text-[var(--muted)]/40 mx-auto" />
            <p className="font-semibold text-[var(--text)]">No leads match the selected filter</p>
            <p className="text-[11px]">Adjust your filter tabs or add a prospective company to the pipeline.</p>
            <button
              onClick={onOpenAddLeadModal}
              className="mt-2 px-3 py-1.5 rounded-xl bg-[#FFC600] text-black font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Lead</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[var(--panel-2)]/40 text-[var(--muted)] font-mono font-bold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Company / Domain</th>
                  <th className="py-2.5 px-3">Contact & SPOC</th>
                  <th className="py-2.5 px-3">Funnel Stage</th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3 text-right">Est. Monthly GMV</th>
                  <th className="py-2.5 px-3">Next Follow-up</th>
                  <th className="py-2.5 px-3">Quick Note</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredLeads.map((lead) => {
                  const fu = getFollowUpStatus(lead.nextFollowUpDate);
                  const stageStyle = STAGE_COLORS[lead.stage] || {
                    bg: 'bg-slate-500/15',
                    text: 'text-slate-300',
                    border: 'border-slate-500/30'
                  };
                  const isConverted = lead.stage === 'ACTIVATED' || lead.stage === 'GMV STARTED' || !!lead.convertedAt;

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-[var(--panel-2)]/50 transition-colors group"
                    >
                      {/* Company / Domain */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <CompanyLogo
                            domain={lead.domain}
                            companyName={lead.companyName}
                            className="w-8 h-8 rounded-lg shrink-0 border border-[var(--line)]"
                          />
                          <div className="min-w-0 max-w-[210px]">
                            <div className="font-bold text-[var(--text)] truncate text-xs flex items-center gap-1.5">
                              <span>{lead.companyName}</span>
                              {lead.existingOrgId && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30">
                                  #{lead.existingOrgId}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[var(--muted)] font-mono truncate">
                              <span>{lead.domain}</span>
                              <span>•</span>
                              <span>{lead.city || 'India'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & SPOC */}
                      <td className="py-3 px-3">
                        <div className="min-w-0 max-w-[180px]">
                          <div className="font-semibold text-[var(--text)] truncate">
                            {lead.contactName || 'Unassigned SPOC'}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] truncate">
                            {lead.designation || 'Travel Administrator'}
                          </div>
                          {lead.mobile && (
                            <div className="text-[10px] text-[var(--muted)] font-mono">
                              {lead.mobile}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Funnel Stage (Clickable to change) */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => {
                            setStageChangeLead(lead);
                            setNewStageSelected(lead.stage);
                            setStageChangeNote('');
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border} hover:scale-105`}
                          title="Click to update funnel stage & add timeline note"
                        >
                          <span>{lead.stage}</span>
                          <ChevronDown className="w-3 h-3 opacity-70" />
                        </button>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit border ${
                              lead.priority === 'Hot'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : lead.priority === 'Warm'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : lead.priority === 'Normal'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                            }`}
                          >
                            {lead.priority === 'Hot' ? '🔥 Hot' : lead.priority === 'Warm' ? '⚡ Warm' : lead.priority}
                          </span>
                          {lead.aiRecommendedPriority && lead.aiRecommendedPriority !== lead.priority && (
                            <span
                              className="text-[9px] text-[#FFC600] font-mono"
                              title={`AI Recommendation: ${lead.aiRecommendedPriority} - ${lead.aiRecommendationReason}`}
                            >
                              AI: {lead.aiRecommendedPriority}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Est. Monthly GMV */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-mono font-bold text-[var(--text)]">
                          {INR(lead.expectedGmv || lead.estimatedMonthlySpend)}
                        </div>
                        <div className="text-[10px] text-[var(--muted)] font-mono">
                          Spend: {INR(lead.estimatedMonthlySpend)}
                        </div>
                      </td>

                      {/* Next Follow-up */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono border w-fit ${fu.badgeClass}`}
                          >
                            {fu.label}
                          </span>
                          <span className="text-[11px] text-[var(--muted)] font-mono">
                            {lead.nextFollowUpDate}
                          </span>
                        </div>
                      </td>

                      {/* Quick Note & Timeline Snippet */}
                      <td className="py-3 px-3">
                        <div className="max-w-[200px]">
                          <p className="text-[11px] text-[var(--text)] line-clamp-2 leading-tight">
                            {lead.quickNote || 'No notes added yet.'}
                          </p>
                          <button
                            onClick={() => setViewHistoryLead(lead)}
                            className="mt-1 text-[10px] text-[var(--muted)] hover:text-[#FFC600] flex items-center gap-1 cursor-pointer"
                          >
                            <History className="w-2.5 h-2.5" />
                            <span>{lead.history.length} audit touchpoints</span>
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* 🐼 Ask Zeta */}
                          <button
                            onClick={() => onOpenZetaWithLead(lead)}
                            className="px-2 py-1 rounded-lg border border-[#FFC600]/40 bg-[#FFC600]/10 hover:bg-[#FFC600]/25 text-[#FFC600] text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            title="Ask Zeta: Research company, draft pitch, call brief & next action"
                          >
                            <ZetaCharacter size="sm" state="opportunity" />
                            <span className="hidden sm:inline">Ask Zeta</span>
                          </button>

                          {/* Convert to Account */}
                          {!isConverted ? (
                            <button
                              onClick={() => onOpenConvertModal(lead)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs shadow-emerald-500/20"
                              title="Convert to active portfolio account"
                            >
                              <Rocket className="w-3 h-3" />
                              <span className="hidden md:inline">Convert</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (lead.convertedOrgId && onViewPortfolioAccount) {
                                  onViewPortfolioAccount(lead.convertedOrgId);
                                }
                              }}
                              className="px-2 py-1 rounded-lg border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                              title="View active account in portfolio"
                            >
                              <Trophy className="w-3 h-3 text-emerald-400" />
                              <span>Portfolio #{lead.convertedOrgId || lead.existingOrgId}</span>
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. STAGE CHANGE & TIMELINE NOTE MODAL                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {stageChangeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--panel-solid)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[var(--line)] bg-[var(--panel-2)]/50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#FFC600]" />
                  <span>Update Funnel Stage</span>
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  {stageChangeLead.companyName}
                </p>
              </div>
              <button
                onClick={() => setStageChangeLead(null)}
                className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Select New Stage
                </label>
                <select
                  value={newStageSelected}
                  onChange={(e) => setNewStageSelected(e.target.value as FunnelStage)}
                  className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs font-bold text-[var(--text)] focus:border-[#FFC600] focus:outline-none"
                >
                  {ALL_STAGES.map((stg) => (
                    <option key={stg} value={stg}>
                      {stg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text)] mb-1">
                  Timeline Action Note <span className="text-[var(--muted)] font-normal">(Preserves history)</span>
                </label>
                <textarea
                  rows={3}
                  value={stageChangeNote}
                  onChange={(e) => setStageChangeNote(e.target.value)}
                  placeholder="e.g. Connected on call with VP Procurement. Shared credit policy document."
                  className="w-full px-3 py-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-xl text-xs text-[var(--text)] placeholder-[var(--muted)]/50 focus:border-[#FFC600] focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[var(--panel-2)]/40 border border-[var(--line)] text-[11px] text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">History Preservation:</span> This action records a timestamped audit entry in this lead's journey.
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[var(--line)] bg-[var(--panel-2)]/50 flex items-center justify-between">
              <button
                onClick={() => setStageChangeLead(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--text)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStageChange}
                className="px-4 py-1.5 rounded-xl bg-[#FFC600] hover:bg-[#e6b200] text-black font-bold text-xs transition-all cursor-pointer shadow-sm shadow-[#FFC600]/30"
              >
                Save Stage & Audit Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 7. VIEW AUDIT TIMELINE MODAL                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewHistoryLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[var(--panel-solid)] border border-[var(--line)] rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-[var(--line)] bg-[var(--panel-2)]/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#FFC600]" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)]">
                    Sales Journey Audit Trail
                  </h3>
                  <p className="text-xs text-[var(--muted)]">
                    {viewHistoryLead.companyName} ({viewHistoryLead.domain})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewHistoryLead(null)}
                className="p-1.5 text-[var(--muted)] hover:text-[var(--text)] rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              <div className="relative border-l-2 border-[#FFC600]/40 ml-3 space-y-4 pl-4">
                {viewHistoryLead.history.map((entry, idx) => (
                  <div key={entry.id || idx} className="relative">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#FFC600] border-2 border-[var(--panel-solid)]" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[var(--text)] font-mono">
                        {entry.stage}
                      </span>
                      <span className="text-[10px] text-[#FFC600] font-mono px-1.5 py-0.2 rounded bg-[#FFC600]/10 border border-[#FFC600]/30">
                        {entry.date}
                      </span>
                      {entry.author && (
                        <span className="text-[10px] text-[var(--muted)] font-medium">
                          by {entry.author}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text)]/90 mt-1 leading-relaxed bg-[var(--panel-2)]/50 p-2.5 rounded-xl border border-[var(--line)]">
                      {entry.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-5 py-3 border-t border-[var(--line)] bg-[var(--panel-2)]/50 flex items-center justify-between shrink-0">
              <button
                onClick={() => {
                  const leadToAsk = viewHistoryLead;
                  setViewHistoryLead(null);
                  onOpenZetaWithLead(leadToAsk, 'Summarise everything before my call.');
                }}
                className="px-3 py-1.5 rounded-xl border border-[#FFC600]/40 bg-[#FFC600]/15 hover:bg-[#FFC600]/25 text-[#FFC600] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ZetaCharacter size="sm" state="opportunity" />
                <span>Summarise with Zeta</span>
              </button>

              <button
                onClick={() => setViewHistoryLead(null)}
                className="px-4 py-1.5 rounded-xl bg-[var(--panel-2)] border border-[var(--line)] text-xs font-semibold text-[var(--text)] cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
