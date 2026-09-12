import {
  PortfolioRecord,
  DerivedPortfolioRecord,
  PortfolioKPIs,
  ActionBucket
} from '../types';

export const INR = (n: number | null | undefined): string => {
  if (n == null) return '—';
  return '₹' + Math.round(n).toLocaleString('en-IN');
};

export const compact = (n: number | null | undefined): string => {
  if (n == null) return '—';
  const abs = Math.abs(n);
  if (abs >= 10000000) return '₹' + (n / 10000000).toFixed(2) + ' Cr';
  if (abs >= 100000) return '₹' + (n / 100000).toFixed(2) + ' L';
  return INR(n);
};

export const uniqueRows = <T extends { org: string }>(rows: T[]): T[] => {
  const seen = new Set<string>();
  return rows.filter((r) => {
    if (r.org === 'NA') return true;
    if (seen.has(r.org)) return false;
    seen.add(r.org);
    return true;
  });
};

export const deriveRecord = (r: PortfolioRecord): DerivedPortfolioRecord => {
  let deltaPct: number | null = null;
  if (r.status === 'Matched' && r.jul > 0 && r.aug != null) {
    deltaPct = ((r.aug - r.jul) / r.jul) * 100;
  }

  let actionBucket: ActionBucket = 'Maintain';
  let actionClass = 'aMaintain';

  const sep = r.sep ?? 0;
  const aug = r.aug;
  const jul = r.jul || 0;

  // Unmatched or missing with high baseline requires priority follow-up
  if (r.status !== 'Matched' && jul >= 100000) {
    actionBucket = 'Priority follow-up';
    actionClass = 'aFollow';
  }
  // Recovery: August contracted significantly but September shows rebound or recovery pacing
  else if (r.status === 'Matched' && jul >= 100000 && aug != null && aug < jul * 0.65) {
    actionBucket = 'Recovery';
    actionClass = 'aRecovery';
  }
  // Upside / Accelerating: August expansion or high September pace
  else if (r.status === 'Matched' && jul > 0 && ((aug != null && aug > jul * 1.25) || (sep > 0 && sep > jul * 0.5))) {
    actionBucket = 'Upside';
    actionClass = 'aUpside';
  }
  // Active MTD: Booking activity in current month
  else if (r.status === 'Matched' && sep > 0) {
    actionBucket = 'Active MTD';
    actionClass = 'aActive';
  }
  // Dormant: Historical spend with zero bookings across recent months
  else if (jul > 0 && (aug == null || aug === 0) && sep === 0) {
    actionBucket = 'Dormant';
    actionClass = 'aDormant';
  }

  return {
    ...r,
    deltaPct,
    actionBucket,
    actionClass
  };
};

export const computeTotals = (rows: DerivedPortfolioRecord[]): PortfolioKPIs => {
  const u = uniqueRows(rows);
  const matched = u.filter((r) => r.status === 'Matched');

  const julTotal = u.reduce((s, r) => s + (r.jul || 0), 0);
  const augTotal = matched.reduce((s, r) => s + (r.aug || 0), 0);
  const sepTotal = matched.reduce((s, r) => s + (r.sep || 0), 0);
  const knownTotal = matched.reduce((s, r) => s + (r.total || 0), 0);
  const matchedJulTotal = matched.reduce((s, r) => s + (r.jul || 0), 0);
  const growth = matchedJulTotal > 0 ? ((augTotal / matchedJulTotal) - 1) * 100 : null;
  const uniqueOrgCount = u.filter((r) => r.org !== 'NA').length;

  const dynamicMonthTotals: Record<string, number> = {};
  matched.forEach((r) => {
    if (r.dynamicMonths) {
      Object.entries(r.dynamicMonths).forEach(([m, val]) => {
        if (val != null) {
          dynamicMonthTotals[m] = (dynamicMonthTotals[m] || 0) + val;
        }
      });
    }
  });

  return {
    julTotal,
    augTotal,
    sepTotal,
    knownTotal,
    matchedCount: matched.length,
    growth,
    matchedJulTotal,
    uniqueOrgCount,
    totalRows: rows.length,
    dynamicMonthTotals
  };
};

export const copyText = async (text: string): Promise<void> => {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fallback below
    }
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    ta.remove();
  }
};

export const exportToCsv = (rows: DerivedPortfolioRecord[], filename = 'gmv_portfolio_v2_filtered.csv'): void => {
  const cols = [
    'Org ID',
    'Domain',
    'Organisation',
    'Channel',
    'Jul GMV',
    'Aug GMV',
    'Sep MTD',
    'Aug Delta %',
    'Known Total',
    'Match Status',
    'Action'
  ];

  const dataRows = rows.map((r) => [
    r.org,
    r.domain,
    r.orgname,
    r.channel,
    r.jul,
    r.aug ?? '',
    r.sep ?? '',
    r.deltaPct != null ? r.deltaPct.toFixed(1) : '',
    r.total ?? '',
    r.status,
    r.actionBucket
  ]);

  const csv =
    '\uFEFF' +
    [cols, ...dataRows]
      .map((row) =>
        row
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatNoteDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate();
    const month = d.toLocaleString('en-US', { month: 'short' });
    return `Edited ${day} ${month}`;
  } catch {
    return '';
  }
};

export const getOrgDisplayName = (r: PortfolioRecord | DerivedPortfolioRecord): string => {
  if (!r.orgname || r.orgname === '—' || r.orgname.trim() === '') {
    return `Unknown account · #${r.org}`;
  }
  return r.orgname;
};


