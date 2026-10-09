/**
 * Message Analyzer — Deterministic rule-based engine for detecting
 * social engineering, phishing, and scam patterns in text messages.
 */

import { SCORING_WEIGHTS, clampScore } from './scoring-weights';
import { analyzeUrl, isLikelyUrl, type UrlAnalysisResult } from './url-analyzer';

export interface MessageSignal {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence: string;
  explanation: string;
  scoreContribution: number;
  matchedPhrases?: string[];
}

export interface MessageAnalysisResult {
  signals: MessageSignal[];
  totalScore: number;
  extractedUrls: string[];
  urlAnalyses: UrlAnalysisResult[];
  detectedPatterns: string[];
  redactedContent: string; // Sensitive data redacted
}

// --- Pattern Definitions ---

const URGENCY_PATTERNS = [
  { pattern: /\b(act now|act immediately|action required|immediate action)\b/i, phrase: 'Act immediately' },
  { pattern: /\baccount (will be|is being|has been) (suspended|closed|blocked|terminated|deactivated)\b/i, phrase: 'Account suspension threat' },
  { pattern: /\b(last chance|final (notice|warning)|expire[sd]? (today|now|immediately|in \d+))\b/i, phrase: 'Final warning/last chance' },
  { pattern: /\b(within \d+ (hours?|minutes?|days?)|you have \d+ (hours?|minutes?|days?))\b/i, phrase: 'Time pressure' },
  { pattern: /\b(urgent|urgently|emergency|critical|immediately)\b/i, phrase: 'Urgency keyword' },
  { pattern: /\b(don'?t delay|no time to waste|respond immediately)\b/i, phrase: 'Urgency pressure' },
] as const;

const FEAR_PATTERNS = [
  { pattern: /\b(legal action|lawsuit|sue|court|arrest|police|authorities)\b/i, phrase: 'Legal threat' },
  { pattern: /\b(fraud|fraudulent|unauthorized (access|activity|transaction))\b/i, phrase: 'Fraud warning' },
  { pattern: /\b(penalty|penalties|fine|criminal)\b/i, phrase: 'Penalty threat' },
  { pattern: /\b(account (compromised|hacked|breached)|suspicious (activity|login|access))\b/i, phrase: 'Security scare' },
  { pattern: /\b(your (information|data|account|identity) (has been|is at risk|may be))\b/i, phrase: 'Data risk claim' },
] as const;

const CREDENTIAL_PATTERNS = [
  { pattern: /\b(enter|provide|confirm|verify|submit|send).{0,30}(password|credentials|login|sign.?in)\b/i, phrase: 'Password request' },
  { pattern: /\b(your|account) password\b/i, phrase: 'Password mention' },
  { pattern: /\b(username and password|login (credentials|details|information))\b/i, phrase: 'Login credentials request' },
  { pattern: /\bverif(y|ication) (your )?(account|identity|email|information|details)\b/i, phrase: 'Verification request' },
  { pattern: /\b(update|confirm) (your )?(account|billing|payment) (information|details)\b/i, phrase: 'Account update request' },
] as const;

const OTP_PATTERNS = [
  { pattern: /\b(otp|one.?time.?(password|code|pin))\b/i, phrase: 'OTP mention' },
  { pattern: /\b(share|send|provide|forward|enter).{0,20}(otp|code|pin)\b/i, phrase: 'OTP sharing request' },
  { pattern: /\b(verification|auth(entication)?|security) code\b/i, phrase: 'Verification code request' },
  { pattern: /\bcode (sent|received) (to|on) (your )?(phone|mobile|number)\b/i, phrase: 'Code sent to phone' },
  { pattern: /\bnever share.{0,20}(otp|code|pin)/i, phrase: 'OTP sharing warning (legitimate orgs include this)' },
] as const;

const FINANCIAL_PATTERNS = [
  { pattern: /\b(you('ve| have) won|winner|prize|reward|lucky|selected|chosen)\b/i, phrase: 'Prize/lottery claim' },
  { pattern: /\b(claim (your )?(prize|reward|money|cash|gift))\b/i, phrase: 'Claim prize' },
  { pattern: /\b(refund|cashback|rebate) (of |for )?\$?[\d,]+/i, phrase: 'Refund claim' },
  { pattern: /\b(invest(ment)?|guaranteed (returns?|profit)|double (your|the) (money|investment))\b/i, phrase: 'Investment opportunity' },
  { pattern: /\b(wire transfer|western union|money(gram)?|gift card|itunes|amazon gift)\b/i, phrase: 'Suspicious payment method' },
  { pattern: /\bpay (via|using|with|by) (gift card|crypto|bitcoin|usdt)\b/i, phrase: 'Crypto/gift card payment request' },
  { pattern: /\b(unclaimed|inheritance|funds? (awaiting|pending|transfer))\b/i, phrase: 'Inheritance scam pattern' },
] as const;

const IMPERSONATION_PATTERNS = [
  { pattern: /\b(from|on behalf of).{0,20}(bank|credit union|financial institution)\b/i, phrase: 'Bank impersonation' },
  { pattern: /\b(irs|internal revenue|tax (authority|department)|income tax)\b/i, phrase: 'Tax authority impersonation' },
  { pattern: /\b(delivery|courier|package|parcel).{0,30}(failed|pending|waiting|held)\b/i, phrase: 'Delivery scam' },
  { pattern: /\b(your (employer|hr|payroll|boss|manager)|hr department)\b/i, phrase: 'Employer impersonation' },
  { pattern: /\b(apple|google|microsoft|facebook|meta|amazon).{0,20}(team|support|security|alert)\b/i, phrase: 'Tech company impersonation' },
  { pattern: /\b(paypal|paytm|phonepe|gpay|bhim).{0,20}(team|support|security|alert|account)\b/i, phrase: 'Payment service impersonation' },
] as const;

const JOB_SCAM_PATTERNS = [
  { pattern: /\b(work from home|work at home|remote (job|opportunity|work))\b/i, phrase: 'Work from home offer' },
  { pattern: /\b(earn \$?[\d,]+ (per|a) (day|week|hour)|part.?time (income|job|work))\b/i, phrase: 'Unrealistic earning claim' },
  { pattern: /\b(no (experience|skills?|qualification) (required|needed))\b/i, phrase: 'No experience required job' },
  { pattern: /\b(job offer|hiring|vacancy|position available).{0,30}(apply now|click|link)\b/i, phrase: 'Suspicious job offer link' },
] as const;

const SOCIAL_ENGINEERING_PATTERNS = [
  { pattern: /\b(don'?t (tell|share|mention|discuss) (anyone|this|it))\b/i, phrase: 'Secrecy demand' },
  { pattern: /\b(this (is|will) expire|before (it expires?|time runs out))\b/i, phrase: 'Expiry pressure' },
  { pattern: /\b(offer (is |only )?valid (for|until)|limited (time |offer )?(only)?)\b/i, phrase: 'Limited time pressure' },
  { pattern: /\b(click (here|the link|below)|tap (here|the link)|visit (the link|below))\b/i, phrase: 'Click pressure' },
] as const;

// Sensitive data patterns (for redaction)
const SENSITIVE_PATTERNS = [
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD NUMBER REDACTED]' },
  { pattern: /\b\d{3}[\s-]?\d{2}[\s-]?\d{4}\b/g, replacement: '[SSN REDACTED]' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL REDACTED]' },
];

/**
 * Redacts potentially sensitive data from content before logging/storage.
 */
export function redactSensitiveData(content: string): string {
  let redacted = content;
  for (const { pattern, replacement } of SENSITIVE_PATTERNS) {
    redacted = redacted.replace(pattern, replacement);
  }
  return redacted;
}

/**
 * Extracts URLs from a message text.
 */
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`\[\]]+|www\.[^\s<>"{}|\\^`\[\]]+/gi;
  return [...new Set(text.match(urlRegex) || [])];
}

/**
 * Main message analysis function.
 */
export function analyzeMessage(rawMessage: string): MessageAnalysisResult {
  const signals: MessageSignal[] = [];
  let totalScore = 0;
  const detectedPatterns: string[] = [];
  let urgencyCount = 0;
  let hasFear = false;

  // Check urgency patterns
  for (const { pattern, phrase } of URGENCY_PATTERNS) {
    if (pattern.test(rawMessage)) {
      urgencyCount++;
      if (!detectedPatterns.includes('urgency')) {
        detectedPatterns.push('urgency');
      }
    }
  }

  if (urgencyCount > 0) {
    const isExtreme = urgencyCount >= 2;
    const w = isExtreme ? SCORING_WEIGHTS.message.extremeUrgency : SCORING_WEIGHTS.message.urgency;
    const matchedPhrases = URGENCY_PATTERNS
      .filter(({ pattern }) => pattern.test(rawMessage))
      .map(({ phrase }) => phrase);
    signals.push({
      type: 'Urgency & Time Pressure',
      severity: isExtreme ? 'high' : 'medium',
      evidence: matchedPhrases.slice(0, 3).join('; '),
      explanation: 'The message uses urgency to pressure the recipient into acting without thinking. Legitimate organizations rarely pressure users with extreme deadlines.',
      scoreContribution: w,
      matchedPhrases,
    });
    totalScore += w;
  }

  // Check fear patterns
  for (const { pattern, phrase } of FEAR_PATTERNS) {
    if (pattern.test(rawMessage)) {
      hasFear = true;
      if (!detectedPatterns.includes('fear')) {
        detectedPatterns.push('fear');
      }
    }
  }
  if (hasFear) {
    const w = SCORING_WEIGHTS.message.fearTactics;
    const matchedPhrases = FEAR_PATTERNS
      .filter(({ pattern }) => pattern.test(rawMessage))
      .map(({ phrase }) => phrase);
    signals.push({
      type: 'Fear Tactics',
      severity: 'high',
      evidence: matchedPhrases.join('; '),
      explanation: 'The message uses fear (legal threats, account compromise, fraud warnings) to pressure the recipient. This is a core social engineering technique that discourages calm verification.',
      scoreContribution: w,
      matchedPhrases,
    });
    totalScore += w;
  }

  // Check credential request patterns
  const credMatches = CREDENTIAL_PATTERNS.filter(({ pattern }) => pattern.test(rawMessage));
  if (credMatches.length > 0) {
    const w = SCORING_WEIGHTS.message.credentialRequest;
    const matchedPhrases = credMatches.map(({ phrase }) => phrase);
    detectedPatterns.push('credential_request');
    signals.push({
      type: 'Credential Request',
      severity: 'critical',
      evidence: matchedPhrases.join('; '),
      explanation: 'The message asks for account credentials (username, password, login information). Legitimate organizations never ask for your password via SMS or messaging apps.',
      scoreContribution: w,
      matchedPhrases,
    });
    totalScore += w;
  }

  // Check OTP patterns
  const otpMatches = OTP_PATTERNS.filter(({ pattern }) => pattern.test(rawMessage));
  if (otpMatches.length > 0) {
    // Reduce score if it's a "never share OTP" warning (legitimate message warning)
    const isWarning = /never share|do not share|don'?t share/.test(rawMessage.toLowerCase());
    if (!isWarning) {
      const w = SCORING_WEIGHTS.message.otpRequest;
      const matchedPhrases = otpMatches.map(({ phrase }) => phrase);
      detectedPatterns.push('otp_request');
      signals.push({
        type: 'OTP / One-Time Code Request',
        severity: 'critical',
        evidence: matchedPhrases.join('; '),
        explanation: 'The message involves an OTP or one-time code. Requesting someone to share an OTP is one of the most serious red flags — it enables account takeover. No legitimate organization will ever ask you to share an OTP with them.',
        scoreContribution: w,
        matchedPhrases,
      });
      totalScore += w;
    }
  }

  // Check financial manipulation patterns
  const finMatches = FINANCIAL_PATTERNS.filter(({ pattern }) => pattern.test(rawMessage));
  if (finMatches.length > 0) {
    const w = SCORING_WEIGHTS.message.financialManipulation;
    const matchedPhrases = finMatches.map(({ phrase }) => phrase);
    detectedPatterns.push('financial');
    signals.push({
      type: 'Financial Manipulation',
      severity: 'high',
      evidence: matchedPhrases.join('; '),
      explanation: 'The message involves prizes, refunds, investment opportunities, or unusual payment methods. These are classic financial scam patterns.',
      scoreContribution: w,
      matchedPhrases,
    });
    totalScore += w;
  }

  // Check impersonation patterns
  const impMatches = IMPERSONATION_PATTERNS.filter(({ pattern }) => pattern.test(rawMessage));
  if (impMatches.length > 0) {
    const w = SCORING_WEIGHTS.message.impersonation;
    const matchedPhrases = impMatches.map(({ phrase }) => phrase);
    detectedPatterns.push('impersonation');
    signals.push({
      type: 'Organization Impersonation',
      severity: 'high',
      evidence: matchedPhrases.join('; '),
      explanation: 'The message appears to impersonate a known organization (bank, government agency, tech company, or payment service). Verify directly through official channels before acting.',
      scoreContribution: w,
      matchedPhrases,
    });
    totalScore += w;
  }

  // Check job scam patterns
  const jobMatches = JOB_SCAM_PATTERNS.filter(({ pattern }) => pattern.test(rawMessage));
  if (jobMatches.length > 0) {
    const w = SCORING_WEIGHTS.message.jobScam;
    const matchedPhrases = jobMatches.map(({ phrase }) => phrase);
    detectedPatterns.push('job_scam');
    signals.push({
      type: 'Job Scam Indicators',
      severity: 'medium',
      evidence: matchedPhrases.join('; '),
      explanation: 'The message contains patterns associated with fake job offers, including unrealistic earnings, work-from-home claims, or no experience required claims.',
      scoreContribution: w,
      matchedPhrases,
    });
    totalScore += w;
  }

  // Check social engineering patterns
  const seMatches = SOCIAL_ENGINEERING_PATTERNS.filter(({ pattern }) => pattern.test(rawMessage));
  if (seMatches.length > 0) {
    const w = SCORING_WEIGHTS.message.socialEngineering;
    const matchedPhrases = seMatches.map(({ phrase }) => phrase);
    detectedPatterns.push('social_engineering');
    signals.push({
      type: 'Social Engineering',
      severity: 'medium',
      evidence: matchedPhrases.join('; '),
      explanation: 'The message uses psychological manipulation techniques (secrecy demands, limited time, click pressure) to override rational decision-making.',
      scoreContribution: w,
      matchedPhrases,
    });
    totalScore += w;
  }

  // Extract and analyze URLs from message
  const extractedUrls = extractUrlsFromText(rawMessage);
  const urlAnalyses: UrlAnalysisResult[] = [];

  for (const url of extractedUrls.slice(0, 3)) { // Analyze up to 3 URLs
    const urlResult = analyzeUrl(url);
    urlAnalyses.push(urlResult);

    if (urlResult.isUrl && urlResult.totalScore > 0) {
      const w = SCORING_WEIGHTS.message.suspiciousLink;
      detectedPatterns.push('suspicious_url');
      signals.push({
        type: 'Suspicious URL in Message',
        severity: urlResult.totalScore > 60 ? 'critical' : urlResult.totalScore > 30 ? 'high' : 'medium',
        evidence: `URL: ${url} (Risk score: ${urlResult.totalScore}/100)`,
        explanation: `The message contains a URL that has ${urlResult.signals.length} suspicious indicator(s). The URL analysis flagged: ${urlResult.signals.map(s => s.type).join(', ')}.`,
        scoreContribution: w,
      });
      totalScore += w;
    } else if (urlResult.isUrl) {
      detectedPatterns.push('contains_url');
      signals.push({
        type: 'URL Detected in Message',
        severity: 'low',
        evidence: `URL: ${url}`,
        explanation: 'The message contains a link. Always verify where a link leads before clicking, especially in unsolicited messages.',
        scoreContribution: 5,
      });
      totalScore += 5;
    }
  }

  return {
    signals,
    totalScore: clampScore(totalScore),
    extractedUrls,
    urlAnalyses,
    detectedPatterns,
    redactedContent: redactSensitiveData(rawMessage),
  };
}
