import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type Application,
  CAREER_QUESTS,
  completeQuest,
  deleteApplication,
  getApplications,
  getCompletedThisWeek,
  getCompletedToday,
  getStats,
  saveApplication,
  updateApplicationStatus,
} from '../careerService';

// Storage keys — kept in sync with careerService.ts
const APPS_KEY = 'eclipse_career_applications';
const XP_LOG_KEY = 'eclipse_career_xp_log';
const DONE_QUESTS_KEY = 'eclipse_career_quests_done';

/**
 * Fixed reference date: Wednesday 15 April 2026, 12:00 UTC.
 * Chosen at midday UTC so local-time / UTC-date conversions inside
 * the service don't straddle a day boundary regardless of runner TZ.
 */
const FIXED_NOW = new Date('2026-04-15T12:00:00.000Z');

/** Returns a Date `n` days before FIXED_NOW (at the same wall-clock time). */
function daysAgo(n: number): Date {
  return new Date(FIXED_NOW.getTime() - n * 86_400_000);
}

function writeRawApps(apps: Application[]): void {
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

function makeApp(overrides: Partial<Application> & { id: string; appliedAt: number }): Application {
  return {
    id: overrides.id,
    company: overrides.company ?? 'Acme',
    position: overrides.position ?? 'Engineer',
    source: overrides.source ?? 'linkedin',
    status: overrides.status ?? 'applied',
    appliedAt: overrides.appliedAt,
    updatedAt: overrides.updatedAt ?? overrides.appliedAt,
    notes: overrides.notes ?? '',
    salaryMin: overrides.salaryMin,
    salaryMax: overrides.salaryMax,
    currency: overrides.currency,
    nextStepAt: overrides.nextStepAt,
    url: overrides.url,
    cvVersion: overrides.cvVersion,
  };
}

// ═══════════════════════════════════════════════════════════════
// Applications — CRUD
// ═══════════════════════════════════════════════════════════════

describe('careerService: applications CRUD', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('saveApplication creates a record with id + appliedAt + updatedAt', () => {
    const saved = saveApplication({
      company: 'Acme',
      position: 'Staff Engineer',
      source: 'linkedin',
      status: 'applied',
      notes: 'referred by Alice',
    });

    expect(saved.id).toBeTruthy();
    expect(typeof saved.id).toBe('string');
    expect(saved.appliedAt).toBe(FIXED_NOW.getTime());
    expect(saved.updatedAt).toBe(FIXED_NOW.getTime());
    expect(saved.company).toBe('Acme');
    expect(saved.status).toBe('applied');
  });

  it('getApplications returns [] when storage is empty', () => {
    expect(getApplications()).toEqual([]);
  });

  it('getApplications returns previously saved applications', () => {
    saveApplication({
      company: 'A', position: 'p1', source: 'direct', status: 'applied', notes: '',
    });
    saveApplication({
      company: 'B', position: 'p2', source: 'hh.ru', status: 'applied', notes: '',
    });

    const apps = getApplications();
    expect(apps).toHaveLength(2);
    expect(apps[0].company).toBe('A');
    expect(apps[1].company).toBe('B');
  });

  it('getApplications tolerates corrupted storage and returns []', () => {
    localStorage.setItem(APPS_KEY, '{not-json');
    expect(getApplications()).toEqual([]);
  });

  it('updateApplicationStatus changes status and bumps updatedAt', () => {
    const saved = saveApplication({
      company: 'A', position: 'p', source: 'direct', status: 'applied', notes: '',
    });

    // Advance clock so updatedAt can differ from appliedAt
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 60_000));

    updateApplicationStatus(saved.id, 'hr-screen');

    const apps = getApplications();
    expect(apps[0].status).toBe('hr-screen');
    expect(apps[0].updatedAt).toBe(FIXED_NOW.getTime() + 60_000);
    expect(apps[0].appliedAt).toBe(FIXED_NOW.getTime()); // unchanged
  });

  it('updateApplicationStatus is a no-op for unknown id', () => {
    const saved = saveApplication({
      company: 'A', position: 'p', source: 'direct', status: 'applied', notes: '',
    });

    updateApplicationStatus('does-not-exist', 'offer');

    const apps = getApplications();
    expect(apps).toHaveLength(1);
    expect(apps[0].id).toBe(saved.id);
    expect(apps[0].status).toBe('applied');
  });

  it('deleteApplication removes a record', () => {
    const a = saveApplication({
      company: 'A', position: 'p', source: 'direct', status: 'applied', notes: '',
    });
    const b = saveApplication({
      company: 'B', position: 'q', source: 'direct', status: 'applied', notes: '',
    });

    deleteApplication(a.id);

    const apps = getApplications();
    expect(apps).toHaveLength(1);
    expect(apps[0].id).toBe(b.id);
  });

  it('deleteApplication is a no-op for unknown id', () => {
    saveApplication({
      company: 'A', position: 'p', source: 'direct', status: 'applied', notes: '',
    });
    deleteApplication('nope');
    expect(getApplications()).toHaveLength(1);
  });

  it('multiple saves preserve insertion order', () => {
    const names = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
    for (const n of names) {
      saveApplication({
        company: n, position: 'p', source: 'direct', status: 'applied', notes: '',
      });
    }
    const apps = getApplications();
    expect(apps.map(a => a.company)).toEqual(names);
  });
});

