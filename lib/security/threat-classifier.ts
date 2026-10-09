/**
 * Threat Classifier — Combines signals from URL and message analyzers
 * to produce a final threat classification and risk score.
 */

import { getRiskLevel, clampScore, type RiskLevel } from './scoring-weights';
import type { UrlAnalysisResult } from './url-analyzer';
import type { MessageAnalysisResult } from './message-analyzer';

export type ThreatClassification =
  | 'safe'
  | 'suspicious'
  | 'phishing'
  | 'financial_scam'
  | 'credential_theft'
  | 'otp_scam'
  | 'impersonation'
  | 'job_scam'
  | 'delivery_scam'
  | 'identity_theft'
  | 'unknown';

export interface ThreatClassificationResult {
  classification: ThreatClassification;
  displayName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  potentialTargets: string[];
}

const CLASSIFICATION_DISPLAY_NAMES: Record<ThreatClassification, string> = {
  safe: 'Safe / No Obvious Threat',
  suspicious: 'Suspicious',
  phishing: 'Phishing',
  financial_scam: 'Financial Scam',
  credential_theft: 'Credential Theft',
  otp_scam: 'OTP Scam',
  impersonation: 'Impersonation',
  job_scam: 'Job Scam',
  delivery_scam: 'Delivery Scam',
  identity_theft: 'Identity Theft Attempt',
  unknown: 'Unknown',
};

/**
 * Classifies a threat based on combined signals from the analysis.
 */
export function classifyThreat(
  detectedPatterns: string[],
  urlSignalTypes: string[],
  riskScore: number,
): ThreatClassificationResult {
  const patterns = new Set(detectedPatterns);
  const urlSignals = new Set(urlSignalTypes);

  let classification: ThreatClassification = 'unknown';
  let confidence: 'high' | 'medium' | 'low' | 'insufficient' = 'low';
  const potentialTargets: string[] = [];

  // Insufficient evidence
  if (riskScore < 10) {
    return {
      classification: 'safe',
      displayName: CLASSIFICATION_DISPLAY_NAMES['safe'],
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      confidence: 'high',
      potentialTargets: [],
    };
  }

  if (riskScore < 15) {
    return {
      classification: 'suspicious',
      displayName: CLASSIFICATION_DISPLAY_NAMES['suspicious'],
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      confidence: 'insufficient',
      potentialTargets: [],
    };
  }

  // OTP Scam (most specific — very high risk)
  if (patterns.has('otp_request')) {
    classification = 'otp_scam';
    confidence = riskScore > 50 ? 'high' : 'medium';
    potentialTargets.push('OTP / one-time codes', 'Account access');
  }
  // Job Scam
  else if (patterns.has('job_scam') && !patterns.has('credential_request')) {
    classification = 'job_scam';
    confidence = riskScore > 40 ? 'high' : 'medium';
    potentialTargets.push('Personal information', 'Banking details', 'Advance fee payment');
  }
  // Delivery Scam
  else if (
    detectedPatterns.some(p => p === 'impersonation') &&
    urlSignals.has('Delivery Scam')
  ) {
    classification = 'delivery_scam';
    confidence = 'medium';
    potentialTargets.push('Payment information', 'Personal address');
  }
  // Financial Scam
  else if (patterns.has('financial') && !patterns.has('credential_request')) {
    classification = 'financial_scam';
    confidence = riskScore > 50 ? 'high' : 'medium';
    potentialTargets.push('Money / Financial information', 'Banking credentials');
  }
  // Credential Theft / Phishing
  else if (patterns.has('credential_request')) {
    if (patterns.has('impersonation') || urlSignals.has('Brand Impersonation in Subdomain') || urlSignals.has('Typosquatting')) {
      classification = 'phishing';
      confidence = riskScore > 60 ? 'high' : 'medium';
      potentialTargets.push('Login credentials', 'Account access');
    } else {
      classification = 'credential_theft';
      confidence = riskScore > 50 ? 'high' : 'medium';
      potentialTargets.push('Username', 'Password', 'Login credentials');
    }
  }
  // Impersonation
  else if (patterns.has('impersonation')) {
    classification = 'impersonation';
    confidence = riskScore > 40 ? 'high' : 'medium';
    potentialTargets.push('Trust exploitation', 'Personal information');
  }
  // URL-based phishing (brand impersonation in URL)
  else if (urlSignals.has('Brand Impersonation in Subdomain') || urlSignals.has('Typosquatting')) {
    classification = 'phishing';
    confidence = riskScore > 60 ? 'high' : 'medium';
    potentialTargets.push('Login credentials', 'Personal information');
  }
  // Suspicious but not clearly classified
  else if (riskScore >= 21) {
    classification = 'suspicious';
    confidence = riskScore > 40 ? 'medium' : 'insufficient';
    potentialTargets.push('Unknown');
  }

  // Add common targets based on signals
  if (patterns.has('financial')) {
    if (!potentialTargets.includes('Financial information')) {
      potentialTargets.push('Financial information');
    }
  }
  if (patterns.has('urgency') || patterns.has('fear')) {
    if (!potentialTargets.includes('Personal information')) {
      potentialTargets.push('Personal information');
    }
  }

  return {
    classification,
    displayName: CLASSIFICATION_DISPLAY_NAMES[classification],
    riskScore,
    riskLevel: getRiskLevel(riskScore),
    confidence,
    potentialTargets: [...new Set(potentialTargets)],
  };
}

/**
 * Combine scores from URL analysis and message analysis.
 */
export function combineScores(urlScore: number, messageScore: number): number {
  // Take the maximum, then add a portion of the other to allow compound signals
  const max = Math.max(urlScore, messageScore);
  const min = Math.min(urlScore, messageScore);
  return clampScore(max + Math.round(min * 0.3));
}
