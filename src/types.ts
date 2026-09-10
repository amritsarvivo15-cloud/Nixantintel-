export type MatchStatus = 'Matched' | 'Unmatched' | 'No Org ID';
export type ActionBucket = 'Priority follow-up' | 'Recovery' | 'Upside' | 'Active MTD' | 'Maintain';
export type DeviceDisplayMode = 'fold-cover' | 'fold-unfolded' | 'auto';

export interface PortfolioRecord {
  org: string;
  domain: string;
  channel: string;
  orgname: string;
  jul: number;
  aug: number | null;
  sep: number | null;
  status: MatchStatus;
  total: number | null;
  dynamicMonths?: Record<string, number | null>;
  lastUpdatedThrough?: string;
  lastImportedAt?: string;
  sourceFile?: string;
}

export interface DerivedPortfolioRecord extends PortfolioRecord {
  deltaPct: number | null;
  actionBucket: ActionBucket;
  actionClass: string;
}

export interface PortfolioKPIs {
  julTotal: number;
  augTotal: number;
  sepTotal: number;
  knownTotal: number;
  matchedCount: number;
  growth: number | null;
  matchedJulTotal: number;
  uniqueOrgCount: number;
  totalRows: number;
  dynamicMonthTotals?: Record<string, number>;
}

export type SortKey =
  | 'idx'
  | 'org'
  | 'domain'
  | 'orgname'
  | 'channel'
  | 'jul'
  | 'aug'
  | 'sep'
  | 'deltaPct'
  | 'total'
  | 'status'
  | 'actionBucket'
  | string;

export type SortDir = 1 | -1;

export type ImportSourceType =
  | 'CSV'
  | 'Excel / XLSX'
  | 'Pasted Text'
  | 'Copied Table'
  | 'Screenshot / Image'
  | 'PDF'
  | 'JSON'
  | 'Manual Single'
  | 'Bulk Manual';

export type RowMatchStatus =
  | 'Ready'
  | 'Updated'
  | 'Unchanged'
  | 'Conflict'
  | 'Unmatched'
  | 'Review Required'
  | 'Invalid';

export interface ImportedRowPreview {
  id: string;
  rawOrgId: string;
  rawOrgName: string;
  rawDomain: string;
  rawGmv: number | null;
  rawMonth: string;
  rawDate: string;
  matchedRecord: PortfolioRecord | null;
  matchStrategy: 'Org ID' | 'Domain' | 'Exact Name' | 'Fuzzy Name' | 'None';
  confidenceScore: number;
  conflictDetails?: {
    existingGmv: number | null;
    incomingGmv: number;
    diff: number;
    resolution: 'Replace' | 'Keep Existing' | 'Add / Merge' | 'Review';
  };
  status: RowMatchStatus;
  statusReason: string;
  targetMonth: string;
  isMtd: boolean;
}

export interface ImportSession {
  importId: string;
  importedAt: string;
  dataThroughDate: string;
  fileName: string;
  sourceType: ImportSourceType;
  totalRows: number;
  successfulMatches: number;
  unmatchedRows: number;
  reviewRequiredCount: number;
  conflictsCount: number;
  valuesChanged: number;
  importedBy: string;
  rollbackSnapshot: PortfolioRecord[];
}

export interface FreshnessState {
  dataThroughDate: string;
  importedAt: string;
  lastSourceName: string;
  lastSourceType: ImportSourceType;
  status: 'fresh' | 'stale' | 'outdated';
}

export interface FilterOptions {
  search: string;
  channel: string;
  status: string;
  action: string;
  gmvfilter: '' | '100k' | '250k' | 'zero';
}

export interface SpocContact {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  department: string;
  roleType: 'Primary SPOC' | 'Procurement Lead' | 'Finance / CFO' | 'Travel Desk Admin';
  preferredChannel: 'Email' | 'Phone Call' | 'WhatsApp';
  verified: boolean;
  notes?: string;
}

export interface OrgStrategyApproach {
  healthScore: number; // 0 to 100
  urgency: 'Immediate (Within 24h)' | 'High Priority' | 'Medium Priority' | 'Cadence Retention';
  urgencyColor: string;
  approachTitle: string;
  approachSummary: string;
  recommendedPitch: string;
  talkingPoints: string[];
  keyRiskFactors: string[];
  commercialOffer: string;
  recommendedMeetingCadence: string;
}

export interface OrgFullProfile {
  record: DerivedPortfolioRecord;
  spocs: SpocContact[];
  strategy: OrgStrategyApproach;
  lastTouchpoint: {
    date: string;
    summary: string;
    channel: string;
  };
  industry: string;
  employeeTier: string;
  headquarters: string;
  contractStatus: 'Active Corporate' | 'Under Review' | 'Notice of Pause' | 'Expansion Pilot';
}

