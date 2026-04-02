/**
 * Eclipse Valhalla — System Voice
 *
 * Unified personality of the system. Cold observer.
 * Changes with time of day. Rare moments of recognition.
 *
 * Archetype: "The Watcher" — sees everything, says little, judges always.
 * Voice: short, precise, no emotion, no praise.
 */

// ═══════════════════════════════════════════
// TIME PHASES
// ═══════════════════════════════════════════

export type TimePhase = 'dawn' | 'day' | 'evening' | 'night' | 'late';

export function getTimePhase(): TimePhase {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return 'dawn';
  if (h >= 9 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  if (h >= 21 && h < 24) return 'night';
  return 'late'; // 0-5
}

// ═══════════════════════════════════════════
// TIME-BASED UI ADJUSTMENTS
// ═══════════════════════════════════════════

export interface TimeAdjustment {
  phase: TimePhase;
  bgOpacity: number;       // 0-1, card dimming
  glowIntensity: number;   // 0-1, accent glow strength
  pressureLevel: number;   // 0-3, escalation intensity
  label: string;
  labelRu: string;
}

export function getTimeAdjustment(): TimeAdjustment {
  const phase = getTimePhase();
  switch (phase) {
    case 'dawn':
      return { phase, bgOpacity: 0.95, glowIntensity: 0.5, pressureLevel: 0, label: 'Dawn', labelRu: 'Рассвет' };
    case 'day':
      return { phase, bgOpacity: 1, glowIntensity: 0.7, pressureLevel: 1, label: 'Active', labelRu: 'Активный' };
    case 'evening':
      return { phase, bgOpacity: 1, glowIntensity: 0.9, pressureLevel: 2, label: 'Closing', labelRu: 'Закрытие' };
    case 'night':
      return { phase, bgOpacity: 1, glowIntensity: 1, pressureLevel: 2, label: 'Night', labelRu: 'Ночь' };
    case 'late':
      return { phase, bgOpacity: 1, glowIntensity: 1, pressureLevel: 3, label: 'Late', labelRu: 'Поздно' };
  }
}

// ═══════════════════════════════════════════
// TIME-BASED MESSAGES (system tone shifts)
// ═══════════════════════════════════════════

export function getTimePressure(pendingCount: number, isRu: boolean): string | null {
  const phase = getTimePhase();

  if (pendingCount === 0) return null;

  if (phase === 'late') {
    return isRu ? 'Ещё не сделано. Уже поздно.' : 'Still not done. It\'s late.';
  }
  if (phase === 'night' && pendingCount > 2) {
    return isRu ? `${pendingCount} целей остались. День заканчивается.` : `${pendingCount} remain. Day is ending.`;
  }
  if (phase === 'evening' && pendingCount > 0) {
    return isRu ? 'Вечер. Время закрывать долги.' : 'Evening. Close your debts.';
  }

  return null;
}

// ═══════════════════════════════════════════
// SYSTEM VOICE — unified responses
// ═══════════════════════════════════════════

/** Completion acknowledgment — cold, short */
export function getCompletionVoice(isRu: boolean): string {
  const en = ['Noted.', 'Done.', 'Recorded.', 'Confirmed.', 'Acknowledged.'];
  const ru = ['Записано.', 'Выполнено.', 'Зафиксировано.', 'Подтверждено.', 'Принято.'];
  const arr = isRu ? ru : en;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Failure observation — no anger, just fact */
export function getFailureVoice(isRu: boolean): string {
  const en = ['Missed.', 'Overdue.', 'Unfulfilled.', 'Noted as failure.'];
  const ru = ['Пропущено.', 'Просрочено.', 'Не выполнено.', 'Зафиксирован провал.'];
  const arr = isRu ? ru : en;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Return observation — matter of fact */
export function getReturnVoice(daysAway: number, isRu: boolean): string {
  if (daysAway === 0) return isRu ? 'Возвращение.' : 'Return.';
  if (daysAway === 1) return isRu ? 'Вчера — тишина.' : 'Yesterday — silence.';
  return isRu ? `${daysAway} дней без действий.` : `${daysAway} days without action.`;
}

// ═══════════════════════════════════════════
// RARE MOMENTS — 1-2% probability events
// ═══════════════════════════════════════════

export interface RareMoment {
  id: string;
  message: string;
  messageRu: string;
  condition: (stats: RareCheckStats) => boolean;
}

export interface RareCheckStats {
  completedToday: number;
  escapesToday: number;
  streak: number;
  pendingCount: number;
  totalCompleted: number;
}

const RARE_MOMENTS: RareMoment[] = [
  {
    id: 'perfect_day',
    message: 'No escapes. Full execution. Flawless.',
    messageRu: 'Ни одного побега. Полное исполнение. Безупречно.',
    condition: (s) => s.completedToday >= 5 && s.escapesToday === 0,
  },
  {
    id: 'week_streak',
    message: 'Seven days. You are no longer inconsistent.',
    messageRu: 'Семь дней. Ты больше не непостоянен.',
    condition: (s) => s.streak === 7,
  },
  {
    id: 'month_streak',
    message: 'Thirty days. This is who you are now.',
    messageRu: 'Тридцать дней. Это теперь ты.',
    condition: (s) => s.streak === 30,
  },
  {
    id: 'hundred',
    message: 'One hundred completed. The system recognizes you.',
    messageRu: 'Сто выполненных. Система узнаёт тебя.',
    condition: (s) => s.totalCompleted === 100,
  },
  {
    id: 'clean_slate',
    message: 'Zero pending. Total control.',
    messageRu: 'Ноль ожидающих. Полный контроль.',
    condition: (s) => s.pendingCount === 0 && s.completedToday > 0,
  },
];

/**
 * Check for rare moments. Returns message or null.
 * Each moment fires ONCE (tracked in localStorage).
 */
export function checkRareMoment(stats: RareCheckStats, isRu: boolean): string | null {
  const shownKey = 'eclipse_rare_shown';
  let shown: string[] = [];
  try { shown = JSON.parse(localStorage.getItem(shownKey) || '[]'); } catch {}

  for (const moment of RARE_MOMENTS) {
    if (shown.includes(moment.id)) continue;
    if (moment.condition(stats)) {
      shown.push(moment.id);
      localStorage.setItem(shownKey, JSON.stringify(shown));
      return isRu ? moment.messageRu : moment.message;
    }
  }

  return null;
}

// ═══════════════════════════════════════════
// SILENCE SYSTEM — sometimes say nothing
// ═══════════════════════════════════════════

/**
 * 15% of completions: the system says nothing.
 * Just the action. The silence IS the response.
 */
export function shouldBeSilent(): boolean {
  return Math.random() < 0.15;
}
