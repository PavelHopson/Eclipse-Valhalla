/**
 * Eclipse Valhalla — Retention Service
 *
 * Smart pressure system. Not annoying — disciplined.
 *
 * Triggers:
 * - Streak loss warning
 * - Inactivity alerts
 * - Critical quest alerts
 * - Comeback prompts
 */

import { notifyInApp, notifyPush } from './notificationService';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface RetentionState {
  lastSessionAt: string;
  consecutiveInactiveDays: number;
  streakWarningShown: boolean;
  comebackPromptShown: boolean;
}

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const KEY = 'eclipse_retention';

function getState(): RetentionState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || defaultState();
  } catch { return defaultState(); }
}

function saveState(s: RetentionState): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function defaultState(): RetentionState {
  return {
    lastSessionAt: new Date().toISOString(),
    consecutiveInactiveDays: 0,
    streakWarningShown: false,
    comebackPromptShown: false,
  };
}

// ═══════════════════════════════════════════
// SESSION TRACKING
// ═══════════════════════════════════════════

/**
 * Call on every app open. Tracks activity and triggers retention logic.
 */
export function recordSession(): RetentionCheck {
  const state = getState();
  const now = new Date();
  const lastSession = new Date(state.lastSessionAt);
  const daysSinceLastSession = Math.floor((now.getTime() - lastSession.getTime()) / 86400000);

  const check: RetentionCheck = {
    daysSinceLastSession,
    isComeback: daysSinceLastSession > 2,
    streakAtRisk: false,
    alerts: [],
  };

  // Streak at risk (didn't open yesterday)
  if (daysSinceLastSession >= 1) {
    check.streakAtRisk = true;
    if (!state.streakWarningShown) {
      check.alerts.push({
        type: 'streak_warning',
        title: 'Streak at risk.',
        message: `${daysSinceLastSession} day${daysSinceLastSession > 1 ? 's' : ''} inactive. Complete one objective to maintain streak.`,
      });
      state.streakWarningShown = true;
    }
  }

  // Comeback after 3+ days
  if (daysSinceLastSession >= 3 && !state.comebackPromptShown) {
    check.alerts.push({
      type: 'comeback',
      title: 'You were away.',
      message: `${daysSinceLastSession} days since last session. Review overdue objectives. Rebuild discipline.`,
    });
    state.comebackPromptShown = true;
  }

  // Inactivity counter
  state.consecutiveInactiveDays = daysSinceLastSession;
  state.lastSessionAt = now.toISOString();

  // Reset flags for new day cycle
  if (daysSinceLastSession === 0) {
    state.streakWarningShown = false;
    state.comebackPromptShown = false;
  }

  saveState(state);
  return check;
}

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface RetentionCheck {
  daysSinceLastSession: number;
  isComeback: boolean;
  streakAtRisk: boolean;
  alerts: RetentionAlert[];
}

export interface RetentionAlert {
  type: 'streak_warning' | 'comeback' | 'critical_quest' | 'inactivity';
  title: string;
  message: string;
}

// ═══════════════════════════════════════════
// CRITICAL QUEST ALERTS
// ═══════════════════════════════════════════

/**
 * Check for quests that are about to become overdue (within 1 hour).
 */
export function checkCriticalQuests(quests: { id: string; title: string; priority: string; dueDateTime: string; isCompleted: boolean }[]): RetentionAlert[] {
  const now = Date.now();
  const alerts: RetentionAlert[] = [];

  for (const quest of quests) {
    if (quest.isCompleted) continue;
    const dueIn = new Date(quest.dueDateTime).getTime() - now;

    // Due within 1 hour
    if (dueIn > 0 && dueIn < 3600000) {
      alerts.push({
        type: 'critical_quest',
        title: `Deadline approaching: ${quest.title}`,
        message: `Due in ${Math.round(dueIn / 60000)} minutes. Act now.`,
      });
    }

    // Just became overdue (within last 5 minutes)
    if (dueIn < 0 && dueIn > -300000 && quest.priority === 'High') {
      alerts.push({
        type: 'critical_quest',
        title: `OVERDUE: ${quest.title}`,
        message: 'High-priority objective failed deadline. Immediate action required.',
      });
    }
  }

  return alerts;
}

// ═══════════════════════════════════════════
// DISPATCH ALERTS
// ═══════════════════════════════════════════

/**
 * Send retention alerts via notification system.
 */
export function dispatchAlerts(alerts: RetentionAlert[]): void {
  for (const alert of alerts) {
    const type = alert.type === 'critical_quest' ? 'critical'
      : alert.type === 'streak_warning' ? 'warning'
      : 'info';

    notifyInApp(alert.title, alert.message, type as any);

    // Push for critical items
    if (alert.type === 'critical_quest' || alert.type === 'streak_warning') {
      notifyPush(alert.title, alert.message, type as any);
    }
  }
}
