import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DayRecord,
  getAntiBurnoutMessage,
  getDailyComparison,
  getWeeklySummary,
  recordDay,
} from './progressionService';

const HISTORY_KEY = 'eclipse_day_history';

function setHistory(records: DayRecord[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(records));
}

function getStoredHistory(): DayRecord[] {
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function dateStr(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * 86_400_000).toISOString().split('T')[0];
}

function makeDay(overrides: Partial<DayRecord> & { date: string }): DayRecord {
  return {
    date: overrides.date,
    completed: overrides.completed ?? 0,
    created: overrides.created ?? 0,
    focusMinutes: overrides.focusMinutes ?? 0,
    escapes: overrides.escapes ?? 0,
    active: overrides.active ?? true,
  };
}

describe('progressionService.recordDay', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('creates a new day record on first call', () => {
    recordDay(3, 5);
    const history = getStoredHistory();
    expect(history).toHaveLength(1);
    expect(history[0].date).toBe(dateStr(0));
    expect(history[0].completed).toBe(3);
    expect(history[0].created).toBe(5);
    expect(history[0].active).toBe(true);
  });

  it('upgrades the existing day record with the max of completed/created', () => {
    recordDay(3, 5);
    recordDay(2, 4); // lower values must not overwrite
    recordDay(7, 10); // higher values must win

    const history = getStoredHistory();
    expect(history).toHaveLength(1);
    expect(history[0].completed).toBe(7);
    expect(history[0].created).toBe(10);
  });

  it('keeps only the last 30 days of history', () => {
    const records = Array.from({ length: 45 }, (_, i) =>
      makeDay({ date: dateStr(-(44 - i)), completed: i }),
    );
    setHistory(records);

    recordDay(99, 99);

    const history = getStoredHistory();
    expect(history.length).toBe(30);
    // today's record must be present
    expect(history[history.length - 1].date).toBe(dateStr(0));
    expect(history[history.length - 1].completed).toBe(99);
  });
});

describe('progressionService.getDailyComparison', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns trend=first when there is no yesterday record', () => {
    const result = getDailyComparison(5);
    expect(result.trend).toBe('first');
    expect(result.today).toBe(5);
    expect(result.yesterday).toBe(0);
    expect(result.message).toContain('5 completed');
  });

  it('returns trend=first with empty message when today=0 and no history', () => {
    const result = getDailyComparison(0);
    expect(result.trend).toBe('first');
    expect(result.message).toBe('');
  });

  it('returns trend=up when today > yesterday', () => {
    setHistory([makeDay({ date: dateStr(-1), completed: 3 })]);
    const result = getDailyComparison(5);
    expect(result.trend).toBe('up');
    expect(result.today).toBe(5);
    expect(result.yesterday).toBe(3);
    expect(result.message).toContain('improving');
  });

  it('returns trend=same when today === yesterday and > 0', () => {
    setHistory([makeDay({ date: dateStr(-1), completed: 4 })]);
    const result = getDailyComparison(4);
    expect(result.trend).toBe('same');
    expect(result.message).toContain('Same as yesterday');
  });

  it('returns trend=down when today < yesterday but today > 0', () => {
    setHistory([makeDay({ date: dateStr(-1), completed: 5 })]);
    const result = getDailyComparison(2);
    expect(result.trend).toBe('down');
    expect(result.message).toContain('slipping');
  });

  it('returns trend=down with a specific message when today=0 and yesterday>0', () => {
    setHistory([makeDay({ date: dateStr(-1), completed: 5 })]);
    const result = getDailyComparison(0);
    expect(result.trend).toBe('down');
    expect(result.message).toContain('nothing yet');
  });
});