// ═══════════════════════════════════════════════════════════════
// Stats
// ═══════════════════════════════════════════════════════════════

describe('careerService: getStats', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('returns zero counters when storage is empty', () => {
    const s = getStats();
    expect(s.totalApplications).toBe(0);
    expect(s.thisWeek).toBe(0);
    expect(s.thisMonth).toBe(0);
    expect(s.activeInterviews).toBe(0);
    expect(s.offers).toBe(0);
    expect(s.rejections).toBe(0);
    expect(s.applyStreak).toBe(0);
    expect(s.lastApplyDate).toBeUndefined();
    expect(s.totalXpEarned).toBe(0);
  });

  it('totalApplications matches the saved count', () => {
    for (let i = 0; i < 5; i++) {
      saveApplication({
        company: `C${i}`, position: 'p', source: 'direct', status: 'applied', notes: '',
      });
    }
    expect(getStats().totalApplications).toBe(5);
  });

  it('thisWeek counts only applications in the last 7 days', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: daysAgo(0).getTime() }),
      makeApp({ id: '2', appliedAt: daysAgo(3).getTime() }),
      makeApp({ id: '3', appliedAt: daysAgo(6).getTime() }),
      makeApp({ id: '4', appliedAt: daysAgo(10).getTime() }), // outside 7d
      makeApp({ id: '5', appliedAt: daysAgo(20).getTime() }), // outside 7d
    ]);
    expect(getStats().thisWeek).toBe(3);
  });

  it('thisMonth counts only applications in the last 30 days', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: daysAgo(0).getTime() }),
      makeApp({ id: '2', appliedAt: daysAgo(15).getTime() }),
      makeApp({ id: '3', appliedAt: daysAgo(29).getTime() }),
      makeApp({ id: '4', appliedAt: daysAgo(40).getTime() }), // outside
      makeApp({ id: '5', appliedAt: daysAgo(60).getTime() }), // outside
    ]);
    expect(getStats().thisMonth).toBe(3);
  });

  it('activeInterviews counts hr-screen / tech-screen / onsite only', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: FIXED_NOW.getTime(), status: 'applied' }),
      makeApp({ id: '2', appliedAt: FIXED_NOW.getTime(), status: 'hr-screen' }),
      makeApp({ id: '3', appliedAt: FIXED_NOW.getTime(), status: 'tech-screen' }),
      makeApp({ id: '4', appliedAt: FIXED_NOW.getTime(), status: 'onsite' }),
      makeApp({ id: '5', appliedAt: FIXED_NOW.getTime(), status: 'offer' }),
      makeApp({ id: '6', appliedAt: FIXED_NOW.getTime(), status: 'rejected' }),
      makeApp({ id: '7', appliedAt: FIXED_NOW.getTime(), status: 'withdrawn' }),
    ]);
    expect(getStats().activeInterviews).toBe(3);
  });

  it('offers counts only the "offer" status', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: FIXED_NOW.getTime(), status: 'offer' }),
      makeApp({ id: '2', appliedAt: FIXED_NOW.getTime(), status: 'offer' }),
      makeApp({ id: '3', appliedAt: FIXED_NOW.getTime(), status: 'rejected' }),
      makeApp({ id: '4', appliedAt: FIXED_NOW.getTime(), status: 'applied' }),
    ]);
    expect(getStats().offers).toBe(2);
  });

  it('rejections counts only the "rejected" status', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: FIXED_NOW.getTime(), status: 'rejected' }),
      makeApp({ id: '2', appliedAt: FIXED_NOW.getTime(), status: 'rejected' }),
      makeApp({ id: '3', appliedAt: FIXED_NOW.getTime(), status: 'rejected' }),
      makeApp({ id: '4', appliedAt: FIXED_NOW.getTime(), status: 'withdrawn' }),
    ]);
    expect(getStats().rejections).toBe(3);
  });

  it('byStatus record contains all 7 known statuses', () => {
    const { byStatus } = getStats();
    expect(Object.keys(byStatus).sort()).toEqual(
      ['applied', 'hr-screen', 'offer', 'onsite', 'rejected', 'tech-screen', 'withdrawn'].sort(),
    );
  });

  it('totalXpEarned reflects XP log after completing quests', () => {
    // apply-3 (daily, 50xp) + learn-hour (daily, 25xp) + reflect (weekly, 40xp) = 115
    completeQuest('apply-3');
    completeQuest('learn-hour');
    completeQuest('reflect');
    expect(getStats().totalXpEarned).toBe(115);
  });
});

