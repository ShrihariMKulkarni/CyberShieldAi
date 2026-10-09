'use client';

import { Shield, CheckCircle, XCircle, Globe, Lock, AlertTriangle } from 'lucide-react';
import type { AnalysisResult } from '@/types';

interface TechnicalEvidencePanelProps {
  result: AnalysisResult;
}

function TechRow({ label, value, status }: { label: string; value: string | number | boolean | null; status?: 'good' | 'bad' | 'neutral' }) {
  const getValueDisplay = () => {
    if (typeof value === 'boolean') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value ? (
            <CheckCircle size={14} color={status === 'bad' ? '#F87171' : '#22C55E'} />
          ) : (
            <XCircle size={14} color={status === 'good' ? '#22C55E' : '#F87171'} />
          )}
          <span style={{ 
            color: value 
              ? (status === 'bad' ? '#F87171' : '#22C55E') 
              : (status === 'good' ? '#22C55E' : '#F87171'),
            fontWeight: 600,
          }}>
            {value ? 'Yes' : 'No'}
          </span>
        </div>
      );
    }
    return (
      <span className="code-text" style={{ fontSize: '12px' }}>
        {value ?? '—'}
      </span>
    );
  };

  return (
    <div className="tech-row">
      <span className="tech-label">{label}</span>
      {getValueDisplay()}
    </div>
  );
}

export function TechnicalEvidencePanel({ result }: TechnicalEvidencePanelProps) {
  const { urlDetails, threatIntelligence, inputType } = result;

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}>
        <Shield size={16} color="var(--cyan-primary)" />
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Technical Evidence
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600 }}>
            {inputType === 'url' ? 'URL Security Analysis' : 'Message Technical Details'}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 24px' }}>
        {urlDetails ? (
          <>
            <div style={{ marginBottom: '16px' }}>
              <div className="section-label" style={{ marginBottom: '10px' }}>Domain Analysis</div>
              <TechRow label="Protocol" value={urlDetails.protocol.toUpperCase()} />
              <TechRow label="Hostname" value={urlDetails.hostname} />
              <TechRow label="Registered Domain" value={urlDetails.registeredDomain} />
              <TechRow label="TLD" value={urlDetails.tld} />
              <TechRow label="Subdomain Count" value={urlDetails.subdomainCount} />
            </div>
            
            <div className="divider" style={{ marginBottom: '16px' }} />
            
            <div style={{ marginBottom: '16px' }}>
              <div className="section-label" style={{ marginBottom: '10px' }}>Security Checks</div>
              <TechRow label="HTTPS" value={urlDetails.hasHttps} status={urlDetails.hasHttps ? 'good' : 'bad'} />
              <TechRow label="IP Address URL" value={urlDetails.isIpAddress} status={urlDetails.isIpAddress ? 'bad' : 'good'} />
              <TechRow label="Punycode / IDN" value={urlDetails.hasPunycode} status={urlDetails.hasPunycode ? 'bad' : 'good'} />
              <TechRow label="@ Symbol Manipulation" value={urlDetails.hasAtSymbol} status={urlDetails.hasAtSymbol ? 'bad' : 'good'} />
              <TechRow label="URL Encoding/Obfuscation" value={urlDetails.hasUrlEncoding} status={urlDetails.hasUrlEncoding ? 'bad' : 'good'} />
              <TechRow label="URL Shortener" value={urlDetails.isUrlShortener} status={urlDetails.isUrlShortener ? 'bad' : 'good'} />
              <TechRow label="URL Length" value={`${urlDetails.urlLength} characters`} />
            </div>
          </>
        ) : (
          <div>
            <div className="section-label" style={{ marginBottom: '10px' }}>Extracted URLs</div>
            {result.extractedUrls && result.extractedUrls.length > 0 ? (
              result.extractedUrls.map((url, i) => (
                <div key={i} style={{ 
                  marginBottom: '8px',
                  padding: '8px 10px',
                  background: 'var(--bg-surface)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ 
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '12px',
                    color: 'var(--cyan-bright)',
                    wordBreak: 'break-all',
                  }}>
                    <Globe size={11} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    {url}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                No URLs detected in message
              </div>
            )}
          </div>
        )}

        {/* Threat Intelligence */}
        <div className="divider" style={{ marginBottom: '16px' }} />
        <div>
          <div className="section-label" style={{ marginBottom: '10px' }}>External Reputation</div>
          {threatIntelligence ? (
            threatIntelligence.available ? (
              <div>
                <div style={{
                  padding: '12px',
                  background: threatIntelligence.result === 'malicious' ? 'rgba(239,68,68,0.08)' :
                              threatIntelligence.result === 'suspicious' ? 'rgba(251,146,60,0.08)' :
                              threatIntelligence.result === 'clean' ? 'rgba(34,197,94,0.08)' : 'var(--bg-surface)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Provider</span>
                    <span className="code-text" style={{ fontSize: '12px' }}>{threatIntelligence.provider}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Result</span>
                    <span style={{ 
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      fontSize: '12px',
                      color: threatIntelligence.result === 'malicious' ? '#EF4444' :
                             threatIntelligence.result === 'suspicious' ? '#FB923C' :
                             threatIntelligence.result === 'clean' ? '#22C55E' : 'var(--text-muted)',
                    }}>
                      {threatIntelligence.result || 'Unknown'}
                    </span>
                  </div>
                  {typeof threatIntelligence.detectionCount !== 'undefined' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Detections</span>
                      <span className="code-text" style={{ fontSize: '12px' }}>
                        {threatIntelligence.detectionCount} / {threatIntelligence.totalEngines} engines
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{
                padding: '12px',
                background: 'var(--bg-surface)',
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}>
                <AlertTriangle size={14} />
                {threatIntelligence.errorMessage || 'External reputation check unavailable.'}
              </div>
            )
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              External reputation check not applicable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
