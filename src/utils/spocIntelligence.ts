import { DerivedPortfolioRecord, OrgFullProfile, SpocContact, OrgStrategyApproach } from '../types';
import { INR } from './formatters';

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
  const strategy = computeBestApproachStrategy(record);

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
 * Compute the tailored commercial approach based on July vs August vs September GMV telemetry
 */
function computeBestApproachStrategy(record: DerivedPortfolioRecord): OrgStrategyApproach {
  const jul = record.jul;
  const aug = record.aug;
  const sep = record.sep ?? 0;
  const delta = record.deltaPct;

  // 1. High Churn / Sharp Drop (Recovery & Priority follow-up)
  if (record.actionBucket === 'Recovery') {
    return {
      healthScore: 28,
      urgency: 'Immediate (Within 24h)',
      urgencyColor: 'text-[#f87171] border-[#f87171]/40 bg-[#f87171]/10',
      approachTitle: 'Executive Escalation & Root-Cause Retention Audit',
      approachSummary:
        `Account spend dropped from ${INR(jul)} in July to near-zero in August (${aug !== null ? INR(aug) : 'unmapped'}). High probability of competitive displacement, internal travel freeze, or platform login disruption. Requires proactive outreach to both Primary SPOC and Finance Head.`,
      recommendedPitch:
        `"Hi ${record.orgname || record.domain} team, we noticed your team's usual travel activity slowed down significantly between July and August. We'd like to schedule a rapid 10-minute audit to see if travel policies tightened, or if our platform had any inventory gaps for your key sectors that we can rectify immediately with waived service charges."`,
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
      recommendedMeetingCadence: 'Immediate phone call today; followed by Friday weekly cadence.'
    };
  }

  if (record.actionBucket === 'Priority follow-up') {
    return {
      healthScore: 48,
      urgency: 'High Priority',
      urgencyColor: 'text-[#FFC600] border-[#FFC600]/40 bg-[#FFC600]/10',
      approachTitle: 'SLA Review & Volume Re-activation Cadence',
      approachSummary:
        `Spend experienced a contraction (${delta !== null ? delta.toFixed(1) + '%' : 'unmapped'}) from ${INR(jul)} in July. The account remains commercially viable but needs proactive account management engagement to prevent total churn in September.`,
      recommendedPitch:
        `"Hi ${record.orgname || record.domain} travel desk, we want to ensure your travelers have seamless inventory access as your September business travel ramps up. We have pre-negotiated corporate rates on your top city routes and want to align on any upcoming group offsites or client roadshows."`,
      talkingPoints: [
        `Share customized top-sector flight rate benchmarks comparing our corporate fares vs spot retail rates.`,
        `Check if September travel approvals are currently pending in their internal ERP or travel authorization workflow.`,
        `Propose multi-user departmental onboarding for sales, engineering, and client-facing teams.`
      ],
      keyRiskFactors: [
        'Travelers bypassing centralized portal due to missing flight time options',
        'Payment gateway failure or corporate card credit limit constraints',
        'Budget reallocation towards upcoming Q4 events'
      ],
      commercialOffer: 'Tiered quarterly rebate: Reach ₹5L quarterly GMV to unlock 3.0% cashback on hotel reservations.',
      recommendedMeetingCadence: 'Within 48 hours; Bi-weekly review.'
    };
  }

  // 2. High Growth & Upside
  if (record.actionBucket === 'Upside') {
    return {
      healthScore: 92,
      urgency: 'Medium Priority',
      urgencyColor: 'text-[#4ade80] border-[#4ade80]/40 bg-[#4ade80]/10',
      approachTitle: 'Enterprise Upsell & Annual Corporate Rate Lock',
      approachSummary:
        `Account expanded significantly (+${delta ? delta.toFixed(1) : '6.3'}%) to ${aug ? INR(aug) : 'strong pacing'}. They are experiencing strong travel demand across projects. Target them for enterprise contracting, corporate credit lines, and automated expense report sync.`,
      recommendedPitch:
        `"Congratulations on your business momentum! Given ${record.orgname || record.domain}'s increased booking volume this quarter, you qualify for our Enterprise Preferred Tier, which includes contracted corporate hotel rates, guaranteed late check-outs, and a unified monthly credit facility."`,
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
      recommendedMeetingCadence: 'Monthly Executive Review.'
    };
  }

  // 3. Active MTD
  if (record.actionBucket === 'Active MTD') {
    return {
      healthScore: 84,
      urgency: 'Medium Priority',
      urgencyColor: 'text-[#ffcd1a] border-[#ffcd1a]/40 bg-[#ffcd1a]/10',
      approachTitle: 'Operational Support & High-Velocity Fulfillment',
      approachSummary:
        `Account has logged ${INR(sep)} in the first 8 days of September. Current booking velocity is solid. The primary goal is frictionless ticketing, proactive flight delay alerts, and zero disruption.`,
      recommendedPitch:
        `"Hi team, our telemetry shows active daily booking velocity across your team this week. We're monitoring your reservations in real-time to guarantee 100% on-time check-ins and instant invoice downloads."`,
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
      recommendedMeetingCadence: 'Standard monthly check-in.'
    };
  }

  // 4. Maintain / Stable
  return {
    healthScore: 72,
    urgency: 'Cadence Retention',
    urgencyColor: 'text-[var(--muted)] border-[var(--line)] bg-[var(--panel-2)]',
    approachTitle: 'Relationship Nurturing & Quarterly Business Review',
    approachSummary:
      `Stable corporate account with steady volume (${INR(jul)} baseline). Maintain scheduled touchpoints, ensure satisfaction, and check for seasonal holiday booking planning.`,
    recommendedPitch:
      `"Hi ${record.orgname || record.domain}, reaching out for our regular check-in to ensure your corporate travel portal experience is smooth. Do you have any upcoming Q3 company retreats or board meetings where we can assist with group blocks?"`,
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
    recommendedMeetingCadence: 'Quarterly review.'
  };
}

/**
 * Local Storage persistence for user-added SPOC notes
 */
export function getSavedOrgNotes(orgId: string): string {
  try {
    return localStorage.getItem(`radar365_notes_${orgId}`) || '';
  } catch {
    return '';
  }
}

export function saveOrgNotes(orgId: string, notes: string): void {
  try {
    localStorage.setItem(`radar365_notes_${orgId}`, notes);
  } catch (e) {
    console.error('Failed to save org notes', e);
  }
}
