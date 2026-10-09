'use client';

import { useState, useEffect } from 'react';
import { LayoutDashboard, Shield, AlertTriangle, Zap, TrendingUp } from 'lucide-react';
import { getHistory, getHistoryStats, type HistoryRecord } from '@/lib/history/history-manager';
import Link from 'next/link';

const RISK_COLORS: Record<string, string> = {
  LOW: '#22D3EE',
  MODERATE: '#FCD34D',
  SUSPICIOUS: '#FB923C',
  HIGH: '#F87171',
  CRITICAL: '#EF4444',
};

function StatCard({ icon: Icon, label, value, sub, color = 'var(--cyan-primary)' }: {
  icon: typeof Shield;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div style={{
      padding: '24px',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '14px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{
          width: '40px', height: '40px',
          borderRadius: '10px',
          background: `${color}10`,
          border: `1px solid ${color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: sub ? '2px' : 0 }}>{label}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, threats: 0, highRisk: 0, byCategory: {} as Record<string, number> });

  useEffect(() => {
    const h = getHistory();
    setHistory(h);
    setStats(getHistoryStats());
  }, []);

  const recent = history.slice(0, 5);

  // Build chart data
  const categoryEntries = Object.entries(stats.byCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  const maxCount = Math.max(1, ...categoryEntries.map(([, v]) => v));

  // Risk distribution
  const riskDist = {
    LOW: history.filter(h => h.riskLevel === 'LOW').length,
    MODERATE: history.filter(h => h.riskLevel === 'MODERATE').length,
    SUSPICIOUS: history.filter(h => h.riskLevel === 'SUSPICIOUS').length,
    HIGH: history.filter(h => h.riskLevel === 'HIGH').length,
    CRITICAL: history.filter(h => h.riskLevel === 'CRITICAL').length,
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '32px 24px',
      }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <LayoutDashboard size={18} color="var(--cyan-primary)" />
            <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Dashboard</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Overview of your threat analysis activity
          </p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '32px' }}>
        {/* Stat Cards */}
        <div className="stats-grid" style={{ marginBottom: '32px' }}>
          <StatCard icon={Shield} label="Total Analyses" value={stats.total} sub="All time" />
          <StatCard icon={AlertTriangle} label="Threats Detected" value={stats.threats} sub="Non-safe classifications" color="#FB923C" />
          <StatCard icon={Zap} label="High-Risk Threats" value={stats.highRisk} sub="HIGH + CRITICAL" color="#EF4444" />
          <StatCard icon={TrendingUp} label="Detection Rate" value={stats.total > 0 ? `${Math.round((stats.threats / stats.total) * 100)}%` : '—'} sub="Threats / Total" color="#22D3EE" />
        </div>

        {history.length === 0 ? (
          <div style={{
            padding: '80px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>No data yet</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              Start analyzing threats to see your dashboard fill up.
            </div>
            <Link href="/analyze" className="btn-primary" style={{ textDecoration: 'none', fontSize: '13px' }}>
              <Shield size={14} />
              Analyze a Threat
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
          }}>
            {/* Category Chart */}
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
              }}>
                <div className="section-label" style={{ marginBottom: '4px' }}>Breakdown</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Threats by Category</h3>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {categoryEntries.length > 0 ? (
                  categoryEntries.map(([label, count]) => (
                    <div key={label} style={{ marginBottom: '14px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                            background: 'linear-gradient(90deg, var(--cyan-primary), rgba(56, 189, 248, 0.5))',
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No data available</div>
                )}
              </div>
            </div>

            {/* Risk Distribution */}
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
              }}>
                <div className="section-label" style={{ marginBottom: '4px' }}>Distribution</div>
                <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Risk Level Distribution</h3>
              </div>
              <div style={{ padding: '20px 24px' }}>
                {Object.entries(riskDist).map(([level, count]) => (
                  <div key={level} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: RISK_COLORS[level] || 'var(--text-secondary)', fontWeight: 600 }}>{level}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>{count}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: stats.total > 0 ? `${(count / stats.total) * 100}%` : '0%',
                          background: RISK_COLORS[level] || 'var(--cyan-primary)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Analyses */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              overflow: 'hidden',
              gridColumn: '1 / -1',
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
                  <div className="section-label" style={{ marginBottom: '4px' }}>Timeline</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700 }}>Recent Analyses</h3>
                </div>
                <Link href="/history" className="btn-ghost" style={{ textDecoration: 'none', fontSize: '11px' }}>
                  View All →
                </Link>
              </div>
              <div style={{ padding: '8px' }}>
                {recent.map(record => (
                  <div key={record.id} style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    borderBottom: '1px solid var(--border-subtle)',
                    marginBottom: '2px',
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: `${RISK_COLORS[record.riskLevel] || 'var(--border-default)'}12`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: RISK_COLORS[record.riskLevel],
                      flexShrink: 0,
                    }}>
                      {record.riskScore}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>
                        {record.classificationDisplay}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {record.preview || 'No preview available'}
                      </div>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