describe('progressionService.getWeeklySummary', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns null when fewer than 7 days of history exist', () => {
    setHistory(Array.from({ length: 3 }, (_, i) => makeDay({ date: dateStr(-(2 - i)) })));
    expect(getWeeklySummary()).toBeNull();
  });

  it('returns null when days_since_install % 7 !== 0', () => {
    // 8 days — not a multiple of 7
    setHistory(Array.from({ length: 8 }, (_, i) => makeDay({ date: dateStr(-(7 - i)) })));
    expect(getWeeklySummary()).toBeNull();
  });

  it('returns null when weekly summary already shown today', () => {
    setHistory(Array.from({ length: 7 }, (_, i) => makeDay({ date: dateStr(-(6 - i)) })));
    localStorage.setItem(`eclipse_weekly_shown_${dateStr(0)}`, 'true');
    expect(getWeeklySummary()).toBeNull();
  });

  it('returns a summary on day 7 with 7 active days and high consistency', () => {
    setHistory(
      Array.from({ length: 7 }, (_, i) =>
        makeDay({ date: dateStr(-(6 - i)), completed: 5, active: true }),
      ),
    );
    const summary = getWeeklySummary();
    expect(summary).not.toBeNull();
    expect(summary?.activeDays).toBe(7);
    expect(summary?.totalCompleted).toBe(35);
    expect(summary?.avgPerDay).toBe(5);
    expect(summary?.identityMessage).toContain('someone who shows up');
  });

  it('classifies trend as improving when this week > previous week', () => {
    const prev7 = Array.from({ length: 7 }, (_, i) =>
      makeDay({ date: dateStr(-(13 - i)), completed: 2, active: true }),
    );
    const last7 = Array.from({ length: 7 }, (_, i) =>
      makeDay({ date: dateStr(-(6 - i)), completed: 5, active: true }),
    );
    setHistory([...prev7, ...last7]);

    const summary = getWeeklySummary();
    expect(summary?.trend).toBe('improving');
  });

  it('classifies trend as declining when this week < previous week', () => {
    const prev7 = Array.from({ length: 7 }, (_, i) =>
      makeDay({ date: dateStr(-(13 - i)), completed: 5, active: true }),
    );
    const last7 = Array.from({ length: 7 }, (_, i) =>
      makeDay({ date: dateStr(-(6 - i)), completed: 2, active: true }),
    );
    setHistory([...prev7, ...last7]);

    const summary = getWeeklySummary();
    expect(summary?.trend).toBe('declining');
  });

  it('produces a harsh identity message for 1 active day of 7', () => {
    const days = Array.from({ length: 7 }, (_, i) =>
      makeDay({ date: dateStr(-(6 - i)), active: i === 3, completed: i === 3 ? 1 : 0 }),
    );
    setHistory(days);
    const summary = getWeeklySummary();
    expect(summary?.activeDays).toBe(1);
    expect(summary?.identityMessage).toContain('not discipline yet');
  });

  it('marks the summary as shown so it cannot be re-fetched today', () => {
    setHistory(
      Array.from({ length: 7 }, (_, i) =>
        makeDay({ date: dateStr(-(6 - i)), completed: 3, active: true }),
      ),
    );

    const first = getWeeklySummary();
    expect(first).not.toBeNull();

    const second = getWeeklySummary();
    expect(second).toBeNull();
  });
});

describe('progressionService.getAntiBurnoutMessage', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when completed < 3', () => {
    expect(getAntiBurnoutMessage(2, 5)).toBeNull();
  });

  it('returns null when streak < 3', () => {
    expect(getAntiBurnoutMessage(5, 2)).toBeNull();
  });

  it('returns null when Math.random() > 0.2 (80% miss rate)', () => {
    vi.mocked(Math.random).mockReturnValue(0.5);
    expect(getAntiBurnoutMessage(5, 5)).toBeNull();
  });

  it('returns a message when Math.random() <= 0.2', () => {
    // First random() call: <0.2 (allows triggering)
    // Second random() call: picks the message
    vi.mocked(Math.random).mockReturnValueOnce(0.1).mockReturnValueOnce(0);
    const msg = getAntiBurnoutMessage(5, 5);
    expect(msg).toBeTruthy();
    expect(typeof msg).toBe('string');
  });

  it('picks a message from the pool deterministically when random is mocked', () => {
    const allMessages = [
      'You showed up enough today. Rest without guilt.',
      'Discipline includes knowing when to stop.',
      'You earned rest. Come back tomorrow stronger.',
      'Enough for today. Consistency beats intensity.',
    ];

    vi.mocked(Math.random).mockReturnValueOnce(0.1).mockReturnValueOnce(0);
    expect(allMessages).toContain(getAntiBurnoutMessage(5, 5));
  });
});
