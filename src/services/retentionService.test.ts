import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  RetentionState,
  checkCriticalQuests,
  dispatchAlerts,
  recordSession,
} from './retentionService';

vi.mock('./notificationService', () => ({
  notifyInApp: vi.fn(),
  notifyPush: vi.fn(),
}));

import { notifyInApp, notifyPush } from './notificationService';

const STATE_KEY = 'eclipse_retention';

function setState(state: Partial<RetentionState>) {
  const full: RetentionState = {
    lastSessionAt: new Date().toISOString(),
    consecutiveInactiveDays: 0,
    streakWarningShown: false,
    comebackPromptShown: false,
    ...state,
  };
  localStorage.setItem(STATE_KEY, JSON.stringify(full));
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString();
}

describe('retentionService.recordSession', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns zero days and no alerts on fresh install', () => {
    const check = recordSession();
    expect(check.daysSinceLastSession).toBe(0);
    expect(check.streakAtRisk).toBe(false);
    expect(check.isComeback).toBe(false);
    expect(check.alerts).toEqual([]);
  });

  it('detects streak at risk after 1 day of inactivity and emits a warning alert', () => {
    setState({ lastSessionAt: daysAgo(1), streakWarningShown: false });

    const check = recordSession();
    expect(check.daysSinceLastSession).toBe(1);
    expect(check.streakAtRisk).toBe(true);
    expect(check.isComeback).toBe(false);
    expect(check.alerts).toHaveLength(1);
    expect(check.alerts[0].type).toBe('streak_warning');
    expect(check.alerts[0].message).toContain('1 day');
  });

  it('does not re-emit the streak warning if it was already shown today', () => {
    setState({ lastSessionAt: daysAgo(1), streakWarningShown: true });

    const check = recordSession();
    expect(check.streakAtRisk).toBe(true);
    expect(check.alerts.filter((a) => a.type === 'streak_warning')).toHaveLength(0);
  });

  it('detects comeback after 3 days and emits both streak_warning and comeback alerts', () => {
    setState({ lastSessionAt: daysAgo(4), streakWarningShown: false, comebackPromptShown: false });

    const check = recordSession();
    expect(check.daysSinceLastSession).toBe(4);
    expect(check.isComeback).toBe(true);
    expect(check.alerts.map((a) => a.type)).toEqual(['streak_warning', 'comeback']);
    expect(check.alerts[1].message).toContain('4 days');
  });

  it('does not re-emit comeback alert if already shown', () => {
    setState({ lastSessionAt: daysAgo(5), comebackPromptShown: true, streakWarningShown: true });

    const check = recordSession();
    expect(check.alerts.filter((a) => a.type === 'comeback')).toHaveLength(0);
  });

  it('resets streakWarningShown and comebackPromptShown when user returns same day', () => {
    setState({
      lastSessionAt: new Date().toISOString(),
      streakWarningShown: true,
      comebackPromptShown: true,
    });

    recordSession();
    const saved = JSON.parse(localStorage.getItem(STATE_KEY)!);
    expect(saved.streakWarningShown).toBe(false);
    expect(saved.comebackPromptShown).toBe(false);
  });

  it('persists lastSessionAt to "now" after recording', () => {
    const before = Date.now();
    recordSession();
    const saved = JSON.parse(localStorage.getItem(STATE_KEY)!);
    const lastSessionMs = new Date(saved.lastSessionAt).getTime();
    expect(lastSessionMs).toBeGreaterThanOrEqual(before);
    expect(lastSessionMs).toBeLessThanOrEqual(Date.now() + 100);
  });

  it('recovers from corrupted JSON state by using defaults', () => {
    localStorage.setItem(STATE_KEY, '{{{corrupt');
    const check = recordSession();
    expect(check.alerts).toEqual([]);
  });
});

