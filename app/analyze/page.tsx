'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Search, AlertTriangle, Link2, MessageSquare, Zap, RotateCcw, Target, CheckCircle } from 'lucide-react';
import { RiskScoreDisplay } from '@/components/RiskScoreDisplay';
import { SignalCard } from '@/components/SignalCard';
import { IncidentResponsePanel } from '@/components/IncidentResponsePanel';
import { TechnicalEvidencePanel } from '@/components/TechnicalEvidencePanel';
import { DEMO_EXAMPLES } from '@/lib/demo/examples';
import { addToHistory } from '@/lib/history/history-manager';
import type { AnalysisResult } from '@/types';

function AnalyzePageContent() {
  const searchParams = useSearchParams();
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'auto' | 'url' | 'message'>('auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  // Open demo panel if ?demo=true
  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      setShowDemo(true);
    }
  }, [searchParams]);

  const handleAnalyze = async (overrideInput?: string, overrideType?: 'url' | 'message' | 'auto') => {
    const content = overrideInput ?? input;
    if (!content.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          input: content.trim(),
          type: overrideType ?? inputType,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analysis failed');
      }

      const data: AnalysisResult = await response.json();
      setResult(data);

      // Save to history (no raw content stored)
      addToHistory({
        inputType: data.inputType,
        classification: data.classification,
        classificationDisplay: data.classificationDisplay,
        riskScore: data.riskScore,
        riskLevel: data.riskLevel,
        summary: data.aiSummary?.slice(0, 120),
        preview: content.slice(0, 60) + (content.length > 60 ? '...' : ''),
      });

      // Scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDemo = (demo: typeof DEMO_EXAMPLES[0]) => {
    setInput(demo.content);
    setInputType(demo.type);
    setShowDemo(false);
    setTimeout(() => handleAnalyze(demo.content, demo.type), 100);
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setInput('');
  };

  const getRiskLevelBadgeClass = (level: string) => {
    const map: Record<string, string> = {
      LOW: 'badge-low',
      MODERATE: 'badge-moderate',
      SUSPICIOUS: 'badge-suspicious',
      HIGH: 'badge-high',
      CRITICAL: 'badge-critical',
    };
    return `badge ${map[level] || 'badge-moderate'}`;
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', paddingBottom: '80px' }}>
      {/* Page Header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '32px 24px',
      }}>
        <div className="container" style={{ maxWidth: '860px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Search size={18} color="var(--cyan-primary)" />
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Threat Analyzer
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Paste a suspicious URL or message. We'll analyze it and tell you exactly what to do.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '860px', paddingTop: '32px' }}>
        {/* Warning Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 16px',
          background: 'rgba(234, 179, 8, 0.06)',
          border: '1px solid rgba(234, 179, 8, 0.15)',
          borderRadius: '10px',
          marginBottom: '24px',
          fontSize: '12px',
          color: '#D4A017',
          lineHeight: 1.5,
        }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          <span>
            <strong>Privacy Note:</strong> Do not paste passwords, OTPs, private keys, or complete payment-card numbers. 
            Your content is sent to our secure API for analysis. Raw content is never stored in history.
          </span>
        </div>

        {/* Input Card */}
        {!result && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '16px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}>
            {/* Tab Bar */}
            <div style={{
              display: 'flex',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
              padding: '0 16px',
            }}>
              {[
                { type: 'auto' as const, label: 'Auto Detect', icon: Zap },
                { type: 'url' as const, label: 'URL', icon: Link2 },
                { type: 'message' as const, label: 'Message', icon: MessageSquare },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setInputType(type)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 16px',
                    background: 'none',
                    border: 'none',
                    borderBottom: `2px solid ${inputType === type ? 'var(--cyan-primary)' : 'transparent'}`,
                    color: inputType === type ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div style={{ padding: '20px' }}>
              <textarea
                id="threat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  inputType === 'url' 
                    ? 'Paste a suspicious URL here (e.g., paypal-security-login.example.com/verify)...'
                    : inputType === 'message'
                      ? 'Paste a suspicious SMS, WhatsApp message, or email content here...'
                      : 'Paste a suspicious URL or message here...'
                }
                className="input-area"
                rows={6}
                style={{ width: '100%', padding: '14px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    handleAnalyze();
                  }
                }}
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginTop: '12px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowDemo(!showDemo)}
                    className="btn-ghost"
                  >
                    <Zap size={13} />
                    Try Demo
                  </button>
                  <button
                    onClick={() => setInput('')}
                    className="btn-ghost"
                    disabled={!input}
                  >
                    Clear
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {input.length}/5000 · Ctrl+Enter to analyze
                  </span>
                  <button
                    id="analyze-btn"
                    onClick={() => handleAnalyze()}
                    disabled={isAnalyzing || !input.trim()}
                    className="btn-primary"
                    style={{ padding: '10px 22px', fontSize: '13px' }}
                  >
                    {isAnalyzing ? (
                      <>
                        <div style={{
                          width: '14px', height: '14px',
                          border: '2px solid rgba(0,0,0,0.3)',
                          borderTopColor: '#000',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Shield size={14} />
                        Analyze Threat
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Demo Panel */}
        {showDemo && !result && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '24px',
          }}
          className="animate-fade-in"
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--bg-elevated)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '2px' }}>Demo Examples</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Click any example to instantly analyze it. All use fictional/safe domains.
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              {DEMO_EXAMPLES.map((demo) => (
                <button
                  key={demo.id}
                  onClick={() => handleDemo(demo)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    marginBottom: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-active)';
                    e.currentTarget.style.background = 'var(--bg-card-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.background = 'var(--bg-surface)';
                  }}
                >
                  <span style={{ fontSize: '24px', flexShrink: 0 }}>{demo.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '3px' }}>
                      {demo.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      {demo.description}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        border: '1px solid rgba(56, 189, 248, 0.15)',
                        borderRadius: '4px',
                        color: 'var(--cyan-primary)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        {demo.type}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: '4px',
                        color: '#F87171',
                        fontWeight: 600,
                      }}>
                        {demo.expectedRisk}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div style={{
            padding: '40px 24px',
            textAlign: 'center',
          }}
          className="animate-fade-in"
          >
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid var(--border-subtle)',
              borderTopColor: 'var(--cyan-primary)',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 20px',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
            }} />
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>
              Analyzing Threat...
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
              Running 30+ security checks and AI analysis
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center',
            }}>
              {['URL Structure', 'Brand Detection', 'Social Engineering', 'AI Semantics', 'Threat Intel'].map((step, i) => (
                <div key={step} style={{
                  padding: '4px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '100px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  animation: `fadeIn 0.3s ease ${i * 0.2}s both`,
                }}>
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.06)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            color: '#F87171',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div ref={resultRef} className="animate-fade-in">
            {/* Result header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', letterSpacing: '-0.01em' }}>
                  Threat Analysis Complete
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {result.inputType === 'url' ? '🔗 URL Analysis' : '💬 Message Analysis'}
                  {' · '}
                  {new Date(result.timestamp).toLocaleTimeString()}
                  {!result.aiAvailable && (
                    <span style={{ color: '#EAB308', marginLeft: '8px' }}>
                      ⚡ Rule-based analysis only (AI offline)
                    </span>
                  )}
                </div>
              </div>
              <button onClick={handleReset} className="btn-ghost">
                <RotateCcw size={13} />
                New Analysis
              </button>
            </div>

            {/* Main result grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '280px 1fr',
              gap: '24px',
              marginBottom: '24px',
            }}
            className="result-grid"
            >
              {/* Left: Risk Score */}
              <div>
                <RiskScoreDisplay
                  score={result.riskScore}
                  riskLevel={result.riskLevel}
                  classification={result.classificationDisplay}
                  confidence={result.confidence}
                />
              </div>

              {/* Right: Summary + Targets */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* AI Summary */}
                <div style={{
                  padding: '20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  flex: 1,
                }}>
                  <div className="section-label" style={{ marginBottom: '8px' }}>Analysis Summary</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.7 }}>
                    {result.aiSummary}
                  </p>
                </div>

                {/* Potential Targets */}
                {result.potentialTargets.length > 0 && (
                  <div style={{
                    padding: '16px 20px',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.15)',
                    borderRadius: '12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                      <Target size={14} color="#F87171" />
                      <div className="section-label" style={{ color: '#F87171' }}>What the Attacker May Want</div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {result.potentialTargets.map((target, i) => (
                        <span key={i} style={{
                          padding: '4px 12px',
                          background: 'rgba(239, 68, 68, 0.08)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '100px',
                          fontSize: '12px',
                          color: '#F87171',
                          fontWeight: 500,
                        }}>
                          {target}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Signals / WHY WE FLAGGED THIS */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              borderRadius: '16px',
              marginBottom: '24px',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                background: 'var(--bg-elevated)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <div className="section-label" style={{ marginBottom: '4px' }}>Detection Signals</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Why We Flagged This</h3>
                </div>
                <span style={{
                  padding: '4px 12px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '100px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                }}>
                  {result.signals.length} signal{result.signals.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.signals.length > 0 ? (
                  result.signals.map((signal, i) => (
                    <SignalCard key={i} signal={signal} index={i} />
                  ))
                ) : (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <CheckCircle size={24} color="#22C55E" />
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      No suspicious signals detected
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      This content doesn't match common threat patterns. Exercise normal caution.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-default)',
                borderRadius: '16px',
                marginBottom: '24px',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '20px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                }}>
                  <div className="section-label" style={{ marginBottom: '4px' }}>Actionable Guidance</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700 }}>What You Should Do</h3>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.recommendations.map((rec, i) => (
                      <li key={i} style={{
                        display: 'flex',
                        gap: '12px',
                        fontSize: '13px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.6,
                      }}>
                        <span style={{
                          flexShrink: 0,
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(56, 189, 248, 0.08)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--cyan-primary)',
                          fontFamily: 'JetBrains Mono, monospace',
                        }}>
                          {i + 1}
                        </span>
                        {rec}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Technical Evidence */}
            <div style={{ marginBottom: '24px' }}>
              <TechnicalEvidencePanel result={result} />
            </div>

            {/* Incident Response */}
            <IncidentResponsePanel riskLevel={result.riskLevel} />

            {/* Uncertainties */}
            {result.uncertainties.length > 0 && !result.uncertainties[0].includes('AI semantic analysis was unavailable') && (
              <div style={{
                marginTop: '20px',
                padding: '14px 16px',
                background: 'rgba(56, 189, 248, 0.04)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                fontSize: '12px',
                color: 'var(--text-muted)',
              }}>
                <strong style={{ color: 'var(--text-secondary)' }}>Limitations:</strong>{' '}
                {result.uncertainties.join(' ')}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 640px) {
          .result-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={
      <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading analyzer...
      </div>
    }>
      <AnalyzePageContent />
    </Suspense>
  );
}