// ═══════════════════════════════════════════════════════════════
// Apply streak
// ═══════════════════════════════════════════════════════════════

describe('careerService: applyStreak', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('returns 0 when there are no applications', () => {
    expect(getStats().applyStreak).toBe(0);
  });

  it('returns 1 for a single application applied today', () => {
    writeRawApps([makeApp({ id: '1', appliedAt: daysAgo(0).getTime() })]);
    expect(getStats().applyStreak).toBe(1);
  });

  it('returns 3 for applications on 3 consecutive days (today + 2 prior)', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: daysAgo(0).getTime() }),
      makeApp({ id: '2', appliedAt: daysAgo(1).getTime() }),
      makeApp({ id: '3', appliedAt: daysAgo(2).getTime() }),
    ]);
    expect(getStats().applyStreak).toBe(3);
  });

  it('breaks when there is a gap greater than 1 day', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: daysAgo(0).getTime() }),
      makeApp({ id: '2', appliedAt: daysAgo(1).getTime() }),
      // gap at day 2
      makeApp({ id: '3', appliedAt: daysAgo(3).getTime() }),
    ]);
    expect(getStats().applyStreak).toBe(2);
  });

  it('still counts when today is missing but yesterday is present', () => {
    // no application today → service checks yesterday instead
    writeRawApps([
      makeApp({ id: '1', appliedAt: daysAgo(1).getTime() }),
      makeApp({ id: '2', appliedAt: daysAgo(2).getTime() }),
      makeApp({ id: '3', appliedAt: daysAgo(3).getTime() }),
    ]);
    expect(getStats().applyStreak).toBe(3);
  });

  it('returns 0 when the last application is >1 day old (today AND yesterday missing)', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: daysAgo(5).getTime() }),
      makeApp({ id: '2', appliedAt: daysAgo(6).getTime() }),
    ]);
    expect(getStats().applyStreak).toBe(0);
  });

  it('reports lastApplyDate as the most recent application date', () => {
    writeRawApps([
      makeApp({ id: '1', appliedAt: daysAgo(5).getTime() }),
      makeApp({ id: '2', appliedAt: daysAgo(0).getTime() }),
      makeApp({ id: '3', appliedAt: daysAgo(10).getTime() }),
    ]);
    // UTC date of FIXED_NOW (2026-04-15T12:00Z) = 2026-04-15
    expect(getStats().lastApplyDate).toBe('2026-04-15');
  });
});

