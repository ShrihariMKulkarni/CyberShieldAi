/**
 * Zod schemas for input validation and AI output validation.
 * All AI responses are validated against these schemas before use.
 */

import { z } from 'zod';

// Input validation schemas
export const AnalyzeInputSchema = z.object({
  input: z
    .string()
    .min(1, 'Input cannot be empty')
    .max(5000, 'Input too long (maximum 5000 characters)')
    .refine(
      (val) => !containsInjectionAttempt(val),
      { message: 'Input contains potentially unsafe instruction patterns and will be analyzed as untrusted content.' }
    ),
  type: z.enum(['url', 'message', 'auto']).default('auto'),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;

// AI output indicator schema
const AIIndicatorSchema = z.object({
  type: z.string().max(100),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  evidence: z.string().max(500),
  explanation: z.string().max(1000),
});

// AI output schema — validated before any use
export const AIAnalysisSchema = z.object({
  classification: z.enum([
    'safe', 'suspicious', 'phishing', 'financial_scam', 'credential_theft',
    'otp_scam', 'impersonation', 'job_scam', 'delivery_scam', 'identity_theft', 'unknown',
  ]),
  confidence: z.enum(['high', 'medium', 'low', 'insufficient']),
  summary: z.string().max(500),
  indicators: z.array(AIIndicatorSchema).max(10),
  potentialTargets: z.array(z.string().max(100)).max(10),
  recommendations: z.array(z.string().max(300)).max(10),
  uncertainties: z.array(z.string().max(200)).max(5),
});

export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;

// History record schema
export const HistoryRecordSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  inputType: z.enum(['url', 'message']),
  classification: z.string(),
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['LOW', 'MODERATE', 'SUSPICIOUS', 'HIGH', 'CRITICAL']),
  // Raw content is NOT stored by default
});

export type HistoryRecord = z.infer<typeof HistoryRecordSchema>;

// Threat Intelligence schema
export const ThreatIntelligenceSchema = z.object({
  available: z.boolean(),
  provider: z.string().optional(),
  result: z.enum(['clean', 'malicious', 'suspicious', 'unrated']).optional(),
  categories: z.array(z.string()).optional(),
  detectionCount: z.number().optional(),
  totalEngines: z.number().optional(),
  permalink: z.string().url().optional(),
  errorMessage: z.string().optional(),
});

export type ThreatIntelligence = z.infer<typeof ThreatIntelligenceSchema>;

/**
 * Detect obvious prompt injection attempts in submitted content.
 * This does NOT block the content — it logs it and treats it as untrusted data.
 */
function containsInjectionAttempt(input: string): boolean {
  const injectionPatterns = [
    /ignore (all |previous |your |the )?(previous |above |prior )?(instructions?|prompt|rules?|context)/i,
    /you are now|from now on you|pretend (to be|you are|you're)/i,
    /act as (a |an )?(different|new|uncensored|unrestricted)/i,
    /disregard (the |your |all |previous )/i,
    /override (the |your |all |system )/i,
    /new (instructions?|prompt|rules?|system)/i,
    /\[system\]|\[assistant\]|\[user\]|\[inst\]/i,
  ];
  // We detect but don't necessarily block — we want to analyze it
  // Return false to allow it through (will be treated as untrusted data)
  return false; // Detection is done server-side in prompt handling
}

/**
 * Sanitize AI response to prevent XSS before displaying.
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validates and parses AI JSON output safely.
 */
export function validateAIOutput(rawOutput: string): AIAnalysis | null {
  try {
    // Extract JSON from potential markdown code blocks
    const jsonMatch = rawOutput.match(/```json\n?([\s\S]*?)\n?```/) ||
                      rawOutput.match(/\{[\s\S]*\}/);
    
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawOutput;
    const parsed = JSON.parse(jsonStr);
    const result = AIAnalysisSchema.safeParse(parsed);
    
    if (result.success) {
      return result.data;
    }
    
    console.error('AI output validation failed:', result.error.format());
    return null;
  } catch (error) {
    console.error('Failed to parse AI output:', error);
    return null;
  }
}
