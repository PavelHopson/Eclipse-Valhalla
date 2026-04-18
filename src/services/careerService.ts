/**
 * Eclipse Valhalla — Career Quest Service
 *
 * Job-search discipline: applications, interviews, and daily career quests.
 * Not gamification — facts about behavior mapped onto XP rewards.
 *
 * - Application tracker (CRUD + status transitions)
 * - Stats: streak, active interviews, offers, rejections
 * - Daily / weekly / on-demand career quests with XP
 */

import { generateId } from '../utils';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type ApplicationStatus =
  | 'applied'
  | 'hr-screen'
  | 'tech-screen'
  | 'onsite'
  | 'offer'
  | 'rejected'
  | 'withdrawn';

export type AppSource = 'linkedin' | 'hh.ru' | 'referral' | 'direct' | 'other';

export interface Application {
  id: string;
  company: string;
  position: string;
  source: AppSource;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  status: ApplicationStatus;
  appliedAt: number;   // timestamp
  updatedAt: number;
  nextStepAt?: number;
  notes: string;
  url?: string;
  cvVersion?: string;
  cvMatchScore?: number;
}

export type CareerQuestId =
  | 'apply-3'
  | 'interview-prep'
  | 'interview-done'
  | 'cv-update'
  | 'learn-hour'
  | 'network-reach'
  | 'project-commit'
  | 'reflect';

export interface CareerQuest {
  id: CareerQuestId;
  title: string;
  titleRu: string;
  xp: number;
  interval: 'daily' | 'weekly' | 'on-demand';
  icon: string;  // emoji
}

export interface CareerStats {
  totalApplications: number;
  thisWeek: number;
  thisMonth: number;
  activeInterviews: number;
  offers: number;
  rejections: number;
  byStatus: Record<ApplicationStatus, number>;
  applyStreak: number;  // consecutive days with at least 1 application
  lastApplyDate?: string;
  totalXpEarned: number;
}

interface XpLogEntry {
  date: string;            // YYYY-MM-DD
  questId: CareerQuestId;
  xp: number;
}

// ═══════════════════════════════════════════
// QUEST CATALOG
// ═══════════════════════════════════════════

export const CAREER_QUESTS: CareerQuest[] = [
  { id: 'apply-3', title: 'Apply to 3 jobs today', titleRu: 'Подать резюме на 3 вакансии', xp: 50, interval: 'daily', icon: '📨' },
  { id: 'interview-prep', title: 'Interview prep session', titleRu: 'Подготовиться к интервью', xp: 30, interval: 'on-demand', icon: '📚' },
  { id: 'interview-done', title: 'Complete an interview', titleRu: 'Пройти собеседование', xp: 100, interval: 'on-demand', icon: '🎤' },
  { id: 'cv-update', title: 'Tailor CV for role', titleRu: 'Обновить CV под вакансию', xp: 20, interval: 'on-demand', icon: '📝' },
  { id: 'learn-hour', title: '1 hour of learning', titleRu: '1 час обучения', xp: 25, interval: 'daily', icon: '🧠' },
  { id: 'network-reach', title: 'Message 1 recruiter', titleRu: 'Написать рекрутёру', xp: 15, interval: 'daily', icon: '🤝' },
  { id: 'project-commit', title: 'Portfolio project commit', titleRu: 'Коммит в portfolio-проект', xp: 20, interval: 'daily', icon: '⚡' },
  { id: 'reflect', title: 'Weekly reflection', titleRu: 'Недельная рефлексия', xp: 40, interval: 'weekly', icon: '🎯' },
];

// ═══════════════════════════════════════════
// STORAGE KEYS
// ═══════════════════════════════════════════

