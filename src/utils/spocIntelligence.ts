import { DerivedPortfolioRecord, OrgFullProfile, SpocContact, OrgStrategyApproach, QuickNotesMap, AccountQuickNote } from '../types';
import { INR } from './formatters';

export const QUICK_NOTES_STORAGE_KEY = 'nixant_portfolio_quick_notes_v1';

export interface AccountStatusIntelligence {
  status: 'Active · Needs Review' | 'Recovery Opportunity' | 'Growing' | 'Dormant' | 'Upside' | 'Data Incomplete' | 'Active MTD' | 'Maintain';
  badgeClass: string;
  reason: string;
}

/**
 * Intelligent account-status classification supporting compound statuses:
 * - Active · Needs Review
 * - Recovery Opportunity
 * - Growing
 * - Dormant
 * - Upside
 * - Data Incomplete
 */
export function getAccountIntelligenceStatus(record: {
  org: string;
  domain: string;
  status: string;
  jul: number;
  aug: number | null;
  sep: number | null;
  deltaPct?: number | null;
  actionBucket?: string;
}): AccountStatusIntelligence {
  const jul = record.jul || 0;
  const aug = record.aug;
  const sep = record.sep ?? 0;
  const hasSepActivity = sep > 0;

  // 1. Data Incomplete (missing Org ID or unmapped with no baseline)
  if (record.org === 'NA' || record.status === 'No Org ID' || (record.status !== 'Matched' && jul === 0 && aug === null && sep === 0)) {
    return {
      status: 'Data Incomplete',
      badgeClass: 'bg-slate-800/80 text-slate-300 border border-dashed border-slate-600',
      reason: 'Missing verified legal entity mapping or Org ID. Requires PAN / GST cross-referencing.'
    };
  }

  // 2. Active · Needs Review:
  // Activity exists in September, BUT available GMV signals indicate material weakness,
  // broken matching in August (like Singan Projects Ltd Org 462472), or run-rate far below baseline.
  if (hasSepActivity) {
    const isAugustMissingWithHighBaseline = (aug === null || record.status !== 'Matched') && jul >= 100000;
    const isAugustSteepDrop = aug !== null && jul > 0 && aug < jul * 0.65;
    const isSepSevereUnderperformance = jul >= 100000 && sep < jul * 0.25; // 8-day pace < 25% of baseline

    if (isAugustMissingWithHighBaseline || isAugustSteepDrop || isSepSevereUnderperformance) {
      let detail = 'Booking activity detected in September, but July baseline was significantly higher with an August tracking gap.';
      if (isAugustMissingWithHighBaseline) {
        detail = `Recorded September bookings (${INR(sep)}), but August has no match and September volume is pacing far below July baseline (${INR(jul)}). Avoid treating as unambiguously healthy.`;
      } else if (isAugustSteepDrop) {
        detail = `September bookings have started (${INR(sep)}), but August suffered a steep contraction from July (${INR(jul)}). Requires proactive account management.`;
      }
      return {
        status: 'Active · Needs Review',
        badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
        reason: detail
      };
    }
  }

  // 3. Recovery Opportunity
  if ((jul >= 100000 && (aug === null || record.status !== 'Matched')) || (aug !== null && jul >= 100000 && aug < jul * 0.65)) {
    if (!hasSepActivity) {
      return {
        status: 'Recovery Opportunity',
        badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold',
        reason: `Significant July volume (${INR(jul)}) has unmapped or contracted in August without recent September bookings.`
      };
    }
  }

  // 4. Growing
  if (aug !== null && jul > 0 && aug > jul * 1.25) {
    const growth = Math.round(((aug - jul) / jul) * 100);
    return {
      status: 'Growing',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
      reason: `Expanding corporate travel volume (+${growth}% MoM in August). Prime candidate for multi-team scale.`
    };
  }

  // 5. Upside
  if (record.actionBucket === 'Upside' || (aug !== null && aug >= 250000 && jul > 0 && aug >= jul * 1.15)) {
    return {
      status: 'Upside',
      badgeClass: 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold',
      reason: 'High potential for annual corporate contracting, credit line extension, and hotel attachment.'
    };
  }

  // 6. Active MTD (Unambiguously healthy)
  if (hasSepActivity && record.status === 'Matched') {
    return {
      status: 'Active MTD',
      badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold',
      reason: `Consistent booking flow with ${INR(sep)} recorded in September MTD. Operations running smoothly.`
    };
  }

  // 7. Dormant
  if (jul > 0 && (aug === null || aug === 0) && sep === 0) {
    return {
      status: 'Dormant',
      badgeClass: 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60',
      reason: `Zero booking activity since July (${INR(jul)}). Requires re-engagement outreach to identify blockers.`
    };
  }

  return {
    status: 'Maintain',
    badgeClass: 'bg-zinc-800/70 text-zinc-300 border border-zinc-700/50',
    reason: 'Stable booking cadence with steady transaction run-rate.'
  };
}

