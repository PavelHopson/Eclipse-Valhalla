/**
 * Eclipse Valhalla — Gamification Service
 *
 * Path of Discipline. Not a game. A system of accountability.
 *
 * Tracks: XP, Level, Streak, Discipline Score, Focus Sessions.
 * Rewards completion. Punishes negligence.
 */

import { Reminder, Priority } from '../types';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface DisciplineState {
  xp: number;
  level: number;
  streak: number;                 // consecutive days with 100% completion
  lastActiveDate: string;         // YYYY-MM-DD
  completedToday: number;
  failedTotal: number;
  focusSessionsCompleted: number;
  disciplineScore: number;        // 0–100
  history: DailyRecord[];         // last 30 days
}

export interface DailyRecord {
  date: string;         // YYYY-MM-DD
  completed: number;
  total: number;
  overdue: number;
  xpEarned: number;
  focusSessions: number;
}

export interface XPEvent {
  amount: number;
  reason: string;
  timestamp: number;
}

// ═══════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════

const XP_QUEST_COMPLETE    = 50;
const XP_HIGH_ON_TIME      = 30;  // bonus for high-priority completed before deadline
const XP_FOCUS_SESSION     = 20;
const XP_STREAK_BONUS      = 10;  // per streak day
const XP_PENALTY_OVERDUE   = -25;
const XP_PENALTY_CRITICAL  = -50; // ignored critical quest

export const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 6000, 8000, 10000];

// ═══════════════════════════════════════════
// STATE MANAGEMENT
// ═══════════════════════════════════════════

const STORAGE_KEY = 'eclipse_discipline';

function getState(): DisciplineState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return createDefaultState();
}

function saveState(state: DisciplineState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function createDefaultState(): DisciplineState {
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: '',
    completedToday: 0,
    failedTotal: 0,
    focusSessionsCompleted: 0,
    disciplineScore: 50,
    history: [],
  };
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Get current discipline state.
 */
export function getDisciplineState(): DisciplineState {
  return getState();
}

/**
 * Calculate level from XP.
 */
export function calculateLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}

/**
 * Get XP needed for next level.
 */
export function getNextLevelXp(level: number): number {
  return LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
}

/**
 * Award XP for completing a quest.
 */
export function onQuestComplete(quest: Reminder): XPEvent {
  const state = getState();
  const now = new Date();
  const today = toDateStr(now);

  let amount = XP_QUEST_COMPLETE;
  let reason = 'Objective completed.';

  // Bonus for high priority completed on time
  if (quest.priority === Priority.HIGH && new Date(quest.dueDateTime) > now) {
    amount += XP_HIGH_ON_TIME;
    reason = 'High-priority objective completed on time. Bonus awarded.';
  }

  // Streak bonus
  if (state.streak > 0) {
    amount += Math.min(XP_STREAK_BONUS * state.streak, 100); // cap at 100
  }

  state.xp = Math.max(0, state.xp + amount);
  state.level = calculateLevel(state.xp);
  state.completedToday++;

  // Update last active date
  if (state.lastActiveDate !== today) {
    updateDailyRecord(state, today);
    state.lastActiveDate = today;
  }

  saveState(state);
  return { amount, reason, timestamp: Date.now() };
}

/**
 * Penalize for overdue/ignored quest.
 */
export function onQuestFailed(quest: Reminder): XPEvent {
  const state = getState();

  const isCritical = quest.priority === Priority.HIGH;
  const amount = isCritical ? XP_PENALTY_CRITICAL : XP_PENALTY_OVERDUE;
  const reason = isCritical
    ? 'Critical objective failed. Severe discipline penalty.'
    : 'Objective overdue. Penalty recorded.';

  state.xp = Math.max(0, state.xp + amount);
  state.level = calculateLevel(state.xp);
  state.failedTotal++;

  saveState(state);
  return { amount, reason, timestamp: Date.now() };
}

/**
 * Record a completed focus session.
 */
export function onFocusSessionComplete(): XPEvent {
  const state = getState();

  state.xp = Math.max(0, state.xp + XP_FOCUS_SESSION);
  state.level = calculateLevel(state.xp);
  state.focusSessionsCompleted++;

  saveState(state);
  return { amount: XP_FOCUS_SESSION, reason: 'Focus session sealed.', timestamp: Date.now() };
}

/**
 * Update streak at end of day. Call this on app load or daily.
 */
export function updateStreak(quests: Reminder[]): void {
  const state = getState();
  const today = toDateStr(new Date());

  if (state.lastActiveDate === today) return; // already processed today

  const yesterday = toDateStr(new Date(Date.now() - 86400000));

  // Check if yesterday had 100% completion
  const yesterdayRecord = state.history.find(h => h.date === yesterday);
  if (yesterdayRecord && yesterdayRecord.total > 0 && yesterdayRecord.completed >= yesterdayRecord.total) {
    state.streak++;
  } else if (state.lastActiveDate && state.lastActiveDate !== today) {
    // Streak broken
    state.streak = 0;
  }

  // Record today
  updateDailyRecord(state, today);
  state.lastActiveDate = today;

  saveState(state);
}

/**
 * Calculate discipline score (0–100).
 * Based on recent history, streak, and failure rate.
 */
export function calculateDisciplineScore(quests: Reminder[]): number {
  const state = getState();
  const total = quests.length;
  if (total === 0) return 50;

  const completed = quests.filter(q => q.isCompleted).length;
  const overdue = quests.filter(q => !q.isCompleted && new Date(q.dueDateTime) < new Date()).length;

  const completionRate = total > 0 ? completed / total : 0;
  const overdueRate = total > 0 ? overdue / total : 0;
  const streakBonus = Math.min(state.streak * 2, 20); // up to +20
  const focusBonus = Math.min(state.focusSessionsCompleted, 10); // up to +10

  let score = Math.round(
    completionRate * 60 +      // 60% weight on completion
    (1 - overdueRate) * 20 +   // 20% weight on no overdue
    streakBonus +               // streak bonus
    focusBonus                  // focus bonus
  );

  score = Math.max(0, Math.min(100, score));

  // Persist
  state.disciplineScore = score;
  saveState(state);

  return score;
}

/**
 * Get streak count.
 */
export function getStreak(): number {
  return getState().streak;
}

/**
 * Get focus session count.
 */
export function getFocusSessions(): number {
  return getState().focusSessionsCompleted;
}

/**
 * Reset all gamification data.
 */
export function resetDiscipline(): void {
  saveState(createDefaultState());
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function updateDailyRecord(state: DisciplineState, date: string): void {
  const existing = state.history.findIndex(h => h.date === date);
  const record: DailyRecord = {
    date,
    completed: state.completedToday,
    total: 0,
    overdue: 0,
    xpEarned: 0,
    focusSessions: state.focusSessionsCompleted,
  };

  if (existing >= 0) {
    state.history[existing] = { ...state.history[existing], ...record };
  } else {
    state.history.push(record);
  }

  // Keep last 30 days only
  if (state.history.length > 30) {
    state.history = state.history.slice(-30);
  }
}
