/**
 * URL Analyzer — Deterministic, does NOT visit the URL.
 * Extracts security signals purely from URL structure and content.
 */

import {
  SCORING_WEIGHTS,
  KNOWN_BRANDS,
  URL_SHORTENERS,
  SUSPICIOUS_TLDS,
  SUSPICIOUS_PATH_KEYWORDS,
  clampScore,
} from './scoring-weights';

export interface UrlSignal {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence: string;
  explanation: string;
  scoreContribution: number;
}

export interface UrlAnalysisResult {
  isUrl: boolean;
  originalUrl: string;
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  registeredDomain: string;
  signals: UrlSignal[];
  totalScore: number;
  extractedBrands: string[];
  technicalDetails: {
    hasHttps: boolean;
    isIpAddress: boolean;
    hasPunycode: boolean;
    hasAtSymbol: boolean;
    hasUrlEncoding: boolean;
    subdomainCount: number;
    urlLength: number;
    isUrlShortener: boolean;
    tld: string;
    path: string;
    queryParams: string;
  };
}

/**
 * Attempts to extract the registered domain (e.g. "example.com") from a hostname.
 * Handles common multi-part TLDs like .co.uk, .com.au, etc.
 */
function extractRegisteredDomain(hostname: string): string {
  if (!hostname) return '';
  const multiPartTlds = ['co.uk', 'com.au', 'co.in', 'co.nz', 'co.za', 'com.br', 'net.au'];
  const parts = hostname.split('.');
  
  for (const mTld of multiPartTlds) {
    if (hostname.endsWith('.' + mTld) && parts.length > 2) {
      return parts.slice(-3).join('.');
    }
  }
  
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }
  return hostname;
}

/**
 * Checks if a string is an IP address (IPv4 or IPv6).
 */
function isIpAddress(hostname: string): boolean {
  const ipv4Regex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  const ipv6Regex = /^\[?[0-9a-fA-F:]+\]?$/;
  // Hex/octal encoded IP
  const hexIpRegex = /^0x[0-9a-fA-F]{8}$/;
  return ipv4Regex.test(hostname) || ipv6Regex.test(hostname) || hexIpRegex.test(hostname);
}

/**
 * Checks if a hostname uses Punycode (starts with xn--).
 */
function hasPunycode(hostname: string): boolean {
  return hostname.toLowerCase().includes('xn--');
}

/**
 * Computes Levenshtein distance between two strings for typosquatting detection.
 */
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      matrix[i][j] = b.charAt(i - 1) === a.charAt(j - 1)
        ? matrix[i - 1][j - 1]
        : Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Detects brand names in a string and returns matched brands.
 */
function detectBrands(str: string): string[] {
  const lowerStr = str.toLowerCase();
  return KNOWN_BRANDS.filter(brand => lowerStr.includes(brand));
}

/**
 * Main URL analysis function.
 */
