/**
 * Main Analyze API Route
 * POST /api/analyze
 * 
 * Security: server-side API keys, input validation, rate limiting, secure headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeUrl, isLikelyUrl } from '@/lib/security/url-analyzer';
import { analyzeMessage, redactSensitiveData } from '@/lib/security/message-analyzer';
import { classifyThreat, combineScores } from '@/lib/security/threat-classifier';
import { clampScore, getRiskLevel } from '@/lib/security/scoring-weights';
import { analyzeWithAI, generateFallbackAnalysis } from '@/lib/ai/gemini';
import { checkUrlReputation, getThreatIntelligenceScore } from '@/lib/threat-intelligence/virustotal';
import type { AnalysisResult } from '@/types';

// Simple in-memory rate limiter (per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Input schema
const RequestSchema = z.object({
  input: z
    .string()
    .min(1, 'Input cannot be empty')
    .max(5000, 'Input too long (maximum 5000 characters)'),
  type: z.enum(['url', 'message', 'auto']).default('auto'),
});

export async function POST(request: NextRequest) {
  // Security headers
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
  };

  // Rate limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 
              'unknown';
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before analyzing again.' },
      { status: 429, headers: securityHeaders }
    );
  }

  // Parse and validate request
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400, headers: securityHeaders }
    );
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'Invalid input' },
      { status: 400, headers: securityHeaders }
    );
  }

  const { input, type } = parsed.data;

  // Determine input type
  const detectedType = type === 'auto' 
    ? (isLikelyUrl(input) ? 'url' : 'message')
    : type;

  try {
    let urlAnalysis = null;
    let messageAnalysis = null;
    let deterministicScore = 0;
    let allSignals: AnalysisResult['signals'] = [];
    let allDetectedPatterns: string[] = [];

    // --- DETERMINISTIC ANALYSIS ---
    if (detectedType === 'url' || type === 'url') {
      urlAnalysis = analyzeUrl(input);
      deterministicScore = urlAnalysis.totalScore;
      allSignals = urlAnalysis.signals.map(s => ({
        type: s.type,
        severity: s.severity,
        evidence: s.evidence,
        explanation: s.explanation,
        scoreContribution: s.scoreContribution,
      }));
      allDetectedPatterns = urlAnalysis.signals.map(s => s.type);
    } else {
      messageAnalysis = analyzeMessage(input);
      deterministicScore = messageAnalysis.totalScore;
      allSignals = messageAnalysis.signals.map(s => ({
        type: s.type,
        severity: s.severity,
        evidence: s.evidence,
        explanation: s.explanation,
        scoreContribution: s.scoreContribution,
        matchedPhrases: s.matchedPhrases,
      }));
      allDetectedPatterns = messageAnalysis.detectedPatterns;

      // If message contains URLs, incorporate URL analysis
      if (messageAnalysis.urlAnalyses.length > 0) {
        const urlScore = Math.max(...messageAnalysis.urlAnalyses.map(u => u.totalScore));
        deterministicScore = combineScores(deterministicScore, urlScore);
      }
    }

    // --- THREAT INTELLIGENCE ---
    let threatIntelligence = undefined;
    let tiScoreAdjustment = 0;

    if (detectedType === 'url' && input.startsWith('http')) {
      threatIntelligence = await checkUrlReputation(input);
      tiScoreAdjustment = getThreatIntelligenceScore(threatIntelligence);
    } else if (messageAnalysis?.extractedUrls?.[0]) {
      const firstUrl = messageAnalysis.extractedUrls[0];
      if (firstUrl.startsWith('http')) {
        threatIntelligence = await checkUrlReputation(firstUrl);
        tiScoreAdjustment = getThreatIntelligenceScore(threatIntelligence);
      }
    }

    const finalScore = clampScore(deterministicScore + tiScoreAdjustment);

    // --- THREAT CLASSIFICATION ---
    const urlSignalTypes = urlAnalysis?.signals.map(s => s.type) || 
      (messageAnalysis?.urlAnalyses.flatMap(u => u.signals.map(s => s.type)) || []);
    
    const classification = classifyThreat(allDetectedPatterns, urlSignalTypes, finalScore);

    // --- AI ANALYSIS ---
    const aiResult = await analyzeWithAI({
      content: input, // Full content sent to AI (AI has system prompt protection)
      contentType: detectedType,
      deterministicSignals: allDetectedPatterns,
      deterministicScore: finalScore,
    });

    const effectiveAI = aiResult || generateFallbackAnalysis(
      allDetectedPatterns,
      classification.classification,
      finalScore,
    );

    // Merge AI indicators with deterministic signals (deduplicate)
    const aiIndicatorTypes = new Set(allSignals.map(s => s.type));
    for (const indicator of effectiveAI.indicators) {
      if (!aiIndicatorTypes.has(indicator.type)) {
        allSignals.push({
          type: indicator.type,
          severity: indicator.severity,
          evidence: indicator.evidence,
          explanation: indicator.explanation,
          scoreContribution: 0, // AI indicators don't change score
        });
      }
    }

    // Sort signals by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    allSignals.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Build response
    const result: AnalysisResult = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      inputType: detectedType,
      originalInput: input.slice(0, 200) + (input.length > 200 ? '...' : ''),
      
      riskScore: finalScore,
      riskLevel: getRiskLevel(finalScore),
      
      classification: classification.classification,
      classificationDisplay: classification.displayName,
      confidence: effectiveAI.confidence || classification.confidence,
      
      signals: allSignals,
      potentialTargets: [
        ...new Set([
          ...classification.potentialTargets,
          ...effectiveAI.potentialTargets,
        ])
      ],
      
      aiSummary: effectiveAI.summary,
      aiAvailable: !!aiResult,
      
      urlDetails: urlAnalysis ? {
        protocol: urlAnalysis.protocol,
        hostname: urlAnalysis.hostname,
        registeredDomain: urlAnalysis.registeredDomain,
        hasHttps: urlAnalysis.technicalDetails.hasHttps,
        isIpAddress: urlAnalysis.technicalDetails.isIpAddress,
        hasPunycode: urlAnalysis.technicalDetails.hasPunycode,
        hasAtSymbol: urlAnalysis.technicalDetails.hasAtSymbol,
        hasUrlEncoding: urlAnalysis.technicalDetails.hasUrlEncoding,
        subdomainCount: urlAnalysis.technicalDetails.subdomainCount,
        urlLength: urlAnalysis.technicalDetails.urlLength,
        isUrlShortener: urlAnalysis.technicalDetails.isUrlShortener,
        tld: urlAnalysis.technicalDetails.tld,
      } : undefined,
      
      extractedUrls: messageAnalysis?.extractedUrls,
      
      threatIntelligence,
      
      recommendations: effectiveAI.recommendations,
      uncertainties: effectiveAI.uncertainties,
    };

    return NextResponse.json(result, { headers: securityHeaders });
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500, headers: securityHeaders }
    );
  }
}
