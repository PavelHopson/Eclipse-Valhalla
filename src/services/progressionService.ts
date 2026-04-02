/**
 * Eclipse Valhalla — Progression Service
 *
 * Long-term retention through visible growth.
 * NOT gamification. Facts about behavior.
 *
 * - Daily comparison (today vs yesterday)
 * - Weekly identity summary (7-day pattern)
 * - Anti-burnout valve (permission to rest)
 */

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface DayRecord {
  date: string;          // YYYY-MM-DD
  completed: number;
  created: number;
  focusMinutes: number;
  escapes: number;
  active: boolean;       // did user show up at all
}

export interface WeeklySummary {
  activeDays: number;    // out of 7
  totalCompleted: number;
  avgPerDay: number;
  trend: 'improving' | 'stable' | 'declining';
  message: string;
  identityMessage: string;
}

export interface DailyComparison {
  today: number;
  yesterday: number;
  trend: 'up' | 'same' | 'down' | 'first';
  message: string;
}

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const HISTORY_KEY = 'eclipse_day_history';

function getHistory(): DayRecord[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveHistory(h: DayRecord[]): void {
  // Keep last 30 days
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-30)));
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterday(): string {
  return new Date(Date.now() - 86400000).toISOString().split('T')[0];
}

// ═══════════════════════════════════════════
// RECORD
// ═══════════════════════════════════════════

export function recordDay(completed: number, created: number): void {
  const history = getHistory();
  const todayStr = today();
  const existing = history.find(d => d.date === todayStr);

  if (existing) {
    existing.completed = Math.max(existing.completed, completed);
    existing.created = Math.max(existing.created, created);
    existing.active = true;
  } else {
    history.push({ date: todayStr, completed, created, focusMinutes: 0, escapes: 0, active: true });
  }

  saveHistory(history);
}

// ═══════════════════════════════════════════
// DAILY COMPARISON
// ═══════════════════════════════════════════

export function getDailyComparison(completedToday: number): DailyComparison {
  const history = getHistory();
  const yesterdayRecord = history.find(d => d.date === yesterday());
  const yesterdayCount = yesterdayRecord?.completed || 0;

  if (!yesterdayRecord) {
    return {
      today: completedToday,
      yesterday: 0,
      trend: 'first',
      message: completedToday > 0 ? `${completedToday} completed today.` : '',
    };
  }

  if (completedToday > yesterdayCount) {
    return {
      today: completedToday,
      yesterday: yesterdayCount,
      trend: 'up',
      message: `${completedToday} today vs ${yesterdayCount} yesterday. You are improving.`,
    };
  } else if (completedToday === yesterdayCount && completedToday > 0) {
    return {
      today: completedToday,
      yesterday: yesterdayCount,
      trend: 'same',
      message: `${completedToday} today. Same as yesterday. Stay consistent.`,
    };
  } else {
    return {
      today: completedToday,
      yesterday: yesterdayCount,
      trend: 'down',
      message: completedToday > 0
        ? `${completedToday} today vs ${yesterdayCount} yesterday. You are slipping.`
        : `Yesterday you did ${yesterdayCount}. Today: nothing yet.`,
    };
  }
}

// ═══════════════════════════════════════════
// WEEKLY SUMMARY
// ═══════════════════════════════════════════

export function getWeeklySummary(): WeeklySummary | null {
  const history = getHistory();

  // Only show on day 7+ or every 7th day
  const todayStr = today();
  const shownKey = `eclipse_weekly_shown_${todayStr}`;
  const daysSinceInstall = history.length;

  // Show weekly summary every 7 days (day 7, 14, 21...)
  if (daysSinceInstall < 7 || daysSinceInstall % 7 !== 0) return null;
  if (localStorage.getItem(shownKey) === 'true') return null;

  const last7 = history.slice(-7);
  const activeDays = last7.filter(d => d.active).length;
  const totalCompleted = last7.reduce((sum, d) => sum + d.completed, 0);
  const avgPerDay = activeDays > 0 ? Math.round(totalCompleted / activeDays * 10) / 10 : 0;

  // Trend: compare this week to previous week
  const prev7 = history.slice(-14, -7);
  const prevTotal = prev7.reduce((sum, d) => sum + d.completed, 0);
  const trend: WeeklySummary['trend'] = totalCompleted > prevTotal ? 'improving' : totalCompleted === prevTotal ? 'stable' : 'declining';

  // Identity message based on consistency
  let identityMessage: string;
  if (activeDays >= 6) identityMessage = 'You are becoming someone who shows up every day.';
  else if (activeDays >= 4) identityMessage = 'Consistency is forming. Don\'t let it break.';
  else if (activeDays >= 2) identityMessage = 'You showed up, but inconsistently. The system needs more.';
  else identityMessage = 'One active day in seven. This is not discipline yet.';

  // Summary message
  let message: string;
  if (activeDays >= 6) message = `${activeDays}/7 days active. ${totalCompleted} objectives completed. ${trend === 'improving' ? 'Growing.' : 'Steady.'}`;
  else if (activeDays >= 3) message = `${activeDays}/7 days. ${totalCompleted} completed. ${7 - activeDays} days missing.`;
  else message = `Only ${activeDays}/7 days active. ${totalCompleted} completed. You are losing ground.`;

  localStorage.setItem(shownKey, 'true');

  return { activeDays, totalCompleted, avgPerDay, trend, message, identityMessage };
}

// ═══════════════════════════════════════════
// ANTI-BURNOUT
// ═══════════════════════════════════════════

/**
 * Returns a rest permission message if the user has earned it.
 * Triggers: 3+ completions today AND streak 3+ days.
 * Shows ~20% of the time (rare, valuable).
 */
export function getAntiBurnoutMessage(completedToday: number, streak: number): string | null {
  if (completedToday < 3 || streak < 3) return null;
  if (Math.random() > 0.2) return null; // Only 20% chance

  const messages = [
    'You showed up enough today. Rest without guilt.',
    'Discipline includes knowing when to stop.',
    'You earned rest. Come back tomorrow stronger.',
    'Enough for today. Consistency beats intensity.',
  ];

  return messages[Math.floor(Math.random() * messages.length)];
}
