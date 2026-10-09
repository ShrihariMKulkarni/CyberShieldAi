'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { AnalysisSignal } from '@/types';

const SEVERITY_CONFIG = {
  critical: { dot: 'severity-dot-critical', color: '#EF4444', emoji: '🔴', label: 'Critical' },
  high: { dot: 'severity-dot-high', color: '#F97316', emoji: '🟠', label: 'High' },
  medium: { dot: 'severity-dot-medium', color: '#EAB308', emoji: '🟡', label: 'Medium' },
  low: { dot: 'severity-dot-low', color: '#22C55E', emoji: '🟢', label: 'Low' },
};

interface SignalCardProps {
  signal: AnalysisSignal;
  index: number;
}

export function SignalCard({ signal, index }: SignalCardProps) {
  const [expanded, setExpanded] = useState(index < 2); // First 2 expanded by default
  const config = SEVERITY_CONFIG[signal.severity];

  return (
    <div
      className="signal-item animate-fade-in"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
        overflow: 'hidden',
        transition: 'border-color 0.2s ease',
        borderLeft: `3px solid ${config.color}`,
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div className={`severity-dot ${config.dot}`} style={{ flexShrink: 0 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: '13px',
            color: 'var(--text-primary)',
            marginBottom: '2px',
          }}>
            {signal.type}
          </div>
          {!expanded && (
            <div style={{ 
              fontSize: '12px', 
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {signal.evidence}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: config.color,
            background: `${config.color}10`,
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {config.label}
          </span>
          {signal.scoreContribution > 0 && (
            <span style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              +{signal.scoreContribution}
            </span>
          )}
          <div style={{ color: 'var(--text-muted)' }}>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ 
          padding: '0 16px 16px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '12px',
        }}>
          {/* Evidence */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}>
              Evidence
            </div>
            <div className="code-text" style={{ display: 'block', padding: '8px 10px', fontSize: '12px' }}>
              {signal.evidence}
            </div>
          </div>

          {/* Explanation */}
          <div>
            <div style={{ 
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: '4px',
            }}>
              Why This Matters
            </div>
            <p style={{ 
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
            }}>
              {signal.explanation}
            </p>
          </div>

          {/* Matched phrases */}
          {signal.matchedPhrases && signal.matchedPhrases.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ 
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '6px',
              }}>
                Detected Phrases
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {signal.matchedPhrases.slice(0, 5).map((phrase, i) => (
                  <span key={i} style={{
                    fontSize: '11px',
                    padding: '2px 8px',
                    background: `${config.color}10`,
                    border: `1px solid ${config.color}20`,
                    borderRadius: '4px',
                    color: config.color,
                  }}>
                    {phrase}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
