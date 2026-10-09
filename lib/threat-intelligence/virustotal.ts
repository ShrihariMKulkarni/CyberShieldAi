/**
 * Threat Intelligence integration.
 * Supports VirusTotal as the primary provider.
 * Fails gracefully if API key is not configured.
 */

import type { ThreatIntelligence } from '../validation/schemas';

const VT_API_BASE = 'https://www.virustotal.com/api/v3';

/**
 * Checks a URL against VirusTotal's database.
 * Returns null if API key is not configured.
 */
export async function checkUrlReputation(url: string): Promise<ThreatIntelligence> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return {
      available: false,
      errorMessage: 'External reputation check unavailable. No API key configured.',
    };
  }

  try {
    // VirusTotal URL ID is base64url-encoded URL (without trailing =)
    const urlId = Buffer.from(url).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    const response = await fetch(`${VT_API_BASE}/urls/${urlId}`, {
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (response.status === 404) {
      // URL not in VT database — submit for analysis
      const submitResponse = await fetch(`${VT_API_BASE}/urls`, {
        method: 'POST',
        headers: {
          'x-apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `url=${encodeURIComponent(url)}`,
        signal: AbortSignal.timeout(8000),
      });

      if (!submitResponse.ok) {
        return {
          available: true,
          provider: 'VirusTotal',
          result: 'unrated',
          errorMessage: 'URL submitted for analysis. Results not yet available.',
        };
      }

      return {
        available: true,
        provider: 'VirusTotal',
        result: 'unrated',
        errorMessage: 'URL is new. Analysis submitted.',
      };
    }

    if (!response.ok) {
      throw new Error(`VirusTotal API error: ${response.status}`);
    }

    const data = await response.json();
    const stats = data?.data?.attributes?.last_analysis_stats;
    const categories = data?.data?.attributes?.categories;

    if (!stats) {
      return {
        available: true,
        provider: 'VirusTotal',
        result: 'unrated',
      };
    }

    const maliciousCount = stats.malicious || 0;
    const suspiciousCount = stats.suspicious || 0;
    const totalEngines = (stats.harmless || 0) + maliciousCount + suspiciousCount + (stats.undetected || 0);

    let result: ThreatIntelligence['result'];
    if (maliciousCount > 3) {
      result = 'malicious';
    } else if (maliciousCount > 0 || suspiciousCount > 3) {
      result = 'suspicious';
    } else {
      result = 'clean';
    }

    return {
      available: true,
      provider: 'VirusTotal',
      result,
      categories: categories ? Object.values(categories).flat() as string[] : undefined,
      detectionCount: maliciousCount + suspiciousCount,
      totalEngines,
      permalink: data?.data?.links?.self,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return {
        available: false,
        provider: 'VirusTotal',
        errorMessage: 'Reputation check timed out.',
      };
    }
    
    console.error('Threat intelligence error:', error);
    return {
      available: false,
      provider: 'VirusTotal',
      errorMessage: 'Reputation check encountered an error.',
    };
  }
}

/**
 * Gets the score contribution from threat intelligence results.
 */
export function getThreatIntelligenceScore(ti: ThreatIntelligence): number {
  if (!ti.available || !ti.result) return 0;
  
  switch (ti.result) {
    case 'malicious': return 40;
    case 'suspicious': return 20;
    case 'clean': return -10; // Slight reduction for confirmed clean
    default: return 0;
  }
}
