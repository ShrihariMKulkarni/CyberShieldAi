/**
 * History management using localStorage (client-side).
 * Raw message content is NOT stored by default.
 */

export interface HistoryRecord {
  id: string;
  timestamp: string;
  inputType: 'url' | 'message';
  classification: string;
  classificationDisplay: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'SUSPICIOUS' | 'HIGH' | 'CRITICAL';
  summary?: string;
  // Truncated preview only — never full content
  preview?: string;
}

const HISTORY_KEY = 'cybershield_history';
const MAX_HISTORY = 50;

export function getHistory(): HistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function addToHistory(record: Omit<HistoryRecord, 'id' | 'timestamp'>): HistoryRecord {
  const newRecord: HistoryRecord = {
    ...record,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  
  const history = getHistory();
  const updated = [newRecord, ...history].slice(0, MAX_HISTORY);
  
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Storage might be full
  }
  
  return newRecord;
}

export function deleteHistoryRecord(id: string): void {
  const history = getHistory();
  const updated = history.filter(r => r.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function getHistoryStats(): {
  total: number;
  threats: number;
  highRisk: number;
  byCategory: Record<string, number>;
} {
  const history = getHistory();
  
  const threats = history.filter(r => 
    !['safe', 'unknown'].includes(r.classification)
  ).length;
  
  const highRisk = history.filter(r => 
    ['HIGH', 'CRITICAL'].includes(r.riskLevel)
  ).length;
  
  const byCategory: Record<string, number> = {};
  for (const record of history) {
    const cat = record.classificationDisplay || record.classification;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  
  return { total: history.length, threats, highRisk, byCategory };
}
