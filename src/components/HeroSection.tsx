import React from 'react';
import { PortfolioKPIs } from '../types';
import { RadarMark } from './RadarLogo';
import { AiIntelligenceFace } from './AiIntelligenceFace';

interface HeroSectionProps {
  kpis: PortfolioKPIs;
  onOpenAi?: () => void;
  dataThroughDate?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  kpis,
  onOpenAi,
  dataThroughDate = '10 Sep 2026'
}) => {
  return (
    <section
      id="hero-cockpit"
      className="relative overflow-hidden p-5 sm:p-7 border border-[var(--line)] rounded-3xl bg-gradient-to-br from-[#121822]/95 to-[#0b0f16]/90 [html[data-theme='light']_&]:from-white/95 [html[data-theme='light']_&]:to-[#fafafa]/95 backdrop-blur-xl shadow-[var(--shadow)] mb-4"
    >
      {/* Decorative radial amber blur in top-right */}
      <div className="pointer-events-none absolute -right-16 -top-20 w-80 h-80 rounded-full bg-radial from-[#FFC600]/15 to-transparent blur-3xl" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
        <div className="max-w-3xl">
          <div className="flex gap-2 items-center flex-wrap mb-3">
            <span className="inline-flex items-center gap-1.5 border border-[#FFC600]/30 bg-[#FFC600]/10 px-3 py-1 rounded-full text-[var(--text)] text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FFC600] animate-ping" />
              Radar 365 • 360° Account Visibility
            </span>
            <span className="inline-flex items-center gap-1.5 border border-[var(--line)] bg-[var(--panel-2)]/60 px-2.5 py-1 rounded-full text-[var(--muted)] text-[11px] font-bold">
              Data through {dataThroughDate}
            </span>
            <span className="inline-flex items-center gap-1.5 border border-[var(--line)] bg-[var(--panel-2)]/60 px-2.5 py-1 rounded-full text-[var(--muted)] text-[11px] font-bold">
              Non-RAM / KAM Cohort
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-tight text-[var(--text)]">
            Focus on the accounts that can move your month.
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm text-[var(--muted)] leading-relaxed mt-2.5">
            113 portfolio rows consolidated across July baseline and matched August / September GMV.
            Separates unmapped accounts from genuine drop-offs, dedupes Org IDs, and accelerates daily sales outreach.
          </p>

          <div className="flex gap-2.5 flex-wrap mt-4 pt-1">
            <span className="inline-flex items-center gap-1 border border-[var(--line)] bg-[var(--panel-2)]/60 px-3 py-1 rounded-full text-[var(--muted)] text-[11px] font-semibold">
              <strong className="text-[var(--text)]">{kpis.totalRows}</strong> rows
            </span>
            <span className="inline-flex items-center gap-1 border border-[var(--line)] bg-[var(--panel-2)]/60 px-3 py-1 rounded-full text-[var(--muted)] text-[11px] font-semibold">
              <strong className="text-[var(--text)]">{kpis.uniqueOrgCount}</strong> unique Org IDs
            </span>
            <span className="inline-flex items-center gap-1 border border-[var(--line)] bg-[var(--panel-2)]/60 px-3 py-1 rounded-full text-[var(--muted)] text-[11px] font-semibold">
              <strong className="text-[var(--text)]">{kpis.matchedCount}</strong> matched accounts
            </span>
            <span className="inline-flex items-center gap-1 border border-[var(--line)] bg-[var(--panel-2)]/60 px-3 py-1 rounded-full text-[var(--muted)] text-[11px] font-semibold">
              Sep is MTD, not full month
            </span>
          </div>
        </div>

        {/* Right side AI mascot & radar card */}
        <div className="hidden lg:flex items-center gap-3.5">
          <div
            onClick={onOpenAi}
            className="flex flex-col items-center justify-center p-3.5 rounded-2xl border border-[#FFC600]/40 bg-[var(--panel-solid)]/80 hover:bg-[var(--panel-solid)] shadow-lg min-w-[190px] text-center cursor-pointer hover:border-[#FFC600] hover:-translate-y-0.5 transition-all group"
            title="Click to summon Radar AI Intelligence Analyst"
          >
            <AiIntelligenceFace size="lg" mood="happy" showStatusDot={true} interactive={false} />
            <div className="mt-2.5">
              <div className="text-xs font-black tracking-wider text-[var(--text)] group-hover:text-[#FFC600] transition-colors flex items-center justify-center gap-1.5">
                <span>Radar AI Face</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-[10px] text-[var(--muted)] font-medium mt-0.5">
                Portfolio Copilot Active
              </div>
              <div className="mt-2 px-2.5 py-1 rounded-full bg-[#FFC600]/15 text-[#FFC600] border border-[#FFC600]/30 text-[10px] font-bold group-hover:bg-[#FFC600] group-hover:text-[#111111] transition-all">
                Ask Intelligence &rarr;
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--line)] bg-[var(--panel-solid)]/70 shadow-lg text-center">
            <RadarMark size={56} animated={true} />
            <div className="mt-2">
              <div className="text-[11px] font-black tracking-wider text-[var(--text)] uppercase">
                Radar 365
              </div>
              <div className="text-[9px] text-[var(--muted)] font-medium mt-0.5">
                Continuous Scan
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
