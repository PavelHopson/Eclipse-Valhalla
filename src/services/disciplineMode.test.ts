import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getCompletionMessage,
  getDailyStats,
  getEscapeMessage,
  getIdentityMessage,
  getMode,
  getPressureNotification,
  getProgressMessage,
  recordDailyCompletion,
  recordDailyEscape,
  setMode,
} from './disciplineMode';

describe('disciplineMode.getMode + setMode', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('defaults to hardcore when nothing is persisted', () => {
    expect(getMode()).toBe('hardcore');
  });

  it('persists and reads back the hardcore mode', () => {
    setMode('hardcore');
    expect(getMode()).toBe('hardcore');
  });

  it('persists and reads back the balanced mode', () => {
    setMode('balanced');
    expect(getMode()).toBe('balanced');
  });
});

describe('disciplineMode.getCompletionMessage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns a hardcore message shape when mode=hardcore', () => {
    setMode('hardcore');
    const msg = getCompletionMessage();
    expect(msg).toHaveProperty('line1');
    expect(msg).toHaveProperty('line2');
    expect(typeof msg.line1).toBe('string');
    expect(typeof msg.line2).toBe('string');
    expect(msg.line1.length).toBeGreaterThan(0);
  });

  it('returns a balanced message shape when mode=balanced', () => {
    setMode('balanced');
    const msg = getCompletionMessage();
    expect(msg).toHaveProperty('line1');
    expect(msg).toHaveProperty('line2');
  });

  it('picks deterministically when Math.random is mocked', () => {
    setMode('hardcore');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const first = getCompletionMessage();
    const second = getCompletionMessage();
    expect(first).toEqual(second); // same random seed -> same message
  });
});

describe('disciplineMode.getIdentityMessage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns null when completionsToday < 2', () => {
    expect(getIdentityMessage(0)).toBeNull();
    expect(getIdentityMessage(1)).toBeNull();
  });

  it('returns null when random() > 0.3 (70% miss rate)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(getIdentityMessage(5)).toBeNull();
  });

  it('returns a hardcore identity message when mode=hardcore and random() <= 0.3', () => {
    setMode('hardcore');
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0);
    const msg = getIdentityMessage(5);
    expect(msg).not.toBeNull();
    expect(typeof msg).toBe('string');
  });

  it('returns a balanced identity message when mode=balanced', () => {
    setMode('balanced');
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0);
    const msg = getIdentityMessage(5);
    expect(msg).not.toBeNull();
  });
});

describe('disciplineMode.getEscapeMessage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns a non-empty string in hardcore mode', () => {
    setMode('hardcore');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(typeof getEscapeMessage()).toBe('string');
    expect(getEscapeMessage().length).toBeGreaterThan(0);
  });

  it('returns a non-empty string in balanced mode', () => {
    setMode('balanced');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(typeof getEscapeMessage()).toBe('string');
  });
});

describe('disciplineMode.getPressureNotification', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('returns a plain hardcore message without count prefix', () => {
    setMode('hardcore');
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const notif = getPressureNotification(3);
    expect(notif).not.toMatch(/^\d+ task/);
  });

  it('prefixes balanced messages with the pending count', () => {
    setMode('balanced');
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const single = getPressureNotification(1);
    expect(single).toMatch(/^1 task /);

    const plural = getPressureNotification(5);
    expect(plural).toMatch(/^5 tasks /);
  });
});

describe('disciplineMode.getDailyStats', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns a fresh record when nothing is stored', () => {
    const stats = getDailyStats();
    expect(stats.completed).toBe(0);
    expect(stats.focusMinutes).toBe(0);
    expect(stats.escapes).toBe(0);
    expect(stats.date).toBe(new Date().toISOString().split('T')[0]);
  });

  it('returns a fresh record when the stored date is stale', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
    localStorage.setItem(
      'eclipse_daily_stats',
      JSON.stringify({ date: yesterday, completed: 42, focusMinutes: 60, escapes: 3 }),
    );

    const stats = getDailyStats();
    expect(stats.completed).toBe(0);
    expect(stats.focusMinutes).toBe(0);
    expect(stats.escapes).toBe(0);
    expect(stats.date).toBe(new Date().toISOString().split('T')[0]);
  });

  it('reads back the stored record when the date matches today', () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(
      'eclipse_daily_stats',
      JSON.stringify({ date: today, completed: 4, focusMinutes: 25, escapes: 1 }),
    );

    const stats = getDailyStats();
    expect(stats.completed).toBe(4);
    expect(stats.focusMinutes).toBe(25);
    expect(stats.escapes).toBe(1);
  });

  it('recovers from a corrupted JSON blob by returning a fresh record', () => {
    localStorage.setItem('eclipse_daily_stats', '{bad');
    const stats = getDailyStats();
    expect(stats.completed).toBe(0);
  });
});

describe('disciplineMode.recordDailyCompletion + recordDailyEscape', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('increments completed counter and persists it', () => {
    recordDailyCompletion();
    recordDailyCompletion();
    recordDailyCompletion();
    expect(getDailyStats().completed).toBe(3);
  });

  it('increments escape counter independently', () => {
    recordDailyCompletion();
    recordDailyEscape();
    recordDailyEscape();
    const stats = getDailyStats();
    expect(stats.completed).toBe(1);
    expect(stats.escapes).toBe(2);
  });
});

describe('disciplineMode.getProgressMessage', () => {
  it('returns null when 0 completed', () => {
    expect(getProgressMessage(0)).toBeNull();
  });

  it('uses the 1-completion message', () => {
    expect(getProgressMessage(1)).toContain('1 objective');
  });

  it('uses the momentum message for 2..3 completions', () => {
    expect(getProgressMessage(2)).toContain('Building momentum');
    expect(getProgressMessage(3)).toContain('Building momentum');
  });

  it('uses the relentless message for 4+', () => {
    expect(getProgressMessage(4)).toContain('Relentless');
    expect(getProgressMessage(10)).toContain('Relentless');
  });
});
