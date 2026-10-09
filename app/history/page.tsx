'use client';

import { useState, useEffect } from 'react';
import { Clock, Trash2, Shield, AlertTriangle, Search } from 'lucide-react';
import { getHistory, deleteHistoryRecord, clearHistory, type HistoryRecord } from '@/lib/history/history-manager';
import Link from 'next/link';

const RISK_BADGE_CLASSES: Record<string, string> = {
  LOW: 'badge-low',
  MODERATE: 'badge-moderate',
  SUSPICIOUS: 'badge-suspicious',
  HIGH: 'badge-high',
  CRITICAL: 'badge-critical',
};

const RISK_COLORS: Record<string, string> = {
  LOW: '#22D3EE',
  MODERATE: '#FCD34D',
  SUSPICIOUS: '#FB923C',
  HIGH: '#F87171',
  CRITICAL: '#EF4444',
};

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleDelete = (id: string) => {
    deleteHistoryRecord(id);
    setHistory(getHistory());
  };

  const handleClearAll = () => {
    if (confirm('Delete all analysis history? This cannot be undone.')) {
      clearHistory();
      setHistory([]);
    }
  };

  const filtered = history.filter(r => {
    if (filterRisk !== 'all' && r.riskLevel !== filterRisk) return false;
    if (filterType !== 'all' && r.inputType !== filterType) return false;
    return true;
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '32px 24px',
      }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Clock size={18} color="var(--cyan-primary)" />
                <h1 style={{ fontSize: '22px', fontWeight: 800, letterSpacing: '-0.02em' }}>Analysis History</h1>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {history.length} analysis{history.length !== 1 ? 'es' : ''} recorded. Raw content is never stored.
              </p>
            </div>
            {history.length > 0 && (
              <button onClick={handleClearAll} className="btn-ghost" style={{ color: '#F87171' }}>
                <Trash2 size={13} />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '900px', paddingTop: '24px' }}>
        {/* Filters */}
        {history.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Risk:</span>
              {['all', 'LOW', 'MODERATE', 'SUSPICIOUS', 'HIGH', 'CRITICAL'].map(level => (
                <button
                  key={level}
                  onClick={() => setFilterRisk(level)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: filterRisk === level ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card)',
                    border: filterRisk === level ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                    color: filterRisk === level ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {level === 'all' ? 'All' : level}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Type:</span>
              {['all', 'url', 'message'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: filterType === type ? 'rgba(56, 189, 248, 0.12)' : 'var(--bg-card)',
                    border: filterType === type ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
                    color: filterType === type ? 'var(--cyan-primary)' : 'var(--text-secondary)',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {type === 'all' ? 'All' : type}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* History List */}
        {filtered.length === 0 ? (
          <div style={{
            padding: '80px 24px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
              {history.length === 0 ? 'No analyses yet' : 'No matching analyses'}
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
              {history.length === 0
                ? "Start by analyzing a suspicious URL or message."
                : "Try changing the filters above."}
            </div>
            {history.length === 0 && (
              <Link href="/analyze" className="btn-primary" style={{ textDecoration: 'none', fontSize: '13px' }}>
                <Shield size={14} />
                Analyze a Threat
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(record => (
              <div
                key={record.id}
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'border-color 0.15s ease',
                  borderLeft: `3px solid ${RISK_COLORS[record.riskLevel] || 'var(--border-default)'}`,
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border-default)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                {/* Risk indicator */}
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: `${RISK_COLORS[record.riskLevel] || 'var(--border-default)'}12`,
                  border: `1px solid ${RISK_COLORS[record.riskLevel] || 'var(--border-default)'}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 800,
                  fontSize: '14px',
                  color: RISK_COLORS[record.riskLevel],
                }}>
                  {record.riskScore}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{record.classificationDisplay}</span>
                    <span className={`badge ${RISK_BADGE_CLASSES[record.riskLevel] || ''}`}>
                      {record.riskLevel}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 8px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '4px',
                      color: 'var(--text-muted)',
                      textTransform: 'capitalize',
                    }}>
                      {record.inputType === 'url' ? '🔗' : '💬'} {record.inputType}
                    </span>
                  </div>
                  {record.preview && (
                    <div style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '400px',
                    }}>
                      {record.preview}
                    </div>
                  )}
                </div>

                {/* Time + Delete */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {formatDate(record.timestamp)}
                  </span>
                  <button
                    onClick={() => handleDelete(record.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '4px',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#F87171'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
