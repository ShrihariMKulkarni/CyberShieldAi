'use client';

import Link from 'next/link';
import { Shield, Zap, Eye, ChevronRight, Lock, AlertTriangle } from 'lucide-react';

const workflowSteps = [
  {
    number: '01',
    title: 'Paste',
    description: 'Drop in any suspicious URL, SMS, WhatsApp message, or email content.',
    icon: '📥',
  },
  {
    number: '02',
    title: 'Analyze',
    description: 'AI + deterministic cybersecurity heuristics inspect it for 30+ threat indicators.',
    icon: '🔬',
  },
  {
    number: '03',
    title: 'Understand',
    description: 'See the exact warning signs with evidence, severity, and plain-language explanations.',
    icon: '🔍',
  },
  {
    number: '04',
    title: 'Act',
    description: 'Get a personalized response plan based on what you already did.',
    icon: '🛡️',
  },
];

const threatTypes = [
  { icon: '🎣', label: 'Phishing' },
  { icon: '💸', label: 'Financial Scams' },
  { icon: '🔑', label: 'Credential Theft' },
  { icon: '📱', label: 'OTP Scams' },
  { icon: '🎭', label: 'Impersonation' },
  { icon: '💼', label: 'Job Scams' },
  { icon: '📦', label: 'Delivery Scams' },
  { icon: '🕵️', label: 'Identity Theft' },
];

const capabilities = [
  {
    icon: Shield,
    title: 'Deterministic Engine',
    description: '30+ rule-based security checks that run before AI — not influenced by prompt injection.',
  },
  {
    icon: Eye,
    title: 'Explainable Results',
    description: 'Every finding shows what was detected, why it matters, and its severity level.',
  },
  {
    icon: Zap,
    title: 'Incident Response',
    description: 'Tell us what happened and get a step-by-step response plan tailored to your situation.',
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero Section */}
      <section style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }} />

        {/* Radial glow */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '780px', textAlign: 'center' }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 16px',
            background: 'rgba(56, 189, 248, 0.07)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '100px',
            marginBottom: '32px',
            color: 'var(--cyan-primary)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            <Lock size={11} />
            AI-Powered Cybersecurity
          </div>

          {/* Main headline */}
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 900,
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            marginBottom: '24px',
            color: 'var(--text-primary)',
          }}>
            Don't Just Detect{' '}
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #38BDF8, #7DD3FC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              the Threat.
            </span>
            <br />
            Know What to Do Next.
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 'clamp(16px, 2vw, 19px)',
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            marginBottom: '40px',
            maxWidth: '560px',
            margin: '0 auto 40px',
          }}>
            CyberShield AI analyzes suspicious links and messages, explains every warning sign with evidence, and gives you a personalized response plan.
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '48px' }}>
            <Link href="/analyze" className="btn-primary" style={{ 
              fontSize: '15px', 
              padding: '14px 32px',
              textDecoration: 'none',
              borderRadius: '9px',
              boxShadow: '0 0 30px rgba(56, 189, 248, 0.3)',
            }}>
              <Shield size={16} />
              Analyze a Threat
            </Link>
            <Link href="/analyze?demo=true" className="btn-secondary" style={{ 
              fontSize: '14px',
              padding: '13px 28px',
              textDecoration: 'none',
              borderRadius: '9px',
            }}>
              Try Demo →
            </Link>
          </div>

          {/* Warning notice */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'rgba(234, 179, 8, 0.06)',
            border: '1px solid rgba(234, 179, 8, 0.15)',
            borderRadius: '8px',
            color: '#EAB308',
            fontSize: '12px',
          }}>
            <AlertTriangle size={12} />
            Do not paste passwords, OTPs, private keys, or payment card information.
          </div>
        </div>
      </section>

      {/* Threat Types */}
      <section style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '32px 24px',
        background: 'var(--bg-surface)',
      }}>
        <div className="container">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Detects
            </span>
            {threatTypes.map(({ icon, label }) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '100px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}>
                <span>{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '96px 24px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="section-label" style={{ marginBottom: '12px' }}>How It Works</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              From Suspicious to Secure in 4 Steps
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
          }}>
            {workflowSteps.map((step, index) => (
              <div key={step.number} style={{
                padding: '32px 24px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 0.2s ease, transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-active)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  fontSize: '80px',
                  fontWeight: 900,
                  color: 'rgba(56, 189, 248, 0.04)',
                  lineHeight: 1,
                  fontFamily: 'JetBrains Mono, monospace',
                  userSelect: 'none',
                }}>
                  {step.number}
                </div>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{step.icon}</div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'var(--cyan-primary)',
                  textTransform: 'uppercase',
                  marginBottom: '8px',
                }}>
                  Step {step.number}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{step.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.description}</p>
                {index < workflowSteps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    right: '-12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--border-active)',
                    zIndex: 10,
                    display: 'none',
                  }} className="step-arrow">
                    <ChevronRight size={24} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section style={{ 
        padding: '80px 24px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div className="section-label" style={{ marginBottom: '12px' }}>Why CyberShield AI</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Built for Real-World Threats
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {capabilities.map(({ icon: Icon, title, description }) => (
              <div key={title} style={{
                padding: '32px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--cyan-glow)',
                  border: '1px solid var(--border-active)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}>
                  <Icon size={22} color="var(--cyan-primary)" />
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '10px' }}>{title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '96px 24px', textAlign: 'center' }}>
        <div className="container">
          <div style={{
            padding: '64px 48px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.06), rgba(56, 189, 248, 0.02))',
            border: '1px solid var(--border-active)',
            borderRadius: '24px',
            maxWidth: '600px',
            margin: '0 auto',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🛡️</div>
            <h2 style={{ 
              fontSize: 'clamp(24px, 4vw, 36px)', 
              fontWeight: 800, 
              letterSpacing: '-0.02em',
              marginBottom: '16px',
            }}>
              Something looks suspicious?
            </h2>
            <p style={{ 
              color: 'var(--text-secondary)', 
              marginBottom: '32px',
              fontSize: '15px',
              lineHeight: 1.7,
            }}>
              Paste it. Analyze it. Know exactly what to do.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/analyze" className="btn-primary" style={{ 
                textDecoration: 'none',
                fontSize: '14px',
                padding: '13px 28px',
                boxShadow: '0 0 24px rgba(56, 189, 248, 0.25)',
              }}>
                <Shield size={15} />
                Analyze a Threat
              </Link>
              <Link href="/analyze?demo=true" className="btn-secondary" style={{ 
                textDecoration: 'none',
                fontSize: '14px',
                padding: '12px 24px',
              }}>
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