// ═══════════════════════════════════════════════════════════════
// Quests
// ═══════════════════════════════════════════════════════════════

describe('careerService: quest catalog', () => {
  it('exposes exactly 8 quests', () => {
    expect(CAREER_QUESTS).toHaveLength(8);
  });

  it('every quest has a positive xp reward and a known interval', () => {
    for (const q of CAREER_QUESTS) {
      expect(q.xp).toBeGreaterThan(0);
      expect(['daily', 'weekly', 'on-demand']).toContain(q.interval);
    }
  });
});

describe('careerService: completeQuest', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('daily quest: first call awards XP, second same-day call is alreadyDone', () => {
    const first = completeQuest('apply-3');
    expect(first.alreadyDone).toBe(false);
    expect(first.xp).toBe(50);

    const second = completeQuest('apply-3');
    expect(second.alreadyDone).toBe(true);
    expect(second.xp).toBe(0);
  });

  it('daily quest: completing it next day awards XP again', () => {
    completeQuest('apply-3');
    // advance 1 day
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 86_400_000));

    const again = completeQuest('apply-3');
    expect(again.alreadyDone).toBe(false);
    expect(again.xp).toBe(50);
  });

  it('weekly quest: same ISO week returns alreadyDone on second attempt', () => {
    const first = completeQuest('reflect');
    expect(first.alreadyDone).toBe(false);
    expect(first.xp).toBe(40);

    // move a couple of days forward but stay within the same ISO week
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 2 * 86_400_000));

    const second = completeQuest('reflect');
    expect(second.alreadyDone).toBe(true);
    expect(second.xp).toBe(0);
  });

  it('on-demand quest can be completed multiple times in a row', () => {
    const r1 = completeQuest('cv-update');
    const r2 = completeQuest('cv-update');
    const r3 = completeQuest('cv-update');
    expect(r1.alreadyDone).toBe(false);
    expect(r2.alreadyDone).toBe(false);
    expect(r3.alreadyDone).toBe(false);
    expect(r1.xp + r2.xp + r3.xp).toBe(60);
  });

  it('unknown quest id yields { xp: 0, alreadyDone: false } and no XP logged', () => {
    // @ts-expect-error — testing runtime fallback
    const result = completeQuest('does-not-exist');
    expect(result).toEqual({ xp: 0, alreadyDone: false });
    expect(getStats().totalXpEarned).toBe(0);
    expect(localStorage.getItem(DONE_QUESTS_KEY)).toBeNull();
    expect(localStorage.getItem(XP_LOG_KEY)).toBeNull();
  });
});

describe('careerService: getCompletedToday / getCompletedThisWeek', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('getCompletedToday returns quests completed today (daily + on-demand)', () => {
    completeQuest('apply-3');      // daily
    completeQuest('cv-update');    // on-demand

    const today = getCompletedToday();
    expect(today.sort()).toEqual(['apply-3', 'cv-update'].sort());
  });

  it('getCompletedToday excludes quests completed on previous days', () => {
    completeQuest('apply-3');
    // jump to next day
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 86_400_000));

    completeQuest('learn-hour');
    expect(getCompletedToday()).toEqual(['learn-hour']);
  });

  it('getCompletedThisWeek returns every quest completed inside the current ISO week', () => {
    // Wed 15.04 — complete daily
    completeQuest('apply-3');
    // Thu 16.04 — another daily
    vi.setSystemTime(new Date(FIXED_NOW.getTime() + 86_400_000));
    completeQuest('learn-hour');
    // same week — weekly reflection
    completeQuest('reflect');

    const week = getCompletedThisWeek();
    expect(week.sort()).toEqual(['apply-3', 'learn-hour', 'reflect'].sort());
  });

  it('getCompletedThisWeek excludes quests completed before the current ISO week', () => {
    // previous week (7 days earlier)
    vi.setSystemTime(new Date(FIXED_NOW.getTime() - 7 * 86_400_000));
    completeQuest('apply-3');

    // back to fixed "now"
    vi.setSystemTime(FIXED_NOW);
    completeQuest('learn-hour');

    const week = getCompletedThisWeek();
    expect(week).toEqual(['learn-hour']);
  });
});
