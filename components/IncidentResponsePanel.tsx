'use client';

import { useState } from 'react';
import type { IncidentAction, IncidentResponse } from '@/types';

const INCIDENT_OPTIONS: { action: IncidentAction; label: string; icon: string; description: string }[] = [
  {
    action: 'not_clicked',
    label: "I didn't click it",
    icon: '✅',
    description: 'I saw it but took no action',
  },
  {
    action: 'clicked_link',
    label: 'I clicked the link',
    icon: '⚠️',
    description: 'I opened the URL/link',
  },
  {
    action: 'entered_password',
    label: 'I entered my password',
    icon: '🔴',
    description: 'I typed in my credentials',
  },
  {
    action: 'shared_otp',
    label: 'I shared an OTP',
    icon: '🚨',
    description: 'I gave someone a one-time code',
  },
  {
    action: 'made_payment',
    label: 'I made a payment',
    icon: '💸',
    description: 'I transferred money',
  },
];

const INCIDENT_RESPONSES: Record<IncidentAction, IncidentResponse> = {
  not_clicked: {
    action: 'not_clicked',
    severity: 'medium',
    title: 'Good — You Are Safe',
    steps: [
      'Do not click the link or respond to the message.',
      'Delete the message from your inbox.',
      'If received via email, mark it as phishing/spam.',
      'If you know the sender, warn them their account may be compromised.',
      "Report the message to the platform (e.g., WhatsApp's Report function).",
    ],
  },
  clicked_link: {
    action: 'clicked_link',
    severity: 'high',
    title: 'Caution — Link Was Visited',
    steps: [
      'Close the page immediately if it is still open.',
      'Do NOT enter any information on that page.',
      'Do NOT download or install anything from that site.',
      'Clear your browser history and cookies.',
      'Run a security scan on your device.',
      'Monitor your accounts for any unusual activity over the next 30 days.',
      'If you were prompted to log in, change that password immediately (see: "I entered my password").',
    ],
    warning: 'Simply visiting a phishing page usually does not compromise your account unless you entered credentials or downloaded something.',
  },
  entered_password: {
    action: 'entered_password',
    severity: 'urgent',
    title: '⚡ Urgent Action Required',
    steps: [
      'Go to the LEGITIMATE website directly (type the address manually, do NOT use the link from the message).',
      'Change your password immediately.',
      'If you used the same password elsewhere, change it on ALL those accounts now.',
      'Enable Multi-Factor Authentication (MFA/2FA) on the affected account.',
      'Review active sessions and sign out of all unknown devices.',
      'Check your email linked to the account — the attacker may have changed your recovery email.',
      'Notify the organization through their official support channel.',
      "Review your account's recent activity for unauthorized changes.",
    ],
    warning: 'Your credentials may already be in use by the attacker. Act within minutes, not hours.',
  },
  shared_otp: {
    action: 'shared_otp',
    severity: 'urgent',
    title: '🚨 Critical — OTP Was Shared',
    steps: [
      'Call the legitimate organization immediately using their official number.',
      'Report that your OTP was shared with an unauthorized party.',
      'Ask them to block any recent transactions or changes made to your account.',
      'Change your account password immediately.',
      'Enable Multi-Factor Authentication if not already active.',
      'If banking-related: contact your bank immediately to freeze the account if needed.',
      "Review all recent transactions and dispute any you didn't make.",
      'File a complaint with your national cybercrime authority.',
    ],
    warning: 'An OTP can enable full account takeover or authorize financial transactions within seconds. Contact the organization RIGHT NOW.',
  },
  made_payment: {
    action: 'made_payment',
    severity: 'urgent',
    title: '🚨 Urgent — Payment Was Made',
    steps: [
      'Contact your bank or payment provider immediately — explain you were scammed.',
      'Request a chargeback or transaction reversal (success rate is higher if acted upon quickly).',
      'Block your card if card details were shared.',
      'If UPI/digital payment: contact the payment platform\'s fraud helpline.',
      "File a complaint at your national cybercrime portal (India: cybercrime.gov.in, US: ic3.gov).",
      'Keep all evidence: transaction IDs, screenshots, messages.',
      'Monitor your account for further unauthorized transactions.',
      'Alert your bank to flag any suspicious activity.',
    ],
    warning: 'The faster you act, the higher the chance of recovery. Some banks can reverse transactions within hours.',
  },
};

interface IncidentResponsePanelProps {
  riskLevel: string;
}

export function IncidentResponsePanel({ riskLevel }: IncidentResponsePanelProps) {
  const [selectedAction, setSelectedAction] = useState<IncidentAction | null>(null);
  const response = selectedAction ? INCIDENT_RESPONSES[selectedAction] : null;

  const getUrgencyStyle = (severity: string) => {
    if (severity === 'urgent') return { 
      bg: 'rgba(239, 68, 68, 0.08)', 
      border: 'rgba(239, 68, 68, 0.3)',
      headerBg: 'rgba(239, 68, 68, 0.12)',
      color: '#EF4444',
    };
    if (severity === 'high') return { 
      bg: 'rgba(251, 146, 60, 0.06)', 
      border: 'rgba(251, 146, 60, 0.25)',
      headerBg: 'rgba(251, 146, 60, 0.1)',
      color: '#FB923C',
    };
    return { 
      bg: 'rgba(34, 211, 238, 0.06)', 
      border: 'rgba(34, 211, 238, 0.2)',
      headerBg: 'rgba(34, 211, 238, 0.08)',
      color: '#22D3EE',
    };
  };

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-elevated)',
      }}>
        <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
          Incident Response
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
          What Happened?
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Select what you already did. We'll give you a personalized response plan.
        </p>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {INCIDENT_OPTIONS.map(({ action, label, icon, description }) => (
          <button
            key={action}
            onClick={() => setSelectedAction(action)}
            className={`incident-btn ${selectedAction === action ? 'active' : ''}`}
          >
            <span style={{ fontSize: '18px', flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '1px' }}>{label}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{description}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Response */}
      {response && (() => {
        const style = getUrgencyStyle(response.severity);
        return (
          <div style={{
            margin: '0 20px 20px',
            background: style.bg,
            border: `1px solid ${style.border}`,
            borderRadius: '12px',
            overflow: 'hidden',
          }}
          className="animate-fade-in"
          >
            {/* Response header */}
            <div style={{
              padding: '14px 18px',
              background: style.headerBg,
              borderBottom: `1px solid ${style.border}`,
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 800, 
                color: style.color,
                letterSpacing: '-0.01em',
              }}>
                {response.title}
              </div>
            </div>

            {/* Warning */}
            {response.warning && (
              <div style={{
                padding: '10px 18px',
                background: `${style.color}08`,
                borderBottom: `1px solid ${style.border}`,
                fontSize: '12px',
                color: style.color,
                lineHeight: 1.5,
              }}>
                ⚠️ {response.warning}
              </div>
            )}

            {/* Steps */}
            <div style={{ padding: '16px 18px' }}>
              <div style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                letterSpacing: '0.1em', 
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: '12px',
              }}>
                Action Steps
              </div>
              <ol style={{ 
                paddingLeft: '0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                listStyle: 'none',
              }}>
                {response.steps.map((step, i) => (
                  <li key={i} style={{ 
                    display: 'flex', 
                    gap: '12px',
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}>
                    <span style={{
                      flexShrink: 0,
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: `${style.color}15`,
                      border: `1px solid ${style.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: style.color,
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
