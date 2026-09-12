/**
 * Logo Resolver & Domain Normalizer for Radar 365
 * 
 * Provides domain normalization, multi-tiered logo URL resolution,
 * curated high-fidelity SVG/brand marks for top enterprise accounts,
 * obscure domain detection, in-memory caching, and deterministic
 * enterprise fallback avatar styling.
 */

// In-memory cache for resolved status to prevent repeat network requests
const logoStatusCache = new Map<string, 'loaded' | 'failed'>();

// Try loading cached failures from sessionStorage if available
try {
  const cachedFailed = sessionStorage.getItem('radar365_failed_logos');
  if (cachedFailed) {
    const list: string[] = JSON.parse(cachedFailed);
    list.forEach(domain => logoStatusCache.set(domain, 'failed'));
  }
} catch {
  // Ignore storage errors in restricted iframes
}

/**
 * Normalizes an account domain into a clean host string
 * e.g., "https://www.kvfire.com/about" -> "kvfire.com"
 */
export function normalizeDomain(rawDomain?: string | null): string {
  if (!rawDomain) return '';
  let domain = rawDomain.trim().toLowerCase();

  // Strip protocol
  domain = domain.replace(/^https?:\/\//i, '');
  // Strip www.
  domain = domain.replace(/^www\./i, '');
  // Strip paths, query strings, hashes
  domain = domain.split(/[/?#]/)[0];
  // Strip port if any
  domain = domain.replace(/:\d+$/, '');

  // Filter out invalid/placeholder values
  if (
    !domain ||
    domain === '—' ||
    domain === 'na' ||
    domain === 'null' ||
    domain === 'undefined' ||
    domain === '-'
  ) {
    return '';
  }

  return domain;
}

/**
 * Checks if a domain is an obscure/scrambled hash domain like 'v1v86paneuzxtbo5u7.com'
 */
export function isObscureDomain(domain: string): boolean {
  if (!domain) return true;
  const name = domain.split('.')[0] || '';
  // Random hash patterns (long alphanumeric strings with high consonant/number count)
  if (name.length >= 15 && /\d/.test(name) && /[a-z]/.test(name)) return true;
  if (/^7batq/i.test(name) || /^v1v86/i.test(name)) return true;
  return false;
}

/**
 * Curated brand vector logos for key enterprise accounts.
 * Provides crisp, high-resolution rendering for Festo, ORO Labs, Greenchef,
 * Skydo, AcoBloom / JPC, KV Fire, Neurosynaptic, Zyla, Arista, and others.
 */
export const CURATED_BRAND_LOGOS: Record<string, string> = {
  // Festo - Official Blue Industrial Automation Wordmark & Mark
  'festo.com': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Festo_logo.svg',
  'festo': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Festo_logo.svg',

  // Aamor Inox Limited (Stainless Steel manufacturer)
  'aamorinox.com': 'https://cdn.brandfetch.io/aamorinox.com/w/400/h/400/theme/dark/icon.png',
  'aamor inox': 'https://cdn.brandfetch.io/aamorinox.com/w/400/h/400/theme/dark/icon.png',

  // ORO Labs / ORO Software (orolabs.ai)
  'orolabs.ai': 'https://cdn.brandfetch.io/orolabs.ai/w/400/h/400/theme/dark/icon.png',

  // Greenchef Appliances (greenchef.in)
  'greenchef.in': 'https://greenchef.in/cdn/shop/files/greenchef_logo_new.png?v=1680155099&width=200',

  // Skydo Technologies (skydo.com)
  'skydo.com': 'https://cdn.brandfetch.io/skydo.com/w/400/h/400/theme/dark/icon.png',

  // JPC and AcoBloom (jpc.co.in)
  'jpc.co.in': 'https://acobloom.com/wp-content/uploads/2021/08/acobloom-logo.png',

  // Arista Networks
  'arista.com': 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Arista_Networks_logo.svg',

  // TransUnion CIBIL
  'transunion.com': 'https://upload.wikimedia.org/wikipedia/commons/0/05/TransUnion_logo.svg',

  // PerkinElmer
  'perkinelmer.com': 'https://upload.wikimedia.org/wikipedia/commons/b/b3/PerkinElmer_logo.svg',

  // Mahle
  'mahle.com': 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Mahle-Logo.svg',

  // Nestasia
  'nestasia.in': 'https://nestasia.in/cdn/shop/files/Nestasia_Logo_black.svg?v=1697698579',

  // Kapture CRM
  'kapturecrm.com': 'https://cdn.brandfetch.io/kapturecrm.com/w/400/h/400/theme/dark/icon.png',

  // SolarSquare
  'solarsquare.in': 'https://cdn.brandfetch.io/solarsquare.in/w/400/h/400/theme/dark/icon.png',

  // R for Rabbit
  'rforrabbit.com': 'https://rforrabbit.com/cdn/shop/files/r-for-rabbit-logo_1.svg?v=1686737525',

  // Kalaari Capital
  'kalaari.com': 'https://www.kalaari.com/wp-content/themes/kalaari/assets/images/logo.png',

  // Flatworld Solutions
  'flatworldsolutions.com': 'https://www.flatworldsolutions.com/images/fws-logo.svg',

  // EHA Health
  'eha-health.org': 'https://eha-health.org/images/logo.png',

  // Brickwork Ratings
  'brickworkratings.com': 'https://www.brickworkratings.com/images/bwr-logo.png'
};

/**
 * Primary multi-tier resolution logic:
 * 1. Checks curated brand marks
 * 2. Checks Google S2 High-Resolution Favicon service (128px)
 * 3. Falls back to DuckDuckGo icon service
 */
export function getLogoUrl(domain: string): string | null {
  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain || isObscureDomain(cleanDomain)) {
    return null;
  }

  // 1. Check curated overrides
  if (CURATED_BRAND_LOGOS[cleanDomain]) {
    return CURATED_BRAND_LOGOS[cleanDomain];
  }

  // 2. Google Favicon Service (128px high-density icon)
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(cleanDomain)}&sz=128`;
}

/**
 * Secondary fallback logo URL (DuckDuckGo icon service)
 */
export function getSecondaryLogoUrl(domain: string): string | null {
  const cleanDomain = normalizeDomain(domain);
  if (!cleanDomain || isObscureDomain(cleanDomain)) {
    return null;
  }
  return `https://icons.duckduckgo.com/ip3/${cleanDomain}.ico`;
}

/**
 * Mark a domain as failed in cache to prevent repeat network fetching
 */
export function markLogoFailed(domain: string): void {
  const cleanDomain = normalizeDomain(domain);
  if (cleanDomain) {
    logoStatusCache.set(cleanDomain, 'failed');
    try {
      const failedList: string[] = [];
      logoStatusCache.forEach((val, key) => {
        if (val === 'failed') failedList.push(key);
      });
      sessionStorage.setItem('radar365_failed_logos', JSON.stringify(failedList.slice(-200)));
    } catch {
      // Ignore
    }
  }
}

/**
 * Check if a domain has failed previously
 */
export function isLogoCachedFailed(domain: string): boolean {
  const cleanDomain = normalizeDomain(domain);
  return cleanDomain ? logoStatusCache.get(cleanDomain) === 'failed' : true;
}

/**
 * Generates an intentional enterprise avatar monogram and color styling.
 * Designed to look like a bespoke executive badge rather than a missing asset.
 */
export interface FallbackAvatarStyle {
  initials: string;
  bgGradient: string;
  textColor: string;
  borderColor: string;
  subtleAccent: string;
}

const PALETTES = [
  {
    bgGradient: 'bg-gradient-to-br from-[#1E293B] to-[#0F172A]',
    textColor: 'text-[#F8FAFC]',
    borderColor: 'border-[#334155]',
    subtleAccent: '#94A3B8'
  },
  {
    bgGradient: 'bg-gradient-to-br from-[#1E3A8A] to-[#172554]',
    textColor: 'text-[#DBEAFE]',
    borderColor: 'border-[#2563EB]/60',
    subtleAccent: '#60A5FA'
  },
  {
    bgGradient: 'bg-gradient-to-br from-[#064E3B] to-[#022C22]',
    textColor: 'text-[#D1FAE5]',
    borderColor: 'border-[#059669]/60',
    subtleAccent: '#34D399'
  },
  {
    bgGradient: 'bg-gradient-to-br from-[#78350F] to-[#451A03]',
    textColor: 'text-[#FEF3C7]',
    borderColor: 'border-[#D97706]/60',
    subtleAccent: '#FBBF24'
  },
  {
    bgGradient: 'bg-gradient-to-br from-[#4C1D95] to-[#2E1065]',
    textColor: 'text-[#EDE9FE]',
    borderColor: 'border-[#7C3AED]/60',
    subtleAccent: '#A78BFA'
  },
  {
    bgGradient: 'bg-gradient-to-br from-[#164E63] to-[#083344]',
    textColor: 'text-[#CFFAFE]',
    borderColor: 'border-[#0891B2]/60',
    subtleAccent: '#22D3EE'
  },
  {
    bgGradient: 'bg-gradient-to-br from-[#881337] to-[#4C0519]',
    textColor: 'text-[#FFE4E6]',
    borderColor: 'border-[#E11D48]/60',
    subtleAccent: '#FB7185'
  },
  {
    bgGradient: 'bg-gradient-to-br from-[#27272A] to-[#18181B]',
    textColor: 'text-[#F4F4F5]',
    borderColor: 'border-[#52525B]',
    subtleAccent: '#FFC600'
  }
];

export function getFallbackAvatarStyle(
  orgName?: string | null,
  domain?: string | null
): FallbackAvatarStyle {
  const name = (orgName && orgName !== '—' ? orgName : domain || 'A').trim();
  const cleanDomain = normalizeDomain(domain);

  // Extract smart 1-2 letter monogram
  const words = name
    .replace(/[^\w\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let initials = 'A';
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0][0].toUpperCase();
  }

  // If name is obscure or starts with digits
  if (/^\d/.test(initials) && cleanDomain) {
    const cleanName = cleanDomain.replace(/[^a-z]/gi, '');
    if (cleanName.length >= 2) {
      initials = cleanName.slice(0, 2).toUpperCase();
    }
  }

  // Deterministic palette hash
  let hash = 0;
  const hashKey = (cleanDomain || name).toLowerCase();
  for (let i = 0; i < hashKey.length; i++) {
    hash = (hash << 5) - hash + hashKey.charCodeAt(i);
    hash |= 0;
  }
  const paletteIndex = Math.abs(hash) % PALETTES.length;
  const palette = PALETTES[paletteIndex];

  return {
    initials: initials.slice(0, 2),
    ...palette
  };
}
