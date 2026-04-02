/**
 * Eclipse Valhalla — Discipline Mode + Identity + Variability
 *
 * Two modes: Hardcore (default) vs Balanced
 * Identity messages that form behavior
 * Variable messaging to prevent habituation
 */

export type DisciplineMode = 'hardcore' | 'balanced';

// ═══════════════════════════════════════════
// MODE
// ═══════════════════════════════════════════

const MODE_KEY = 'eclipse_discipline_mode';

export function getMode(): DisciplineMode {
  return (localStorage.getItem(MODE_KEY) as DisciplineMode) || 'hardcore';
}

export function setMode(mode: DisciplineMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

// ═══════════════════════════════════════════
// COMPLETION MESSAGES (with variability)
// ═══════════════════════════════════════════

const HARDCORE_COMPLETION = [
  { line1: 'You did what most people postpone.', line2: 'Discipline +1.' },
  { line1: 'Executed. Not planned. Executed.', line2: 'That is the difference.' },
  { line1: 'While others hesitate, you act.', line2: 'Remember this.' },
  { line1: 'One step against chaos.', line2: 'The system recognizes you.' },
  { line1: 'Objective eliminated.', line2: 'What\'s next?' },
  { line1: 'Most would have quit by now.', line2: 'You didn\'t.' },
  { line1: 'Another proof of what you are.', line2: 'Keep going.' },
  { line1: 'Weakness had no room here.', line2: 'Discipline confirmed.' },
];

const BALANCED_COMPLETION = [
  { line1: 'Well done.', line2: 'Every completed task counts.' },
  { line1: 'Progress made.', line2: 'You\'re building momentum.' },
  { line1: 'Task complete.', line2: 'Keep going at your pace.' },
  { line1: 'Good work.', line2: 'Consistency over intensity.' },
  { line1: 'Another step forward.', line2: 'You showed up.' },
  { line1: 'Done.', line2: 'Small wins build big results.' },
];

// ═══════════════════════════════════════════
// IDENTITY MESSAGES (occasional, not every time)
// ═══════════════════════════════════════════

const IDENTITY_MESSAGES = [
  'You are becoming someone who executes.',
  'This is what discipline looks like.',
  'You showed up again. That\'s who you are now.',
  'Consistency is forming. Don\'t let it break.',
  'You\'re not just doing tasks. You\'re building character.',
  'Most users would stop here. You didn\'t.',
  'Your past self would be impressed.',
  'You are ahead of where you were yesterday.',
];

const BALANCED_IDENTITY = [
  'You\'re building a good habit.',
  'Showing up is the hardest part. You did it.',
  'Progress, not perfection.',
  'Every session makes the next one easier.',
  'You\'re doing better than you think.',
];

// ═══════════════════════════════════════════
// ESCAPE MESSAGES
// ═══════════════════════════════════════════

const HARDCORE_ESCAPE = [
  'You switched away during focus. That is escape behavior.',
  'You left. The objective didn\'t.',
  'Running from discomfort is a pattern. Break it.',
  'Your attention is your weapon. You just dropped it.',
];

const BALANCED_ESCAPE = [
  'You switched away. Try to stay focused.',
  'Focus works best without interruptions.',
  'Come back to your objective.',
];

// ═══════════════════════════════════════════
// PRESSURE (notifications, return)
// ═══════════════════════════════════════════

const HARDCORE_PRESSURE = [
  'You said you would act. You didn\'t.',
  'Still nothing done today.',
  'Discipline is not built later.',
  'Every hour of delay is a choice against yourself.',
  'Your objectives are waiting. They don\'t forget.',
];

const BALANCED_PRESSURE = [
  'You have pending tasks. A quick check might help.',
  'Your objectives are still here when you\'re ready.',
  'A small step today keeps momentum alive.',
];

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getCompletionMessage(): { line1: string; line2: string } {
  return pick(getMode() === 'hardcore' ? HARDCORE_COMPLETION : BALANCED_COMPLETION);
}

/**
 * Returns an identity message ~30% of the time (not every completion).
 * This variability prevents habituation.
 */
export function getIdentityMessage(completionsToday: number): string | null {
  // Show identity message after 2+ completions, ~30% chance
  if (completionsToday < 2) return null;
  if (Math.random() > 0.3) return null;
  return pick(getMode() === 'hardcore' ? IDENTITY_MESSAGES : BALANCED_IDENTITY);
}

export function getEscapeMessage(): string {
  return pick(getMode() === 'hardcore' ? HARDCORE_ESCAPE : BALANCED_ESCAPE);
}

export function getPressureNotification(pendingCount: number): string {
  const msgs = getMode() === 'hardcore' ? HARDCORE_PRESSURE : BALANCED_PRESSURE;
  const base = pick(msgs);
  if (getMode() === 'hardcore') return base;
  return `${pendingCount} task${pendingCount > 1 ? 's' : ''} pending. ${base}`;
}

// ═══════════════════════════════════════════
// DAILY STATS
// ═══════════════════════════════════════════

const DAILY_KEY = 'eclipse_daily_stats';

interface DailyStats {
  date: string;
  completed: number;
  focusMinutes: number;
  escapes: number;
}

export function getDailyStats(): DailyStats {
  try {
    const raw = localStorage.getItem(DAILY_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d.date === new Date().toISOString().split('T')[0]) return d;
    }
  } catch {}
  return { date: new Date().toISOString().split('T')[0], completed: 0, focusMinutes: 0, escapes: 0 };
}

export function recordDailyCompletion(): DailyStats {
  const stats = getDailyStats();
  stats.completed++;
  localStorage.setItem(DAILY_KEY, JSON.stringify(stats));
  return stats;
}

export function recordDailyEscape(): void {
  const stats = getDailyStats();
  stats.escapes++;
  localStorage.setItem(DAILY_KEY, JSON.stringify(stats));
}

/**
 * Get "ahead of yesterday" message if applicable.
 */
export function getProgressMessage(completedToday: number): string | null {
  if (completedToday === 0) return null;
  if (completedToday === 1) return '1 objective completed today.';
  if (completedToday <= 3) return `${completedToday} objectives completed today. Building momentum.`;
  return `${completedToday} objectives today. Relentless.`;
}
