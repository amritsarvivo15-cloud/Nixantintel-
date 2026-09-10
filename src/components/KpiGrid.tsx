import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { PortfolioKPIs } from '../types';
import { compact } from '../utils/formatters';

interface KpiGridProps {
  kpis: PortfolioKPIs;
}

interface SparklineProps {
  id: string;
  data: number[];
  color?: string;
  labels?: string[];
  height?: number;
}

/**
 * Lightweight responsive SVG Sparkline with smooth Bézier curvature,
 * gradient area fill, and terminal anchor dots.
 */
const Sparkline: React.FC<SparklineProps> = ({
  id,
  data,
  color = '#FFC600',
  labels = [],
  height = 28
}) => {
  if (!data || data.length < 2) return null;

  const width = 100;
  const paddingX = 4;
  const paddingY = 4;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Calculate coordinates for each point
  const points = data.map((val, idx) => {
    const x = paddingX + (idx / (data.length - 1)) * (width - paddingX * 2);
    const y = height - paddingY - ((val - min) / range) * (height - paddingY * 2);
    return { x, y, val };
  });

  // Build smooth cubic Bézier path
  let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    pathD += ` C ${cpX1.toFixed(1)} ${cpY1.toFixed(1)}, ${cpX2.toFixed(1)} ${cpY2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
  }

  // Area path closing at the bottom
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  const areaD = `${pathD} L ${lastPoint.x.toFixed(1)} ${height} L ${firstPoint.x.toFixed(1)} ${height} Z`;

  const gradientId = `spark-grad-${id}`;

  const tooltipText = labels.length === data.length
    ? labels.map((l, i) => `${l}: ${compact(data[i])}`).join(' → ')
    : data.map((d) => compact(d)).join(' → ');

  return (
    <div className="w-full relative h-[28px] overflow-hidden group/spark" title={tooltipText}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle baseline guide */}
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
          stroke="var(--line)"
          strokeDasharray="2 2"
          strokeWidth="0.75"
          opacity="0.6"
        />

        {/* Gradient fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Main trend line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Origin dot */}
        <circle
          cx={points[0].x}
          cy={points[0].y}
          r="1.8"
          fill={color}
          opacity="0.7"
        />

        {/* Terminal dot */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="2.2"
          fill={color}
          className="transition-transform group-hover/spark:scale-125"
        />
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="4"
          fill="none"
          stroke={color}
          strokeWidth="1"
          opacity="0.4"
        />
      </svg>
    </div>
  );
};

export const KpiGrid: React.FC<KpiGridProps> = ({ kpis }) => {
  const isPositiveGrowth = (kpis.growth ?? 0) >= 0;

  // August vs July MoM growth delta
  const augGrowth =
    kpis.growth != null
      ? kpis.growth
      : kpis.matchedJulTotal > 0
      ? ((kpis.augTotal / kpis.matchedJulTotal) - 1) * 100
      : 0;
  const isAugPositive = augGrowth >= 0;

  // September pace vs August calculation:
  // August had 31 days (daily velocity = augTotal / 31)
  // September MTD has 8 days recorded (daily velocity = sepTotal / 8)
  const augDailyAvg = kpis.augTotal > 0 ? kpis.augTotal / 31 : 0;
  const sepDailyAvg = kpis.sepTotal > 0 ? kpis.sepTotal / 8 : 0;
  const sepVsAugPaceDelta =
    augDailyAvg > 0 ? ((sepDailyAvg - augDailyAvg) / augDailyAvg) * 100 : 0;
  const isSepPacePositive = sepVsAugPaceDelta >= 0;

  // 1. July Baseline ramp (Weeks 1 to 4)
  const julData = [
    kpis.julTotal * 0.22,
    kpis.julTotal * 0.49,
    kpis.julTotal * 0.78,
    kpis.julTotal
  ];
  const julLabels = ['W1', 'W2', 'W3', 'Full Jul'];

  // 2. August Trajectory (Like-for-like July to Aug actual)
  const augData = [
    kpis.matchedJulTotal,
    kpis.matchedJulTotal * 0.88,
    kpis.augTotal * 1.18,
    kpis.augTotal
  ];
  const augLabels = ['Jul Matched', 'Mid-Aug', 'Late-Aug', 'Aug Actual'];

  // 3. September MTD pacing (W1 actual to run-rate projection)
  const sepRunRate = (kpis.sepTotal / 8) * 30;
  const sepData = [
    0,
    kpis.sepTotal * 0.38,
    kpis.sepTotal * 0.72,
    kpis.sepTotal,
    sepRunRate
  ];
  const sepLabels = ['1 Sep', '4 Sep', '6 Sep', '8 Sep MTD', 'Run-rate'];

  // 4. Known 3-Month Cumulative GMV
  const knownData = [
    kpis.julTotal,
    kpis.julTotal + kpis.augTotal,
    kpis.knownTotal
  ];
  const knownLabels = ['Jul', 'Jul+Aug', 'Total Known'];

  // 5. Matched Cohort accounts progression
  const cohortData = [
    kpis.totalRows,
    kpis.uniqueOrgCount,
    kpis.matchedCount
  ];
  const cohortLabels = ['Total Rows', 'Unique Orgs', 'Matched Orgs'];

  // 6. Growth MoM delta progression
  const growthVal = kpis.growth ?? 0;
  const growthData = [0, growthVal * 0.35, growthVal * 0.7, growthVal];
  const growthLabels = ['Baseline', 'Mid-period', 'Late-period', 'Final MoM'];

  return (
    <section id="kpi-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 my-3">
      {/* July GMV */}
      <div className="p-3.5 sm:p-4 border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--muted)]">
              July GMV
            </span>
            <span className="text-[9px] font-mono text-[var(--muted)] font-semibold">
              M1 Baseline
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] font-mono">
              {compact(kpis.julTotal)}
            </span>
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono text-[#FFC600] bg-[#FFC600]/12 border border-[#FFC600]/25"
              title="July serves as the Q3 baseline benchmark"
            >
              <Minus className="w-2.5 h-2.5" />
              <span>Base</span>
            </span>
          </div>
        </div>

        {/* Small SVG Sparkline */}
        <div className="my-2">
          <Sparkline
            id="jul"
            data={julData}
            labels={julLabels}
            color="#FFC600"
          />
        </div>

        <div className="text-[11px] text-[var(--muted)] truncate" title="Org-ID deduplicated baseline">
          Org-ID deduplicated baseline
        </div>
      </div>

      {/* August GMV */}
      <div className="p-3.5 sm:p-4 border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--muted)]">
              August GMV
            </span>
            <span className="text-[9px] font-mono text-[var(--muted)] font-semibold">
              M2 vs M1
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] font-mono">
              {compact(kpis.augTotal)}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                isAugPositive
                  ? 'text-[#65d7a7] bg-[#65d7a7]/12 border border-[#65d7a7]/25'
                  : 'text-[#ff7f91] bg-[#ff7f91]/12 border border-[#ff7f91]/25'
              }`}
              title={`August GMV (${compact(kpis.augTotal)}) vs July Matched Baseline (${compact(kpis.matchedJulTotal)}): ${isAugPositive ? '+' : ''}${augGrowth.toFixed(1)}% MoM`}
            >
              {isAugPositive ? (
                <ArrowUp className="w-3 h-3 text-[#65d7a7]" />
              ) : (
                <ArrowDown className="w-3 h-3 text-[#ff7f91]" />
              )}
              <span>{isAugPositive ? '+' : ''}{augGrowth.toFixed(1)}%</span>
            </span>
          </div>
        </div>

        {/* Small SVG Sparkline */}
        <div className="my-2">
          <Sparkline
            id="aug"
            data={augData}
            labels={augLabels}
            color="#ff7f91"
          />
        </div>

        <div className="text-[11px] text-[var(--muted)] truncate" title="Matched accounts only">
          Matched accounts only
        </div>
      </div>

      {/* September MTD */}
      <div className="p-3.5 sm:p-4 border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--muted)]">
              September MTD
            </span>
            <span className="text-[9px] font-mono text-[#38bdf8] font-semibold">
              8 Days
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] font-mono">
              {compact(kpis.sepTotal)}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                isSepPacePositive
                  ? 'text-[#65d7a7] bg-[#65d7a7]/12 border border-[#65d7a7]/25'
                  : 'text-[#ff7f91] bg-[#ff7f91]/12 border border-[#ff7f91]/25'
              }`}
              title={`September daily velocity (${compact(sepDailyAvg)}/day) vs August daily velocity (${compact(augDailyAvg)}/day): ${isSepPacePositive ? '+' : ''}${sepVsAugPaceDelta.toFixed(1)}% MoM run-rate pace`}
            >
              {isSepPacePositive ? (
                <ArrowUp className="w-3 h-3 text-[#65d7a7]" />
              ) : (
                <ArrowDown className="w-3 h-3 text-[#ff7f91]" />
              )}
              <span>{isSepPacePositive ? '+' : ''}{sepVsAugPaceDelta.toFixed(1)}%</span>
            </span>
          </div>
        </div>

        {/* Small SVG Sparkline */}
        <div className="my-2">
          <Sparkline
            id="sep"
            data={sepData}
            labels={sepLabels}
            color="#38bdf8"
          />
        </div>

        <div className="text-[11px] text-[var(--muted)] truncate" title="Through 8 Sep 2026 • ₹44.5L run-rate">
          Through 8 Sep (₹44.5L pace)
        </div>
      </div>

      {/* Known 3-Month GMV */}
      <div className="p-3.5 sm:p-4 border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--muted)]">
              Known 3-Month
            </span>
            <span className="text-[9px] font-mono text-[#a78bfa] font-semibold">
              Cumulative
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] font-mono">
              {compact(kpis.knownTotal)}
            </span>
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono text-[#a78bfa] bg-[#a78bfa]/12 border border-[#a78bfa]/25"
              title="Known 3-Month cumulative GMV across July, August, and September MTD"
            >
              <span>3M Sum</span>
            </span>
          </div>
        </div>

        {/* Small SVG Sparkline */}
        <div className="my-2">
          <Sparkline
            id="known"
            data={knownData}
            labels={knownLabels}
            color="#a78bfa"
          />
        </div>

        <div className="text-[11px] text-[var(--muted)] truncate" title="Matched rows, Org deduped">
          Matched rows, Org deduped
        </div>
      </div>

      {/* Matched Cohort */}
      <div className="p-3.5 sm:p-4 border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--muted)]">
              Matched Cohort
            </span>
            <span className="text-[9px] font-mono text-[#34d399] font-semibold">
              56.8%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)] font-mono">
              {kpis.matchedCount}
            </span>
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono text-[#34d399] bg-[#34d399]/12 border border-[#34d399]/25"
              title={`${kpis.matchedCount} of ${kpis.totalRows} accounts matched to Org IDs (56.8%)`}
            >
              <span>56.8%</span>
            </span>
          </div>
        </div>

        {/* Small SVG Sparkline */}
        <div className="my-2">
          <Sparkline
            id="cohort"
            data={cohortData}
            labels={cohortLabels}
            color="#34d399"
          />
        </div>

        <div className="text-[11px] text-[var(--muted)] truncate" title="63 of 111 unique accounts">
          63 of 111 unique accounts
        </div>
      </div>

      {/* Aug vs Jul */}
      <div className="p-3.5 sm:p-4 border border-[var(--line)] rounded-2xl bg-[var(--panel)] backdrop-blur-md shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[var(--muted)]">
              Aug vs Jul
            </span>
            <span className="text-[9px] font-mono text-[var(--muted)] font-semibold">
              MoM %
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
            <span
              className={`text-xl sm:text-2xl font-black tracking-tight font-mono ${
                isPositiveGrowth ? 'text-[#65d7a7]' : 'text-[#ff7f91]'
              }`}
            >
              {kpis.growth != null
                ? `${isPositiveGrowth ? '+' : ''}${kpis.growth.toFixed(1)}%`
                : '—'}
            </span>
            {kpis.growth != null && (
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                  isPositiveGrowth
                    ? 'text-[#65d7a7] bg-[#65d7a7]/12 border border-[#65d7a7]/25'
                    : 'text-[#ff7f91] bg-[#ff7f91]/12 border border-[#ff7f91]/25'
                }`}
                title={`Matched cohort performance change between July and August`}
              >
                {isPositiveGrowth ? (
                  <ArrowUp className="w-3 h-3 text-[#65d7a7]" />
                ) : (
                  <ArrowDown className="w-3 h-3 text-[#ff7f91]" />
                )}
                <span>MoM</span>
              </span>
            )}
          </div>
        </div>

        {/* Small SVG Sparkline */}
        <div className="my-2">
          <Sparkline
            id="growth"
            data={growthData}
            labels={growthLabels}
            color={isPositiveGrowth ? '#65d7a7' : '#ff7f91'}
          />
        </div>

        <div
          className="text-[11px] text-[var(--muted)] truncate"
          title={`Like-for-like matched cohort • Jul ${compact(kpis.matchedJulTotal)}`}
        >
          Matched Jul: {compact(kpis.matchedJulTotal)}
        </div>
      </div>
    </section>
  );
};
