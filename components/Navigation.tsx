'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, LayoutDashboard, Search, Clock, Menu, X } from 'lucide-react';
import { useState } from 'react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/analyze', label: 'Analyze', icon: Search },
  { href: '/history', label: 'History', icon: Clock },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      background: 'rgba(5, 10, 20, 0.92)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      height: '64px',
    }}>
      <div className="container" style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
      }}>
        {/* Logo */}
        <Link href="/" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          textDecoration: 'none',
          flexShrink: 0,
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '9px',
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.06))',
            border: '1px solid var(--border-active)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.15)',
          }}>
            <Shield size={18} color="var(--cyan-primary)" />
          </div>
          <div>
            <div style={{ 
              color: 'var(--text-primary)', 
              fontWeight: 800, 
              fontSize: '15px',
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
            }}>
              CyberShield<span style={{ color: 'var(--cyan-primary)' }}>AI</span>
            </div>
            <div style={{ 
              color: 'var(--text-muted)', 
              fontSize: '10px',
              letterSpacing: '0.06em',
              fontWeight: 600,
              textTransform: 'uppercase',
              lineHeight: 1,
            }}>
              Security Analyzer
            </div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
          <div style={{ marginLeft: '12px' }}>
            <Link href="/analyze" className="btn-primary" style={{ padding: '8px 18px', fontSize: '12px', borderRadius: '7px', textDecoration: 'none' }}>
              Analyze Threat
            </Link>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            padding: '8px',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileOpen && (
        <div style={{
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '12px 24px 16px',
        }}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname === href ? 'active' : ''}`}
              style={{ marginBottom: '4px', width: '100%' }}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
          <Link
            href="/analyze"
            className="btn-primary"
            style={{ marginTop: '8px', width: '100%', textDecoration: 'none', borderRadius: '7px' }}
            onClick={() => setMobileOpen(false)}
          >
            Analyze Threat
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </nav>
  );
}