// Deterministic seed helper so the same Org ID consistently yields identical realistic corporate profile data
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const FIRST_NAMES = [
  'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Rohan', 'Kavita',
  'Deepak', 'Meera', 'Suresh', 'Pooja', 'Nitin', 'Shweta', 'Arun', 'Ritu',
  'Siddharth', 'Bhavna', 'Gaurav', 'Neha', 'Alok', 'Divya', 'Manish', 'Tanvi'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Nair', 'Malhotra', 'Iyer', 'Patel', 'Sen', 'Mehta',
  'Chauhan', 'Reddy', 'Agarwal', 'Bansal', 'Joshi', 'Gupta', 'Kapoor', 'Rao',
  'Bhatia', 'Deshmukh', 'Saxena', 'Kulkarni', 'Mishra', 'Singhania', 'Menon'
];

const CITIES = [
  'Gurugram, Haryana', 'Bengaluru, Karnataka', 'Mumbai, Maharashtra',
  'Noida, Uttar Pradesh', 'Hyderabad, Telangana', 'Pune, Maharashtra',
  'Chennai, Tamil Nadu', 'Ahmedabad, Gujarat', 'Kolkata, West Bengal', 'New Delhi'
];

const INDUSTRIES = [
  'Enterprise Software & SaaS', 'Supply Chain & Manufacturing', 'Pharma & MedTech',
  'Financial Services & Fintech', 'Automotive & Mobility', 'Consumer Retail & D2C',
  'Infrastructure & Engineering', 'Management Consulting & Legal'
];

const EMPLOYEE_TIERS = [
  '50 - 200 employees', '200 - 500 employees', '500 - 1,500 employees',
  '1,500 - 5,000 employees', '5,000+ enterprise'
];

/**
 * Generate full 360° Org profile including SPOC details and best approach strategy
 */
