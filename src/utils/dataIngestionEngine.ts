import * as XLSX from 'xlsx';
import {
  PortfolioRecord,
  ImportSourceType,
  ImportedRowPreview,
  RowMatchStatus,
  ImportSession
} from '../types';

/**
 * Normalizes a website domain by stripping protocol, www, paths, and trailing slashes.
 */
export function normalizeDomain(rawDomain?: string | null): string {
  if (!rawDomain) return '';
  return rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .split('?')[0]
    .trim();
}

/**
 * Normalizes an organisation name for fuzzy/exact string comparison.
 */
export function normalizeOrgName(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // remove punctuation
    .replace(/\b(pvt|ltd|private|limited|inc|corp|corporation|technologies|solutions|services|india|llc|co)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates dice coefficient string similarity (0.0 to 1.0)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeOrgName(str1);
  const s2 = normalizeOrgName(str2);
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.88;

  // Bigram token overlap
  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.slice(i, i + 2));
    }
    return bigrams;
  };

  const b1 = getBigrams(s1);
  const b2 = getBigrams(s2);
  let intersection = 0;
  b1.forEach((bg) => {
    if (b2.has(bg)) intersection++;
  });

  return (2.0 * intersection) / (b1.size + b2.size || 1);
}

/**
 * Extracts numeric value from string (handles '₹', commas, 'Lakhs', etc.)
 */
export function parseGmvValue(val: any): number | null {
  if (val == null || val === '' || val === '—' || val === '-') return null;
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }
  const str = String(val).trim().toLowerCase();
  if (str === '0' || str === '₹0' || str === 'zero') return 0;

  // Check for Lakhs / Cr multiplier
  if (str.includes('cr') || str.includes('crore')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : Math.round(num * 10000000);
  }
  if (str.includes('l') || str.includes('lakh')) {
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? null : Math.round(num * 100000);
  }

  const cleanNum = parseFloat(str.replace(/[^0-9.-]/g, ''));
  return isNaN(cleanNum) ? null : cleanNum;
}

/**
 * Date detection helper: parses any common date string and extracts the latest reporting date.
 */
export function parseReportDate(val?: string | null): Date | null {
  if (!val) return null;
  const str = String(val).trim();

  // Try standard parse
  const d = new Date(str);
  if (!isNaN(d.getTime()) && d.getFullYear() >= 2024 && d.getFullYear() <= 2030) {
    return d;
  }

  // Common Indian / Excel patterns: DD/MM/YYYY or DD-MM-YYYY
  const dmYMatch = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmYMatch) {
    const parsed = new Date(Number(dmYMatch[3]), Number(dmYMatch[2]) - 1, Number(dmYMatch[1]));
    if (!isNaN(parsed.getTime())) return parsed;
  }

  // Regex pattern for "10 Sep 2026", "10 September 2026", "Sep 10 2026"
  const textDateMatch = str.match(/(\d{1,2})?\s*([a-zA-Z]{3,9})\s*(\d{1,2})?,?\s*(\d{4})/);
  if (textDateMatch) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

/**
 * Formats a date as "DD MMM YYYY" (e.g. "10 Sep 2026")
 */
