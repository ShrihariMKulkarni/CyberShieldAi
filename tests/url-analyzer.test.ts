/**
 * Tests for URL Analyzer
 * Run with: npx jest or npx ts-node tests/url-analyzer.test.ts
 */

import { analyzeUrl, isLikelyUrl } from '../lib/security/url-analyzer';

// Simple test runner
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`❌ FAIL: ${name} — ${e}`);
    failed++;
  }
}

function expect(actual: unknown) {
  return {
    toBe: (expected: unknown) => {
      if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
    },
    toBeGreaterThan: (n: number) => {
      if (typeof actual !== 'number' || actual <= n) throw new Error(`Expected > ${n}, got ${actual}`);
    },
    toContain: (str: string) => {
      if (typeof actual !== 'string' || !actual.includes(str)) throw new Error(`Expected "${actual}" to contain "${str}"`);
    },
    toBeTruthy: () => {
      if (!actual) throw new Error(`Expected truthy, got ${actual}`);
    },
    toBeFalsy: () => {
      if (actual) throw new Error(`Expected falsy, got ${actual}`);
    },
    toBeGreaterThanOrEqual: (n: number) => {
      if (typeof actual !== 'number' || actual < n) throw new Error(`Expected >= ${n}, got ${actual}`);
    },
  };
}

// --- isLikelyUrl tests ---
test('isLikelyUrl: detects http URL', () => {
  expect(isLikelyUrl('http://example.com')).toBeTruthy();
});

test('isLikelyUrl: detects https URL', () => {
  expect(isLikelyUrl('https://paypal.com')).toBeTruthy();
});

test('isLikelyUrl: detects www. prefix', () => {
  expect(isLikelyUrl('www.example.com')).toBeTruthy();
});

test('isLikelyUrl: detects domain with path', () => {
  expect(isLikelyUrl('example.com/login')).toBeTruthy();
});

test('isLikelyUrl: does not detect plain text as URL', () => {
  expect(isLikelyUrl('Your account will be suspended')).toBeFalsy();
});

// --- analyzeUrl tests ---

test('analyzeUrl: safe HTTPS URL should have low score', () => {
  const result = analyzeUrl('https://example.com');
  expect(result.isUrl).toBeTruthy();
  expect(result.totalScore).toBe(0);
});

test('analyzeUrl: HTTP URL should add score', () => {
  const result = analyzeUrl('http://example.com');
  expect(result.isUrl).toBeTruthy();
  expect(result.totalScore).toBeGreaterThan(0);
  const signal = result.signals.find(s => s.type.includes('HTTP'));
  expect(!!signal).toBeTruthy();
});

test('analyzeUrl: brand in subdomain should be flagged', () => {
  const result = analyzeUrl('https://paypal-security-login.example.com/verify');
  expect(result.isUrl).toBeTruthy();
  expect(result.totalScore).toBeGreaterThanOrEqual(30);
  const brandSignal = result.signals.find(s => s.type.includes('Brand Impersonation'));
  expect(!!brandSignal).toBeTruthy();
});

test('analyzeUrl: suspicious path keywords should add score', () => {
  const result = analyzeUrl('https://example.com/login/verify');
  const pathSignal = result.signals.find(s => s.type.includes('Path'));
  expect(!!pathSignal).toBeTruthy();
});

test('analyzeUrl: IP address URL should be flagged', () => {
  const result = analyzeUrl('http://192.168.1.1/login');
  const ipSignal = result.signals.find(s => s.type.includes('IP Address'));
  expect(!!ipSignal).toBeTruthy();
});

test('analyzeUrl: @ symbol should be flagged', () => {
  const result = analyzeUrl('http://evil.com@legitimate.com');
  const atSignal = result.signals.find(s => s.type.includes('At-Symbol'));
  expect(!!atSignal).toBeTruthy();
});

test('analyzeUrl: URL shortener should be flagged', () => {
  const result = analyzeUrl('https://bit.ly/abc123');
  const shortenerSignal = result.signals.find(s => s.type.includes('Shortener'));
  expect(!!shortenerSignal).toBeTruthy();
});

test('analyzeUrl: full phishing URL gets CRITICAL score', () => {
  const result = analyzeUrl('http://paypal-account-verify.secure-login-now.xyz/webscr?cmd=confirm');
  expect(result.totalScore).toBeGreaterThanOrEqual(50);
});

test('analyzeUrl: registered domain extracted correctly', () => {
  const result = analyzeUrl('https://paypal-security.phishingsite.com/login');
  expect(result.registeredDomain).toBe('phishingsite.com');
});

// --- Summary ---
console.log(`\n📊 Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed > 0) process.exit(1);
