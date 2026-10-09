/**
 * Demo examples for hackathon demonstration.
 * Uses fictional/safe domains only.
 */

export interface DemoExample {
  id: string;
  title: string;
  description: string;
  type: 'url' | 'message';
  content: string;
  expectedClassification: string;
  expectedRisk: string;
  icon: string;
}

export const DEMO_EXAMPLES: DemoExample[] = [
  {
    id: 'banking-phishing',
    title: 'Banking Phishing Message',
    description: 'A fake bank security alert with credential request',
    type: 'message',
    content: `URGENT ALERT from SecureBank: We detected unauthorized access to your account. Your account will be suspended within 24 hours unless you verify your identity immediately.

Click here to verify: http://securebank-verification.phish-demo.xyz/login?ref=SMS

Please enter your username, password, and OTP to restore access. Failure to verify will result in permanent account closure.

SecureBank Security Team`,
    expectedClassification: 'Phishing / Credential Theft',
    expectedRisk: 'CRITICAL',
    icon: '🏦',
  },
  {
    id: 'job-scam',
    title: 'Fake Job Offer',
    description: 'A fraudulent work-from-home job offer',
    type: 'message',
    content: `Hi! You've been selected for an exciting remote opportunity!

Work from home and earn $500-$800 per day! No experience or qualifications needed. Just 2-3 hours daily.

This is a limited offer — only 5 positions available today!

To apply, send your full name, bank account details, and a small registration fee of $50 to confirm your position. 

Don't miss this chance! Respond immediately!

HR Team — GlobalRemote Jobs`,
    expectedClassification: 'Job Scam',
    expectedRisk: 'HIGH',
    icon: '💼',
  },
  {
    id: 'otp-scam',
    title: 'OTP Theft Attempt',
    description: 'A message designed to steal a one-time password',
    type: 'message',
    content: `Dear customer, your UPI transaction of Rs. 15,000 is on hold due to KYC verification failure.

To complete verification and release your funds, please share the 6-digit OTP you just received on your registered mobile number with our verification agent.

Call us NOW at +91-9876543210 or reply with your OTP to this message.

This is your FINAL NOTICE. Funds will be reversed in 30 minutes.

— PaySecure Verification Team`,
    expectedClassification: 'OTP Scam',
    expectedRisk: 'CRITICAL',
    icon: '🔢',
  },
  {
    id: 'brand-impersonation-url',
    title: 'Brand Impersonation URL',
    description: 'A URL that uses a brand name to deceive users',
    type: 'url',
    content: 'http://paypal-account-verify.secure-login-now.xyz/webscr?cmd=confirm&account=limited',
    expectedClassification: 'Phishing',
    expectedRisk: 'CRITICAL',
    icon: '🔗',
  },
];
