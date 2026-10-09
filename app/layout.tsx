import type { Metadata } from 'next';
import './globals.css';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'CyberShield AI — Cybersecurity Threat Analyzer',
  description: 'AI-powered cybersecurity platform that analyzes suspicious URLs and messages, explains warning signs, and provides personalized incident response plans.',
  keywords: ['cybersecurity', 'phishing detection', 'scam analyzer', 'URL analyzer', 'AI security'],
  openGraph: {
    title: 'CyberShield AI',
    description: "Don't just detect the threat. Know what to do next.",
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&amp;family=JetBrains+Mono:wght@400;500;600&amp;display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#050A14" />
      </head>
      <body>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          flexDirection: 'column',
          background: 'var(--bg-base)',
        }}>
          <Navigation />
          <main style={{ flex: 1, paddingTop: '64px' }}>
            {children}
          </main>
          <footer style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '20px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}>
            CyberShield AI — For educational and demonstration purposes only. Always verify with official sources.
          </footer>
        </div>
      </body>
    </html>
  );
}
