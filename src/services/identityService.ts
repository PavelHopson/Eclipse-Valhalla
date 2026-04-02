/**
 * Eclipse Valhalla — Identity Service
 *
 * Builds user identity through progressive reinforcement.
 * "You are disciplined." — not as flattery, but as identity anchor.
 *
 * Psychology:
 * - Identity labeling: "You are a disciplined person" increases consistency
 * - Loss aversion: "You've built X. Don't lose it."
 * - Progress anchoring: "You're in the top tier. Keep going."
 */

import { getDisciplineState } from './gamificationService';
import { getUsageMetrics } from './analyticsService';

// ═══════════════════════════════════════════
// IDENTITY TITLES
// ═══════════════════════════════════════════

export interface IdentityProfile {
  title: string;        // "The Disciplined"
  rank: string;         // "Warrior"
  statement: string;    // "You maintain control when others don't."
  progressAnchor: string; // "Level 7. 14-day streak. Top 5% discipline."
  lossWarning: string;  // "14 days of consistency. One skip resets it."
}

export function getIdentityProfile(): IdentityProfile {
  const d = getDisciplineState();
  const m = getUsageMetrics();

  const title = getTitle(d.level, d.streak, d.disciplineScore);
  const rank = getRank(d.level);
  const statement = getStatement(d.disciplineScore, d.streak);
  const progressAnchor = buildProgressAnchor(d.level, d.streak, m.questsCompleted, d.disciplineScore);
  const lossWarning = buildLossWarning(d.streak, d.xp, d.level);

  return { title, rank, statement, progressAnchor, lossWarning };
}

// ═══════════════════════════════════════════
// TITLE (displayed in profile)
// ═══════════════════════════════════════════

function getTitle(level: number, streak: number, score: number): string {
  if (level >= 10 && streak >= 30) return 'The Unbroken';
  if (level >= 10) return 'The Ascended';
  if (streak >= 30) return 'The Relentless';
  if (score >= 90) return 'The Disciplined';
  if (streak >= 14) return 'The Consistent';
  if (streak >= 7) return 'The Focused';
  if (level >= 5) return 'The Rising';
  if (score >= 50) return 'The Awakened';
  return 'The Wanderer';
}

function getRank(level: number): string {
  if (level >= 10) return 'Legend';
  if (level >= 7) return 'Commander';
  if (level >= 5) return 'Warrior';
  if (level >= 3) return 'Sentinel';
  return 'Initiate';
}

// ═══════════════════════════════════════════
// IDENTITY STATEMENTS
// ═══════════════════════════════════════════

function getStatement(score: number, streak: number): string {
  if (score >= 90 && streak >= 14) return 'You maintain control when others collapse.';
  if (score >= 80) return 'You operate above standard. Discipline is your default.';
  if (score >= 60) return 'You show consistency. The system responds to your effort.';
  if (streak >= 7) return 'Seven days of discipline. You are building something real.';
  if (score >= 40) return 'You are choosing to show up. That matters.';
  return 'The path begins with one objective completed.';
}

// ═══════════════════════════════════════════
// PROGRESS ANCHORING
// ═══════════════════════════════════════════

function buildProgressAnchor(level: number, streak: number, completed: number, score: number): string {
  const parts: string[] = [];

  if (level > 1) parts.push(`Level ${level}`);
  if (streak > 0) parts.push(`${streak}-day streak`);
  if (completed > 0) parts.push(`${completed} completed`);
  parts.push(`Score ${score}`);

  return parts.join(' · ');
}

// ═══════════════════════════════════════════
// LOSS AVERSION
// ═══════════════════════════════════════════

function buildLossWarning(streak: number, xp: number, level: number): string {
  if (streak >= 30) return `${streak} days of discipline built. One day off erases this entirely.`;
  if (streak >= 14) return `${streak}-day streak. Missing today means starting from zero.`;
  if (streak >= 7) return `A week of consistency. Don't break it now.`;
  if (xp > 500) return `${xp} XP earned. Inactivity means decay.`;
  if (level >= 3) return `Level ${level} status. Maintain it or lose ground.`;
  return 'Every day without action makes the next harder.';
}

// ═══════════════════════════════════════════
// NUDGE MESSAGES (contextual, brief)
// ═══════════════════════════════════════════

export function getIdentityNudge(context: 'morning' | 'overdue' | 'streak_risk' | 'comeback'): string {
  const d = getDisciplineState();

  switch (context) {
    case 'morning':
      if (d.streak >= 7) return `${d.streak}-day streak active. You are disciplined. Prove it again.`;
      return 'New day. New chance to build discipline.';

    case 'overdue':
      if (d.disciplineScore >= 60) return 'You operate above average. These overdue objectives are beneath you.';
      return 'Objectives are slipping. You are better than this pattern.';

    case 'streak_risk':
      return buildLossWarning(d.streak, d.xp, d.level);

    case 'comeback':
      if (d.streak > 0) return `You had a ${d.streak}-day streak. Rebuild it today.`;
      return 'Absence is forgiven once. Act now.';

    default:
      return 'Discipline is a choice. Make it now.';
  }
}