describe('retentionService.checkCriticalQuests', () => {
  it('returns an empty array when no quests are given', () => {
    expect(checkCriticalQuests([])).toEqual([]);
  });

  it('ignores completed quests', () => {
    const inOneMinute = new Date(Date.now() + 60_000).toISOString();
    const alerts = checkCriticalQuests([
      { id: '1', title: 'Done', priority: 'High', dueDateTime: inOneMinute, isCompleted: true },
    ]);
    expect(alerts).toEqual([]);
  });

  it('emits a critical_quest alert for quests due within 1 hour', () => {
    const in30Min = new Date(Date.now() + 30 * 60_000).toISOString();
    const alerts = checkCriticalQuests([
      { id: '1', title: 'Report', priority: 'Medium', dueDateTime: in30Min, isCompleted: false },
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('critical_quest');
    expect(alerts[0].title).toContain('Report');
    expect(alerts[0].message).toMatch(/\d+ minutes/);
  });

  it('does not emit an alert for quests due more than 1 hour from now', () => {
    const in2Hours = new Date(Date.now() + 2 * 3600_000).toISOString();
    const alerts = checkCriticalQuests([
      { id: '1', title: 'Far', priority: 'High', dueDateTime: in2Hours, isCompleted: false },
    ]);
    expect(alerts).toEqual([]);
  });

  it('emits an OVERDUE alert for High priority quests that became overdue within 5 minutes', () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();
    const alerts = checkCriticalQuests([
      { id: '1', title: 'Urgent', priority: 'High', dueDateTime: twoMinAgo, isCompleted: false },
    ]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].title).toContain('OVERDUE');
    expect(alerts[0].title).toContain('Urgent');
  });

  it('does not emit OVERDUE alert for Medium priority overdue quests', () => {
    const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();
    const alerts = checkCriticalQuests([
      { id: '1', title: 'Normal', priority: 'Medium', dueDateTime: twoMinAgo, isCompleted: false },
    ]);
    expect(alerts).toEqual([]);
  });

  it('does not emit OVERDUE alert for quests overdue more than 5 minutes', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
    const alerts = checkCriticalQuests([
      { id: '1', title: 'Old', priority: 'High', dueDateTime: tenMinAgo, isCompleted: false },
    ]);
    expect(alerts).toEqual([]);
  });

  it('handles multiple quests with mixed states', () => {
    const in30Min = new Date(Date.now() + 30 * 60_000).toISOString();
    const in2Hours = new Date(Date.now() + 2 * 3600_000).toISOString();
    const twoMinAgo = new Date(Date.now() - 2 * 60_000).toISOString();

    const alerts = checkCriticalQuests([
      { id: '1', title: 'A', priority: 'High', dueDateTime: in30Min, isCompleted: false },
      { id: '2', title: 'B', priority: 'Medium', dueDateTime: in2Hours, isCompleted: false },
      { id: '3', title: 'C', priority: 'High', dueDateTime: twoMinAgo, isCompleted: false },
      { id: '4', title: 'D', priority: 'High', dueDateTime: in30Min, isCompleted: true },
    ]);

    expect(alerts).toHaveLength(2); // A (deadline) + C (overdue); B too far, D completed
    expect(alerts[0].title).toContain('A');
    expect(alerts[1].title).toContain('OVERDUE');
    expect(alerts[1].title).toContain('C');
  });
});

describe('retentionService.dispatchAlerts', () => {
  beforeEach(() => {
    vi.mocked(notifyInApp).mockClear();
    vi.mocked(notifyPush).mockClear();
  });

  it('sends critical_quest alerts to both in-app and push', () => {
    dispatchAlerts([{ type: 'critical_quest', title: 'A', message: 'm' }]);
    expect(notifyInApp).toHaveBeenCalledOnce();
    expect(notifyInApp).toHaveBeenCalledWith('A', 'm', 'critical');
    expect(notifyPush).toHaveBeenCalledOnce();
    expect(notifyPush).toHaveBeenCalledWith('A', 'm', 'critical');
  });

  it('sends streak_warning alerts to both in-app and push', () => {
    dispatchAlerts([{ type: 'streak_warning', title: 'S', message: 'm' }]);
    expect(notifyInApp).toHaveBeenCalledWith('S', 'm', 'warning');
    expect(notifyPush).toHaveBeenCalledWith('S', 'm', 'warning');
  });

  it('sends comeback alerts to in-app only, not push', () => {
    dispatchAlerts([{ type: 'comeback', title: 'C', message: 'm' }]);
    expect(notifyInApp).toHaveBeenCalledWith('C', 'm', 'info');
    expect(notifyPush).not.toHaveBeenCalled();
  });

  it('dispatches multiple alerts in order', () => {
    dispatchAlerts([
      { type: 'streak_warning', title: 'A', message: 'a' },
      { type: 'comeback', title: 'B', message: 'b' },
      { type: 'critical_quest', title: 'C', message: 'c' },
    ]);
    expect(notifyInApp).toHaveBeenCalledTimes(3);
    expect(notifyPush).toHaveBeenCalledTimes(2); // only streak_warning + critical_quest
  });
});
