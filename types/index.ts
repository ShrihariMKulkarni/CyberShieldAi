/**
 * Shared TypeScript types for CyberShield AI.
 */

import type { AIAnalysis } from '@/lib/validation/schemas';
import type { ThreatIntelligence } from '@/lib/validation/schemas';
import type { UrlAnalysisResult } from '@/lib/security/url-analyzer';
import type { MessageAnalysisResult } from '@/lib/security/message-analyzer';

export type { AIAnalysis, ThreatIntelligence, UrlAnalysisResult, MessageAnalysisResult };

export type RiskLevel = 'LOW' | 'MODERATE' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';

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

export interface AnalysisSignal {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  evidence: string;
  explanation: string;
  scoreContribution: number;
  matchedPhrases?: string[];
}

export interface AnalysisResult {
  id: string;
  timestamp: string;
  inputType: 'url' | 'message';
  originalInput: string; // Truncated for display
  
  // Risk
  riskScore: number;
  riskLevel: RiskLevel;
  
  // Classification
  classification: ThreatClassification;
  classificationDisplay: string;
  confidence: 'high' | 'medium' | 'low' | 'insufficient';
  
  // Evidence
  signals: AnalysisSignal[];
  potentialTargets: string[];
  
  // AI analysis
  aiSummary: string;
  aiAvailable: boolean;
  
  // Technical details (URL analysis)
  urlDetails?: {
    protocol: string;
    hostname: string;
    registeredDomain: string;
    hasHttps: boolean;
    isIpAddress: boolean;
    hasPunycode: boolean;
    hasAtSymbol: boolean;
    hasUrlEncoding: boolean;
    subdomainCount: number;
    urlLength: number;
    isUrlShortener: boolean;
    tld: string;
  };
  
  // Extracted URLs from message
  extractedUrls?: string[];
  
  // Threat intelligence
  threatIntelligence?: ThreatIntelligence;
  
  // Recommendations
  recommendations: string[];
  
  // Uncertainties
  uncertainties: string[];
}

export type IncidentAction =
  | 'not_clicked'
  | 'clicked_link'
  | 'entered_password'
  | 'shared_otp'
  | 'made_payment';

export interface IncidentResponse {
  action: IncidentAction;
  severity: 'urgent' | 'high' | 'medium';
  title: string;
  steps: string[];
  warning?: string;
}
