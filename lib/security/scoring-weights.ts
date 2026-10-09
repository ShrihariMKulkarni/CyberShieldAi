/**
 * Centralized scoring weights for the deterministic risk engine.
 * All weights are additive and the final score is clamped to 0-100.
 */

export const SCORING_WEIGHTS = {
  // URL-based signals
  url: {
    httpOnly: 10,           // Using HTTP instead of HTTPS
    rawIpAddress: 25,       // URL uses raw IP (e.g., http://192.168.1.1/login)
    excessiveSubdomains: 15, // More than 3 subdomains
    brandInSubdomain: 20,   // Brand name in subdomain but different registered domain
    brandInPath: 15,        // Brand name in path but different registered domain
    typosquatting: 25,      // Domain closely resembles a known brand
    suspiciousTld: 10,      // Suspicious TLD like .xyz, .tk, .ml, .ga, .cf, .gq
    urlShortener: 10,       // Known URL shortener service
    atSymbol: 20,           // @ symbol in URL (can redirect to different host)
    obfuscation: 15,        // URL encoding/obfuscation detected
    punycode: 15,           // Punycode/IDN homograph attack
    excessiveLength: 10,    // URL longer than 100 characters
    suspiciousPath: 10,     // Suspicious path keywords (login, verify, secure, update)
    multipleRedirects: 15,  // Query parameters suggesting multiple redirects
    misleadingSubdomain: 20, // Misleading subdomain (e.g., paypal.phishingsite.com)
    ipObfuscation: 20,       // Obfuscated IP address (hex, octal, decimal)
  },

  // Message-based signals
  message: {
    urgency: 10,              // Urgency language
    extremeUrgency: 20,       // Extreme urgency (account close, legal threat)
    fearTactics: 10,          // Fear-based language
    financialManipulation: 15, // Prize, refund, investment, payment
    credentialRequest: 20,    // Password, login, credential request
    otpRequest: 25,           // OTP/PIN request (very high risk)
    impersonation: 15,        // Impersonating a known organization
    suspiciousLink: 15,       // Contains a URL (analyzed separately)
    unrealisticClaim: 15,     // Guaranteed returns, unexpected prize
    socialEngineering: 10,    // Pressure to act without verification
    personalInfoRequest: 15,  // Asking for personal information
    moneyRequest: 20,         // Asking for payment/money transfer
    threatLanguage: 15,       // Legal threats, police, arrest
    jobScam: 15,              // Fake job offer patterns
  },

  // Threat intelligence (external API)
  threatIntelligence: {
    knownMalicious: 40,       // Known malicious from reputation database
    suspicious: 20,           // Marked as suspicious by reputation database
    lowReputation: 10,        // Low reputation score
  },
} as const;

export const RISK_LEVELS = {
  LOW: { min: 0, max: 20, label: 'LOW', color: 'green' },
  MODERATE: { min: 21, max: 40, label: 'MODERATE', color: 'yellow' },
  SUSPICIOUS: { min: 41, max: 60, label: 'SUSPICIOUS', color: 'orange' },
  HIGH: { min: 61, max: 80, label: 'HIGH', color: 'red' },
  CRITICAL: { min: 81, max: 100, label: 'CRITICAL', color: 'crimson' },
} as const;

export type RiskLevel = keyof typeof RISK_LEVELS;

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 20) return 'LOW';
  if (score <= 40) return 'MODERATE';
  if (score <= 60) return 'SUSPICIOUS';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

export function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

// Known brands for impersonation detection
export const KNOWN_BRANDS = [
  'paypal', 'google', 'facebook', 'amazon', 'apple', 'microsoft', 'netflix',
  'ebay', 'twitter', 'instagram', 'linkedin', 'bank', 'chase', 'wellsfargo',
  'citibank', 'barclays', 'hsbc', 'hdfc', 'sbi', 'icici', 'axis', 'kotak',
  'paytm', 'phonepe', 'gpay', 'whatsapp', 'dropbox', 'adobe', 'office365',
  'outlook', 'gmail', 'yahoo', 'hotmail', 'icloud', 'binance', 'coinbase',
  'fedex', 'ups', 'dhl', 'usps', 'irs', 'ssa', 'medicare', 'dmv',
  'visa', 'mastercard', 'amex', 'stripe', 'shopify', 'walmart', 'target',
] as const;

// Known URL shorteners
export const URL_SHORTENERS = [
  'bit.ly', 'tinyurl.com', 'goo.gl', 'ow.ly', 't.co', 'buff.ly',
  'short.to', 'tiny.cc', 'lnkd.in', 'cutt.ly', 'rb.gy', 'shorte.st',
  'cli.gs', 'is.gd', 'snipr.com', 'tr.im', 'twurl.nl', 'u.to',
] as const;

// Suspicious TLDs
export const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.pw', '.top', '.click',
  '.download', '.link', '.loan', '.win', '.racing', '.review', '.trade',
  '.webcam', '.online', '.site', '.space', '.fun', '.live',
] as const;

// Suspicious path keywords that often appear in phishing URLs
export const SUSPICIOUS_PATH_KEYWORDS = [
  'login', 'verify', 'secure', 'update', 'account', 'confirm', 'validation',
  'authenticate', 'credential', 'signin', 'password', 'banking', 'webscr',
  'paypal', 'ebayisapi', 'suspended', 'limited', 'unusual', 'activity',
] as const;
