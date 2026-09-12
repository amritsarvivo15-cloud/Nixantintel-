export type MatchStatus = 'Matched' | 'Unmatched' | 'No Org ID';
export type ActionBucket = 'Priority follow-up' | 'Recovery' | 'Upside' | 'Active MTD' | 'Maintain' | 'Dormant';
export type PriorityActionClassification = 'Priority Follow-up' | 'Recovery' | 'Upside' | 'Active MTD' | 'Normal' | 'Dormant';
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
  | 'pace'
  | 'signal'
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

export interface AccountQuickNote {
  note: string;
  updatedAt: string;
  followUpDate?: string | null;
  priority?: string | null;
  tags?: string[];
}

export type QuickNotesMap = Record<string, AccountQuickNote>;

export interface FilterOptions {
  search: string;
  channel: string;
  status: string;
  action: string;
  gmvfilter: '' | '100k' | '250k' | 'zero';
  noteFilter?: '' | 'has_note' | 'no_note';
  tagFilter?: string;
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
  // Actionable battlecard sections:
  opportunity?: string;
  whyNow?: string;
  commercialLever?: string;
  riskObjection?: string;
  nextBestAction?: string;
  compoundStatus?: string;
  compoundStatusReason?: string;
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

// ─────────────────────────────────────────────────────────────
// 16. LEAD FUNNEL & FUTURE MONITORING TYPES
// ─────────────────────────────────────────────────────────────

export type FunnelStage =
  | 'NEW LEAD'
  | 'CONTACTED'
  | 'CONNECTED'
  | 'DEMO SCHEDULED'
  | 'DEMO DONE'
  | 'FOLLOW-UP'
  | 'INTERESTED'
  | 'COMMERCIAL / CREDIT DISCUSSION'
  | 'ONBOARDING'
  | 'ORG CREATED'
  | 'ACTIVATED'
  | 'GMV STARTED'
  | 'ON HOLD'
  | 'NOT INTERESTED'
  | 'LOST';

export type LeadPriority = 'Hot' | 'Warm' | 'Normal' | 'Low';

export interface LeadHistoryEntry {
  id: string;
  stage: FunnelStage;
  date: string; // e.g. '08 Sep 2026'
  timestamp: number;
  note: string;
  author?: string;
  action?: string;
}

export interface Lead {
  id: string;
  companyName: string;
  domain: string;
  contactName: string;
  designation: string;
  mobile: string;
  email: string;
  city: string;
  industry: string;
  estimatedMonthlySpend: number; // in INR
  expectedGmv: number; // in INR
  channel: string; // 'SME+' | 'SEM' | 'SMEV' | 'Enterprise'
  leadSource: string; // 'Outbound' | 'Inbound' | 'Referral' | 'Event' | 'Cold Outreach' | 'LinkedIn' | 'Partner'
  demoDate?: string;
  nextFollowUpDate: string; // YYYY-MM-DD or 'DD MMM YYYY'
  priority: LeadPriority;
  owner: string; // Account Manager name
  quickNote: string;
  // Optional verification identifiers
  existingOrgId?: string;
  gstin?: string;
  pan?: string;
  linkedinUrl?: string;
  stage: FunnelStage;
  history: LeadHistoryEntry[];
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  convertedOrgId?: string;
  aiRecommendedPriority?: LeadPriority;
  aiRecommendationReason?: string;
}

export type FunnelIntelligenceGroup =
  | 'all'
  | 'today'
  | 'overdue'
  | 'upcoming'
  | 'demo_pending'
  | 'demo_done'
  | 'ready_onboarding'
  | 'no_activity'
  | 'converted';

export type AppNavTab =
  | 'dashboard'
  | 'portfolio'
  | 'funnel'
  | 'signals'
  | 'opportunities'
  | 'zeta';

export interface LeadDuplicateMatch {
  type: 'Portfolio Account' | 'Existing Lead';
  matchedOn: 'Domain' | 'Company Name' | 'Org ID' | 'GSTIN' | 'Email Domain';
  identifier: string;
  recordName: string;
  details: string;
  recordId: string;
  status?: string;
}

export interface LeadDuplicateCheckResult {
  hasDuplicate: boolean;
  matches: LeadDuplicateMatch[];
}