export function formatDateThrough(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Formats current timestamp as "DD MMM YYYY, HH:mm"
 */
export function formatImportTimestamp(d: Date = new Date()): string {
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${year}, ${hours}:${mins}`;
}

/**
 * Automatically detects whether an imported column or period belongs to
 * July, August, September MTD, October, etc.
 */
export function detectMonthPeriod(colOrPeriodName: string): {
  targetMonth: string;
  monthLabel: string;
  isMtd: boolean;
} {
  const str = colOrPeriodName.toLowerCase().trim();
  const isMtd = str.includes('mtd') || str.includes('month to date') || str.includes('month-to-date');

  if (str.includes('jul')) {
    return { targetMonth: 'jul', monthLabel: 'July 2026', isMtd: false };
  }
  if (str.includes('aug')) {
    return { targetMonth: 'aug', monthLabel: 'August 2026', isMtd: false };
  }
  if (str.includes('sep')) {
    return { targetMonth: 'sep', monthLabel: 'September 2026 MTD', isMtd: true };
  }
  if (str.includes('oct')) {
    return { targetMonth: 'oct', monthLabel: 'October 2026' + (isMtd ? ' MTD' : ''), isMtd };
  }
  if (str.includes('nov')) {
    return { targetMonth: 'nov', monthLabel: 'November 2026' + (isMtd ? ' MTD' : ''), isMtd };
  }
  if (str.includes('dec')) {
    return { targetMonth: 'dec', monthLabel: 'December 2026' + (isMtd ? ' MTD' : ''), isMtd };
  }
  if (str.includes('jan')) {
    return { targetMonth: 'jan', monthLabel: 'January 2027' + (isMtd ? ' MTD' : ''), isMtd };
  }

  // Default to September MTD if current context is Q3 2026
  return { targetMonth: 'sep', monthLabel: 'September 2026 MTD', isMtd: true };
}

/**
 * Matches an incoming record to the existing Radar365 portfolio in strict priority order:
 * 1. Org ID
 * 2. Domain
 * 3. Exact Organisation Name
 * 4. Fuzzy Organisation Match
 */
export function matchIncomingRecord(
  rawOrgId: string,
  rawOrgName: string,
  rawDomain: string,
  existingPortfolio: PortfolioRecord[]
): {
  matchedRecord: PortfolioRecord | null;
  matchStrategy: 'Org ID' | 'Domain' | 'Exact Name' | 'Fuzzy Name' | 'None';
  confidenceScore: number;
} {
  const normOrgId = rawOrgId.trim();
  const normDomain = normalizeDomain(rawDomain);
  const normName = normalizeOrgName(rawOrgName);

  // 1. Priority: Org ID (if valid and not NA)
  if (normOrgId && normOrgId !== 'NA' && normOrgId !== '—' && normOrgId !== '-') {
    const match = existingPortfolio.find((r) => r.org.trim() === normOrgId);
    if (match) {
      return { matchedRecord: match, matchStrategy: 'Org ID', confidenceScore: 100 };
    }
  }

  // 2. Priority: Normalized Domain
  if (normDomain && normDomain !== 'na' && normDomain !== '—' && normDomain !== '-') {
    const match = existingPortfolio.find((r) => normalizeDomain(r.domain) === normDomain);
    if (match) {
      return { matchedRecord: match, matchStrategy: 'Domain', confidenceScore: 95 };
    }
  }

  // 3. Priority: Exact Organisation Name
  if (normName) {
    const match = existingPortfolio.find((r) => normalizeOrgName(r.orgname) === normName);
    if (match) {
      return { matchedRecord: match, matchStrategy: 'Exact Name', confidenceScore: 90 };
    }
  }

  // 4. Priority: Fuzzy Organisation Match
  if (normName && normName.length >= 3) {
    let bestMatch: PortfolioRecord | null = null;
    let highestSim = 0;

    for (const r of existingPortfolio) {
      const sim = stringSimilarity(normName, r.orgname);
      if (sim > highestSim) {
        highestSim = sim;
        bestMatch = r;
      }
    }

    if (bestMatch && highestSim >= 0.70) {
      const score = Math.round(highestSim * 100);
      return {
        matchedRecord: bestMatch,
        matchStrategy: 'Fuzzy Name',
        confidenceScore: score
      };
    }
  }

  return { matchedRecord: null, matchStrategy: 'None', confidenceScore: 0 };
}

/**
 * Builds the comprehensive Preview & Validation structure for incoming rows.
 */
export function buildImportPreview(
  rawRows: Array<{
    org?: string;
    orgname?: string;
    domain?: string;
    gmv?: any;
    month?: string;
    date?: string;
    channel?: string;
  }>,
  existingPortfolio: PortfolioRecord[],
  defaultTargetMonth = 'sep',
  defaultDataThroughDate = '10 Sep 2026'
): {
  previews: ImportedRowPreview[];
  summary: {
    totalDetected: number;
    matchedCount: number;
    reviewRequiredCount: number;
    duplicatesCount: number;
    conflictsCount: number;
    invalidCount: number;
    dataThroughDate: string;
  };
} {
  const previews: ImportedRowPreview[] = [];
  const seenKeys = new Set<string>();
  let highestDateFound: Date | null = parseReportDate(defaultDataThroughDate);

  let matchedCount = 0;
  let reviewRequiredCount = 0;
  let duplicatesCount = 0;
  let conflictsCount = 0;
  let invalidCount = 0;

  rawRows.forEach((row, idx) => {
    const rawOrgId = String(row.org || '').trim();
    const rawOrgName = String(row.orgname || '').trim();
    const rawDomain = String(row.domain || '').trim();
    const parsedGmv = parseGmvValue(row.gmv);

    // Detect month
    const detected = row.month ? detectMonthPeriod(row.month) : detectMonthPeriod(defaultTargetMonth);
    const targetMonth = detected.targetMonth;
    const isMtd = detected.isMtd;

    // Check date in row
    if (row.date) {
      const parsedD = parseReportDate(row.date);
      if (parsedD && (!highestDateFound || parsedD > highestDateFound)) {
        highestDateFound = parsedD;
      }
    }

    const { matchedRecord, matchStrategy, confidenceScore } = matchIncomingRecord(
      rawOrgId,
      rawOrgName,
      rawDomain,
      existingPortfolio
    );

    const rowKey = `${rawOrgId || 'NOID'}-${rawDomain || rawOrgName || idx}`;
    const isDuplicate = seenKeys.has(rowKey);
    seenKeys.add(rowKey);

    let status: RowMatchStatus = 'Ready';
    let statusReason = 'Ready to update';
    let conflictDetails: ImportedRowPreview['conflictDetails'] = undefined;

    if (parsedGmv === null) {
      status = 'Invalid';
      statusReason = 'Missing or unparseable GMV amount';
      invalidCount++;
    } else if (isDuplicate) {
      status = 'Invalid';
      statusReason = 'Duplicate entry in imported source';
      duplicatesCount++;
    } else if (!matchedRecord) {
      status = 'Unmatched';
      statusReason = 'New / Unmatched organisation (not in portfolio)';
    } else if (confidenceScore < 85) {
      status = 'Review Required';
      statusReason = `Low confidence match (${confidenceScore}%) via ${matchStrategy}`;
      reviewRequiredCount++;
    } else {
      // Check existing value for conflict detection
      let existingVal: number | null = null;
      if (targetMonth === 'jul') existingVal = matchedRecord.jul;
      else if (targetMonth === 'aug') existingVal = matchedRecord.aug;
      else if (targetMonth === 'sep') existingVal = matchedRecord.sep;
      else if (matchedRecord.dynamicMonths) {
        existingVal = matchedRecord.dynamicMonths[targetMonth] ?? null;
      }

      if (existingVal !== null && existingVal !== parsedGmv) {
        status = 'Conflict';
        const diff = parsedGmv - existingVal;
        statusReason = `Existing ${existingVal.toLocaleString('en-IN')} vs incoming ${parsedGmv.toLocaleString('en-IN')}`;
        conflictDetails = {
          existingGmv: existingVal,
          incomingGmv: parsedGmv,
          diff,
          resolution: 'Replace' // default per requirement
        };
        conflictsCount++;
      } else if (existingVal === parsedGmv) {
        status = 'Unchanged';
        statusReason = 'Value identical to current portfolio record';
      } else {
        status = 'Updated';
        statusReason = `Will populate ${detected.monthLabel}`;
      }
      matchedCount++;
    }

    previews.push({
      id: `row-${idx}-${Date.now()}`,
      rawOrgId,
      rawOrgName,
      rawDomain,
      rawGmv: parsedGmv,
      rawMonth: row.month || detected.monthLabel,
      rawDate: row.date || defaultDataThroughDate,
      matchedRecord,
      matchStrategy,
      confidenceScore,
      conflictDetails,
      status,
      statusReason,
      targetMonth,
      isMtd
    });
  });

  const finalDataThroughDate = highestDateFound
    ? formatDateThrough(highestDateFound)
    : defaultDataThroughDate;

  return {
    previews,
    summary: {
      totalDetected: rawRows.length,
      matchedCount,
      reviewRequiredCount,
      duplicatesCount,
      conflictsCount,
      invalidCount,
      dataThroughDate: finalDataThroughDate
    }
  };
}

/**
 * Commits verified preview rows into the existing portfolio dataset.
 * Adheres strictly to the rule: missing account in a fresh file != ₹0 GMV!
 */
export function commitImportedRows(
  existingPortfolio: PortfolioRecord[],
  previews: ImportedRowPreview[],
  dataThroughDate: string,
  fileName: string,
  sourceType: ImportSourceType,
  importedBy = 'Nishant Chawla'
): {
  updatedPortfolio: PortfolioRecord[];
  session: ImportSession;
} {
  // Deep clone existing portfolio as snapshot for rollback
  const rollbackSnapshot: PortfolioRecord[] = JSON.parse(JSON.stringify(existingPortfolio));

  const updatedPortfolio = [...existingPortfolio];
  let valuesChanged = 0;
  let successfulMatches = 0;
  let unmatchedRows = 0;

  previews.forEach((p) => {
    if (p.status === 'Invalid') return;
    if (!p.matchedRecord || p.status === 'Unmatched') {
      unmatchedRows++;
      return;
    }

    // Find the record in updatedPortfolio
    const targetIdx = updatedPortfolio.findIndex(
      (r) => r.org === p.matchedRecord!.org && r.domain === p.matchedRecord!.domain
    );

    if (targetIdx === -1) return;

    const currentRecord = { ...updatedPortfolio[targetIdx] };
    const month = p.targetMonth;
    let newGmv = p.rawGmv;

    // Handle resolution if conflict
    if (p.conflictDetails) {
      if (p.conflictDetails.resolution === 'Keep Existing') {
        return; // do not overwrite
      }
      if (p.conflictDetails.resolution === 'Add / Merge') {
        const base = p.conflictDetails.existingGmv || 0;
        newGmv = base + (p.rawGmv || 0);
      }
    }

    let changed = false;
    if (month === 'jul') {
      if (currentRecord.jul !== newGmv && newGmv !== null) {
        currentRecord.jul = newGmv;
        changed = true;
      }
    } else if (month === 'aug') {
      if (currentRecord.aug !== newGmv) {
        currentRecord.aug = newGmv;
        changed = true;
      }
    } else if (month === 'sep') {
      if (currentRecord.sep !== newGmv) {
        currentRecord.sep = newGmv;
        changed = true;
      }
    } else {
      // Dynamic Month handling (e.g. oct, nov)
      if (!currentRecord.dynamicMonths) {
        currentRecord.dynamicMonths = {};
      }
      if (currentRecord.dynamicMonths[month] !== newGmv) {
        currentRecord.dynamicMonths[month] = newGmv;
        changed = true;
      }
    }

    if (changed) {
      // Update match status and total
      if (currentRecord.aug !== null || currentRecord.sep !== null) {
        currentRecord.status = 'Matched';
      }
      currentRecord.lastUpdatedThrough = dataThroughDate;
      currentRecord.lastImportedAt = formatImportTimestamp();
      currentRecord.sourceFile = fileName;

      // Recompute total known
      let dynTotal = 0;
      if (currentRecord.dynamicMonths) {
        Object.values(currentRecord.dynamicMonths).forEach((v) => {
          if (v != null) dynTotal += v;
        });
      }
      currentRecord.total = (currentRecord.aug || 0) + (currentRecord.sep || 0) + dynTotal;

      updatedPortfolio[targetIdx] = currentRecord;
      valuesChanged++;
      successfulMatches++;
    } else {
      successfulMatches++;
    }
  });

  const session: ImportSession = {
    importId: `imp-${Date.now()}`,
    importedAt: formatImportTimestamp(),
    dataThroughDate,
    fileName,
    sourceType,
    totalRows: previews.length,
    successfulMatches,
    unmatchedRows,
    reviewRequiredCount: previews.filter((p) => p.status === 'Review Required').length,
    conflictsCount: previews.filter((p) => p.status === 'Conflict').length,
    valuesChanged,
    importedBy,
    rollbackSnapshot
  };

  return { updatedPortfolio, session };
}

/**
 * Parses raw text from paste or CSV / TSV with automatic delimiter and header detection.
 */
export function parsePastedOrCsvText(text: string): Array<{
  org?: string;
  orgname?: string;
  domain?: string;
  gmv?: any;
  month?: string;
  date?: string;
}> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return [];

  // 1. Check for pipe-separated format:
  // "599324 | ORO SOFTWARE PRIVATE LIMITED | orolabs.ai | 556169 | Sep 2026"
  if (lines[0].includes('|')) {
    return lines.map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      return {
        org: parts[0] || '',
        orgname: parts[1] || '',
        domain: parts[2] || '',
        gmv: parts[3] || '',
        month: parts[4] || ''
      };
    });
  }

  // 2. Check for tab-separated (e.g. copied directly from Excel / Google Sheets)
  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(',') ? ',' : lines[0].includes(';') ? ';' : ' ';

  // If first line contains headers (like "org id", "company", "gmv")
  const firstLineLower = lines[0].toLowerCase();
  const hasHeader =
    firstLineLower.includes('org') ||
    firstLineLower.includes('company') ||
    firstLineLower.includes('domain') ||
    firstLineLower.includes('gmv') ||
    firstLineLower.includes('spend') ||
    firstLineLower.includes('month');

  const dataLines = hasHeader ? lines.slice(1) : lines;

  // Header indices
  let orgIdx = 0;
  let nameIdx = 1;
  let domainIdx = 2;
  let gmvIdx = 3;
  let monthIdx = 4;

  if (hasHeader) {
    const headers = lines[0].split(delimiter).map((h) => h.toLowerCase().trim());
    headers.forEach((h, i) => {
      if (h.includes('org') || h.includes('id')) orgIdx = i;
      else if (h.includes('company') || h.includes('organisation') || h.includes('account') || h.includes('name')) nameIdx = i;
      else if (h.includes('domain') || h.includes('website') || h.includes('url')) domainIdx = i;
      else if (h.includes('gmv') || h.includes('spend') || h.includes('value') || h.includes('revenue')) gmvIdx = i;
      else if (h.includes('month') || h.includes('period') || h.includes('date')) monthIdx = i;
    });
  }

  return dataLines.map((line) => {
    const cols = line.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    return {
      org: cols[orgIdx] || '',
      orgname: cols[nameIdx] || '',
      domain: cols[domainIdx] || '',
      gmv: cols[gmvIdx] || '',
      month: cols[monthIdx] || ''
    };
  });
}

/**
 * Parses Excel XLSX / XLS array buffer into structured rows
 */
export function parseExcelArrayBuffer(buffer: ArrayBuffer): Array<{
  org?: string;
  orgname?: string;
  domain?: string;
  gmv?: any;
  month?: string;
  date?: string;
}> {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return [];

  const ws = wb.Sheets[sheetName];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (rows.length === 0) return [];

  // Match column names dynamically
  return rows.map((r) => {
    const keys = Object.keys(r);

    let org = '';
    let orgname = '';
    let domain = '';
    let gmv: any = '';
    let month = '';
    let date = '';

    keys.forEach((k) => {
      const kl = k.toLowerCase().trim();
      const val = r[k];

      if (kl === 'org' || kl.includes('org id') || kl.includes('orgid') || kl.includes('organisation id')) {
        org = String(val);
      } else if (kl.includes('company') || kl.includes('organisation') || kl.includes('orgname') || kl.includes('account')) {
        orgname = String(val);
      } else if (kl.includes('domain') || kl.includes('website') || kl.includes('url')) {
        domain = String(val);
      } else if (kl.includes('gmv') || kl.includes('spend') || kl.includes('revenue') || kl.includes('booking')) {
        gmv = val;
      } else if (kl.includes('month') || kl.includes('period')) {
        month = String(val);
      } else if (kl.includes('date')) {
        date = String(val);
      }
    });

    return { org, orgname, domain, gmv, month, date };
  });
}