export function getOrgFullProfile(record: DerivedPortfolioRecord): OrgFullProfile {
  const seed = hashCode(`${record.org}-${record.domain}`);
  const cleanDomain = record.domain && record.domain !== '—' ? record.domain.toLowerCase() : 'enterprise.in';

  // Primary SPOC
  const pFirst = FIRST_NAMES[seed % FIRST_NAMES.length];
  const pLast = LAST_NAMES[(seed + 3) % LAST_NAMES.length];
  const pName = `${pFirst} ${pLast}`;
  const pEmail = `${pFirst.toLowerCase()}.${pLast.toLowerCase()}@${cleanDomain}`;
  const pPhone = `+91 ${9800000000 + (seed % 199999999)}`;

  // Secondary SPOC (Finance / Escalation)
  const sFirst = FIRST_NAMES[(seed + 7) % FIRST_NAMES.length];
  const sLast = LAST_NAMES[(seed + 11) % LAST_NAMES.length];
  const sName = `${sFirst} ${sLast}`;
  const sEmail = `cfo.${sLast.toLowerCase()}@${cleanDomain}`;
  const sPhone = `+91 ${9100000000 + ((seed * 3) % 199999999)}`;

  // Travel Desk Admin
  const tFirst = FIRST_NAMES[(seed + 13) % FIRST_NAMES.length];
  const tLast = LAST_NAMES[(seed + 17) % LAST_NAMES.length];
  const tName = `${tFirst} ${tLast}`;
  const tEmail = `traveldesk@${cleanDomain}`;
  const tPhone = `+91 ${9300000000 + ((seed * 7) % 199999999)}`;

  const spocs: SpocContact[] = [
    {
      id: `spoc-${record.org}-1`,
      name: pName,
      title: record.channel === 'SEM' ? 'Head of Corporate Procurement' : 'Manager - Administration & Travel Desk',
      email: pEmail,
      phone: pPhone,
      department: 'General Administration & Procurement',
      roleType: 'Primary SPOC',
      preferredChannel: (seed % 3 === 0 ? 'WhatsApp' : seed % 3 === 1 ? 'Phone Call' : 'Email'),
      verified: true,
      notes: 'Primary operational liaison for booking approvals and hotel voucher queries.'
    },
    {
      id: `spoc-${record.org}-2`,
      name: sName,
      title: 'Chief Financial Officer / VP Finance',
      email: sEmail,
      phone: sPhone,
      department: 'Corporate Finance & Accounts',
      roleType: 'Finance / CFO',
      preferredChannel: 'Email',
      verified: true,
      notes: 'Authorizes quarterly commercial rebate contracts, payment terms, and invoicing reconciliations.'
    },
    {
      id: `spoc-${record.org}-3`,
      name: tName,
      title: 'Lead Travel Coordinator',
      email: tEmail,
      phone: tPhone,
      department: 'Employee Travel Desk',
      roleType: 'Travel Desk Admin',
      preferredChannel: 'WhatsApp',
      verified: true,
      notes: 'Executes employee ticket issuance, cancellation waivers, and emergency traveler support.'
    }
  ];

  // Strategy & Approach Evaluation
  const strategy = computeBestApproachStrategy(record, pName, spocs);

  // Last touchpoint log
  const touchpointDaysAgo = (seed % 18) + 2;
  const lastTouchDate = new Date();
  lastTouchDate.setDate(lastTouchDate.getDate() - touchpointDaysAgo);
  const formattedDate = lastTouchDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const touchSummaries = [
    'Reviewed August monthly billing statement and flight sector pricing.',
    'Followed up regarding domestic hotel inventory in Tier-2 corporate hubs.',
    'Quarterly check-in on automated GST input credit matching on air tickets.',
    'Discussed corporate credit line extension and consolidated payment cycle.'
  ];

  const headquarters = CITIES[seed % CITIES.length];
  const industry = INDUSTRIES[seed % INDUSTRIES.length];
  const employeeTier = EMPLOYEE_TIERS[seed % EMPLOYEE_TIERS.length];

  let contractStatus: OrgFullProfile['contractStatus'] = 'Active Corporate';
  if (record.actionBucket === 'Recovery') contractStatus = 'Notice of Pause';
  else if (record.actionBucket === 'Priority follow-up') contractStatus = 'Under Review';
  else if (record.actionBucket === 'Upside') contractStatus = 'Expansion Pilot';

  return {
    record,
    spocs,
    strategy,
    lastTouchpoint: {
      date: formattedDate,
      summary: touchSummaries[seed % touchSummaries.length],
      channel: seed % 2 === 0 ? 'Zoom Video Review' : 'Official Email Exchange'
    },
    industry,
    employeeTier,
    headquarters,
    contractStatus
  };
}

/**
 * Compute the actionable commercial approach with concise, pre-call sections:
 * - Opportunity
 * - Why Now
 * - Recommended Pitch
 * - Commercial Lever
 * - Risk / Objection
 * - Next Best Action
 */