export function analyzeUrl(rawUrl: string): UrlAnalysisResult {
  const signals: UrlSignal[] = [];
  let totalScore = 0;

  // Normalize: add protocol if missing
  let urlString = rawUrl.trim();
  if (!urlString.match(/^https?:\/\//i)) {
    urlString = 'https://' + urlString;
  }

  let parsed: URL | null = null;
  try {
    parsed = new URL(urlString);
  } catch {
    return {
      isUrl: false,
      originalUrl: rawUrl,
      normalizedUrl: urlString,
      protocol: '',
      hostname: '',
      registeredDomain: '',
      signals: [],
      totalScore: 0,
      extractedBrands: [],
      technicalDetails: {
        hasHttps: false,
        isIpAddress: false,
        hasPunycode: false,
        hasAtSymbol: false,
        hasUrlEncoding: false,
        subdomainCount: 0,
        urlLength: rawUrl.length,
        isUrlShortener: false,
        tld: '',
        path: '',
        queryParams: '',
      },
    };
  }

  const protocol = parsed.protocol.replace(':', '');
  const hostname = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  const search = parsed.search;
  const registeredDomain = extractRegisteredDomain(hostname);
  const subdomainPart = hostname.replace('.' + registeredDomain, '');
  const subdomains = subdomainPart ? subdomainPart.split('.').filter(Boolean) : [];
  const tld = '.' + registeredDomain.split('.').pop();
  
  // --- SIGNAL DETECTION ---

  // 1. HTTP only
  if (protocol === 'http') {
    const w = SCORING_WEIGHTS.url.httpOnly;
    signals.push({
      type: 'Insecure Connection (HTTP)',
      severity: 'medium',
      evidence: `Protocol: ${protocol.toUpperCase()}`,
      explanation: 'The URL uses HTTP instead of HTTPS. Data transmitted is not encrypted and can be intercepted.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 2. Raw IP address
  if (isIpAddress(hostname)) {
    const w = SCORING_WEIGHTS.url.rawIpAddress;
    signals.push({
      type: 'IP Address URL',
      severity: 'high',
      evidence: `Host: ${hostname}`,
      explanation: 'The URL uses a raw IP address instead of a domain name. Legitimate services almost never do this. This is a common phishing technique.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 3. At symbol in URL
  if (rawUrl.includes('@')) {
    const w = SCORING_WEIGHTS.url.atSymbol;
    signals.push({
      type: 'At-Symbol Manipulation',
      severity: 'high',
      evidence: `URL contains "@": ${rawUrl}`,
      explanation: 'The @ symbol in a URL causes browsers to ignore everything before it as credentials, redirecting to what comes after. This is a classic deception technique.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 4. Punycode / IDN homograph
  if (hasPunycode(hostname)) {
    const w = SCORING_WEIGHTS.url.punycode;
    signals.push({
      type: 'Punycode / Homograph Attack',
      severity: 'high',
      evidence: `Hostname: ${hostname}`,
      explanation: 'The domain uses Punycode encoding (xn--). This can be used to create domains that look identical to legitimate ones using Unicode lookalike characters.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 5. URL shortener
  const isShortener = URL_SHORTENERS.some(s => hostname === s || hostname.endsWith('.' + s));
  if (isShortener) {
    const w = SCORING_WEIGHTS.url.urlShortener;
    signals.push({
      type: 'URL Shortener Detected',
      severity: 'medium',
      evidence: `Shortener service: ${hostname}`,
      explanation: 'URL shorteners hide the actual destination. While not malicious by themselves, they are frequently used to obscure phishing URLs.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 6. Suspicious TLD
  const suspiciousTld = SUSPICIOUS_TLDS.find(t => hostname.endsWith(t));
  if (suspiciousTld) {
    const w = SCORING_WEIGHTS.url.suspiciousTld;
    signals.push({
      type: 'Suspicious TLD',
      severity: 'medium',
      evidence: `TLD: ${suspiciousTld}`,
      explanation: `The top-level domain "${suspiciousTld}" is associated with a high rate of phishing and spam activity due to low registration costs.`,
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 7. Brand in subdomain (misleading subdomain)
  const brandsInSubdomain = detectBrands(subdomainPart);
  const brandsInPath = detectBrands(path);
  const brandsInRegistered = detectBrands(registeredDomain.split('.')[0]);

  if (brandsInSubdomain.length > 0) {
    const w = SCORING_WEIGHTS.url.brandInSubdomain;
    signals.push({
      type: 'Brand Impersonation in Subdomain',
      severity: 'high',
      evidence: `Subdomain: ${subdomainPart}.${registeredDomain}`,
      explanation: `The subdomain contains "${brandsInSubdomain.join(', ')}" but the actual registered domain is "${registeredDomain}". This is a classic misleading subdomain impersonation technique. The subdomain is not the website's identity — the registered domain is.`,
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 8. Typosquatting (only if no brand in registered domain already matched)
  if (brandsInRegistered.length === 0 && brandsInSubdomain.length === 0) {
    const domainWithoutTld = registeredDomain.split('.')[0];
    for (const brand of KNOWN_BRANDS) {
      const distance = levenshtein(domainWithoutTld, brand);
      if (distance > 0 && distance <= 2 && domainWithoutTld.length >= 4) {
        const w = SCORING_WEIGHTS.url.typosquatting;
        signals.push({
          type: 'Typosquatting',
          severity: 'high',
          evidence: `Domain "${domainWithoutTld}" closely resembles "${brand}"`,
          explanation: `The domain is very similar to the well-known brand "${brand}" but is not the same. This technique, called typosquatting, tricks users into thinking they are visiting the legitimate site.`,
          scoreContribution: w,
        });
        totalScore += w;
        break; // Only flag once
      }
    }
  }

  // 9. Brand in path
  if (brandsInPath.length > 0 && brandsInSubdomain.length === 0 && brandsInRegistered.length === 0) {
    const w = SCORING_WEIGHTS.url.brandInPath;
    signals.push({
      type: 'Brand Name in URL Path',
      severity: 'medium',
      evidence: `Path contains: ${brandsInPath.join(', ')}`,
      explanation: `The URL path mentions "${brandsInPath.join(', ')}" but the actual domain is "${registeredDomain}". URL paths do not indicate site ownership. The registered domain is the authoritative identifier.`,
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 10. Excessive subdomains
  if (subdomains.length > 3) {
    const w = SCORING_WEIGHTS.url.excessiveSubdomains;
    signals.push({
      type: 'Excessive Subdomains',
      severity: 'medium',
      evidence: `${subdomains.length} subdomain levels: ${hostname}`,
      explanation: 'An unusually high number of subdomains is a common pattern in phishing URLs used to obscure the true domain and confuse users.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 11. Excessive URL length
  if (rawUrl.length > 100) {
    const w = SCORING_WEIGHTS.url.excessiveLength;
    signals.push({
      type: 'Excessive URL Length',
      severity: 'low',
      evidence: `URL length: ${rawUrl.length} characters`,
      explanation: 'Unusually long URLs may be designed to obscure the true destination or inject hidden parameters.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 12. URL encoding/obfuscation
  const hasUrlEncoding = /%[0-9a-fA-F]{2}/.test(rawUrl);
  if (hasUrlEncoding) {
    const w = SCORING_WEIGHTS.url.obfuscation;
    signals.push({
      type: 'URL Encoding / Obfuscation',
      severity: 'medium',
      evidence: `Encoded characters detected in URL`,
      explanation: 'URL-encoded characters (%XX) are sometimes used to disguise suspicious URLs, making them harder to read and detect.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 13. Suspicious path keywords
  const suspiciousKeyword = SUSPICIOUS_PATH_KEYWORDS.find(kw => path.includes(kw));
  if (suspiciousKeyword) {
    const w = SCORING_WEIGHTS.url.suspiciousPath;
    signals.push({
      type: 'Suspicious Path Keywords',
      severity: 'medium',
      evidence: `Path contains suspicious keyword: "${suspiciousKeyword}"`,
      explanation: `The URL path contains "${suspiciousKeyword}", which is commonly used in phishing URLs to create fake login, verification, or account-management pages.`,
      scoreContribution: w,
    });
    totalScore += w;
  }

  // 14. Redirect parameters
  const hasRedirectParam = /[?&](url|redirect|next|goto|return|returnurl|redir|r)=/i.test(search);
  if (hasRedirectParam) {
    const w = SCORING_WEIGHTS.url.multipleRedirects;
    signals.push({
      type: 'Redirect Parameters Detected',
      severity: 'medium',
      evidence: `Query string contains redirect parameters`,
      explanation: 'The URL contains parameters that suggest a redirect, which may be used to chain through legitimate-looking domains before sending users to a malicious site.',
      scoreContribution: w,
    });
    totalScore += w;
  }

  const allBrands = [...new Set([...brandsInSubdomain, ...brandsInPath])];

  return {
    isUrl: true,
    originalUrl: rawUrl,
    normalizedUrl: urlString,
    protocol,
    hostname,
    registeredDomain,
    signals,
    totalScore: clampScore(totalScore),
    extractedBrands: allBrands,
    technicalDetails: {
      hasHttps: protocol === 'https',
      isIpAddress: isIpAddress(hostname),
      hasPunycode: hasPunycode(hostname),
      hasAtSymbol: rawUrl.includes('@'),
      hasUrlEncoding: hasUrlEncoding,
      subdomainCount: subdomains.length,
      urlLength: rawUrl.length,
      isUrlShortener: isShortener,
      tld,
      path,
      queryParams: search,
    },
  };
}

/**
 * Quick check to determine if a string looks like a URL.
 */
export function isLikelyUrl(input: string): boolean {
  const trimmed = input.trim();
  return /^https?:\/\//i.test(trimmed) || 
    /^www\./i.test(trimmed) || 
    /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(\/|$|\?)/.test(trimmed);
}
