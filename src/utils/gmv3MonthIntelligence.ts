import { DerivedPortfolioRecord, PortfolioRecord } from '../types';
import { compact } from './formatters';

export type ThreeMonthSignalType =
  | 'accelerating'
  | 'growth'
  | 'recovery'
  | 'active_mtd'
  | 'watch'
  | 'declining'
  | 'dormant'
  | 'new_activity';

export interface DynamicMonthMeta {
  currentKey: string;
  currentLabel: string;
  currentShort: string;
  prevKey: string;
  prevLabel: string;
  prevShort: string;
  baselineKey: string;
  baselineLabel: string;
  baselineShort: string;
  daysPassed: number;
  daysInCurrentMonth: number;
  daysInPrevMonth: number;
  dataThroughDate: string;
}

export interface Account3MStats {
  curVal: number | null;
  prevVal: number | null;
  baseVal: number;
  isCurMissing: boolean;
  isPrevMissing: boolean;
  isBaseMissing: boolean;
  // August vs July MoM
  momPrevVsBasePct: number | null;
  // Current MTD vs full Previous
  curVsFullPrevPct: number | null;
  // Current pace vs Previous same-period
  paceVsPrevPct: number | null;
  prevSamePeriodVal: number | null;
  projectedRunRate: number | null;
  paceStatus: 'accelerating' | 'above' | 'on_track' | 'below' | 'zero' | 'insufficient_data';
  paceLabel: string;
  // 3M Signal
  signal: ThreeMonthSignalType;
  signalLabel: string;
  signalBadgeClass: string;
  signalBorderClass: string;
  signalColorClass: string;
  signalIcon: string;
  shortReason: string;
  detailedExplanation: string;
  // Action recommendation
  actionRecommendation: string;
  actionQueueCategory: 'Priority Follow-up' | 'Recovery' | 'Upside / Growth' | 'Active MTD' | 'Maintain' | 'Dormant';
  // Sparkline coordinates
  sparklineValues: [number, number, number];
  sparklineShape: 'accelerating' | 'growth' | 'recovery' | 'declining' | 'stable' | 'flat';
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function getDaysInMonth(monthIndex: number, year: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Dynamically parses dataThroughDate (e.g. "10 Sep 2026") to resolve
 * rolling 3-month window: Current MTD, Previous Month, and Baseline Month.
 */
export function getDynamicMonthMeta(dataThroughDate: string = '10 Sep 2026'): DynamicMonthMeta {
  let day = 10;
  let monthIndex = 8; // Sep (0-indexed)
  let year = 2026;

  // Try parsing pattern like "10 Sep 2026"
  const parts = dataThroughDate.trim().split(/[\s-]+/);
  if (parts.length >= 3) {
    const p0 = parseInt(parts[0], 10);
    if (!isNaN(p0)) day = Math.min(Math.max(1, p0), 31);

    const mStr = parts[1].slice(0, 3).toLowerCase();
    const foundIdx = MONTH_KEYS.indexOf(mStr);
    if (foundIdx !== -1) monthIndex = foundIdx;

    const yr = parseInt(parts[2], 10);
    if (!isNaN(yr) && yr > 2000) year = yr;
  } else if (parts.length === 2) {
    const mStr = parts[0].slice(0, 3).toLowerCase();
    const foundIdx = MONTH_KEYS.indexOf(mStr);
    if (foundIdx !== -1) monthIndex = foundIdx;
    const yr = parseInt(parts[1], 10);
    if (!isNaN(yr) && yr > 2000) year = yr;
  }

  const prevMonthIdx = (monthIndex - 1 + 12) % 12;
  const prevYear = monthIndex === 0 ? year - 1 : year;

  const baseMonthIdx = (monthIndex - 2 + 12) % 12;

  const daysInCurrentMonth = getDaysInMonth(monthIndex, year);
  const daysInPrevMonth = getDaysInMonth(prevMonthIdx, prevYear);
  const clampedDay = Math.min(day, daysInCurrentMonth);

  const curKey = MONTH_KEYS[monthIndex];
  const prevKey = MONTH_KEYS[prevMonthIdx];
  const baseKey = MONTH_KEYS[baseMonthIdx];

  const curName = MONTH_NAMES[monthIndex].toUpperCase();
  const prevName = MONTH_NAMES[prevMonthIdx].toUpperCase();
  const baseName = MONTH_NAMES[baseMonthIdx].toUpperCase();

  return {
    currentKey: curKey,
    currentLabel: `${curName} MTD`,
    currentShort: curName,
    prevKey: prevKey,
    prevLabel: `${prevName} GMV`,
    prevShort: prevName,
    baselineKey: baseKey,
    baselineLabel: `${baseName} GMV`,
    baselineShort: baseName,
    daysPassed: clampedDay,
    daysInCurrentMonth,
    daysInPrevMonth,
    dataThroughDate
  };
}

/**
 * Extracts a month value from a record, distinguishing confirmed 0 from genuinely missing (null/undefined).
 */
export function getMonthValue(record: PortfolioRecord | DerivedPortfolioRecord, key: string): {
  val: number | null;
  isMissing: boolean;
} {
  const lKey = key.toLowerCase();
  let raw: any = undefined;

  if (lKey === 'jul') raw = record.jul;
  else if (lKey === 'aug') raw = record.aug;
  else if (lKey === 'sep') raw = record.sep;
  else if (record.dynamicMonths && record.dynamicMonths[key] !== undefined) {
    raw = record.dynamicMonths[key];
  }

  if (raw === null || raw === undefined) {
    return { val: null, isMissing: true };
  }

  const num = Number(raw);
  if (isNaN(num)) {
    return { val: null, isMissing: true };
  }

  return { val: num, isMissing: false };
}

/**
 * Computes complete 3-month statistics, pace comparisons, signals, and explanations.
 */
export function calculateAccount3MStats(
  record: PortfolioRecord | DerivedPortfolioRecord,
  meta: DynamicMonthMeta
): Account3MStats {
  const curExtract = getMonthValue(record, meta.currentKey);
  const prevExtract = getMonthValue(record, meta.prevKey);
  const baseExtract = getMonthValue(record, meta.baselineKey);

  const curVal = curExtract.val;
  const prevVal = prevExtract.val;
  const baseVal = baseExtract.val ?? 0;

  const isCurMissing = curExtract.isMissing;
  const isPrevMissing = prevExtract.isMissing;
  const isBaseMissing = baseExtract.isMissing;

  // 1. Previous vs Baseline (August vs July) MoM %
  let momPrevVsBasePct: number | null = null;
  if (!isPrevMissing && prevVal !== null && baseVal > 0) {
    momPrevVsBasePct = ((prevVal - baseVal) / baseVal) * 100;
  }

  // 2. Current vs Full Previous %
  let curVsFullPrevPct: number | null = null;
  if (!isCurMissing && curVal !== null && !isPrevMissing && prevVal !== null && prevVal > 0) {
    curVsFullPrevPct = ((curVal - prevVal) / prevVal) * 100;
  }

  // 3. Current Pace vs Previous Same-Period
  // Since Current Month is incomplete (e.g. 10 days out of 30),
  // compare against the equivalent proportion of Previous Month (10 days out of 31).
  let paceVsPrevPct: number | null = null;
  let prevSamePeriodVal: number | null = null;
  let projectedRunRate: number | null = null;
  let paceStatus: Account3MStats['paceStatus'] = 'insufficient_data';
  let paceLabel = '—';

  if (!isCurMissing && curVal !== null) {
    if (meta.daysPassed > 0) {
      projectedRunRate = (curVal / meta.daysPassed) * meta.daysInCurrentMonth;
    }

    if (!isPrevMissing && prevVal !== null && prevVal > 0) {
      // Prorated previous month for equivalent elapsed days
      prevSamePeriodVal = prevVal * (meta.daysPassed / meta.daysInPrevMonth);
      if (prevSamePeriodVal > 0) {
        paceVsPrevPct = ((curVal - prevSamePeriodVal) / prevSamePeriodVal) * 100;

        if (curVal === 0) {
          paceStatus = 'zero';
          paceLabel = '₹0 MTD (Zero Bookings)';
        } else if (paceVsPrevPct >= 25) {
          paceStatus = 'accelerating';
          paceLabel = `+${paceVsPrevPct.toFixed(0)}% vs same period (Above ${meta.prevShort})`;
        } else if (paceVsPrevPct > 0) {
          paceStatus = 'above';
          paceLabel = `+${paceVsPrevPct.toFixed(0)}% vs same period (Pacing ${meta.prevShort})`;
        } else if (paceVsPrevPct >= -15) {
          paceStatus = 'on_track';
          paceLabel = `${paceVsPrevPct.toFixed(0)}% vs same period (Normal)`;
        } else {
          paceStatus = 'below';
          paceLabel = `${paceVsPrevPct.toFixed(0)}% vs same period (Below ${meta.prevShort})`;
        }
      }
    } else if (isPrevMissing) {
      paceStatus = 'insufficient_data';
      paceLabel = `No ${meta.prevShort} data recorded (vs ${meta.baselineShort}: ${compact(baseVal)})`;
    } else if (prevVal === 0) {
      paceStatus = 'zero';
      paceLabel = `₹0 ${meta.prevShort} spend (Zero bookings)`;
    } else if (curVal > 0) {
      // No prev month match, but current month has bookings
      if (baseVal > 0) {
        const baseSamePeriod = baseVal * (meta.daysPassed / 31);
        const paceVsBase = ((curVal - baseSamePeriod) / baseSamePeriod) * 100;
        paceVsPrevPct = paceVsBase;
        paceStatus = paceVsBase >= 0 ? 'above' : 'below';
        paceLabel = `${paceVsBase >= 0 ? '+' : ''}${paceVsBase.toFixed(0)}% vs ${meta.baselineShort} pace`;
      } else {
        paceStatus = 'above';
        paceLabel = `Active ${meta.currentShort} MTD`;
      }
    } else if (curVal === 0) {
      paceStatus = 'zero';
      paceLabel = '₹0 MTD';
    }
  }

  // 4. Determine 3-Month Signal & Action Queue
  let signal: ThreeMonthSignalType = 'active_mtd';
  let signalLabel = 'ACTIVE MTD';
  let signalBadgeClass = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  let signalBorderClass = 'border-sky-500/40';
  let signalColorClass = 'text-sky-400';
  let signalIcon = '⚡';
  let shortReason = 'Active bookings recorded in current month';
  let detailedExplanation = `${meta.currentLabel} shows bookings. Track run-rate against previous period.`;
  let actionRecommendation = 'Engage SPOC for mid-month check-in';
  let actionQueueCategory: Account3MStats['actionQueueCategory'] = 'Active MTD';
  let sparklineShape: Account3MStats['sparklineShape'] = 'stable';

  const hasCurActivity = !isCurMissing && curVal !== null && curVal > 0;
  const isCurZero = !isCurMissing && curVal === 0;
  const hasPrevActivity = !isPrevMissing && prevVal !== null && prevVal > 0;
  const isPrevZero = !isPrevMissing && prevVal === 0;
  const hasBaseActivity = baseVal > 0;

  // DORMANT: Previously active account with no meaningful recent GMV
  if ((isCurMissing || isCurZero) && (isPrevMissing || isPrevZero)) {
    if (hasBaseActivity) {
      signal = 'dormant';
      signalLabel = 'DORMANT';
      signalBadgeClass = 'bg-zinc-800 text-zinc-400 border-zinc-700';
      signalBorderClass = 'border-zinc-700';
      signalColorClass = 'text-zinc-400';
      signalIcon = '⚪';
      shortReason = `Previously active (${compact(baseVal)} ${meta.baselineShort}) with zero recent GMV`;
      detailedExplanation = `Account had strong historical volume in ${meta.baselineShort} but zero recorded bookings in ${meta.prevShort} and ${meta.currentShort}. High churn risk; trigger re-engagement campaign.`;
      actionRecommendation = 'Initiate win-back or check corporate booking policy shift';
      actionQueueCategory = 'Dormant';
      sparklineShape = 'flat';
    } else {
      signal = 'dormant';
      signalLabel = 'INACTIVE';
      signalBadgeClass = 'bg-zinc-900/80 text-zinc-500 border-zinc-800';
      signalBorderClass = 'border-zinc-800';
      signalColorClass = 'text-zinc-500';
      signalIcon = '⚪';
      shortReason = 'No active bookings recorded';
      detailedExplanation = 'No current or historical bookings recorded across 3-month tracking window.';
      actionRecommendation = 'Verify contract activation status';
      actionQueueCategory = 'Maintain';
      sparklineShape = 'flat';
    }
  }
  // DECLINING / STEEP DROP: If pace or MoM is sharply negative (e.g. < -20%), classify as declining regardless of minor noise
  else if (
    (paceVsPrevPct !== null && paceVsPrevPct <= -20) ||
    (momPrevVsBasePct !== null && momPrevVsBasePct <= -30 && (curVal === 0 || (paceVsPrevPct !== null && paceVsPrevPct < 0)))
  ) {
    signal = 'declining';
    signalLabel = 'DECLINING';
    signalBadgeClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    signalBorderClass = 'border-rose-500/40';
    signalColorClass = 'text-rose-400';
    signalIcon = '🔴';
    shortReason = `Sharp contraction in recent pace (${paceVsPrevPct !== null ? paceVsPrevPct.toFixed(0) : 'significant'}% vs ${meta.prevShort})`;
    detailedExplanation = `Account volume has contracted severely compared to baseline and previous period. Immediate KAM escalation required to arrest churn.`;
    actionRecommendation = 'Escalate to RAM/KAM lead and review service friction';
    actionQueueCategory = 'Priority Follow-up';
    sparklineShape = 'declining';
  }
  // RECOVERY: Previous decline (Aug < Jul baseline * 0.85) followed by improving current-month activity (Sep pace > 0)
  else if (
    hasCurActivity &&
    hasPrevActivity &&
    hasBaseActivity &&
    prevVal < baseVal * 0.85 &&
    (paceVsPrevPct !== null ? paceVsPrevPct > 0 : curVal >= prevVal * 0.5)
  ) {
    signal = 'recovery';
    signalLabel = 'RECOVERY';
    signalBadgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    signalBorderClass = 'border-amber-500/40';
    signalColorClass = 'text-amber-400';
    signalIcon = '🟡';
    shortReason = `${meta.currentShort} pace has improved after an ${meta.prevShort} contraction`;
    detailedExplanation = `Spend contracted by ${Math.abs(momPrevVsBasePct ?? 0).toFixed(0)}% in ${meta.prevShort} from ${compact(baseVal)} ${meta.baselineShort}, but ${meta.currentShort} MTD (${compact(curVal)}) is pacing ${paceVsPrevPct !== null && paceVsPrevPct > 0 ? `+${paceVsPrevPct.toFixed(0)}% ` : ''}above ${meta.prevShort}. Rebound in progress.`;
    actionRecommendation = 'Schedule recovery call with SPOC to solidify turnaround';
    actionQueueCategory = 'Recovery';
    sparklineShape = 'recovery';
  }
  // ACCELERATING: Current activity materially above previous trend (pace >= +25%) and positive pace
  else if (
    hasCurActivity &&
    paceVsPrevPct !== null &&
    paceVsPrevPct >= 25
  ) {
    signal = 'accelerating';
    signalLabel = 'ACCELERATING';
    signalBadgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    signalBorderClass = 'border-emerald-500/40';
    signalColorClass = 'text-emerald-400';
    signalIcon = '🟢';
    shortReason = `Current activity materially outperforming trend (+${paceVsPrevPct.toFixed(0)}% pace)`;
    detailedExplanation = `${meta.currentShort} MTD of ${compact(curVal)} is tracking +${paceVsPrevPct.toFixed(0)}% above ${meta.prevShort} run-rate. Strong corporate travel demand; upsell enterprise SLA or credit terms.`;
    actionRecommendation = 'Upsell enterprise credit line or expand department coverage';
    actionQueueCategory = 'Upside / Growth';
    sparklineShape = 'accelerating';
  }
  // GROWTH: Current month trending above previous month
  else if (
    hasCurActivity &&
    hasPrevActivity &&
    (paceVsPrevPct !== null ? paceVsPrevPct > 0 : prevVal > baseVal)
  ) {
    signal = 'growth';
    signalLabel = 'GROWTH';
    signalBadgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    signalBorderClass = 'border-emerald-500/40';
    signalColorClass = 'text-emerald-400';
    signalIcon = '🟢';
    shortReason = `${meta.currentShort} MTD tracking above ${meta.prevShort} comparable period`;
    detailedExplanation = `Positive momentum: ${meta.currentShort} pace is exceeding ${meta.prevShort}. Overall account health is solid and expanding.`;
    actionRecommendation = 'Protect volume and propose preferred hotel program';
    actionQueueCategory = 'Upside / Growth';
    sparklineShape = 'growth';
  }
  // NEW ACTIVITY: Current-month activity where historical comparison is insufficient
  else if (hasCurActivity && (baseVal === 0 || isBaseMissing) && (isPrevMissing || prevVal === 0)) {
    signal = 'new_activity';
    signalLabel = 'NEW ACTIVITY';
    signalBadgeClass = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    signalBorderClass = 'border-purple-500/40';
    signalColorClass = 'text-purple-400';
    signalIcon = '🟣';
    shortReason = `First-time or newly onboarded bookings in ${meta.currentShort} (${compact(curVal)})`;
    detailedExplanation = `Account initiated fresh bookings of ${compact(curVal)} in ${meta.currentShort} with no recorded prior baseline. Onboarding follow-up recommended.`;
    actionRecommendation = 'Assign dedicated onboarding SPOC and confirm invoice details';
    actionQueueCategory = 'Active MTD';
    sparklineShape = 'growth';
  }
  // DECLINING: Confirmed sustained decline using comparable periods
  else if (
    (hasBaseActivity && prevVal !== null && prevVal < baseVal * 0.7 && (isCurZero || (paceVsPrevPct !== null && paceVsPrevPct < -20))) ||
    (record.status !== 'Matched' && baseVal >= 100000 && isCurZero)
  ) {
    signal = 'declining';
    signalLabel = 'DECLINING';
    signalBadgeClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    signalBorderClass = 'border-rose-500/40';
    signalColorClass = 'text-rose-400';
    signalIcon = '🔴';
    shortReason = 'Confirmed sustained decline across comparable periods';
    detailedExplanation = `Steep contraction observed: ${meta.prevShort} dropped to ${compact(prevVal)} from ${compact(baseVal)} in ${meta.baselineShort}, and ${meta.currentShort} run-rate continues to lag. Immediate intervention required.`;
    actionRecommendation = 'Escalate to RAM/KAM lead and review competitor displacement';
    actionQueueCategory = 'Priority Follow-up';
    sparklineShape = 'declining';
  }
  // WATCH: Momentum weakening or unmapped high-baseline account
  else if (
    (hasBaseActivity && baseVal >= 100000 && (isPrevMissing || paceVsPrevPct !== null && paceVsPrevPct < -10)) ||
    (prevVal !== null && prevVal < baseVal * 0.8)
  ) {
    signal = 'watch';
    signalLabel = 'WATCH';
    signalBadgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    signalBorderClass = 'border-amber-500/40';
    signalColorClass = 'text-amber-400';
    signalIcon = '🟠';
    shortReason = `Momentum weakening vs ${meta.baselineShort} baseline`;
    detailedExplanation = `High baseline account (${compact(baseVal)} ${meta.baselineShort}) showing softer velocity in recent periods. Requires cadence check.`;
    actionRecommendation = 'Check SPOC booking cadence and resolve any service friction';
    actionQueueCategory = 'Priority Follow-up';
    sparklineShape = 'declining';
  }
  // ACTIVE MTD: Standard active account
  else if (hasCurActivity) {
    signal = 'active_mtd';
    signalLabel = 'ACTIVE MTD';
    signalBadgeClass = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
    signalBorderClass = 'border-sky-500/40';
    signalColorClass = 'text-sky-400';
    signalIcon = '🔵';
    shortReason = `Live ${meta.currentShort} bookings (${compact(curVal)})`;
    detailedExplanation = `Healthy active bookings in ${meta.currentShort}. Normal booking pattern maintained.`;
    actionRecommendation = 'Standard monthly account review cadence';
    actionQueueCategory = 'Active MTD';
    sparklineShape = 'stable';
  }

  // Sparkline coordinates normalized to 3 data points
  // For current month, we plot the run-rate projection or raw value
  const sBase = baseVal;
  const sPrev = prevVal ?? 0;
  const sCur = curVal ?? 0;

  return {
    curVal,
    prevVal,
    baseVal,
    isCurMissing,
    isPrevMissing,
    isBaseMissing,
    momPrevVsBasePct,
    curVsFullPrevPct,
    paceVsPrevPct,
    prevSamePeriodVal,
    projectedRunRate,
    paceStatus,
    paceLabel,
    signal,
    signalLabel,
    signalBadgeClass,
    signalBorderClass,
    signalColorClass,
    signalIcon,
    shortReason,
    detailedExplanation,
    actionRecommendation,
    actionQueueCategory,
    sparklineValues: [sBase, sPrev, sCur],
    sparklineShape
  };
}
