/**
 * Eclipse Valhalla — Content Hooks
 *
 * Short, shareable messages triggered by user state.
 * Used in notifications, widgets, and share cards.
 */

// ═══════════════════════════════════════════
// PRESSURE MESSAGES
// ═══════════════════════════════════════════

export function getPressureMessage(opts: {
  overdueCount: number;
  streak: number;
  disciplineScore: number;
  daysInactive: number;
}): string | null {
  const { overdueCount, streak, disciplineScore, daysInactive } = opts;

  if (daysInactive >= 3) return `${daysInactive} days absent. Discipline decaying.`;
  if (overdueCount >= 5) return `${overdueCount} objectives ignored. The system is failing.`;
  if (overdueCount >= 3) return `${overdueCount} objectives overdue. Act or accept failure.`;
  if (streak === 0 && overdueCount > 0) return 'Streak broken. Overdue targets remain. Rebuild.';
  if (disciplineScore < 30) return `Discipline score: ${disciplineScore}. Critical condition.`;
  if (disciplineScore < 50) return `Discipline score: ${disciplineScore}. Below acceptable standard.`;

  return null; // No pressure needed
}

// ═══════════════════════════════════════════
// MOTIVATION MESSAGES
// ═══════════════════════════════════════════

export function getMotivationMessage(opts: {
  streak: number;
  level: number;
  completedToday: number;
  disciplineScore: number;
}): string | null {
  const { streak, level, completedToday, disciplineScore } = opts;

  if (completedToday >= 5) return `${completedToday} objectives completed today. Relentless.`;
  if (streak >= 30) return `${streak}-day streak. Legendary consistency.`;
  if (streak >= 14) return `${streak}-day streak. Warrior-level discipline.`;
  if (streak >= 7) return `${streak}-day streak. Momentum building.`;
  if (disciplineScore >= 90) return `Discipline: ${disciplineScore}. Peak operational status.`;
  if (level >= 10) return `Level ${level}. Elite tier. Keep ascending.`;

  return null;
}

// ═══════════════════════════════════════════
// SHARE-READY MESSAGES
// ═══════════════════════════════════════════

export function getShareMessage(opts: {
  streak: number;
  level: number;
  disciplineScore: number;
  questsCompleted: number;
}): { title: string; body: string } {
  const { streak, level, disciplineScore, questsCompleted } = opts;

  if (streak >= 7) {
    return {
      title: `${streak}-day discipline streak`,
      body: `Level ${level} · Score ${disciplineScore} · ${questsCompleted} objectives completed · Eclipse Valhalla`,
    };
  }

  return {
    title: `Discipline Score: ${disciplineScore}`,
    body: `Level ${level} · ${questsCompleted} objectives completed · Eclipse Valhalla`,
  };
}

// ═══════════════════════════════════════════
// WIDGET MESSAGES
// ═══════════════════════════════════════════

export function getWidgetMessage(overdueMinutes: number): string {
  if (overdueMinutes > 120) return 'Critical. Act immediately.';
  if (overdueMinutes > 60) return 'Over 1 hour overdue.';
  if (overdueMinutes > 30) return 'Slipping. 30+ minutes late.';
  if (overdueMinutes > 10) return 'Overdue. Begin now.';
  if (overdueMinutes > 0) return 'Just passed deadline.';
  if (overdueMinutes > -10) return 'Due now.';
  if (overdueMinutes > -30) return 'Due within 30 minutes.';
  return 'Approaching deadline.';
}
