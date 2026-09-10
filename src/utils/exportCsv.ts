import { DerivedPortfolioRecord } from '../types';

/**
 * Export portfolio records to a CSV file downloadable in the browser.
 */
export const exportPortfolioToCsv = (
  records: DerivedPortfolioRecord[],
  filename: string = 'nixant_portfolio_accounts.csv'
) => {
  if (!records || records.length === 0) return;

  const headers = [
    'Index',
    'Org ID',
    'Domain',
    'Organisation Name',
    'Channel',
    'July GMV (INR)',
    'August GMV (INR)',
    'September MTD (INR)',
    'Aug vs Jul Delta (%)',
    'Known Total (INR)',
    'Match Status',
    'Action Bucket'
  ];

  const rows = records.map((r, i) => [
    i + 1,
    r.org,
    r.domain,
    `"${(r.orgname || '').replace(/"/g, '""')}"`,
    r.channel,
    r.jul ?? 0,
    r.aug ?? '',
    r.sep ?? '',
    r.deltaPct != null ? r.deltaPct.toFixed(1) : '',
    r.total ?? '',
    r.status,
    `"${r.actionBucket}"`
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM for Microsoft Excel compatibility
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
