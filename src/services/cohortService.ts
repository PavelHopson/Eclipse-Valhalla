/**
 * Eclipse Valhalla — Cohort & Segmentation Service
 *
 * Tracks retention cohorts and user segments.
 * Local-first analytics for product insights.
 */

import { getUsageMetrics } from './analyticsService';
import { getDisciplineState } from './gamificationService';
import { getActivationStatus } from './growthService';

// ═══════════════════════════════════════════
// USER SEGMENTS
// ═══════════════════════════════════════════

export type UserSegment = 'new' | 'activated' | 'engaged' | 'power' | 'dormant' | 'churned';

export interface SegmentProfile {
  segment: UserSegment;
  label: string;
  description: string;
  color: string;
  daysActive: number;
  activationScore: number;
  recentSessions: number;
}

/**
 * Determine current user segment based on behavior.
 */
export function getUserSegment(): SegmentProfile {
  const metrics = getUsageMetrics();
  const discipline = getDisciplineState();
  const activation = getActivationStatus();

  const lastActive = metrics.lastActiveAt ? new Date(metrics.lastActiveAt) : new Date();
  const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / 86400000);
  const totalSessions = metrics.sessionsTotal;

  // Churned: 14+ days inactive
  if (daysSinceActive >= 14) {
    return { segment: 'churned', label: 'Churned', description: 'Inactive for 14+ days.', color: '#8B0000', daysActive: 0, activationScore: activation.activationScore, recentSessions: 0 };
  }

  // Dormant: 3-13 days inactive
  if (daysSinceActive >= 3) {
    return { segment: 'dormant', label: 'Dormant', description: 'Inactive for 3+ days. At risk.', color: '#FF4444', daysActive: 0, activationScore: activation.activationScore, recentSessions: 0 };
  }

  // New: < 3 sessions, activation < 40%
  if (totalSessions < 3 && activation.activationScore < 40) {
    return { segment: 'new', label: 'New User', description: 'Just started. Needs guidance.', color: '#55556A', daysActive: daysSinceActive, activationScore: activation.activationScore, recentSessions: totalSessions };
  }

  // Activated: completed activation but < 7 sessions
  if (activation.activationScore >= 60 && totalSessions < 7) {
    return { segment: 'activated', label: 'Activated', description: 'Explored features. Building habit.', color: '#5DAEFF', daysActive: daysSinceActive, activationScore: activation.activationScore, recentSessions: totalSessions };
  }

  // Power: high discipline + high sessions + streak
  if (discipline.streak >= 7 && discipline.disciplineScore >= 70 && totalSessions >= 20) {
    return { segment: 'power', label: 'Power User', description: 'Highly engaged. Discipline proven.', color: '#FFD700', daysActive: daysSinceActive, activationScore: activation.activationScore, recentSessions: totalSessions };
  }

  // Engaged: active, using features
  return { segment: 'engaged', label: 'Engaged', description: 'Regular usage. Forming habit.', color: '#4ADE80', daysActive: daysSinceActive, activationScore: activation.activationScore, recentSessions: totalSessions };
}

// ═══════════════════════════════════════════
// RETENTION COHORT
// ═══════════════════════════════════════════

export interface CohortData {
  installDate: string;    // YYYY-MM-DD
  day1: boolean;
  day3: boolean;
  day7: boolean;
  day14: boolean;
  day30: boolean;
}

const COHORT_KEY = 'eclipse_cohort';

export function getCohortData(): CohortData {
  try {
    const raw = localStorage.getItem(COHORT_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  const data: CohortData = {
    installDate: new Date().toISOString().split('T')[0],
    day1: false, day3: false, day7: false, day14: false, day30: false,
  };
  localStorage.setItem(COHORT_KEY, JSON.stringify(data));
  return data;
}

/**
 * Update cohort retention markers. Call on each session.
 */
export function updateCohort(): CohortData {
  const data = getCohortData();
  const installDate = new Date(data.installDate);
  const daysSinceInstall = Math.floor((Date.now() - installDate.getTime()) / 86400000);

  if (daysSinceInstall >= 1) data.day1 = true;
  if (daysSinceInstall >= 3) data.day3 = true;
  if (daysSinceInstall >= 7) data.day7 = true;
  if (daysSinceInstall >= 14) data.day14 = true;
  if (daysSinceInstall >= 30) data.day30 = true;

  localStorage.setItem(COHORT_KEY, JSON.stringify(data));
  return data;
}

// ═══════════════════════════════════════════
// HEALTH SCORE
// ═══════════════════════════════════════════

/**
 * Overall user health score (0-100).
 * Combines activation, engagement, discipline, retention.
 */
export function getUserHealthScore(): { score: number; factors: Record<string, number> } {
  const activation = getActivationStatus();
  const discipline = getDisciplineState();
  const metrics = getUsageMetrics();
  const segment = getUserSegment();

  const factors = {
    activation: activation.activationScore,                                      // 0-100
    discipline: discipline.disciplineScore,                                      // 0-100
    engagement: Math.min(100, metrics.sessionsTotal * 5),                       // 0-100
    streak: Math.min(100, discipline.streak * 10),                              // 0-100
    recency: segment.segment === 'churned' ? 0 : segment.segment === 'dormant' ? 20 : 100, // 0-100
  };

  const weights = { activation: 0.2, discipline: 0.25, engagement: 0.2, streak: 0.15, recency: 0.2 };
  const score = Math.round(
    Object.entries(factors).reduce((sum, [key, val]) => sum + val * (weights as any)[key], 0)
  );

  return { score: Math.max(0, Math.min(100, score)), factors };
}
