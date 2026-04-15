import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Note, Reminder, Routine, User, WorkoutLog } from '../types';
import { api } from '../services/storageService';
import { pmfSessionStart } from '../services/pmfTracker';
import { trackSessionStart } from '../services/analyticsService';
import { dispatchAlerts, recordSession } from '../services/retentionService';
import { getWeeklySummary, recordDay } from '../services/progressionService';

const STREAK_KEY_PREFIX = 'eclipse_streak_';
const RETURN_SHOWN_KEY_PREFIX = 'eclipse_return_shown_';
const PRESSURE_1_DELAY_MS = 2 * 60 * 60 * 1000;
const PRESSURE_2_DELAY_MS = 5 * 60 * 60 * 1000;
const OVERDUE_POLL_INTERVAL_MS = 5 * 60 * 1000;
const OVERDUE_WINDOW_MS = 10 * 60 * 1000;

type ReturnOverlayState = {
  type: 'debt' | 'comeback';
  streak: number;
  abandonedCount: number;
  daysAway: number;
  topAbandoned?: string;
};

type StreakData = {
  days?: number;
  lastActiveDate?: string;
};

interface UseBootstrapParams {
  user: User;
  isRussian: boolean;
  setReminders: Dispatch<SetStateAction<Reminder[]>>;
  setNotes: Dispatch<SetStateAction<Note[]>>;
  setRoutines: Dispatch<SetStateAction<Routine[]>>;
  setWorkoutLogs: Dispatch<SetStateAction<WorkoutLog[]>>;
  setIsDataLoaded: Dispatch<SetStateAction<boolean>>;
  setReturnMessage: Dispatch<SetStateAction<string | null>>;
  setReturnOverlay: Dispatch<SetStateAction<ReturnOverlayState | null>>;
  setWeeklySummary: Dispatch<SetStateAction<unknown>>;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayIso(): string {
  return new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
}

function countAbandoned(reminders: Reminder[], today: string): number {
  return reminders.filter(
    (r) =>
      !r.isCompleted &&
      (r as { createdAt?: number | string }).createdAt &&
      new Date((r as { createdAt?: number | string }).createdAt!).toISOString().split('T')[0] <
        today,
  ).length;
}

function findTopAbandoned(reminders: Reminder[]): string | undefined {
  const highPriority = reminders.find((r) => !r.isCompleted && r.priority === 'High');
  if (highPriority) return highPriority.title;
  return reminders.find((r) => !r.isCompleted)?.title;
}

function schedulePressureNotification(
  delayMs: number,
  body: string,
  tag: string,
): ReturnType<typeof setTimeout> {
  return setTimeout(() => {
    if (document.hidden) {
      new Notification('Eclipse Valhalla', {
        body,
        icon: '/favicon.ico',
        tag,
      });
    }
  }, delayMs);
}

function startOverdueWatcher(userId: string): ReturnType<typeof setInterval> {
  return setInterval(() => {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const now = new Date();
    const loaded = api.getData('reminders', userId) as Reminder[];
    const justOverdue = loaded.filter(
      (r) =>
        !r.isCompleted &&
        r.dueDateTime &&
        new Date(r.dueDateTime) < now &&
        new Date(r.dueDateTime) > new Date(now.getTime() - OVERDUE_WINDOW_MS),
    );
    if (justOverdue.length > 0) {
      new Notification('Eclipse Valhalla', {
        body:
          justOverdue.length === 1
            ? `⚠️ ${justOverdue[0].title} — просрочено`
            : `⚠️ ${justOverdue.length} квестов просрочено`,
        icon: undefined,
        silent: false,
      });
    }
  }, OVERDUE_POLL_INTERVAL_MS);
}

/**
 * Runs the one-time app bootstrap sequence: load persisted data, start PMF and
 * analytics sessions, compute streak + return overlay, record the day, schedule
 * pressure notifications, and start the overdue-quest watcher interval.
 *
 * Intentionally has an empty dependency array — this runs exactly once per
 * mount. All callbacks are captured in a closure; passing stale setters is
 * safe because React's useState setters are guaranteed stable.
 */
export function useBootstrap(params: UseBootstrapParams): void {
  const {
    user,
    isRussian,
    setReminders,
    setNotes,
    setRoutines,
    setWorkoutLogs,
    setIsDataLoaded,
    setReturnMessage,
    setReturnOverlay,
    setWeeklySummary,
  } = params;

  useEffect(() => {
    const cleanups: Array<() => void> = [];

    // Load persisted collections
    setReminders(api.getData('reminders', user.id));
    setNotes(api.getData('notes', user.id));
    setRoutines(api.getData('routines', user.id));
    setWorkoutLogs(api.getData('workout_logs', user.id));
    setIsDataLoaded(true);

    // PMF + analytics + retention
    pmfSessionStart();
    trackSessionStart();
    const retention = recordSession();
    if (retention.alerts.length > 0) {
      dispatchAlerts(retention.alerts);
    }

    // Streak + return overlay + notifications
    try {
      const streakKey = `${STREAK_KEY_PREFIX}${user.id}`;
      const streakData: StreakData = JSON.parse(localStorage.getItem(streakKey) || '{}');
      const today = todayIso();
      const yesterday = yesterdayIso();
      const lastShownKey = `${RETURN_SHOWN_KEY_PREFIX}${today}`;
      const alreadyShown = localStorage.getItem(lastShownKey) === 'true';

      const loadedReminders = api.getData('reminders', user.id) as Reminder[];
      const abandonedCount = countAbandoned(loadedReminders, today);
      const topAbandoned = findTopAbandoned(loadedReminders);

      if (streakData.lastActiveDate === today) {
        if ((streakData.days ?? 0) > 1) {
          setReturnMessage(
            `Day ${streakData.days}. ${isRussian ? 'Дисциплина сохранена.' : 'Discipline maintained.'}`,
          );
        }
      } else if (streakData.lastActiveDate === yesterday) {
        streakData.days = (streakData.days || 0) + 1;
        streakData.lastActiveDate = today;
        localStorage.setItem(streakKey, JSON.stringify(streakData));
        setReturnMessage(
          `Day ${streakData.days}. ${isRussian ? 'Ты пришёл. Продолжай.' : 'You showed up. Continue.'}`,
        );

        if (!alreadyShown && abandonedCount > 0) {
          setReturnOverlay({
            type: 'debt',
            streak: streakData.days,
            abandonedCount,
            daysAway: 0,
            topAbandoned,
          });
          localStorage.setItem(lastShownKey, 'true');
        }
      } else if (streakData.lastActiveDate) {
        const daysAway = Math.floor(
          (Date.now() - new Date(streakData.lastActiveDate).getTime()) / 86_400_000,
        );
        streakData.days = 1;
        streakData.lastActiveDate = today;
        localStorage.setItem(streakKey, JSON.stringify(streakData));
        setReturnMessage(
          `${daysAway} ${isRussian ? 'дней отсутствия. Стрик сломан. День 1.' : 'days absent. Streak broken. Day 1 begins now.'}`,
        );

        if (!alreadyShown) {
          setReturnOverlay({
            type: 'comeback',
            streak: 1,
            abandonedCount,
            daysAway,
            topAbandoned,
          });
          localStorage.setItem(lastShownKey, 'true');
        }
      } else {
        streakData.days = 1;
        streakData.lastActiveDate = today;
        localStorage.setItem(streakKey, JSON.stringify(streakData));
      }

      // Achievement: streak update
      import('../services/achievementService')
        .then(({ trackEvent }) => {
          trackEvent('streak_update', streakData.days || 0);
        })
        .catch(() => {});

      // Notification permission
      if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
        Notification.requestPermission();
      }

      // Record day + weekly summary
      const completedCount = loadedReminders.filter((r) => r.isCompleted).length;
      const createdCount = loadedReminders.length;
      recordDay(completedCount, createdCount);

      const weekly = getWeeklySummary();
      if (weekly) setWeeklySummary(weekly);

      // Inactivity pressure notifications
      const pendingCount = loadedReminders.filter((r) => !r.isCompleted).length;
      if (pendingCount > 0 && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        const pressureBody1 = isRussian
          ? `${pendingCount} в ожидании. Дисциплина не строится потом.`
          : `${pendingCount} objective${pendingCount > 1 ? 's' : ''} still pending. Discipline is not built later.`;

        const timer1 = schedulePressureNotification(PRESSURE_1_DELAY_MS, pressureBody1, 'ev-pressure-1');
        const timer2 = schedulePressureNotification(
          PRESSURE_2_DELAY_MS,
          "You said you would act. You didn't. Still nothing done.",
          'ev-pressure-2',
        );
        cleanups.push(() => clearTimeout(timer1));
        cleanups.push(() => clearTimeout(timer2));
      }

      // Overdue watcher
      const overdueInterval = startOverdueWatcher(user.id);
      cleanups.push(() => clearInterval(overdueInterval));
    } catch {
      // Swallow — bootstrap failures must not break the app
    }

    return () => {
      cleanups.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
