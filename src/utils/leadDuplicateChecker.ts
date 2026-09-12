import { Lead, PortfolioRecord, LeadDuplicateCheckResult, LeadDuplicateMatch } from '../types';

/**
 * Normalizes domain strings (removes protocol, www, trailing slashes, path)
 */
export function normalizeDomain(domainStr: string): string {
  if (!domainStr) return '';
  let clean = domainStr.trim().toLowerCase();
  clean = clean.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '');
  clean = clean.split('/')[0].split('?')[0];
  return clean;
}

/**
 * Extracts domain from an email address
 */
export function extractEmailDomain(email: string): string {
  if (!email || !email.includes('@')) return '';
  const parts = email.trim().toLowerCase().split('@');
  return parts[parts.length - 1];
}

/**
 * Normalizes company name for comparison
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/\b(pvt|ltd|limited|private|technologies|solutions|services|india|corp|corporation|inc|llp)\b/gi, '')
    .replace(/[^a-z0-9]/gi, '')
    .trim();
}

/**
 * Comprehensive duplicate detection across Portfolio Accounts and Existing Leads
 */
export function checkLeadDuplicate(
  candidate: {
    id?: string;
    companyName?: string;
    domain?: string;
    email?: string;
    existingOrgId?: string;
    gstin?: string;
  },
  existingLeads: Lead[],
  portfolioAccounts: PortfolioRecord[]
): LeadDuplicateCheckResult {
  const matches: LeadDuplicateMatch[] = [];

  const candidateDomain = normalizeDomain(candidate.domain || '');
  const candidateEmailDomain = extractEmailDomain(candidate.email || '');
  const candidateCleanName = normalizeCompanyName(candidate.companyName || '');
  const candidateOrgId = candidate.existingOrgId?.trim();
  const candidateGstin = candidate.gstin?.trim().toUpperCase();

  // 1. Check against Portfolio Accounts (Active/Existing customer base)
  for (const acc of portfolioAccounts) {
    const accDomain = normalizeDomain(acc.domain || '');
    const accCleanName = normalizeCompanyName(acc.orgname || '');
    const accOrgId = acc.org?.trim();

    // Org ID match (Exact)
    if (candidateOrgId && accOrgId && candidateOrgId === accOrgId) {
      matches.push({
        type: 'Portfolio Account',
        matchedOn: 'Org ID',
        identifier: accOrgId,
        recordName: acc.orgname || acc.domain,
        details: `Active Portfolio Org #${acc.org} (${acc.channel})`,
        recordId: acc.org,
        status: 'Active Account'
      });
      continue;
    }

    // Domain match (Exact normalized)
    if (candidateDomain && accDomain && candidateDomain === accDomain) {
      matches.push({
        type: 'Portfolio Account',
        matchedOn: 'Domain',
        identifier: accDomain,
        recordName: acc.orgname || acc.domain,
        details: `Domain '${accDomain}' is already in Account Portfolio (Org #${acc.org})`,
        recordId: acc.org,
        status: 'Active Account'
      });
      continue;
    }

    // Email Domain match (if matches account domain)
    if (candidateEmailDomain && accDomain && candidateEmailDomain === accDomain && candidateEmailDomain !== candidateDomain) {
      matches.push({
        type: 'Portfolio Account',
        matchedOn: 'Email Domain',
        identifier: candidateEmailDomain,
        recordName: acc.orgname || acc.domain,
        details: `Contact email domain matches active account '${accDomain}' (Org #${acc.org})`,
        recordId: acc.org,
        status: 'Active Account'
      });
      continue;
    }

    // Company Name match
    if (candidateCleanName && candidateCleanName.length >= 4 && accCleanName && candidateCleanName === accCleanName) {
      matches.push({
        type: 'Portfolio Account',
        matchedOn: 'Company Name',
        identifier: acc.orgname,
        recordName: acc.orgname,
        details: `Identical company name in Account Portfolio (Org #${acc.org})`,
        recordId: acc.org,
        status: 'Active Account'
      });
    }
  }

  // 2. Check against Existing Leads in Pipeline (Pre-conversion leads)
  for (const lead of existingLeads) {
    // Skip self if editing
    if (candidate.id && lead.id === candidate.id) continue;

    const leadDomain = normalizeDomain(lead.domain || '');
    const leadEmailDomain = extractEmailDomain(lead.email || '');
    const leadCleanName = normalizeCompanyName(lead.companyName || '');
    const leadOrgId = lead.existingOrgId?.trim();
    const leadGstin = lead.gstin?.trim().toUpperCase();

    // Org ID match
    if (candidateOrgId && leadOrgId && candidateOrgId === leadOrgId) {
      matches.push({
        type: 'Existing Lead',
        matchedOn: 'Org ID',
        identifier: leadOrgId,
        recordName: lead.companyName,
        details: `Existing Lead with same Org ID (${lead.stage}, Priority: ${lead.priority})`,
        recordId: lead.id,
        status: lead.stage
      });
      continue;
    }

    // GSTIN match
    if (candidateGstin && leadGstin && candidateGstin === leadGstin) {
      matches.push({
        type: 'Existing Lead',
        matchedOn: 'GSTIN',
        identifier: leadGstin,
        recordName: lead.companyName,
        details: `Matching GSTIN with lead '${lead.companyName}' (${lead.stage})`,
        recordId: lead.id,
        status: lead.stage
      });
      continue;
    }

    // Domain match
    if (candidateDomain && leadDomain && candidateDomain === leadDomain) {
      matches.push({
        type: 'Existing Lead',
        matchedOn: 'Domain',
        identifier: leadDomain,
        recordName: lead.companyName,
        details: `Domain '${leadDomain}' already exists in Lead Funnel (${lead.stage})`,
        recordId: lead.id,
        status: lead.stage
      });
      continue;
    }

    // Email Domain match
    if (
      candidateEmailDomain &&
      leadEmailDomain &&
      candidateEmailDomain === leadEmailDomain &&
      !['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'rediffmail.com'].includes(candidateEmailDomain)
    ) {
      matches.push({
        type: 'Existing Lead',
        matchedOn: 'Email Domain',
        identifier: leadEmailDomain,
        recordName: lead.companyName,
        details: `Corporate email domain '${leadEmailDomain}' matches existing lead '${lead.companyName}' (${lead.stage})`,
        recordId: lead.id,
        status: lead.stage
      });
      continue;
    }

    // Company Name match
    if (candidateCleanName && candidateCleanName.length >= 4 && leadCleanName && candidateCleanName === leadCleanName) {
      matches.push({
        type: 'Existing Lead',
        matchedOn: 'Company Name',
        identifier: lead.companyName,
        recordName: lead.companyName,
        details: `Lead with identical name exists in pipeline (${lead.stage})`,
        recordId: lead.id,
        status: lead.stage
      });
    }
  }

  return {
    hasDuplicate: matches.length > 0,
    matches
  };
}