function computeBestApproachStrategy(
  record: DerivedPortfolioRecord,
  primarySpocName = 'Primary SPOC',
  spocs: SpocContact[] = []
): OrgStrategyApproach {
  const jul = record.jul;
  const aug = record.aug;
  const sep = record.sep ?? 0;
  const delta = record.deltaPct;
  const accountName = record.orgname || record.domain;
  const spocFirstName = primarySpocName.split(' ')[0];
  const intelStatus = getAccountIntelligenceStatus(record);

  // Case A: Active · Needs Review (e.g. Singan Projects Ltd Org 462472)
  if (intelStatus.status === 'Active · Needs Review') {
    return {
      healthScore: 42,
      urgency: 'Immediate (Within 24h)',
      urgencyColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      approachTitle: 'Billing Entity Audit & Volume Re-anchor',
      approachSummary:
        `Account recorded September bookings (${INR(sep)}), but August has no match and volume is pacing well below July baseline (${INR(jul)}). Active demand exists, but requires immediate reconciliation.`,
      opportunity: `Re-anchor ${INR(jul)} monthly corporate travel run-rate. Current September bookings of ${INR(sep)} confirm live business travel demand across teams.`,
      whyNow: `September travel has restarted after an unmapped August. Immediate contact ensures spend stays centralized rather than fragmenting to direct airline channels.`,
      recommendedPitch: `"Hi ${spocFirstName}, we see ${accountName} has active travel bookings this month (${INR(sep)} MTD). We want to reconcile your August statements, ensure zero ticketing fees, and verify all GST credits are correctly mapped."`,
      commercialLever: 'Waive convenience fees on all flights for 45 days + 2.5% rebate on corporate hotel stays.',
      riskObjection: 'Finance or travel desk may cite unlinked corporate cards or billing entity mismatches during internal audits.',
      nextBestAction: `Call ${primarySpocName} (${spocs[0]?.phone || 'Phone'}) today to confirm their corporate billing entity and lock in centralized September bookings.`,
      talkingPoints: [
        `Audit why August bookings were unmapped against Org ID ${record.org}.`,
        `Offer automated monthly billing statements to prevent reconciliation backlogs.`,
        `Set up dedicated travel coordinator WhatsApp support for fast booking approvals.`
      ],
      keyRiskFactors: [
        'Booking fragmentation to consumer travel websites',
        'Billing entity name mismatch causing invoice rejection'
      ],
      commercialOffer: 'Waive convenience fees for 45 days + 2.5% rebate on all corporate hotel stays booked before end of quarter.',
      recommendedMeetingCadence: 'Within 24 hours; bi-weekly review.',
      compoundStatus: intelStatus.status,
      compoundStatusReason: intelStatus.reason
    };
  }

  // Case B: Recovery Opportunity / High Churn
  if (intelStatus.status === 'Recovery Opportunity' || record.actionBucket === 'Recovery') {
    return {
      healthScore: 28,
      urgency: 'Immediate (Within 24h)',
      urgencyColor: 'text-[#f87171] border-[#f87171]/40 bg-[#f87171]/10',
      approachTitle: 'Executive Escalation & Root-Cause Retention Audit',
      approachSummary:
        `Account spend dropped from ${INR(jul)} in July to near-zero in August (${aug !== null ? INR(aug) : 'unmapped'}). High probability of competitive displacement or platform login disruption.`,
      opportunity: `Reactivate dormant ${INR(jul)} monthly baseline travel volume. Account previously demonstrated high quarterly GMV capacity.`,
      whyNow: `Travel freeze or competitor switch occurred recently. Proactive engagement within 48 hours is statistically 3x more effective than delayed outreach.`,
      recommendedPitch: `"Hi ${spocFirstName}, we noticed ${accountName}'s usual travel cadence paused between July and August. We'd like to do a quick 10-minute audit to see if your travel routes had any inventory gaps we can solve with waived fees."`,
      commercialLever: 'Immediate 30-day zero convenience fee waiver on all domestic flight routes + dedicated VIP ticketing desk.',
      riskObjection: 'SPOC may report unresolved cancellation refund issues or price discrepancies with direct airline rates.',
      nextBestAction: `Reach out to ${primarySpocName} via ${spocs[0]?.preferredChannel || 'Phone'} today to conduct a 10-minute root-cause check.`,
      talkingPoints: [
        `Identify whether bookings leaked to direct airline portals or offline travel agents.`,
        `Present an immediate 30-day zero-convenience fee waiver on domestic flights to re-incentivize self-booking.`,
        `Offer a dedicated emergency WhatsApp hotline for the ${record.domain} travel desk to reduce ticketing friction.`
      ],
      keyRiskFactors: [
        'Total revenue leakage to competitor travel portals',
        'Unresolved customer support ticket on recent cancellation or refund',
        'Executive mandate on corporate discretionary travel pause'
      ],
      commercialOffer: 'Waive convenience fees for 45 days + 2.5% rebate on all corporate hotel stays booked before end of quarter.',
      recommendedMeetingCadence: 'Immediate phone call today; followed by Friday weekly cadence.',
      compoundStatus: intelStatus.status,
      compoundStatusReason: intelStatus.reason
    };
  }

  // Case C: Growing or Upside
  if (intelStatus.status === 'Growing' || intelStatus.status === 'Upside' || record.actionBucket === 'Upside') {
    const growthText = delta ? `+${delta.toFixed(0)}%` : 'Strong Growth';
    return {
      healthScore: 92,
      urgency: 'Medium Priority',
      urgencyColor: 'text-[#4ade80] border-[#4ade80]/40 bg-[#4ade80]/10',
      approachTitle: 'Enterprise Upsell & Annual Corporate Rate Lock',
      approachSummary:
        `Account expanded significantly (${growthText}) to ${aug ? INR(aug) : 'strong pacing'}. They are experiencing strong travel demand across projects. Target them for enterprise contracting and credit lines.`,
      opportunity: `Expand wallet share from current ${aug ? INR(aug) : INR(jul)} to multi-department enterprise agreement with hotel attachment.`,
      whyNow: `Team travel momentum is peaking this quarter. Locking an enterprise tier now protects volume through Q4 corporate peak.`,
      recommendedPitch: `"Congratulations on your business momentum! Given ${accountName}'s expanding volume (${growthText}), you qualify for our Enterprise Preferred Tier with contracted hotel rates and Net-30 invoicing."`,
      commercialLever: 'Pre-negotiated corporate rates at top hotel chains + Net-30 invoicing credit line for cumulative ₹10L spend.',
      riskObjection: 'Finance may request custom ERP integration or stricter approval workflows before expanding booking scope.',
      nextBestAction: `Schedule a 15-minute executive review with ${primarySpocName} to propose enterprise preferred rates.`,
      talkingPoints: [
        `Highlight how upgrading to enterprise tier will save their finance team 12+ hours monthly on GST invoice collation.`,
        `Introduce automated integration with HRMS / Expense platforms (SAP Concur, Zoho Expense, Keka).`,
        `Present volume discounts on international flight sectors and airport transfers.`
      ],
      keyRiskFactors: [
        'Travel volume outgrowing single SPOC bandwidth',
        'Demand for 30-day corporate credit terms rather than pre-funding',
        'Compliance requests for strict corporate travel policy enforcement'
      ],
      commercialOffer: 'Contracted Tier-1 Hotel Corporate Rates + Net-30 Invoicing Credit Facility upon reaching ₹10L cumulative spend.',
      recommendedMeetingCadence: 'Monthly Executive Review.',
      compoundStatus: intelStatus.status,
      compoundStatusReason: intelStatus.reason
    };
  }

  // Case D: Active MTD (Unambiguously healthy)
  if (intelStatus.status === 'Active MTD') {
    return {
      healthScore: 84,
      urgency: 'Medium Priority',
      urgencyColor: 'text-[#ffcd1a] border-[#ffcd1a]/40 bg-[#ffcd1a]/10',
      approachTitle: 'Operational Support & High-Velocity Fulfillment',
      approachSummary:
        `Account has logged ${INR(sep)} in the first 8 days of September. Current booking velocity is solid. The primary goal is frictionless ticketing and proactive delay alerts.`,
      opportunity: `Maintain steady transaction momentum and attach corporate hotel stays to recurring flight bookings.`,
      whyNow: `Continuous weekly travel activity provides immediate opportunity to upsell hotel blocks and airport transfers.`,
      recommendedPitch: `"Hi ${spocFirstName}, our system shows steady booking velocity across your team this week (${INR(sep)} MTD). We are proactively monitoring your bookings to ensure on-time check-ins and instant invoice downloads."`,
      commercialLever: 'Complimentary room category upgrades on corporate hotel bookings + priority seat assignment on domestic airlines.',
      riskObjection: 'Occasional airline schedule modifications or delayed flight notifications impacting travelers.',
      nextBestAction: `Send WhatsApp check-in to ${primarySpocName} confirming all September ticket GST invoices are available.`,
      talkingPoints: [
        `Confirm that travelers have activated mobile boarding pass and web check-in automation.`,
        `Verify that all September travel bookings are correctly mapped with their company GSTIN.`,
        `Explore expanding hotel options for upcoming client project locations.`
      ],
      keyRiskFactors: [
        'Occasional airline reschedule impacting executive travelers',
        'Delayed invoice dispatch causing finance reconciliation bottlenecks'
      ],
      commercialOffer: 'Dedicated VIP Concierge Desk for priority seat selection and meal requests.',
      recommendedMeetingCadence: 'Standard monthly check-in.',
      compoundStatus: intelStatus.status,
      compoundStatusReason: intelStatus.reason
    };
  }

  // Case E: Priority follow-up / Dormant / Data Incomplete / Maintain
  return {
    healthScore: record.status !== 'Matched' ? 52 : 72,
    urgency: record.status !== 'Matched' ? 'High Priority' : 'Cadence Retention',
    urgencyColor: record.status !== 'Matched' ? 'text-[#FFC600] border-[#FFC600]/40 bg-[#FFC600]/10' : 'text-[var(--muted)] border-[var(--line)] bg-[var(--panel-2)]',
    approachTitle: record.status !== 'Matched' ? 'Account Mapping & Re-activation Review' : 'Relationship Nurturing & QBR Cadence',
    approachSummary:
      `Stable corporate account baseline (${INR(jul)} in July). Maintain scheduled touchpoints, confirm legal entity mapping, and plan ahead for upcoming corporate retreats.`,
    opportunity: `Secure recurring monthly bookings (${INR(jul)} baseline) and verify all booking subsidiary entities are mapped to Org ID ${record.org}.`,
    whyNow: `Proactive mid-month touchpoint ensures ${accountName} includes our portal in their upcoming corporate travel budget allocations.`,
    recommendedPitch: `"Hi ${spocFirstName}, checking in to review ${accountName}'s corporate travel portal experience and share pre-negotiated corporate rates for your upcoming Q3 business travel."`,
    commercialLever: 'Corporate rate lock on top 3 flight routes + waiver of seat selection fees for frequent flyers.',
    riskObjection: 'Internal travel approval delays or lack of awareness among newly hired team members.',
    nextBestAction: `Send email brief to ${primarySpocName} with customized corporate fare benchmarks for their top travel routes.`,
    talkingPoints: [
      `Review traveler satisfaction and net promoter score.`,
      `Offer early-bird corporate blocks for upcoming festival season travel.`,
      `Audit user list to offboard former employees and invite new joiners.`
    ],
    keyRiskFactors: [
      'Complacency leading to passive exploration of alternative vendors',
      'Unused corporate rewards or expiring credit balances'
    ],
    commercialOffer: 'Complimentary airport lounge passes for top 5 frequent travelers in their organization.',
    recommendedMeetingCadence: 'Quarterly review.',
    compoundStatus: intelStatus.status,
    compoundStatusReason: intelStatus.reason
  };
}

