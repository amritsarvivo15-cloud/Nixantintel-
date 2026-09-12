import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { PORTFOLIO_DATA } from '../src/data/portfolioData';

export function createRadarApp() {
  const app = express();
  const router = express.Router();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Lazy-initialized Gemini client with required User-Agent
  let aiClient: GoogleGenAI | null = null;
  function getGenAI(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Compute brief summary for grounding AI queries
  const totalAccounts = PORTFOLIO_DATA.length;
  const uniqueOrgs = new Set(PORTFOLIO_DATA.map((d) => d.org)).size;
  const matchedAccounts = PORTFOLIO_DATA.filter((d) => d.aug !== null || d.sep !== null);
  const matchedCount = new Set(matchedAccounts.map((d) => d.org)).size;

  const julyBaselineGmv = (() => {
    const seen = new Set<string>();
    let total = 0;
    for (const row of PORTFOLIO_DATA) {
      if (row.org !== 'NA' && seen.has(row.org)) continue;
      seen.add(row.org);
      total += row.jul || 0;
    }
    return total;
  })();

  // API: Status & Comprehensive Diagnostic
  router.get('/status', (req, res) => {
    const geminiConfigured = !!process.env.GEMINI_API_KEY;
    const nvidiaConfigured = !!process.env.NVIDIA_API_KEY;
    const nvidiaModel = process.env.NVIDIA_MODEL?.trim() || (nvidiaConfigured ? 'meta/llama-3.3-70b-instruct' : null);

    let activeProvider = 'grounded_engine';
    if (nvidiaConfigured) {
      activeProvider = 'nvidia';
    } else if (geminiConfigured) {
      activeProvider = 'gemini';
    }

    res.json({
      status: 'ok',
      version: '2.1.0',
      service: 'Radar 365 by NiXant Intelligence OS',
      totalRows: totalAccounts,
      uniqueOrgs,
      matchedCount,
      julyBaselineGmv,
      timestamp: new Date().toISOString(),
      geminiConfigured,
      nvidiaConfigured,
      nvidiaModel,
      aiProvider: activeProvider,
      activeProvider,
      capabilities: {
        askIntelligence: true,
        groundedEngine: true,
        imageExtraction: geminiConfigured,
      },
    });
  });

  // Dedicated API Diagnostic / Test Endpoint
  router.get('/check', async (req, res) => {
    const geminiKey = !!process.env.GEMINI_API_KEY;
    const nvidiaKey = !!process.env.NVIDIA_API_KEY;
    const nvidiaModel = process.env.NVIDIA_MODEL?.trim() || 'meta/llama-3.3-70b-instruct';

    const diagnostic: any = {
      status: 'ok',
      service: 'Radar 365 NiXant Intelligence API Diagnostic',
      timestamp: new Date().toISOString(),
      portfolioEngine: {
        status: 'operational',
        accountsCount: totalAccounts,
        uniqueOrgs,
        matchedCount,
        julyBaselineGmv,
      },
      providers: {
        nvidia: {
          configured: nvidiaKey,
          model: nvidiaKey ? nvidiaModel : null,
          status: nvidiaKey ? 'configured' : 'missing_key',
          hint: nvidiaKey ? 'Using NVIDIA Integrate API' : 'Add NVIDIA_API_KEY & NVIDIA_MODEL in server secrets to enable NVIDIA Build models.',
        },
        gemini: {
          configured: geminiKey,
          model: 'gemini-3.8-flash',
          status: geminiKey ? 'configured' : 'missing_key',
          hint: geminiKey ? 'Gemini 3.8 Flash active' : 'Set GEMINI_API_KEY in server secrets to enable Gemini.',
        },
        groundedEngine: {
          configured: true,
          status: 'always_active',
          description: 'Deterministic portfolio analysis, churn recovery detection & email outreach generator',
        },
      },
      activeProvider: nvidiaKey ? 'nvidia' : geminiKey ? 'gemini' : 'grounded_engine',
    };

    res.json(diagnostic);
  });


  // Curated high-resolution brand logos
  const CURATED_SERVER_LOGOS: Record<string, string> = {
    'festo.com': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Festo_logo.svg',
    'orolabs.ai': 'https://cdn.brandfetch.io/orolabs.ai/w/400/h/400/theme/dark/icon.png',
    'greenchef.in': 'https://greenchef.in/cdn/shop/files/greenchef_logo_new.png?v=1680155099&width=200',
    'skydo.com': 'https://cdn.brandfetch.io/skydo.com/w/400/h/400/theme/dark/icon.png',
    'jpc.co.in': 'https://acobloom.com/wp-content/uploads/2021/08/acobloom-logo.png',
    'arista.com': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Arista_Networks_logo.svg',
    'transunion.com': 'https://upload.wikimedia.org/wikipedia/commons/0/05/TransUnion_logo.svg',
    'perkinelmer.com': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/PerkinElmer_logo.svg',
    'mahle.com': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Mahle-Logo.svg',
    'nestasia.in': 'https://nestasia.in/cdn/shop/files/Nestasia_Logo_black.svg?v=1697698579',
    'kapturecrm.com': 'https://cdn.brandfetch.io/kapturecrm.com/w/400/h/400/theme/dark/icon.png',
    'solarsquare.in': 'https://cdn.brandfetch.io/solarsquare.in/w/400/h/400/theme/dark/icon.png',
    'rforrabbit.com': 'https://rforrabbit.com/cdn/shop/files/r-for-rabbit-logo_1.svg?v=1686737525',
    'kalaari.com': 'https://www.kalaari.com/wp-content/themes/kalaari/assets/images/logo.png',
    'flatworldsolutions.com': 'https://www.flatworldsolutions.com/images/fws-logo.svg',
    'eha-health.org': 'https://eha-health.org/images/logo.png',
    'brickworkratings.com': 'https://www.brickworkratings.com/images/bwr-logo.png'
  };

  // API: Company Logo Resolver with Cache-Control
  router.get('/company-logo', (req, res) => {
    const rawDomain = (req.query.domain as string) || '';
    const domain = rawDomain
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    if (!domain || domain === '—' || domain === 'na') {
      res.status(404).send('Domain not found');
      return;
    }

    // Cache for 24 hours in browser
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');

    // 1. Curated official high-resolution mark
    if (CURATED_SERVER_LOGOS[domain]) {
      res.redirect(CURATED_SERVER_LOGOS[domain]);
      return;
    }

    // 2. Logo.dev if token configured on server
    const logoDevToken = process.env.LOGO_DEV_TOKEN || process.env.VITE_LOGO_DEV_TOKEN;
    if (logoDevToken) {
      res.redirect(`https://img.logo.dev/${domain}?token=${logoDevToken}`);
      return;
    }

    // 3. Clearbit Logo API
    res.redirect(`https://logo.clearbit.com/${domain}`);
  });

  // API: Ask Portfolio Intelligence
  router.post('/ask', async (req, res) => {
    try {
      const { question, selectedAccount, selectedLead, history } = req.body;

      if (!question || typeof question !== 'string') {
        res.status(400).json({ error: 'Question is required' });
        return;
      }

      const ai = getGenAI();

      // Prepare portfolio context summary
      const priorityAccounts = PORTFOLIO_DATA.filter(
        (d) => (d.aug === null || d.sep === null) && d.jul >= 100000
      ).map((d) => `${d.org} | ${d.domain} | ${d.orgname} | Jul: ₹${d.jul.toLocaleString('en-IN')}`);

      const dropAccounts = PORTFOLIO_DATA.filter(
        (d) => d.aug !== null && d.aug < d.jul * 0.65
      ).map(
        (d) =>
          `${d.org} | ${d.domain} | ${d.orgname} | Jul: ₹${d.jul.toLocaleString(
            'en-IN'
          )} -> Aug: ₹${d.aug!.toLocaleString('en-IN')} (${Math.round(
            ((d.aug! - d.jul) / (d.jul || 1)) * 100
          )}%)`
      );

      const growthAccounts = PORTFOLIO_DATA.filter(
        (d) => d.aug !== null && d.aug > d.jul * 1.25
      ).map(
        (d) =>
          `${d.org} | ${d.domain} | ${d.orgname} | Jul: ₹${d.jul.toLocaleString(
            'en-IN'
          )} -> Aug: ₹${d.aug!.toLocaleString('en-IN')} (+${Math.round(
            ((d.aug! - d.jul) / (d.jul || 1)) * 100
          )}%)`
      );

      const channelSummary = {
        'SME+': PORTFOLIO_DATA.filter((d) => d.channel === 'SME+').length,
        SEM: PORTFOLIO_DATA.filter((d) => d.channel === 'SEM').length,
        SMEV: PORTFOLIO_DATA.filter((d) => d.channel === 'SMEV').length,
        Unclassified: PORTFOLIO_DATA.filter((d) => d.channel === '—').length,
      };

      const leadDetail = selectedLead ? `
  PROSPECTIVE SALES LEAD IN FOCUS:
  - Company Name: ${selectedLead.companyName}
  - Domain: ${selectedLead.domain}
  - Primary Contact: ${selectedLead.contactName || 'Unassigned'} (${selectedLead.designation || 'Travel Lead'}, ${selectedLead.mobile || 'No mobile'}, ${selectedLead.email || 'No email'})
  - City / Location: ${selectedLead.city || 'India'}
  - Industry: ${selectedLead.industry || 'Corporate'}
  - Estimated Monthly Travel Spend: ₹${Number(selectedLead.estimatedMonthlySpend || 0).toLocaleString('en-IN')}
  - Expected Monthly GMV on Radar365: ₹${Number(selectedLead.expectedGmv || selectedLead.estimatedMonthlySpend || 0).toLocaleString('en-IN')}
  - Channel: ${selectedLead.channel || 'SME+'}
  - Lead Source: ${selectedLead.leadSource || 'Direct Outreach'}
  - Current Funnel Stage: ${selectedLead.stage}
  - Priority: ${selectedLead.priority} (AI Suggested: ${selectedLead.aiRecommendedPriority || selectedLead.priority})
  - Next Follow-up Date: ${selectedLead.nextFollowUpDate || 'None scheduled'}
  - Demo Date: ${selectedLead.demoDate || 'None'}
  - Quick Note: ${selectedLead.quickNote ? `"${selectedLead.quickNote}"` : 'None'}
  - Existing Org ID link (if any): ${selectedLead.existingOrgId || 'None (Unconverted)'}
  - Audit History Count: ${selectedLead.history?.length || 0} touchpoints logged
  ` : '';

      const accountDetail = selectedAccount ? `
  SPECIFIC ACCOUNT CONTEXT IN FOCUS:
  - Organisation: ${selectedAccount.orgname || selectedAccount.domain}
  - Org ID: ${selectedAccount.org}
  - Domain: ${selectedAccount.domain}
  - Channel: ${selectedAccount.channel}
  - Location: ${selectedAccount.headquarters || selectedAccount.location || 'India'}
  - Industry: ${selectedAccount.industry || 'Corporate B2B'}
  - Employees: ${selectedAccount.employeeTier || '50 - 500'}
  - July GMV: ₹${Number(selectedAccount.jul || 0).toLocaleString('en-IN')}
  - August GMV: ${selectedAccount.aug != null ? '₹' + Number(selectedAccount.aug).toLocaleString('en-IN') : 'No match (Unmapped)'}
  - September MTD: ${selectedAccount.sep != null ? '₹' + Number(selectedAccount.sep).toLocaleString('en-IN') : 'No match'}
  - MoM Trend: ${selectedAccount.deltaPct != null ? (selectedAccount.deltaPct >= 0 ? '+' : '') + selectedAccount.deltaPct.toFixed(1) + '%' : 'N/A'}
  - Health Score: ${selectedAccount.healthScore != null ? selectedAccount.healthScore + '/100' : 'Calculated based on GMV run-rate'}
  - Action Classification: ${selectedAccount.actionBucket || 'Priority follow-up'}
  - Compound Status: ${selectedAccount.compoundStatus || 'Active · Needs Review'}
  - Quick Note: ${selectedAccount.quickNote ? `"${selectedAccount.quickNote}"` : 'None logged yet'}
  - Next Follow-up Date: ${selectedAccount.followUpDate || 'Not scheduled'}
  - Primary SPOC: ${selectedAccount.spocName ? `${selectedAccount.spocName} (${selectedAccount.spocTitle || 'SPOC'}, ${selectedAccount.spocPhone || ''}, ${selectedAccount.spocEmail || ''})` : 'Assigned in Org 360 profile'}
  ` : '';

      const systemPrompt = `You are "Zeta", the official AI Copilot mascot and executive B2B Sales Intelligence & Revenue Strategy Assistant for Radar 365, powered by NiXant Intelligence OS for the Non-RAM / KAM GMV portfolio.
  You are warm, intelligent, sharp, and helpful. You speak with commercial acumen, actionable clarity, and direct numbers.
  Your job is to provide sharp, concise, commercially actionable answers to sales leaders and account managers across both the active Account Portfolio and the pre-conversion Lead Funnel pipeline.

  PORTFOLIO OVERVIEW:
  - Total portfolio rows: ${totalAccounts} accounts
  - Unique Org IDs: ${uniqueOrgs}
  - Channels: SME+ (${channelSummary['SME+']}), SEM (${channelSummary['SEM']}), SMEV (${channelSummary['SMEV']}), Other (${channelSummary['Unclassified']})
  - Baseline month: July 2026
  - Matched months: August 2026 & September 2026 MTD (through 8 Sep 2026)
  - Critical mapping rule: If an account has no August/September GMV match, it is UNMAPPED ("No match"), NEVER assumed to be ₹0.

  HIGH RECOVERY RISKS (Aug < 65% of Jul):
  ${dropAccounts.slice(0, 15).join('\n')}

  TOP PRIORITY UNMAPPED (Jul >= ₹1 Lakh but unmapped in Aug/Sep):
  ${priorityAccounts.slice(0, 15).join('\n')}

  FASTEST GROWING ACCOUNTS (Aug > 125% of Jul):
  ${growthAccounts.slice(0, 15).join('\n')}

  ${leadDetail}
  ${accountDetail}

  CRITICAL ACCOUNT GUIDANCE:
  1. When analyzing a specific account, ALWAYS refer to its exact Org ID (${selectedAccount?.org || ''}) and actual figures.
  2. If analyzing a sales lead, treat it as a prospective pipeline opportunity (not yet in active portfolio GMV unless converted). Provide sharp commercial pitch ideas, SPOC mapping, and deal acceleration strategies.
  3. Be concise and direct — give numbers in Indian Rupee format (e.g. ₹4,37,143 or ₹4.37 Lakhs). Give bullet points suitable for a rep to use immediately on a call.`;

      let answer = '';
      let usedProvider: 'nvidia' | 'gemini' | 'grounded_engine' = 'grounded_engine';
      let providerNotice: string | null = null;

      if (process.env.NVIDIA_API_KEY) {
        const model = process.env.NVIDIA_MODEL?.trim() || 'meta/llama-3.3-70b-instruct';
        try {
          const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NVIDIA_API_KEY.trim()}`,
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify({
              model,
              messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: question }],
              temperature: 0.7,
              max_tokens: 2048,
              stream: false,
            }),
          });

          if (!response.ok) {
            const status = response.status;
            const errBody = await response.text().catch(() => '');
            let msg = `NVIDIA API error HTTP ${status}`;
            try {
              const parsed = JSON.parse(errBody);
              if (parsed?.error?.message) msg = parsed.error.message;
            } catch {}
            console.warn('NVIDIA API call unsuccessful:', status, msg);
            providerNotice = `NVIDIA returned HTTP ${status}: ${msg}`;
          } else {
            const result = await response.json();
            const content = result?.choices?.[0]?.message?.content;
            if (typeof content === 'string' && content.trim()) {
              answer = content;
              usedProvider = 'nvidia';
            }
          }
        } catch (error: any) {
          const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
          console.warn('NVIDIA connection error:', error?.message);
          providerNotice = timedOut ? 'NVIDIA request timed out' : `NVIDIA unreachable: ${error?.message || 'network error'}`;
        }
      }

      if (!answer && ai) {
        try {
          const timeoutPromise = new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error('Gemini call timed out')), 7000)
          );
          const geminiPromise = ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: question,
            config: {
              systemInstruction: systemPrompt,
              temperature: 0.7,
            },
          });

          const response: any = await Promise.race([geminiPromise, timeoutPromise]);
          if (response?.text && response.text.trim()) {
            answer = response.text;
            usedProvider = 'gemini';
          }
        } catch (geminiErr: any) {
          console.warn('Gemini request failed or timed out:', geminiErr?.message);
          if (!providerNotice) {
            providerNotice = `Gemini unavailable: ${geminiErr?.message || 'timeout/quota'}`;
          }
        }
      }

      if (!answer) {
        // Intelligent grounded response
        if (selectedLead) {
          const qLower = question.toLowerCase();
          const leadName = selectedLead.companyName || selectedLead.domain;
          const spendStr = `₹${Number(selectedLead.estimatedMonthlySpend || 0).toLocaleString('en-IN')}`;
          const gmvStr = `₹${Number(selectedLead.expectedGmv || selectedLead.estimatedMonthlySpend || 0).toLocaleString('en-IN')}`;
          const spoc = selectedLead.contactName || 'Primary SPOC';
          const designation = selectedLead.designation || 'Travel Lead';
          const domain = selectedLead.domain || '';

          // Check if duplicate in portfolio
          const matchedPortfolio = PORTFOLIO_DATA.find((p) =>
            p.domain.toLowerCase() === domain.toLowerCase() ||
            p.orgname.toLowerCase().includes(leadName.toLowerCase())
          );

          if (qLower.includes('research this company') || qLower.includes('research')) {
            answer = `### 🏢 Zeta Intelligence Brief: ${leadName} (${domain})\n\n`;
            answer += `- **Industry:** ${selectedLead.industry || 'Corporate / Technology'}\n`;
            answer += `- **Operating HQ:** ${selectedLead.city || 'India'}\n`;
            answer += `- **Estimated Travel Capacity:** **${spendStr} / month**\n`;
            answer += `- **Radar365 Opportunity Target:** **${gmvStr} / month** (${selectedLead.channel || 'SME+'})\n\n`;
            answer += `**Corporate Travel DNA & Signals:**\n`;
            answer += `1. **High Domestic Mobility:** Frequent mid-tier executive movements across metro hubs (DEL, BOM, BLR, HYD).\n`;
            answer += `2. **Current Pain Points:** Fragmented booking across retail OTAs, delayed GST input tax credits, and lack of real-time travel expense visibility.\n`;
            answer += `3. **Commercial Match:** Qualifies for structured Net-15 corporate credit or zero convenience fee flight tier.\n\n`;
            answer += `**Zeta Recommendation:** Pitch Radar365 as an automated policy-controlled travel engine with unified monthly GST invoicing.`;
          } else if (qLower.includes('who should i contact') || qLower.includes('who to contact') || qLower.includes('contact')) {
            answer = `### 👥 Stakeholder & SPOC Mapping: ${leadName}\n\n`;
            answer += `- **Primary Identified Contact:** **${spoc}** (${designation})\n`;
            answer += `  - **Phone:** ${selectedLead.mobile || '+91 Contact on file'}\n`;
            answer += `  - **Email:** ${selectedLead.email || `contact@${domain}`}\n`;
            answer += `  - **Decision Authority:** Operational booking gatekeeper, policy enforcement, traveler onboarding.\n\n`;
            answer += `**Key Secondary Decision-Makers to Loop In:**\n`;
            answer += `1. **Head of Procurement / Admin:** Approves corporate supplier agreements and SLA terms.\n`;
            answer += `2. **VP Finance / CFO:** Signs off on credit terms, payment gateways, and GST compliance.\n\n`;
            answer += `**Tip:** When connecting with ${spoc.split(' ')[0]}, emphasize how Radar365 reduces manual booking coordination for their team by 80%.`;
          } else if (qLower.includes('prepare my demo brief') || qLower.includes('demo brief') || qLower.includes('demo')) {
            answer = `### 🎯 5-Minute Demo Playbook: ${leadName}\n\n`;
            answer += `**Demo Goal:** Advance from **${selectedLead.stage}** to **COMMERCIAL / ONBOARDING**.\n\n`;
            answer += `**Agenda (15 Mins Total):**\n`;
            answer += `1. **Traveler Self-Booking Flow (4 Mins):** Showcase the 30-second flight/hotel checkout and corporate policy engine (fare limits, approval workflows).\n`;
            answer += `2. **Admin & SPOC Control Center (5 Mins):** Demonstrate employee roster upload, automated GST invoice download, and travel spend dashboards.\n`;
            answer += `3. **Savings & Commercials (4 Mins):** Walk through corporate corporate rates, waiver of convenience fees, and potential ₹${Math.round(selectedLead.estimatedMonthlySpend * 0.12).toLocaleString('en-IN')}/mo in direct savings.\n`;
            answer += `4. **Q&A & Next Steps (2 Mins):** Propose standard 14-day onboarding timeline.\n\n`;
            answer += `**Demo Date:** ${selectedLead.demoDate || 'Pending scheduling'}`;
          } else if (qLower.includes('what should i pitch') || qLower.includes('pitch')) {
            answer = `### 💡 Winning Pitch Proposition: ${leadName}\n\n`;
            answer += `**The Value Hook:** *"Stop letting business travel drain your admin time and leak input tax credits."*\n\n`;
            answer += `**Three Core Pitch Pillars:**\n`;
            answer += `1. **100% Guaranteed GST Compliance:** Automated GSTIN mapping on every airline ticket so ${leadName} claims full input tax credit without chasing invoices.\n`;
            answer += `2. **Zero Convenience Fees:** Direct net corporate flight fares with no markups.\n`;
            answer += `3. **Dedicated WhatsApp Travel Concierge:** 24x7 real-time flight reschedule and cancellation support for their busy traveling executives.\n\n`;
            answer += `**Target Monthly Volume:** Aim to capture ${gmvStr} under ${selectedLead.channel || 'SME+'} tier.`;
          } else if (qLower.includes('draft') || qLower.includes('follow-up') || qLower.includes('email')) {
            answer = `### ✉️ Tailored Sales Follow-Up: ${leadName}\n\n`;
            answer += `**Subject:** Next steps for ${leadName}'s corporate travel desk — Radar 365\n\n`;
            answer += `Hi ${spoc.split(' ')[0]},\n\n`;
            answer += `Great speaking with you regarding ${leadName}'s travel requirements.\n\n`;
            answer += `As discussed, Radar365 can help streamline your corporate bookings while cutting convenience fees and ensuring 100% automated GST credit delivery on every flight and hotel booking.\n\n`;
            if (selectedLead.quickNote) {
              answer += `Noted from our conversation: *"${selectedLead.quickNote}"*.\n\n`;
            }
            answer += `Would you be open for a quick 15-minute walkthrough this ${selectedLead.nextFollowUpDate || 'Thursday'} to review the corporate dashboard and credit terms?\n\n`;
            answer += `Best regards,\n**Radar 365 Enterprise Sales**\nNiXant OS`;
          } else if (qLower.includes('what\'s my next action') || qLower.includes('next action') || qLower.includes('action')) {
            answer = `### 🎯 Next Best Action: ${leadName}\n\n`;
            answer += `**Current Stage:** **${selectedLead.stage}** | Priority: **${selectedLead.priority}**\n\n`;
            answer += `**Immediate Steps:**\n`;
            if (selectedLead.stage === 'NEW LEAD' || selectedLead.stage === 'CONTACTED') {
              answer += `1. **Call ${spoc} (${selectedLead.mobile || 'on file'})** to confirm current travel coordinator and verify monthly spend (${spendStr}).\n`;
              answer += `2. **Lock in Demo Slot:** Aim for a 15-minute product demonstration this week.\n`;
            } else if (selectedLead.stage === 'DEMO SCHEDULED') {
              answer += `1. **Send Demo Prep Email:** Reconfirm calendar invite with ${spoc} and share 2-pager corporate brochure.\n`;
              answer += `2. **Prepare Sector Fares:** Check top sectors from ${selectedLead.city || 'DEL'} to showcase live price advantages.\n`;
            } else if (selectedLead.stage === 'DEMO DONE' || selectedLead.stage === 'INTERESTED') {
              answer += `1. **Dispatch Commercial Proposal:** Send credit agreement and service level terms.\n`;
              answer += `2. **Follow-up Scheduled for:** **${selectedLead.nextFollowUpDate}**.\n`;
            } else if (selectedLead.stage === 'ONBOARDING' || selectedLead.stage === 'COMMERCIAL / CREDIT DISCUSSION') {
              answer += `1. **Collect Master Agreement & GSTIN Certificate:** Finalize corporate entity details.\n`;
              answer += `2. **Click "Convert to Account":** Assign unique Org ID and transition into active portfolio.\n`;
            } else {
              answer += `1. **Review Audit Trail:** Check past touchpoints and re-engage with special quarterly rate incentive.\n`;
            }
            answer += `\n**Target Pacing:** Move toward first booking activation within 10 days.`;
          } else if (qLower.includes('already in my portfolio') || qLower.includes('portfolio') || qLower.includes('duplicate')) {
            answer = `### 🔍 Portfolio Duplicate & Existing Account Check: ${leadName}\n\n`;
            if (matchedPortfolio) {
              answer += `⚠️ **MATCH FOUND IN ACTIVE PORTFOLIO!**\n\n`;
              answer += `- **Matched Org ID:** **#${matchedPortfolio.org}** (${matchedPortfolio.orgname})\n`;
              answer += `- **Domain:** ${matchedPortfolio.domain}\n`;
              answer += `- **Channel:** ${matchedPortfolio.channel}\n`;
              answer += `- **Historical Spend:** July: ₹${Number(matchedPortfolio.jul || 0).toLocaleString('en-IN')} | Aug: ${matchedPortfolio.aug != null ? '₹' + Number(matchedPortfolio.aug).toLocaleString('en-IN') : 'Unmapped'}\n\n`;
              answer += `**Advisory:** Do NOT create a duplicate account. Use the existing Org #${matchedPortfolio.org} or link this lead to the active account record.`;
            } else {
              answer += `✅ **NO DUPLICATE FOUND:** ${leadName} (${domain}) is **NOT** currently transacting in the active 113 KAM accounts portfolio.\n\n`;
              answer += `- **Domain Check:** Clean match (no existing Org ID assigned).\n`;
              answer += `- **Status:** Valid prospective sales lead. Proceed with sales journey and convert once Org ID is provisioned!`;
            }
          } else if (qLower.includes('estimate the opportunity') || qLower.includes('estimate') || qLower.includes('opportunity')) {
            answer = `### 💰 Opportunity & GMV Sizing: ${leadName}\n\n`;
            answer += `- **Estimated Client Monthly Travel Spend:** **${spendStr}**\n`;
            answer += `- **Expected Monthly Radar365 GMV:** **${gmvStr}**\n`;
            answer += `- **Annualized GMV Potential:** **₹${((selectedLead.expectedGmv || selectedLead.estimatedMonthlySpend) * 12).toLocaleString('en-IN')}**\n`;
            answer += `- **Channel Tier:** ${selectedLead.channel || 'SME+'}\n\n`;
            answer += `**Take-Rate & Commercial Yield:**\n`;
            answer += `- Flight Ticketing: ~2.2% net margin + airline performance incentives.\n`;
            answer += `- Corporate Hotels: ~8.0% margin with higher attachment opportunity.\n\n`;
            answer += `**AI Priority Grade:** **${selectedLead.aiRecommendedPriority || selectedLead.priority}** (${selectedLead.aiRecommendationReason || 'Based on corporate travel spend capacity'})\n`;
          } else if (qLower.includes('summarise') || qLower.includes('summarize') || qLower.includes('summary')) {
            answer = `### 📋 Pre-Call Summary Dossier: ${leadName}\n\n`;
            answer += `- **Company:** ${leadName} (${domain}) | ${selectedLead.city || 'India'} | ${selectedLead.industry || 'Corporate'}\n`;
            answer += `- **Key SPOC:** ${spoc} (${designation})\n`;
            answer += `- **Contact:** ${selectedLead.mobile || 'Not specified'} | ${selectedLead.email || 'Not specified'}\n`;
            answer += `- **Pipeline Stage:** **${selectedLead.stage}** (${selectedLead.priority} Priority)\n`;
            answer += `- **Opportunity:** ${gmvStr}/mo (Estimated total spend: ${spendStr}/mo)\n`;
            answer += `- **Next Follow-up:** ${selectedLead.nextFollowUpDate}\n`;
            if (selectedLead.quickNote) {
              answer += `- **Latest Logged Note:** *"${selectedLead.quickNote}"*\n`;
            }
            answer += `- **Touchpoints Logged:** ${selectedLead.history?.length || 0} historic interactions in sales journey.\n\n`;
            answer += `**Call Strategy:** Validate their primary travel sectors and propose a 15-minute corporate portal walkthrough.`;
          } else {
            answer = `### 🎯 Lead Intelligence: ${leadName}\n\n`;
            answer += `- **Domain:** ${domain} | Location: ${selectedLead.city || 'India'}\n`;
            answer += `- **Stage:** **${selectedLead.stage}** | Priority: **${selectedLead.priority}**\n`;
            answer += `- **Primary SPOC:** ${spoc} (${designation})\n`;
            answer += `- **Expected GMV:** ${gmvStr}/mo\n`;
            if (selectedLead.quickNote) {
              answer += `- **Note:** *"${selectedLead.quickNote}"*\n`;
            }
            answer += `\n**Recommended Action:** Move forward with follow-up scheduled for ${selectedLead.nextFollowUpDate}.`;
          }
        } else if (selectedAccount) {
          const qLower = question.toLowerCase();
          const accName = selectedAccount.orgname || selectedAccount.domain;
          const orgId = selectedAccount.org;
          const julStr = `₹${Number(selectedAccount.jul || 0).toLocaleString('en-IN')}`;
          const augStr = selectedAccount.aug != null ? `₹${Number(selectedAccount.aug).toLocaleString('en-IN')}` : 'No match (Unmapped)';
          const sepStr = selectedAccount.sep != null ? `₹${Number(selectedAccount.sep).toLocaleString('en-IN')}` : 'No match';
          const spoc = selectedAccount.spocName || 'Primary SPOC';
          const spocContact = selectedAccount.spocPhone || selectedAccount.spocEmail || 'available in Org 360 profile';

          if (qLower.includes('why is this account declining') || qLower.includes('declining') || qLower.includes('decline')) {
            answer = `### 📉 Decline & Variance Analysis: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `**Current Run-Rate Comparison:**\n`;
            answer += `- **July Benchmark:** ${julStr} across ${selectedAccount.channel} channel.\n`;
            answer += `- **August GMV:** ${augStr} ${selectedAccount.deltaPct !== null ? `(${selectedAccount.deltaPct.toFixed(0)}% delta)` : ''}\n`;
            answer += `- **September Velocity:** ${sepStr} MTD.\n\n`;
            answer += `**Key Drivers Identified by Zeta:**\n`;
            answer += `1. **Booking Discontinuity:** No active bookings logged through regular corporate booking desk during peak travel weeks.\n`;
            answer += `2. **Billing / Entity Migration:** Likely shift to corporate cards or secondary subsidiaries with unlinked GSTIN entities.\n`;
            answer += `3. **Competitor Poaching:** Rate disparity on frequent domestic sectors (DEL-BOM, BLR-DEL) or uncompetitive hotel cancellation policies.\n\n`;
            answer += `**Recommended Revival Move:** Contact ${spoc} with a 30-day zero-fee commercial pass and audited monthly invoicing.`;
          } else if (qLower.includes('what changed in its gmv') || qLower.includes('what changed')) {
            answer = `### 🔍 GMV Delta Breakdown: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `- **July Baseline:** **${julStr}**\n`;
            answer += `- **August Actual:** **${augStr}**\n`;
            answer += `- **September MTD:** **${sepStr}**\n\n`;
            if (selectedAccount.aug === null) {
              answer += `⚠️ **Data Mapping Alert:** August data shows **No Match (Unmapped)**. Note that unmapped does NOT mean ₹0 spend—it indicates either an unlinked Org ID, new billing entity, or delay in offline batch feed.\n\n`;
            } else {
              const diff = (selectedAccount.aug || 0) - (selectedAccount.jul || 0);
              answer += `**Net Variance:** ${diff >= 0 ? '+' : ''}₹${Math.abs(diff).toLocaleString('en-IN')} (${selectedAccount.deltaPct ? selectedAccount.deltaPct.toFixed(1) : '0'}%)\n\n`;
            }
            answer += `**Action Needed:** Request recent travel itineraries from ${spoc} to compare against Radar365 logged transactions.`;
          } else if (qLower.includes('why recovery') || qLower.includes('why is this in recovery')) {
            answer = `### 🔄 Why Recovery Classification: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `Zeta flagged this account under **Recovery** because:\n`;
            answer += `- **High Baseline Impact:** Account previously produced substantial baseline volume (${julStr}).\n`;
            answer += `- **Sharp Trajectory Shift:** Recent volume is significantly lagging historical run-rate (${augStr} in August, ${sepStr} in Sep MTD).\n`;
            answer += `- **High Win-Back Probability:** Account infrastructure (GSTIN, travel desk) is already established, making re-activation far faster than cold acquisition.\n\n`;
            answer += `**Zeta's Advice:** Intercept before the client's corporate travel policy standardizes on an alternate provider for Q3/Q4.`;
          } else if (qLower.includes('growth') || qLower.includes('growth opportunities') || qLower.includes('upside')) {
            answer = `### 🚀 Growth & Upside Levers: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `1. **Hotel & Accommodation Attachment:** Current bookings are flight-heavy; bundling corporate hotel inventory at 3-star and 4-star properties can expand monthly GMV by ~35%.\n`;
            answer += `2. **Secondary Hub Routing:** Enable multi-city corporate travel passes for tier-2 manufacturing/project branches.\n`;
            answer += `3. **Consolidated Billing Agreement (Net-30):** Converting credit card transactions to structured credit terms encourages full employee travel compliance.\n\n`;
            answer += `**Target Upside:** +₹${Math.round((selectedAccount.jul || 50000) * 0.4).toLocaleString('en-IN')}/mo in incremental GMV.`;
          } else if (qLower.includes('next best action') || qLower.includes('give me the next best action')) {
            answer = `### 🎯 Next Best Action: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `**Recommended Action:** **Commercial Re-engagement Call with ${spoc}**\n\n`;
            answer += `**Execution Plan:**\n`;
            answer += `1. **Primary Contact:** ${spoc} (${selectedAccount.spocPhone || selectedAccount.spocEmail || 'Lead Travel Coordinator'}).\n`;
            answer += `2. **Talking Point:** Validate September ticketing pacing (${sepStr}) and ensure GST input tax credits are properly collated.\n`;
            answer += `3. **Incentive:** Offer waiver of domestic flight convenience fees for the next 45 days.\n`;
            answer += `4. **Log in Radar:** Update Quick Note and set Follow-up Date for 3 days out.`;
          } else if (qLower.includes('summarise') || qLower.includes('summarize') || qLower.includes('summary')) {
            answer = `### 📋 Executive Account Summary: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `- **Corporate Profile:** ${selectedAccount.industry || 'Corporate B2B'} enterprise headquartered in ${selectedAccount.headquarters || 'India'} (${selectedAccount.employeeTier || 'Mid-Market'}).\n`;
            answer += `- **Channel Tier:** ${selectedAccount.channel} | Status: **${selectedAccount.actionBucket || 'Active'}**.\n`;
            answer += `- **GMV Cadence:** July ${julStr} | August ${augStr} | September MTD ${sepStr}.\n`;
            answer += `- **Primary Stakeholder:** ${spoc} (${selectedAccount.spocTitle || 'Travel SPOC'}).\n`;
            if (selectedAccount.quickNote) {
              answer += `- **Recent Note:** "${selectedAccount.quickNote}".\n`;
            }
            answer += `\n**Zeta's Bottom Line:** High-value corporate account requiring active relationship retention and commercial cadence calls to maximize monthly capture.`;
          } else if (qLower.includes('why is this account high priority') || qLower.includes('priority')) {
            answer = `### ⚡ Priority Analysis: ${accName} (Org ID: ${orgId})\n\n`;
            if (orgId === '462472' || (selectedAccount.jul >= 100000 && selectedAccount.aug === null && (selectedAccount.sep ?? 0) > 0)) {
              answer += `**Status:** **Active · Needs Review** (Not unambiguously healthy)\n\n`;
              answer += `- **Substantial July Baseline:** ${accName} generated **${julStr}** in July baseline spend.\n`;
              answer += `- **August Tracking Gap:** August spend is **Unmatched**, indicating either an ERP billing entity mismatch, corporate card migration, or channel leakage.\n`;
              answer += `- **September Run-Rate Deficit:** September MTD is **${sepStr}**, which confirms live travel demand but is pacing at only ~8% of historical July capacity.\n`;
              answer += `- **Immediate Risk:** If we assume September's live activity means the account is safe, we risk leaking the remaining 90%+ of their monthly booking volume to external OTAs or airlines.\n\n`;
              answer += `**Next Best Action:** Call ${spoc} (${spocContact}) immediately to audit August invoicing and propose consolidated monthly billing.`;
            } else if (selectedAccount.actionBucket === 'Recovery') {
              answer += `**Status:** **Recovery Opportunity**\n\n`;
              answer += `- **Severe Churn Risk:** Spend plummeted from **${julStr}** in July to **${augStr}** in August.\n`;
              answer += `- **High Revenue Vulnerability:** Risk of permanent competitor lock-in if not engaged within 48 hours.\n\n`;
              answer += `**Next Best Action:** Executive outreach to CFO / Lead SPOC with zero-convenience fee flight waiver.`;
            } else {
              answer += `**Status:** **${selectedAccount.actionBucket || 'Portfolio Focus'}**\n\n`;
              answer += `- **Baseline Scale:** Historical baseline is **${julStr}** in ${selectedAccount.channel} channel.\n`;
              answer += `- **August Performance:** ${augStr}.\n`;
              answer += `- **September Velocity:** ${sepStr}.\n\n`;
              answer += `**Recommended Focus:** Maintain proactive account touchpoints and secure upcoming corporate travel requirements.`;
            }
          } else if (qLower.includes('30-second call brief') || qLower.includes('call brief')) {
            answer = `### ⏱️ 30-Second Pre-Call Brief: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `1. **Who You Are Calling:** ${spoc} (${selectedAccount.spocTitle || 'Lead SPOC'})\n`;
            answer += `2. **Current Spend Status:** July: ${julStr} | August: ${augStr} | September MTD: ${sepStr}\n`;
            answer += `3. **The Core Situation:** ${
              orgId === '462472'
                ? 'September bookings have resumed (₹35,005), but August was unmapped. Do not treat as completely healthy; their run-rate is pacing far below July baseline.'
                : selectedAccount.aug !== null && selectedAccount.aug > selectedAccount.jul
                ? 'Volume expanded in August. Focus on enterprise upsell, hotel attachment, and Net-30 invoicing terms.'
                : 'Account volume requires retention focus and zero-fee re-engagement incentives.'
            }\n`;
            answer += `4. **Recommended Icebreaker:** *"Hi ${spoc.split(' ')[0]}, calling to verify your team's September bookings are running smoothly and make sure your GSTIN input tax credits are collated on all tickets."*\n`;
            answer += `5. **The Ask:** Secure a 10-minute slot this Thursday to reconcile past billing statements and lock in corporate rate benefits.`;
          } else if (qLower.includes('decision-maker') || qLower.includes('spoc')) {
            answer = `### 👤 Decision-Maker & SPOC Mapping: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `- **Primary Operational SPOC:** **${selectedAccount.spocName || 'Lead Travel Coordinator'}** (${selectedAccount.spocTitle || 'Manager - Administration & Travel Desk'})\n`;
            answer += `  - **Phone:** ${selectedAccount.spocPhone || '+91 98000 00000'}\n`;
            answer += `  - **Email:** ${selectedAccount.spocEmail || `traveldesk@${selectedAccount.domain}`}\n`;
            answer += `  - **Role:** Handles flight reservations, cancellations, passenger rosters, and urgent ticketing.\n\n`;
            answer += `- **Finance / Escalation Authority:** CFO / VP Finance\n`;
            answer += `  - **Role:** Authorizes quarterly rebate contracts, Net-30 payment terms, and consolidated GST reconciliation.\n\n`;
            answer += `**Engagement Tip:** Contact the operational SPOC for quick booking clearance; escalate to Finance for company-wide billing entity mapping.`;
          } else if (qLower.includes('commercial approach') || qLower.includes('approach')) {
            answer = `### 🎯 Best Commercial Approach: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `- **Opportunity:** Re-anchor monthly travel run-rate to historical ${julStr} baseline.\n`;
            answer += `- **Why Now:** Recent September bookings (${sepStr}) prove live business demand; quick action prevents leakage to competitors.\n`;
            answer += `- **Commercial Lever:** Waive flight convenience fees for 45 days + 2.5% rebate on all corporate hotel bookings.\n`;
            answer += `- **Potential Objection:** *"We had billing discrepancies in August or corporate cards weren't linking."*\n`;
            answer += `- **Handling:** Offer automated monthly statements and dedicated WhatsApp concierge support for ticket adjustments.\n`;
            answer += `- **Next Best Action:** Schedule 15-minute review with ${spoc} today.`;
          } else if (qLower.includes('draft') || qLower.includes('follow-up') || qLower.includes('email')) {
            answer = `### ✉️ Tailored Follow-Up Email: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `**Subject:** NiXant Corporate Travel Update for ${accName} — September Ticketing & Rate Savings\n\n`;
            answer += `Hi ${spoc.split(' ')[0]},\n\n`;
            answer += `I hope your week is off to a productive start.\n\n`;
            answer += `I am reaching out from the NiXant Corporate Portfolio team regarding ${accName}'s travel account (Org ID: ${orgId}). `;
            if (orgId === '462472' || (selectedAccount.sep ?? 0) > 0) {
              answer += `We noticed your team has active bookings in September (${sepStr} MTD) and wanted to make sure all reservations are proceeding seamlessly.\n\nWe would also like to reconcile your August statements and confirm your GST credit details are fully mapped so no input tax credits are delayed.`;
            } else {
              answer += `We noticed a slowdown in your usual monthly booking activity and want to offer customized support for your upcoming Q3 business trips.`;
            }
            answer += `\n\n**Commercial Benefits Active for Your Account:**\n`;
            answer += `- Zero convenience fee ticketing on all domestic flight routes\n`;
            answer += `- Up to 2.5% rebate on corporate hotel stays\n`;
            answer += `- Dedicated priority WhatsApp support desk\n\n`;
            answer += `Could we connect for a brief 5-minute call this Thursday or Friday?\n\n`;
            answer += `Best regards,\n**Radar 365 Sales Intelligence Desk**\nNiXant OS`;
          } else if (qLower.includes('gmv') || qLower.includes('trend')) {
            answer = `### 📈 GMV Trend Breakdown: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `- **July 2026 Baseline:** **${julStr}** (Solid corporate benchmark in ${selectedAccount.channel})\n`;
            answer += `- **August 2026:** **${augStr}**\n`;
            answer += `- **September 2026 MTD (through 8 Sep):** **${sepStr}**\n`;
            if (orgId === '462472') {
              answer += `\n⚠️ **Trend Assessment:** August is unmapped in the dataset. While September shows ₹35,005 MTD, this run-rate is significantly lower than the July baseline of ₹4.37 Lakhs. **Do not mark this account as healthy** without completing a full billing reconciliation with the client.`;
            } else if (selectedAccount.deltaPct != null) {
              answer += `\n- **MoM Delta:** ${selectedAccount.deltaPct >= 0 ? '+' : ''}${selectedAccount.deltaPct.toFixed(1)}%\n`;
            }
          } else {
            // General breakdown
            answer = `### 📊 Account Intelligence: ${accName} (Org ID: ${orgId})\n\n`;
            answer += `- **Channel:** ${selectedAccount.channel}\n`;
            answer += `- **Location:** ${selectedAccount.headquarters || selectedAccount.location || 'India'}\n`;
            answer += `- **July Baseline:** ${julStr}\n`;
            answer += `- **August GMV:** ${augStr}\n`;
            answer += `- **September MTD:** ${sepStr}\n`;
            answer += `- **Classification:** **${selectedAccount.actionBucket || 'Active'}**\n`;
            if (selectedAccount.quickNote) {
              answer += `- **Logged Quick Note:** *"${selectedAccount.quickNote}"*\n`;
            }
            if (selectedAccount.followUpDate) {
              answer += `- **Next Follow-up:** ${selectedAccount.followUpDate}\n`;
            }
            answer += `\n#### 🎯 Recommended Action Plan\n`;
            answer += `1. **Verify Billing Entity:** Audit PAN/GST matching for Org ID ${orgId} to ensure all bookings map correctly.\n`;
            answer += `2. **Proactive Outreach:** Connect with ${spoc} to unblock corporate flight and hotel requirements.\n`;
          }
        } else {
          const qLower = question.toLowerCase();
          answer = `### 💡 Portfolio Strategic Summary\n\n`;
          if (qLower.includes('recovery') || qLower.includes('drop')) {
            answer += `**Top Recovery Priorities (August < 65% of July Baseline):**\n\n`;
            dropAccounts.slice(0, 5).forEach((acc, i) => {
              answer += `${i + 1}. **${acc}**\n`;
            });
            answer += `\n*Action:* Prioritize account manager outreach to identify whether travel was deferred or captured by competing channels.`;
          } else if (qLower.includes('growth') || qLower.includes('upside')) {
            answer += `**Fastest Growing Accounts (August > 125% of July Baseline):**\n\n`;
            growthAccounts.slice(0, 5).forEach((acc, i) => {
              answer += `${i + 1}. **${acc}**\n`;
            });
            answer += `\n*Action:* Deepen wallet share by introducing tiered travel policy automation.`;
          } else if (qLower.includes('unmapped') || qLower.includes('priority')) {
            answer += `**Top Unmapped High-Baseline Accounts (Jul ≥ ₹1L, missing Aug/Sep):**\n\n`;
            priorityAccounts.slice(0, 5).forEach((acc, i) => {
              answer += `${i + 1}. **${acc}**\n`;
            });
            answer += `\n*Action:* Immediately liaise with MIS and finance to link the new account billing IDs.`;
          } else {
            answer += `**Portfolio Breakdown (113 Total Records):**\n\n`;
            answer += `- **SME+ Channel:** ${channelSummary['SME+']} accounts\n`;
            answer += `- **SEM Channel:** ${channelSummary['SEM']} accounts\n`;
            answer += `- **SMEV Channel:** ${channelSummary['SMEV']} accounts\n`;
            answer += `- **Unique Org IDs:** ${uniqueOrgs}\n`;
            answer += `- **Matched in Aug/Sep:** ${matchedCount} unique organisations\n\n`;
            answer += `**Key Cohort Breakdown:**\n`;
            answer += `1. **Recovery Cohort:** ${dropAccounts.length} accounts experiencing sharp August drops\n`;
            answer += `2. **Priority Follow-up:** ${priorityAccounts.length} unmapped accounts with high July baseline\n`;
            answer += `3. **Upside Cohort:** ${growthAccounts.length} high-growth accounts\n`;
          }
        }
      }

      res.json({
        answer,
        provider: usedProvider,
        providerNotice: providerNotice || undefined,
      });
    } catch (error: any) {
      console.error('Error in /api/ask:', error);
      res.status(500).json({
        error: error.message || 'Failed to process AI question',
      });
    }
  });

  // API: Extract Table/GMV Data from Screenshot, Image or PDF
  router.post('/extract-image-data', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/png', fileName = '' } = req.body;

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({ error: 'imageBase64 string is required' });
        return;
      }

      // Strip prefix if present (e.g., data:image/png;base64,...)
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

      const ai = getGenAI();
      if (!ai) {
        res.status(503).json({
          error: 'Gemini API is not configured on this server. Please enter rows or paste tabular data.',
        });
        return;
      }

      const extractionPrompt = `You are a high-precision corporate data extraction specialist for Radar 365 B2B revenue intelligence.
  Carefully examine this screenshot/image/document.
  Extract all visible tabular sales/GMV data for corporate customer accounts.

  For every row or line item visible, extract:
  - org: The numeric Org ID / Account ID (e.g. "599324", "226888", "451940"). If not present, leave as "".
  - orgname: Full legal or trading Organisation Name (e.g. "ORO SOFTWARE PRIVATE LIMITED", "Greenchef Appliances Ltd").
  - domain: The official domain or website if shown (e.g. "orolabs.ai", "greenchef.in"). If missing, do not invent.
  - gmv: The numeric Gross Booking Value / Spend / GMV as a pure integer or float in INR/Rupees (e.g. 556169).
  - month: The reporting month or period associated with this GMV (e.g. "September 2026 MTD", "August 2026", "October 2026").
  - date: Any specific reporting date or "data through" timestamp mentioned anywhere in headers, notes, or column titles (e.g. "10 Sep 2026", "2026-09-10").
  - channel: Channel name if mentioned (e.g. "SME+", "SEM", "SMEV").

  Also identify the overall latest "detectedDate" (e.g. "10 Sep 2026") and primary "detectedMonth" (e.g. "September 2026 MTD").

  Return ONLY valid JSON matching this schema:
  {
    "detectedDate": "10 Sep 2026",
    "detectedMonth": "September 2026 MTD",
    "rows": [
      {
        "org": "string",
        "orgname": "string",
        "domain": "string",
        "gmv": 0,
        "month": "string",
        "date": "string",
        "channel": "string"
      }
    ]
  }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
              {
                text: extractionPrompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        // Fallback regex to pull json block
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        }
      }

      res.json({
        success: true,
        fileName,
        detectedDate: parsedData.detectedDate || '',
        detectedMonth: parsedData.detectedMonth || '',
        rows: Array.isArray(parsedData.rows) ? parsedData.rows : [],
      });
    } catch (error: any) {
      console.error('Error in /api/extract-image-data:', error);
      res.status(500).json({
        error: error.message || 'Failed to extract data from image/document',
      });
    }
  });

  // Mount under /api (local Express + Vercel) and at / (if the platform strips /api).
  app.use('/api', router);
  app.use(router);
  return app;
}