const APPS_KEY = 'eclipse_career_applications';
const XP_LOG_KEY = 'eclipse_career_xp_log';
const DONE_QUESTS_KEY = 'eclipse_career_quests_done';

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function toDateStr(ts: number): string {
  return new Date(ts).toISOString().split('T')[0];
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * ISO week key like "2026-W16". Used to scope weekly quest completions.
 */
function weekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function getQuestMeta(id: CareerQuestId): CareerQuest | undefined {
  return CAREER_QUESTS.find(q => q.id === id);
}

// ═══════════════════════════════════════════
// APPLICATIONS — CRUD
// ═══════════════════════════════════════════

export function getApplications(): Application[] {
  return readJson<Application[]>(APPS_KEY, []);
}

function saveApplications(apps: Application[]): void {
  writeJson(APPS_KEY, apps);
}

export function saveApplication(
  app: Omit<Application, 'id' | 'appliedAt' | 'updatedAt'>,
): Application {
  const now = Date.now();
  const record: Application = {
    ...app,
    id: generateId(),
    appliedAt: now,
    updatedAt: now,
  };
  const apps = getApplications();
  apps.push(record);
  saveApplications(apps);
  return record;
}

export function updateApplicationStatus(id: string, status: ApplicationStatus): void {
  const apps = getApplications();
  const idx = apps.findIndex(a => a.id === id);
  if (idx === -1) return;
  apps[idx] = { ...apps[idx], status, updatedAt: Date.now() };
  saveApplications(apps);
}

export function deleteApplication(id: string): void {
  const apps = getApplications().filter(a => a.id !== id);
  saveApplications(apps);
}

/**
 * Persist a tailored CV + its estimated match score onto an application.
 * No-op if the application is not found.
 */
export function saveCVForApplication(appId: string, cv: string, score: number): void {
  const apps = getApplications();
  const idx = apps.findIndex(a => a.id === appId);
  if (idx === -1) return;
  apps[idx] = {
    ...apps[idx],
    cvVersion: cv,
    cvMatchScore: Math.max(0, Math.min(100, Math.round(score))),
    updatedAt: Date.now(),
  };
  saveApplications(apps);
}

// ═══════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════

export function getStats(): CareerStats {
  const apps = getApplications();
  const now = Date.now();
  const weekAgo = now - 7 * 86400000;
  const monthAgo = now - 30 * 86400000;

  const byStatus: Record<ApplicationStatus, number> = {
    'applied': 0,
    'hr-screen': 0,
    'tech-screen': 0,
    'onsite': 0,
    'offer': 0,
    'rejected': 0,
    'withdrawn': 0,
  };
  for (const a of apps) byStatus[a.status] = (byStatus[a.status] || 0) + 1;

  const activeInterviewStatuses: ApplicationStatus[] = ['hr-screen', 'tech-screen', 'onsite'];
  const activeInterviews = apps.filter(a => activeInterviewStatuses.includes(a.status)).length;

  // Apply streak: consecutive days (counting back from today) with >=1 application.
  // All date comparisons use UTC (same as toDateStr) to avoid TZ drift around midnight.
  const applyDates = new Set(apps.map(a => toDateStr(a.appliedAt)));
  let applyStreak = 0;
  const nowDate = new Date();
  let cursorMs = Date.UTC(
    nowDate.getUTCFullYear(),
    nowDate.getUTCMonth(),
    nowDate.getUTCDate(),
  );

  // If there is activity today, streak starts today; otherwise fall back to yesterday
  // so the streak "ends at the most recent activity that is not broken by a gap > 1 day".
  const todayIso = new Date(cursorMs).toISOString().split('T')[0];
  if (!applyDates.has(todayIso)) {
    cursorMs -= 86400000;
  }
  while (applyDates.has(new Date(cursorMs).toISOString().split('T')[0])) {
    applyStreak++;
    cursorMs -= 86400000;
  }

  const lastApplyTs = apps.reduce<number>((max, a) => Math.max(max, a.appliedAt), 0);
  const lastApplyDate = lastApplyTs > 0 ? toDateStr(lastApplyTs) : undefined;

  const xpLog = readJson<XpLogEntry[]>(XP_LOG_KEY, []);
  const totalXpEarned = xpLog.reduce((sum, e) => sum + (e.xp || 0), 0);

  return {
    totalApplications: apps.length,
    thisWeek: apps.filter(a => a.appliedAt >= weekAgo).length,
    thisMonth: apps.filter(a => a.appliedAt >= monthAgo).length,
    activeInterviews,
    offers: byStatus['offer'],
    rejections: byStatus['rejected'],
    byStatus,
    applyStreak,
    lastApplyDate,
    totalXpEarned,
  };
}

// ═══════════════════════════════════════════
// QUESTS
// ═══════════════════════════════════════════

interface DoneQuestRecord {
  questId: CareerQuestId;
  period: string;   // either date (YYYY-MM-DD) or week key (YYYY-Www) or timestamp for on-demand
  at: number;       // completion timestamp
}

function readDone(): DoneQuestRecord[] {
  return readJson<DoneQuestRecord[]>(DONE_QUESTS_KEY, []);
}

function writeDone(done: DoneQuestRecord[]): void {
  writeJson(DONE_QUESTS_KEY, done);
}

/**
 * Completes a quest. Daily quests can only be completed once per day,
 * weekly quests once per ISO week. On-demand quests can be completed
 * repeatedly (no dedupe).
 */
export function completeQuest(questId: CareerQuestId): { xp: number; alreadyDone: boolean } {
  const meta = getQuestMeta(questId);
  if (!meta) return { xp: 0, alreadyDone: false };

  const done = readDone();
  const now = Date.now();

  if (meta.interval === 'daily') {
    const period = todayStr();
    if (done.some(d => d.questId === questId && d.period === period)) {
      return { xp: 0, alreadyDone: true };
    }
    done.push({ questId, period, at: now });
  } else if (meta.interval === 'weekly') {
    const period = weekKey();
    if (done.some(d => d.questId === questId && d.period === period)) {
      return { xp: 0, alreadyDone: true };
    }
    done.push({ questId, period, at: now });
  } else {
    // on-demand: always allowed, use timestamp as unique period
    done.push({ questId, period: String(now), at: now });
  }

  writeDone(done);

  // Append to XP log
  const xpLog = readJson<XpLogEntry[]>(XP_LOG_KEY, []);
  xpLog.push({ date: todayStr(), questId, xp: meta.xp });
  writeJson(XP_LOG_KEY, xpLog);

  return { xp: meta.xp, alreadyDone: false };
}

export function getCompletedToday(): CareerQuestId[] {
  const today = todayStr();
  const done = readDone();
  const ids = new Set<CareerQuestId>();
  for (const d of done) {
    if (d.period === today) ids.add(d.questId);
    else if (toDateStr(d.at) === today) ids.add(d.questId); // on-demand completed today
  }
  return Array.from(ids);
}

export function getCompletedThisWeek(): CareerQuestId[] {
  const wk = weekKey();
  // UTC-based week start (Monday) so we line up with weekKey() / toDateStr() semantics.
  const now = new Date();
  const todayUtcMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const dayNum = new Date(todayUtcMs).getUTCDay() || 7; // 1..7, Monday=1
  const weekStartTs = todayUtcMs - (dayNum - 1) * 86400000;

  const done = readDone();
  const ids = new Set<CareerQuestId>();
  for (const d of done) {
    if (d.period === wk) ids.add(d.questId);
    else if (d.at >= weekStartTs) ids.add(d.questId); // daily + on-demand inside this week
  }
  return Array.from(ids);
}
