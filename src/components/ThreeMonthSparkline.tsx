import React from 'react';
import { Account3MStats, DynamicMonthMeta } from '../utils/gmv3MonthIntelligence';
import { compact } from '../utils/formatters';

interface ThreeMonthSparklineProps {
  stats: Account3MStats;
  meta: DynamicMonthMeta;
  width?: number;
  height?: number;
}

export const ThreeMonthSparkline: React.FC<ThreeMonthSparklineProps> = ({
  stats,
  meta,
  width = 54,
  height = 20
}) => {
  const [b, p, c] = stats.sparklineValues;

  // Max value to scale against
  const maxVal = Math.max(b, p, c, 1);
  const paddingX = 4;
  const paddingY = 4;
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingY * 2;

  // X coords for 3 equidistant points
  const x0 = paddingX;
  const x1 = paddingX + usableWidth / 2;
  const x2 = paddingX + usableWidth;

  // Y coords (SVG inverted: 0 is top, height is bottom)
  const getY = (val: number) => {
    if (maxVal <= 0) return height / 2;
    const ratio = Math.min(Math.max(val / maxVal, 0), 1);
    return paddingY + (1 - ratio) * usableHeight;
  };

  const y0 = getY(b);
  const y1 = getY(p);
  const y2 = getY(c);

  // Stroke color based on 3M signal
  let strokeColor = '#94a3b8'; // default slate
  let fillColor = '#94a3b8';
  let arrowSymbol = '→';

  if (stats.signal === 'accelerating' || stats.signal === 'growth') {
    strokeColor = '#10b981'; // emerald-500
    fillColor = '#10b981';
    arrowSymbol = '↗';
  } else if (stats.signal === 'recovery') {
    strokeColor = '#FFC600'; // Radar365 gold
    fillColor = '#FFC600';
    arrowSymbol = '↗';
  } else if (stats.signal === 'declining') {
    strokeColor = '#f43f5e'; // rose-500
    fillColor = '#f43f5e';
    arrowSymbol = '↘';
  } else if (stats.signal === 'watch') {
    strokeColor = '#f97316'; // orange-500
    fillColor = '#f97316';
    arrowSymbol = '↘';
  } else if (stats.signal === 'active_mtd' || stats.signal === 'new_activity') {
    strokeColor = '#38bdf8'; // sky-400
    fillColor = '#38bdf8';
    arrowSymbol = '↗';
  } else if (stats.signal === 'dormant') {
    strokeColor = '#64748b'; // slate-500
    fillColor = '#64748b';
    arrowSymbol = '—';
  }

  const tooltipText = `${meta.baselineShort}: ${stats.baseVal > 0 ? compact(stats.baseVal) : '—'} → ${
    meta.prevShort
  }: ${stats.isPrevMissing ? '—' : compact(stats.prevVal)} → ${meta.currentShort} MTD: ${
    stats.isCurMissing ? '—' : compact(stats.curVal)
  }\nTrend: ${stats.signalLabel} (${stats.shortReason})\nPace: ${stats.paceLabel}`;

  return (
    <div
      className="inline-flex items-center gap-1 cursor-help group/spark select-none"
      title={tooltipText}
    >
      <span
        className="text-[11px] font-mono font-bold shrink-0"
        style={{ color: strokeColor }}
      >
        {arrowSymbol}
      </span>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Connection polyline */}
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={`${x0},${y0} ${x1},${y1} ${x2},${y2}`}
        />

        {/* 3 micro circle nodes */}
        <circle cx={x0} cy={y0} r="2" fill={strokeColor} opacity="0.6" />
        <circle cx={x1} cy={y1} r="2" fill={strokeColor} opacity="0.8" />
        <circle
          cx={x2}
          cy={y2}
          r="2.5"
          fill={fillColor}
          stroke="var(--panel-solid)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
