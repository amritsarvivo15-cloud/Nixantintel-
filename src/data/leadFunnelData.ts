import { Lead } from '../types';

export const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-001',
    companyName: 'Zerodha Broking & Tech',
    domain: 'zerodha.com',
    contactName: 'Nitin Kamath / Travel Ops',
    designation: 'Head of Administration & Facilities',
    mobile: '+91 98450 12345',
    email: 'travel.ops@zerodha.com',
    city: 'Bengaluru',
    industry: 'Fintech / BFSI',
    estimatedMonthlySpend: 2800000,
    expectedGmv: 2500000,
    channel: 'SME+',
    leadSource: 'Referral',
    demoDate: '2026-09-09',
    nextFollowUpDate: '2026-09-10', // 🔥 TODAY!
    priority: 'Hot',
    owner: 'Nishant Chawla',
    quickNote: 'Demo completed yesterday with VP Ops. Interested in self-booking portal & automated GST reconciliation. Commercial proposal pending review.',
    gstin: '29AABCZ1234K1Z5',
    stage: 'COMMERCIAL / CREDIT DISCUSSION',
    history: [
      {
        id: 'h-01',
        stage: 'NEW LEAD',
        date: '02 Sep 2026',
        timestamp: 1725264000000,
        note: 'Lead received via Bangalore fintech founders network referral.',
        author: 'Nishant C.'
      },
      {
        id: 'h-02',
        stage: 'CONNECTED',
        date: '04 Sep 2026',
        timestamp: 1725436800000,
        note: 'Connected with travel desk manager. Shared brochure & corporate deck.',
        author: 'Nishant C.'
      },
      {
        id: 'h-03',
        stage: 'DEMO SCHEDULED',
        date: '06 Sep 2026',
        timestamp: 1725609600000,
        note: 'Scheduled live platform demo for travel admin & finance team.',
        author: 'Nishant C.'
      },
      {
        id: 'h-04',
        stage: 'DEMO DONE',
        date: '09 Sep 2026',
        timestamp: 1725868800000,
        note: 'Product demo conducted. High appreciation for flight policy controls & 3-click approvals.',
        author: 'Nishant C.'
      },
      {
        id: 'h-05',
        stage: 'COMMERCIAL / CREDIT DISCUSSION',
        date: '10 Sep 2026',
        timestamp: 1725955200000,
        note: 'Sent 15-day credit cycle draft + zero booking fee agreement. Follow-up due today.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-09-02T10:00:00Z',
    updatedAt: '2026-09-10T09:00:00Z',
    aiRecommendedPriority: 'Hot',
    aiRecommendationReason: 'High GMV potential (₹25L/mo), executive sponsorship, and active commercial negotiations.'
  },
  {
    id: 'lead-002',
    companyName: 'Rapido Fleet & Transit',
    domain: 'rapido.bike',
    contactName: 'Gaurav Sharma',
    designation: 'Director of Procurement & Travel',
    mobile: '+91 99160 88231',
    email: 'gaurav.sharma@rapido.bike',
    city: 'Bengaluru',
    industry: 'Mobility / Logistics',
    estimatedMonthlySpend: 1600000,
    expectedGmv: 1400000,
    channel: 'SME+',
    leadSource: 'Outbound',
    demoDate: '2026-09-05',
    nextFollowUpDate: '2026-09-08', // ⏰ OVERDUE!
    priority: 'Hot',
    owner: 'Nishant Chawla',
    quickNote: 'Overdue follow-up on credit terms! Rapido needs 30-day billing cycle for city operations team travel across 20+ Tier-2 cities.',
    stage: 'INTERESTED',
    history: [
      {
        id: 'h-11',
        stage: 'NEW LEAD',
        date: '28 Aug 2026',
        timestamp: 1724832000000,
        note: 'Target account outbound sourced from LinkedIn Sales Navigator.',
        author: 'Nishant C.'
      },
      {
        id: 'h-12',
        stage: 'CONNECTED',
        date: '01 Sep 2026',
        timestamp: 1725177600000,
        note: 'Call with Gaurav. Current travel vendor has high cancellation turnaround.',
        author: 'Nishant C.'
      },
      {
        id: 'h-13',
        stage: 'DEMO DONE',
        date: '05 Sep 2026',
        timestamp: 1725523200000,
        note: 'Demonstrated corporate hotel inventory and 24x7 WhatsApp executive support.',
        author: 'Nishant C.'
      },
      {
        id: 'h-14',
        stage: 'INTERESTED',
        date: '06 Sep 2026',
        timestamp: 1725609600000,
        note: 'Requested credit approval documentation.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-08-28T11:00:00Z',
    updatedAt: '2026-09-06T14:30:00Z',
    aiRecommendedPriority: 'Hot',
    aiRecommendationReason: 'Follow-up overdue by 2 days; high booking frequency across Tier-2 corporate hotel chains.'
  },
  {
    id: 'lead-003',
    companyName: 'Meesho Supply Chain & Tech',
    domain: 'meesho.com',
    contactName: 'Pooja Iyer',
    designation: 'Senior Manager - Corporate Travel & Admin',
    mobile: '+91 97411 90214',
    email: 'pooja.iyer@meesho.com',
    city: 'Bengaluru',
    industry: 'E-commerce',
    estimatedMonthlySpend: 3500000,
    expectedGmv: 3000000,
    channel: 'Enterprise',
    leadSource: 'Inbound',
    demoDate: '2026-09-10', // 🟡 DEMO TODAY!
    nextFollowUpDate: '2026-09-10', // 🔥 TODAY!
    priority: 'Hot',
    owner: 'Nishant Chawla',
    quickNote: 'Demo scheduled today at 3:30 PM IST with Meesho HR & Admin panel. Focus on multi-level department billing & central GST invoicing.',
    stage: 'DEMO SCHEDULED',
    history: [
      {
        id: 'h-21',
        stage: 'NEW LEAD',
        date: '03 Sep 2026',
        timestamp: 1725350400000,
        note: 'Inbound query on Radar365 enterprise portal.',
        author: 'Inbound SDR'
      },
      {
        id: 'h-22',
        stage: 'CONNECTED',
        date: '05 Sep 2026',
        timestamp: 1725523200000,
        note: 'Pre-qualification call. Annual corporate travel budget exceeds ₹4.2 Cr.',
        author: 'Nishant C.'
      },
      {
        id: 'h-23',
        stage: 'DEMO SCHEDULED',
        date: '08 Sep 2026',
        timestamp: 1725782400000,
        note: 'Calendar invite confirmed for 10 Sep 3:30 PM.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-09-03T12:00:00Z',
    updatedAt: '2026-09-08T15:00:00Z',
    aiRecommendedPriority: 'Hot',
    aiRecommendationReason: 'Enterprise scale (₹30L expected monthly GMV) with demo scheduled today.'
  },
  {
    id: 'lead-004',
    companyName: 'Ather Energy Smart Mobility',
    domain: 'atherenergy.com',
    contactName: 'Karthik Ramanathan',
    designation: 'VP Finance & Operations',
    mobile: '+91 98860 44321',
    email: 'karthik.r@atherenergy.com',
    city: 'Bengaluru / Hosur',
    industry: 'EV & Clean Tech',
    estimatedMonthlySpend: 2200000,
    expectedGmv: 1800000,
    channel: 'SME+',
    leadSource: 'Referral',
    nextFollowUpDate: '2026-09-11', // 📅 UPCOMING
    priority: 'Warm',
    owner: 'Nishant Chawla',
    quickNote: 'Onboarding documentation sent. Awaiting master services agreement (MSA) sign-off from legal counsel. Expected go-live by end of September.',
    stage: 'ONBOARDING',
    history: [
      {
        id: 'h-31',
        stage: 'NEW LEAD',
        date: '20 Aug 2026',
        timestamp: 1724140800000,
        note: 'Introduced by Board Member.',
        author: 'Nishant C.'
      },
      {
        id: 'h-32',
        stage: 'DEMO DONE',
        date: '27 Aug 2026',
        timestamp: 1724745600000,
        note: 'Demo conducted with Hosur plant admin & Bangalore HQ travel team.',
        author: 'Nishant C.'
      },
      {
        id: 'h-33',
        stage: 'COMMERCIAL / CREDIT DISCUSSION',
        date: '02 Sep 2026',
        timestamp: 1725264000000,
        note: 'Credit limit approved for ₹15 Lakhs rolling balance.',
        author: 'Nishant C.'
      },
      {
        id: 'h-34',
        stage: 'ONBOARDING',
        date: '07 Sep 2026',
        timestamp: 1725696000000,
        note: 'Employee roster (420 users) provided for single-sign-on (SSO) configuration.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-08-20T09:30:00Z',
    updatedAt: '2026-09-07T16:00:00Z',
    aiRecommendedPriority: 'Warm',
    aiRecommendationReason: '🚀 Ready for Onboarding! Roster submitted, legal review in progress.'
  },
  {
    id: 'lead-005',
    companyName: 'Licious Fresh Meats Corp',
    domain: 'licious.in',
    contactName: 'Divya Sundaram',
    designation: 'Procurement Head - Non-Core',
    mobile: '+91 99002 55678',
    email: 'divya.s@licious.com',
    city: 'Bengaluru',
    industry: 'Consumer Goods / FoodTech',
    estimatedMonthlySpend: 950000,
    expectedGmv: 800000,
    channel: 'SEM',
    leadSource: 'Cold Outreach',
    nextFollowUpDate: '2026-09-07', // ⏰ OVERDUE!
    priority: 'Normal',
    owner: 'Nishant Chawla',
    quickNote: 'Connected on phone. Divya mentioned contract with existing agent ends 30 Sep. Sent comparison sheet vs Cleartrip/MakeMyTrip Corporate.',
    stage: 'FOLLOW-UP',
    history: [
      {
        id: 'h-41',
        stage: 'NEW LEAD',
        date: '25 Aug 2026',
        timestamp: 1724572800000,
        note: 'Identified expanding procurement hub in Gurgaon & Mumbai.',
        author: 'Nishant C.'
      },
      {
        id: 'h-42',
        stage: 'CONNECTED',
        date: '29 Aug 2026',
        timestamp: 1724918400000,
        note: '15 min call. Interested in lower cancellation penalties.',
        author: 'Nishant C.'
      },
      {
        id: 'h-43',
        stage: 'FOLLOW-UP',
        date: '03 Sep 2026',
        timestamp: 1725350400000,
        note: 'Sent rate benchmarking report.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-08-25T14:00:00Z',
    updatedAt: '2026-09-03T11:20:00Z',
    aiRecommendedPriority: 'Normal',
    aiRecommendationReason: 'Medium spend, replacement window active before 30 Sep.'
  },
  {
    id: 'lead-006',
    companyName: 'Zepto Quick Commerce HQ',
    domain: 'zeptonow.com',
    contactName: 'Aditya Vohra',
    designation: 'Head of People Operations',
    mobile: '+91 98200 67890',
    email: 'aditya.vohra@zeptonow.com',
    city: 'Mumbai',
    industry: 'Quick Commerce',
    estimatedMonthlySpend: 4200000,
    expectedGmv: 3800000,
    channel: 'Enterprise',
    leadSource: 'LinkedIn',
    nextFollowUpDate: '2026-09-10', // 🔥 TODAY!
    priority: 'Hot',
    owner: 'Nishant Chawla',
    quickNote: 'High growth travel velocity for dark store launches across Delhi NCR, Hyderabad, Chennai. Aditya asked for customized GST invoice format.',
    stage: 'CONNECTED',
    history: [
      {
        id: 'h-51',
        stage: 'NEW LEAD',
        date: '04 Sep 2026',
        timestamp: 1725436800000,
        note: 'Direct message on LinkedIn by Nishant to Aditya.',
        author: 'Nishant C.'
      },
      {
        id: 'h-52',
        stage: 'CONNECTED',
        date: '08 Sep 2026',
        timestamp: 1725782400000,
        note: 'Introductory call completed. Shared product video & enterprise deck.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-09-04T16:20:00Z',
    updatedAt: '2026-09-08T18:00:00Z',
    aiRecommendedPriority: 'Hot',
    aiRecommendationReason: 'Massive opportunity (₹38L/mo GMV) across rapid geographic expansion.'
  },
  {
    id: 'lead-007',
    companyName: 'Darwinbox HR Solutions',
    domain: 'darwinbox.com',
    contactName: 'Shalini Narayanan',
    designation: 'Chief of Staff',
    mobile: '+91 91760 11980',
    email: 'shalini.n@darwinbox.io',
    city: 'Hyderabad',
    industry: 'HR SaaS',
    estimatedMonthlySpend: 1500000,
    expectedGmv: 1200000,
    channel: 'SME+',
    leadSource: 'Partner',
    demoDate: '2026-09-12',
    nextFollowUpDate: '2026-09-12', // 📅 UPCOMING
    priority: 'Warm',
    owner: 'Nishant Chawla',
    quickNote: 'Demo locked for Saturday. They want to explore API integration for automated employee onboarding and policy sync with Darwinbox HRMS.',
    stage: 'DEMO SCHEDULED',
    history: [
      {
        id: 'h-61',
        stage: 'NEW LEAD',
        date: '01 Sep 2026',
        timestamp: 1725177600000,
        note: 'Introduced via ecosystem partner integration team.',
        author: 'Nishant C.'
      },
      {
        id: 'h-62',
        stage: 'CONNECTED',
        date: '05 Sep 2026',
        timestamp: 1725523200000,
        note: 'Call with Shalini & tech integration architect.',
        author: 'Nishant C.'
      },
      {
        id: 'h-63',
        stage: 'DEMO SCHEDULED',
        date: '08 Sep 2026',
        timestamp: 1725782400000,
        note: 'Invites sent for 12 Sep.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-09-01T10:15:00Z',
    updatedAt: '2026-09-08T12:00:00Z',
    aiRecommendedPriority: 'Warm',
    aiRecommendationReason: 'Strong software synergy; joint HRMS integration opportunity.'
  },
  {
    id: 'lead-008',
    companyName: 'Shiprocket Logistics Hub',
    domain: 'shiprocket.in',
    contactName: 'Rohit Khandelwal',
    designation: 'VP Operations & Supply',
    mobile: '+91 98112 34509',
    email: 'rohit.k@shiprocket.com',
    city: 'Gurugram',
    industry: 'Logistics Tech',
    estimatedMonthlySpend: 2400000,
    expectedGmv: 2000000,
    channel: 'SME+',
    leadSource: 'Outbound',
    demoDate: '2026-09-04',
    nextFollowUpDate: '2026-09-10', // 🔥 TODAY!
    priority: 'Hot',
    owner: 'Nishant Chawla',
    quickNote: 'Demo completed successfully last week. Rohit confirmed budget clearance. Follow-up call today to finalize Org creation and initial test flight bookings.',
    stage: 'ORG CREATED',
    existingOrgId: '462910',
    history: [
      {
        id: 'h-71',
        stage: 'NEW LEAD',
        date: '22 Aug 2026',
        timestamp: 1724313600000,
        note: 'Outbound campaign initiated.',
        author: 'Nishant C.'
      },
      {
        id: 'h-72',
        stage: 'DEMO DONE',
        date: '04 Sep 2026',
        timestamp: 1725436800000,
        note: 'Full demo delivered to Delhi procurement leadership.',
        author: 'Nishant C.'
      },
      {
        id: 'h-73',
        stage: 'ORG CREATED',
        date: '09 Sep 2026',
        timestamp: 1725868800000,
        note: 'Org #462910 provisioned on Radar platform. Ready for initial GMV transaction.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-08-22T08:00:00Z',
    updatedAt: '2026-09-09T17:00:00Z',
    aiRecommendedPriority: 'Hot',
    aiRecommendationReason: 'Org is created! One step away from GMV activation.'
  },
  {
    id: 'lead-009',
    companyName: 'Slice Fintech Card',
    domain: 'sliceit.com',
    contactName: 'Ananya Deshpande',
    designation: 'Finance Operations Manager',
    mobile: '+91 97690 88712',
    email: 'ananya.d@sliceit.com',
    city: 'Bengaluru',
    industry: 'Fintech / Banking',
    estimatedMonthlySpend: 1100000,
    expectedGmv: 950000,
    channel: 'SMEV',
    leadSource: 'Inbound',
    nextFollowUpDate: '2026-08-28', // 💤 STALE / NO ACTIVITY
    priority: 'Low',
    owner: 'Nishant Chawla',
    quickNote: 'Contact not responding to last 2 emails after initial discussion. May need to re-engage with revised credit structure or reach out to alternate SPOC.',
    stage: 'ON HOLD',
    history: [
      {
        id: 'h-81',
        stage: 'NEW LEAD',
        date: '15 Aug 2026',
        timestamp: 1723708800000,
        note: 'Inbound form submission.',
        author: 'Inbound SDR'
      },
      {
        id: 'h-82',
        stage: 'CONTACTED',
        date: '18 Aug 2026',
        timestamp: 1723968000000,
        note: 'Initial call made. Internal reorganization in progress.',
        author: 'Nishant C.'
      },
      {
        id: 'h-83',
        stage: 'ON HOLD',
        date: '28 Aug 2026',
        timestamp: 1724832000000,
        note: 'Client paused all new vendor onboarding till Q3.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-08-28T09:00:00Z',
    aiRecommendedPriority: 'Low',
    aiRecommendationReason: 'Marked On Hold due to internal travel freeze.'
  },
  {
    id: 'lead-010',
    companyName: 'Spinny Pre-owned Wheels',
    domain: 'spinny.com',
    contactName: 'Vikramaditya Rao',
    designation: 'Head of Administration',
    mobile: '+91 98101 22340',
    email: 'vikram.rao@spinny.com',
    city: 'Gurugram',
    industry: 'Automotive / Retail',
    estimatedMonthlySpend: 1850000,
    expectedGmv: 1600000,
    channel: 'SME+',
    leadSource: 'Event',
    nextFollowUpDate: '2026-09-02', // 🏆 CONVERTED
    priority: 'Hot',
    owner: 'Nishant Chawla',
    quickNote: 'Successfully converted to active portfolio account! Org #462820 active and transacting.',
    stage: 'GMV STARTED',
    convertedAt: '2026-09-02T11:30:00Z',
    convertedOrgId: '462820',
    existingOrgId: '462820',
    history: [
      {
        id: 'h-91',
        stage: 'NEW LEAD',
        date: '10 Aug 2026',
        timestamp: 1723276800000,
        note: 'Met Vikramaditya at Corporate Travel Summit in Delhi.',
        author: 'Nishant C.'
      },
      {
        id: 'h-92',
        stage: 'DEMO DONE',
        date: '18 Aug 2026',
        timestamp: 1723968000000,
        note: 'Platform demo to Gurgaon hub leaders.',
        author: 'Nishant C.'
      },
      {
        id: 'h-93',
        stage: 'ONBOARDING',
        date: '25 Aug 2026',
        timestamp: 1724572800000,
        note: 'Billing KYC and GST details verified.',
        author: 'Nishant C.'
      },
      {
        id: 'h-94',
        stage: 'ACTIVATED',
        date: '01 Sep 2026',
        timestamp: 1725177600000,
        note: 'Org #462820 activated. First batch of executives onboarded.',
        author: 'Nishant C.'
      },
      {
        id: 'h-95',
        stage: 'GMV STARTED',
        date: '02 Sep 2026',
        timestamp: 1725264000000,
        note: 'First corporate flight booked to Mumbai (₹42,800). Moved to active portfolio monitoring.',
        author: 'Nishant C.'
      }
    ],
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-09-02T11:30:00Z',
    aiRecommendedPriority: 'Hot',
    aiRecommendationReason: 'Converted account transacting live GMV.'
  }
];

const LEADS_STORAGE_KEY = 'radar365_lead_funnel_v1';

export function getStoredLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading stored leads:', e);
  }
  return INITIAL_LEADS;
}

export function saveStoredLeads(leads: Lead[]): void {
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  } catch (e) {
    console.error('Error saving leads to storage:', e);
  }
}

export function resetLeadsToDefault(): Lead[] {
  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_LEADS));
  } catch (e) {}
  return INITIAL_LEADS;
}
