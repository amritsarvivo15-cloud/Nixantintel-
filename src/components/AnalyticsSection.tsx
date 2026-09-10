import React from 'react';
import { DerivedPortfolioRecord, PortfolioKPIs, ActionBucket } from '../types';
import { compact } from '../utils/formatters';

interface AnalyticsSectionProps {
  kpis: PortfolioKPIs;
  rows: DerivedPortfolioRecord[];
  selectedAction: string;
  selectedChannel: string;
  onSelectAction: (action: string) => void;
  onSelectChannel: (channel: string) => void;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  kpis,
  rows,
  selectedAction,
  selectedChannel,
  onSelectAction,
  onSelectChannel
}) => {
  // GMV pulse bars
  const trendData = [
    { label: 'Jul', value: kpis.julTotal },
    { label: 'Aug', value: kpis.augTotal },
    { label: 'Sep MTD', value: kpis.sepTotal }
  ];
  const maxTrend = Math.max(...trendData.map((d) => d.value), 1);

  // Action queue definitions
  const actionDefinitions: { name: ActionBucket; icon: string; desc: string }[] = [
    { name: 'Priority follow-up', icon: '⚑', desc: 'Unmatched + ₹1L July baseline' },
    { name: 'Recovery', icon: '↘', desc: 'Aug below 65% of Jul' },
    { name: 'Upside', icon: '↗', desc: 'Aug growth above 25%' },
    { name: 'Active MTD', icon: '●', desc: 'September activity detected' }
  ];

  // Channel mix breakdown
  const channelCounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      map[r.channel] = (map[r.channel] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const maxChannelCount = Math.max(...channelCounts.map(([, c]) => c), 1);

  return (
    <section id="analytics-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
      {/* 1. GMV pulse */}
      <div className="border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md p-4 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div>
            <h3 className="font-bold text-sm text-[var(--text)]">GMV pulse</h3>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Portfolio baseline vs matched monthly GMV
            </p>
          </div>
          <span className="text-[10px] text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-lg">
            ₹ Lakhs
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 items-end h-40 pt-2">
          {trendData.map((item) => {
            const heightPct = Math.max(10, Math.round((item.value / maxTrend) * 100));
            return (
              <div key={item.label} className="h-full flex flex-col justify-end items-center gap-1.5">
                <div className="w-full h-28 flex items-end justify-center bg-gradient-to-b from-[#FFC600]/5 to-transparent rounded-xl p-1.5">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full min-h-2 rounded-t-lg bg-gradient-to-t from-[#FFC600] to-[#ffcd1a] shadow-md shadow-[#FFC600]/20 transition-all duration-500 hover:brightness-110"
                    title={`${item.label}: ${compact(item.value)}`}
                  />
                </div>
                <div className="text-[10px] text-[var(--muted)] font-extrabold uppercase">
                  {item.label}
                </div>
                <div className="text-xs font-bold text-[var(--text)] font-mono">
                  {compact(item.value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Action queue */}
      <div className="border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md p-4 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start gap-2 mb-2.5">
          <div>
            <h3 className="font-bold text-sm text-[var(--text)]">Action queue</h3>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Auto-prioritized from current GMV behavior
            </p>
          </div>
          <span className="text-[10px] text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-lg">
            Visible all rows
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {actionDefinitions.map((act) => {
            const count = rows.filter((r) => r.actionBucket === act.name).length;
            const isSelected = selectedAction === act.name;

            return (
              <button
                key={act.name}
                onClick={() => onSelectAction(isSelected ? '' : act.name)}
                className={`w-full text-left grid grid-cols-[auto_1fr_auto] gap-2.5 items-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#FFC600] bg-[#FFC600]/15 ring-1 ring-[#FFC600]/30'
                    : 'border-[var(--line)] bg-[#040e19]/20 [html[data-theme="light"]_&]:bg-[#f5f9ff]/70 hover:border-[#FFC600]/40'
                }`}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--panel-2)] text-xs font-bold text-[#FFC600]">
                  {act.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[var(--text)] truncate">
                    {act.name}
                  </div>
                  <div className="text-[10px] text-[var(--muted)] truncate">
                    {act.desc}
                  </div>
                </div>
                <div className="text-base font-black text-[var(--text)] font-mono pl-1">
                  {count}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Channel mix */}
      <div className="border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md p-4 flex flex-col justify-between shadow-sm md:col-span-2 lg:col-span-1">
        <div className="flex justify-between items-start gap-2 mb-3">
          <div>
            <h3 className="font-bold text-sm text-[var(--text)]">Channel mix</h3>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">
              Share of portfolio rows
            </p>
          </div>
          <span className="text-[10px] text-[var(--muted)] border border-[var(--line)] px-2 py-0.5 rounded-lg">
            {rows.length} rows
          </span>
        </div>

        <div className="flex flex-col gap-3 py-1">
          {channelCounts.map(([ch, count]) => {
            const widthPct = Math.round((count / maxChannelCount) * 100);
            const isSelected = selectedChannel === ch;

            return (
              <button
                key={ch}
                onClick={() => onSelectChannel(isSelected ? '' : ch)}
                className={`w-full text-left grid grid-cols-[60px_1fr_36px] gap-2 items-center text-xs p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isSelected ? 'bg-[#FFC600]/15 font-bold' : 'hover:bg-[var(--panel-2)]/50'
                }`}
              >
                <span className="font-bold text-[var(--text)] truncate">{ch}</span>
                <div className="h-2 rounded-full bg-[#81a0c0]/15 overflow-hidden w-full">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#FFC600] to-[#ffcd1a] transition-all duration-500"
                  />
                </div>
                <span className="text-right text-[var(--muted)] font-mono font-semibold">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
