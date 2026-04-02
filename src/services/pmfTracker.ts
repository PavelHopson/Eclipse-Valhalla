/**
 * Eclipse Valhalla — PMF Tracker
 *
 * Product-Market Fit signals. Track what matters:
 *
 * 1. Time to first quest (target: <60s)
 * 2. D1 retention (target: >30%)
 * 3. D3 retention (target: >20%)
 * 4. D7 retention (target: >10%)
 * 5. First payment (any payment = signal)
 * 6. Core action: quest created, quest completed
 *
 * All data stored locally. Ready for server-side analytics.
 */

import { trackEvent } from './analyticsService';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface PMFSignals {
  installDate: string;
  firstQuestAt: string | null;
  timeToFirstQuestMs: number | null;
  firstCompleteAt: string | null;
  firstPaymentAt: string | null;
  sessions: SessionMark[];
  d1: boolean;
  d3: boolean;
  d7: boolean;
  d14: boolean;
  d30: boolean;
  totalQuests: number;
  totalCompleted: number;
  totalSessions: number;
}

interface SessionMark {
  date: string;  // YYYY-MM-DD
  ts: number;
}

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const KEY = 'ev_pmf';

function getSignals(): PMFSignals {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const now = new Date();
  return {
    installDate: now.toISOString(),
    firstQuestAt: null,
    timeToFirstQuestMs: null,
    firstCompleteAt: null,
    firstPaymentAt: null,
    sessions: [{ date: toDate(now), ts: now.getTime() }],
    d1: false, d3: false, d7: false, d14: false, d30: false,
    totalQuests: 0,
    totalCompleted: 0,
    totalSessions: 1,
  };
}

function save(s: PMFSignals): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

// ═══════════════════════════════════════════
// TRACKING
// ═══════════════════════════════════════════

export function pmfSessionStart(): void {
  const s = getSignals();
  const now = new Date();
  const today = toDate(now);

  // Don't duplicate today's session
  if (!s.sessions.find(m => m.date === today)) {
    s.sessions.push({ date: today, ts: now.getTime() });
  }
  s.totalSessions++;

  // Check retention days
  const installDate = new Date(s.installDate);
  const daysSince = Math.floor((now.getTime() - installDate.getTime()) / 86400000);
  if (daysSince >= 1) s.d1 = true;
  if (daysSince >= 3) s.d3 = true;
  if (daysSince >= 7) s.d7 = true;
  if (daysSince >= 14) s.d14 = true;
  if (daysSince >= 30) s.d30 = true;

  save(s);
}

export function pmfQuestCreated(): void {
  const s = getSignals();
  s.totalQuests++;

  if (!s.firstQuestAt) {
    s.firstQuestAt = new Date().toISOString();
    s.timeToFirstQuestMs = Date.now() - new Date(s.installDate).getTime();
    trackEvent('pmf_first_quest', { timeMs: s.timeToFirstQuestMs });
  }

  save(s);
}

export function pmfQuestCompleted(): void {
  const s = getSignals();
  s.totalCompleted++;

  if (!s.firstCompleteAt) {
    s.firstCompleteAt = new Date().toISOString();
    trackEvent('pmf_first_complete');
  }

  save(s);
}

export function pmfPayment(): void {
  const s = getSignals();
  if (!s.firstPaymentAt) {
    s.firstPaymentAt = new Date().toISOString();
    trackEvent('pmf_first_payment');
  }
  save(s);
}

// ═══════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════

export function getPMFReport(): PMFSignals & {
  healthVerdict: string;
  criticalIssues: string[];
} {
  const s = getSignals();
  const issues: string[] = [];

  // Time to first quest
  if (s.timeToFirstQuestMs !== null && s.timeToFirstQuestMs > 120000) {
    issues.push(`Time to first quest: ${Math.round(s.timeToFirstQuestMs / 1000)}s (target: <60s)`);
  }
  if (s.totalSessions > 2 && !s.firstQuestAt) {
    issues.push('User has 3+ sessions but never created a quest');
  }

  // Retention
  const installDays = Math.floor((Date.now() - new Date(s.installDate).getTime()) / 86400000);
  if (installDays >= 2 && !s.d1) issues.push('D1 retention: FAILED (did not return day 1)');
  if (installDays >= 4 && !s.d3) issues.push('D3 retention: FAILED');
  if (installDays >= 8 && !s.d7) issues.push('D7 retention: FAILED');

  // Completion rate
  if (s.totalQuests > 5 && s.totalCompleted === 0) {
    issues.push('Created 5+ quests but completed 0');
  }

  // Verdict
  let verdict: string;
  if (issues.length === 0 && s.d7) verdict = 'Strong PMF signals.';
  else if (issues.length === 0) verdict = 'Early signals positive. Need more data.';
  else if (issues.length <= 2) verdict = 'Mixed signals. Address issues.';
  else verdict = 'Weak signals. Critical action needed.';

  return { ...s, healthVerdict: verdict, criticalIssues: issues };
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function toDate(d: Date): string {
  return d.toISOString().split('T')[0];
}