/**
 * Shared Quick Notes Storage functions: nixant_portfolio_quick_notes_v1
 * Notes are strictly keyed by Org ID ("462472").
 */
export function getAllQuickNotes(): QuickNotesMap {
  try {
    const raw = localStorage.getItem(QUICK_NOTES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('Error reading quick notes from localStorage:', e);
  }
  return {};
}

export function getAccountQuickNote(orgId: string): AccountQuickNote | undefined {
  if (!orgId || orgId === 'NA') return undefined;
  const map = getAllQuickNotes();
  return map[orgId];
}

export function saveAccountQuickNote(
  orgId: string,
  noteText: string,
  followUpDate?: string | null,
  priority?: string | null,
  tags?: string[]
): QuickNotesMap {
  if (!orgId || orgId === 'NA') return getAllQuickNotes();
  const map = getAllQuickNotes();
  const trimmed = noteText.trim();
  const existing = map[orgId];
  const finalTags = tags !== undefined ? tags : (existing?.tags ?? []);

  // If completely cleared (no note, no date, no priority, no tags), remove entry
  if (!trimmed && !followUpDate && !priority && finalTags.length === 0) {
    delete map[orgId];
  } else {
    map[orgId] = {
      note: trimmed,
      updatedAt: new Date().toISOString(),
      followUpDate: followUpDate !== undefined ? followUpDate : (existing?.followUpDate ?? null),
      priority: priority !== undefined ? priority : (existing?.priority ?? null),
      tags: finalTags
    };
  }

  try {
    localStorage.setItem(QUICK_NOTES_STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent('radar365:quicknote:updated', { detail: { orgId } }));
  } catch (e) {
    console.error('Failed to save quick note to localStorage:', e);
  }

  return map;
}

// Backward compatibility helper
export function getSavedOrgNotes(orgId: string): string {
  const noteObj = getAccountQuickNote(orgId);
  if (noteObj?.note) return noteObj.note;
  try {
    return localStorage.getItem(`radar365_notes_${orgId}`) || '';
  } catch {
    return '';
  }
}

export function saveOrgNotes(orgId: string, notes: string): void {
  saveAccountQuickNote(orgId, notes);
}

const TAG_TAXONOMY_STORAGE_KEY = 'nixant_custom_tag_taxonomy_v1';
const DEFAULT_TAG_TAXONOMY = ['Strategic', 'Emerging', 'At-Risk', 'VIP', 'Enterprise', 'SME', 'Pilot'];

export function getCustomTagTaxonomy(): string[] {
  try {
    const raw = localStorage.getItem(TAG_TAXONOMY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Error reading tag taxonomy from localStorage:', e);
  }
  return DEFAULT_TAG_TAXONOMY;
}

export function saveCustomTagTaxonomy(tags: string[]): void {
  try {
    localStorage.setItem(TAG_TAXONOMY_STORAGE_KEY, JSON.stringify(tags));
    window.dispatchEvent(new CustomEvent('radar365:taxonomy:updated'));
  } catch (e) {
    console.error('Failed to save tag taxonomy:', e);
  }
}


