/**
 * Eclipse Valhalla — Daily Loop Service
 *
 * Manages the daily discipline cycle:
 *   Morning  → Oracle briefing, day preview
 *   Day      → Active quests, widgets, focus
 *   Evening  → Summary, streak update, reflection
 *
 * Tracks daily state and triggers appropriate actions.
 */

import { Reminder } from '../types';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type DayPhase = 'morning' | 'day' | 'evening' | 'night';

export interface DailySummary {
  date: string;
  phase: DayPhase;
  questsActive: number;
  questsCompleted: number;
  questsOverdue: number;
  questsFailed: number;
  focusMinutes: number;
  streakMaintained: boolean;
  disciplineScore: number;
  oracleMessage: string;
}

export interface DailyState {
  lastCheckedDate: string;    // YYYY-MM-DD
  morningBriefingShown: boolean;
  eveningSummaryShown: boolean;
  dailyResetDone: boolean;
}

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const STATE_KEY = 'eclipse_daily_state';

function getState(): DailyState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : defaultState();
  } catch { return defaultState(); }
}

function saveState(state: DailyState): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function defaultState(): DailyState {
  return {
    lastCheckedDate: '',
    morningBriefingShown: false,
    eveningSummaryShown: false,
    dailyResetDone: false,
  };
}

// ═══════════════════════════════════════════
// DAY PHASE
// ═══════════════════════════════════════════

export function getCurrentPhase(): DayPhase {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

export function getPhaseGreeting(phase: DayPhase): string {
  switch (phase) {
    case 'morning': return 'Dawn cycle. Review your objectives.';
    case 'day':     return 'Active cycle. Execute with precision.';
    case 'evening': return 'Closing cycle. Assess your progress.';
    case 'night':   return 'Rest cycle. Prepare for tomorrow.';
  }
}

// ═══════════════════════════════════════════
// DAILY CHECK
// ═══════════════════════════════════════════

/**
 * Check if a new day has started. If yes, reset daily counters.
 * Call this on app load and periodically.
 */
export function checkDailyReset(): { isNewDay: boolean; phase: DayPhase } {
  const today = toDateStr(new Date());
  const state = getState();
  const phase = getCurrentPhase();

  if (state.lastCheckedDate !== today) {
    // New day
    saveState({
      lastCheckedDate: today,
      morningBriefingShown: false,
      eveningSummaryShown: false,
      dailyResetDone: true,
    });
    return { isNewDay: true, phase };
  }

  return { isNewDay: false, phase };
}

// ═══════════════════════════════════════════
// MORNING BRIEFING
// ═══════════════════════════════════════════

export function shouldShowMorningBriefing(): boolean {
  const state = getState();
  const phase = getCurrentPhase();
  return phase === 'morning' && !state.morningBriefingShown;
}

export function markMorningBriefingShown(): void {
  const state = getState();
  state.morningBriefingShown = true;
  saveState(state);
}

export function generateMorningBriefing(quests: Reminder[]): string {
  const pending = quests.filter(q => !q.isCompleted);
  const overdue = pending.filter(q => new Date(q.dueDateTime) < new Date());
  const highPriority = pending.filter(q => q.priority === 'High');

  if (pending.length === 0) {
    return 'No objectives scheduled. Define your targets or the day controls you.';
  }

  const parts: string[] = [];
  parts.push(`${pending.length} objective${pending.length !== 1 ? 's' : ''} active.`);

  if (overdue.length > 0) {
    parts.push(`${overdue.length} overdue. Address immediately.`);
  }

  if (highPriority.length > 0) {
    parts.push(`Priority target: "${highPriority[0].title}".`);
  } else {
    parts.push(`Start with: "${pending[0].title}".`);
  }

  parts.push('Execute with discipline.');

  return parts.join(' ');
}

// ═══════════════════════════════════════════
// EVENING SUMMARY
// ═══════════════════════════════════════════

export function shouldShowEveningSummary(): boolean {
  const state = getState();
  const phase = getCurrentPhase();
  return phase === 'evening' && !state.eveningSummaryShown;
}

export function markEveningSummaryShown(): void {
  const state = getState();
  state.eveningSummaryShown = true;
  saveState(state);
}

export function generateEveningSummary(
  quests: Reminder[],
  disciplineScore: number,
  streak: number
): DailySummary {
  const today = new Date();
  const todayStr = toDateStr(today);
  const phase = getCurrentPhase();

  const todayQuests = quests; // All quests are relevant
  const completed = todayQuests.filter(q => q.isCompleted);
  const overdue = todayQuests.filter(q => !q.isCompleted && new Date(q.dueDateTime) < today);
  const active = todayQuests.filter(q => !q.isCompleted);

  const completionRate = todayQuests.length > 0
    ? Math.round((completed.length / todayQuests.length) * 100)
    : 0;

  let message: string;
  if (completionRate >= 80) {
    message = `${completionRate}% completion. Discipline maintained. Streak: ${streak} day${streak !== 1 ? 's' : ''}.`;
  } else if (completionRate >= 50) {
    message = `${completionRate}% completion. Acceptable. ${active.length} objectives remain. Tomorrow, do better.`;
  } else if (completionRate > 0) {
    message = `${completionRate}% completion. Below standard. ${overdue.length} overdue. Rebuild focus.`;
  } else {
    message = 'No objectives completed today. Discipline score declining. Reassess priorities.';
  }

  return {
    date: todayStr,
    phase,
    questsActive: active.length,
    questsCompleted: completed.length,
    questsOverdue: overdue.length,
    questsFailed: overdue.length,
    focusMinutes: 0,
    streakMaintained: completionRate >= 80,
    disciplineScore,
    oracleMessage: message,
  };
}

// ═══════════════════════════════════════════
// STREAK FEEDBACK
// ═══════════════════════════════════════════

export function getStreakFeedback(streak: number, wasActive: boolean): string {
  if (!wasActive) return 'Inactive day. Streak at risk.';
  if (streak === 0) return 'Streak broken. Day one begins now.';
  if (streak < 3) return `${streak}-day streak. Building momentum.`;
  if (streak < 7) return `${streak}-day streak. Consistency forming.`;
  if (streak < 14) return `${streak}-day streak. Discipline proven.`;
  if (streak < 30) return `${streak}-day streak. Warrior-level consistency.`;
  return `${streak}-day streak. Legendary discipline.`;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}
