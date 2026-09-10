import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { PORTFOLIO_DATA } from './src/data/portfolioData';

const app = express();
const PORT = 3000;

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

const julTotal = PORTFOLIO_DATA.reduce((acc, curr) => {
  // dedupe by org
  return acc;
}, 0);

// API: Status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    service: 'Radar 365 by NiXant Intelligence OS',
    totalRows: totalAccounts,
    uniqueOrgs,
    matchedCount,
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
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
app.get('/api/company-logo', (req, res) => {
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
app.post('/api/ask', async (req, res) => {
  try {
    const { question, selectedAccount, history } = req.body;

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

    const systemPrompt = `You are "Radar 365 AI", an executive B2B Sales Intelligence & Revenue Strategy Assistant powered by NiXant Intelligence OS for the Non-RAM / KAM GMV portfolio.
Your job is to provide sharp, concise, commercially actionable answers to sales leaders and account managers.

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

${
  selectedAccount
    ? `SPECIFIC ACCOUNT CONTEXT IN FOCUS:
- Org ID: ${selectedAccount.org}
- Domain: ${selectedAccount.domain}
- Organisation: ${selectedAccount.orgname}
- Channel: ${selectedAccount.channel}
- July GMV: ₹${Number(selectedAccount.jul || 0).toLocaleString('en-IN')}
- August GMV: ${selectedAccount.aug != null ? '₹' + Number(selectedAccount.aug).toLocaleString('en-IN') : 'No match'}
- September MTD: ${selectedAccount.sep != null ? '₹' + Number(selectedAccount.sep).toLocaleString('en-IN') : 'No match'}
- Action Category: ${selectedAccount.actionBucket || 'N/A'}`
    : ''
}

GUIDELINES:
1. Provide crisp, structured bullet points with exact numbers in Indian Rupee format (e.g. ₹1.25 Lakhs or ₹1,25,000).
2. When asked for emails or follow-ups, draft high-converting, professional B2B outreach tailored to the account's travel pattern.
3. Highlight actionable next steps: who to call, what questions to ask, and how to unblock spend.`;

    let answer = '';
    if (ai) {
      try {
        const timeoutPromise = new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini call timed out')), 6000)
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
        answer = response?.text || '';
      } catch (geminiErr: any) {
        console.warn('Gemini request failed or timed out, using grounded portfolio engine:', geminiErr?.message);
      }
    }

    if (!answer) {
      // Intelligent grounded portfolio answer
      if (selectedAccount) {
        answer = `### 📊 Account Intelligence: ${selectedAccount.orgname} (${selectedAccount.domain || selectedAccount.org})\n\n`;
        answer += `- **Channel:** ${selectedAccount.channel}\n`;
        answer += `- **July Baseline:** ₹${Number(selectedAccount.jul || 0).toLocaleString('en-IN')}\n`;
        answer += `- **August GMV:** ${selectedAccount.aug != null ? '₹' + Number(selectedAccount.aug).toLocaleString('en-IN') : 'No match (Unmapped)'}\n`;
        answer += `- **September MTD:** ${selectedAccount.sep != null ? '₹' + Number(selectedAccount.sep).toLocaleString('en-IN') : 'No match'}\n`;
        if (selectedAccount.deltaPct != null) {
          answer += `- **Month-over-Month Delta:** ${selectedAccount.deltaPct >= 0 ? '+' : ''}${selectedAccount.deltaPct.toFixed(1)}%\n`;
        }
        answer += `- **Classification:** **${selectedAccount.actionBucket}**\n\n`;

        answer += `#### 🎯 Recommended Action Plan\n`;
        if (selectedAccount.actionBucket === 'Priority follow-up') {
          answer += `1. **Billing Entity Trace:** This account achieved significant July GMV (₹${Number(selectedAccount.jul).toLocaleString('en-IN')}) but lacks August tracking. Cross-reference PAN/GST with Finance.\n`;
          answer += `2. **Travel Admin Check-in:** Connect with company POC to verify if booking volume shifted to another legal entity or sub-account.\n`;
        } else if (selectedAccount.actionBucket === 'Recovery') {
          answer += `1. **Leakage Audit:** August spend dropped sharply compared to July baseline. Inquire whether project travels slowed down or if offline agency bookings occurred.\n`;
          answer += `2. **Re-engagement Offer:** Introduce incentive discounts on top routes and hotel preferred corporate tariffs.\n`;
        } else if (selectedAccount.actionBucket === 'Upside') {
          answer += `1. **Account Expansion:** Account demonstrated strong GMV acceleration in August. Offer corporate credit line review or flight pass packages.\n`;
          answer += `2. **Vertical Cross-Sell:** Explore group travel bookings, offsite events, or car rental integration.\n`;
        } else {
          answer += `1. **Cadence Monitoring:** Account maintains consistent volume. Schedule monthly business review.\n`;
        }

        answer += `\n#### ✉️ Draft Outreach Email Template\n\`\`\`\n`;
        answer += `Subject: Checking in on corporate travel support for ${selectedAccount.orgname}\n\n`;
        answer += `Hi Team,\n\n`;
        answer += `I wanted to reach out regarding your corporate travel partnership for ${selectedAccount.orgname}. `;
        if (selectedAccount.actionBucket === 'Recovery') {
          answer += `We noticed a slight dip in your team's flight and hotel reservations last month and wanted to ensure your travelers have had a seamless booking experience.\n\nAre there any upcoming project travels or team offsites where our corporate desk can assist with negotiated corporate rates?`;
        } else if (selectedAccount.actionBucket === 'Upside') {
          answer += `We noticed increased travel activity across your team recently. We would love to review your top routes to ensure maximum corporate cashback and flight waivers are activated for your account.`;
        } else {
          answer += `We want to ensure your account management and corporate travel bookings are running smoothly for Q3.`;
        }
        answer += `\n\nBest regards,\nNixant Corporate Accounts Team\n\`\`\``;
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

    res.json({ answer });
  } catch (error: any) {
    console.error('Error in /api/ask:', error);
    res.status(500).json({
      error: error.message || 'Failed to process AI question',
    });
  }
});

// API: Extract Table/GMV Data from Screenshot, Image or PDF
app.post('/api/extract-image-data', async (req, res) => {
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

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GMV Portfolio Server running on port ${PORT}`);
  });
}

startServer();
