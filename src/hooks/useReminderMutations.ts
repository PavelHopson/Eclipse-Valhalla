import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Category, Priority, Reminder, ReminderStatus, RepeatType, User } from '../types';
import { generateId } from '../utils';
import { api } from '../services/storageService';
import { pmfQuestCompleted, pmfQuestCreated } from '../services/pmfTracker';
import { trackQuestCompleted, trackQuestCreated } from '../services/analyticsService';

const SESSION_STORAGE_KEY = 'lumina_active_session';
const REPEAT_INSERT_DELAY_MS = 500;

const XP_BY_PRIORITY: Record<string, number> = {
  [Priority.HIGH]: 30,
  [Priority.MEDIUM]: 20,
  [Priority.LOW]: 10,
};

function computeXpGain(priority: Reminder['priority']): number {
  return XP_BY_PRIORITY[priority] ?? XP_BY_PRIORITY[Priority.MEDIUM];
}

function computeNextRepeatDate(base: string, repeatType: RepeatType): string {
  const nextDate = new Date(base);
  if (repeatType === RepeatType.DAILY) nextDate.setDate(nextDate.getDate() + 1);
  else if (repeatType === RepeatType.WEEKLY) nextDate.setDate(nextDate.getDate() + 7);
  else if (repeatType === RepeatType.MONTHLY) nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate.toISOString();
}

interface UseReminderMutationsParams {
  setReminders: Dispatch<SetStateAction<Reminder[]>>;
  setUser: Dispatch<SetStateAction<User>>;
  setIsReminderModalOpen: Dispatch<SetStateAction<boolean>>;
}

export interface ReminderMutations {
  saveReminder: (partial: Partial<Reminder>) => void;
  toggleComplete: (id: string) => void;
  deleteReminder: (id: string) => void;
}

/**
 * Owns all the mutation logic for the Reminder collection:
 *
 * - saveReminder: creates a new quest with safe defaults (including
 *   pmf/analytics fire-and-forget) or patches an existing one by id;
 *   closes the reminder modal on completion.
 *
 * - toggleComplete: flips the completion flag, awards XP based on
 *   priority, fires quest_complete achievement event + success sound,
 *   persists the updated user, and schedules a repeat quest if the
 *   original had a recurring repeatType.
 *
 * - deleteReminder: removes the quest by id.
 *
 * Returning a stable object of callbacks from a single hook prevents the
 * four separate useCallbacks from cluttering App.tsx and gives us one
 * obvious spot to test reminder business logic in the future.
 */
export function useReminderMutations(params: UseReminderMutationsParams): ReminderMutations {
  const { setReminders, setUser, setIsReminderModalOpen } = params;

  const saveReminder = useCallback(
    (r: Partial<Reminder>) => {
      const newR: Reminder = {
        id: r.id || generateId(),
        title: r.title || 'New Quest',
        description: r.description || '',
        dueDateTime: r.dueDateTime || new Date().toISOString(),
        repeatType: r.repeatType || RepeatType.NONE,
        priority: r.priority || Priority.MEDIUM,
        category: r.category || Category.PERSONAL,
        isCompleted: false,
        status: ReminderStatus.TODO,
        createdAt: Date.now(),
        subtasks: r.subtasks || [],
        estimatedMinutes: r.estimatedMinutes,
      };

      if (r.id) {
        setReminders((prev) => prev.map((x) => (x.id === r.id ? ({ ...x, ...r } as Reminder) : x)));
      } else {
        setReminders((prev) => [...prev, newR]);
        pmfQuestCreated();
        trackQuestCreated();
      }

      setIsReminderModalOpen(false);
    },
    [setReminders, setIsReminderModalOpen],
  );

  const toggleComplete = useCallback(
    (id: string) => {
      setReminders((prev) => {
        const quest = prev.find((r) => r.id === id);
        if (quest && !quest.isCompleted) {
          pmfQuestCompleted();
          trackQuestCompleted();
        }

        const updated = prev.map((r) =>
          r.id === id
            ? {
                ...r,
                isCompleted: !r.isCompleted,
                completedAt: !r.isCompleted ? Date.now() : undefined,
                status: r.isCompleted ? ReminderStatus.TODO : ReminderStatus.DONE,
              }
            : r,
        );

        const updatedQuest = updated.find((r) => r.id === id);
        if (updatedQuest?.isCompleted) {
          import('../services/achievementService')
            .then(({ trackEvent }) => {
              trackEvent('quest_complete');
            })
            .catch(() => {});
          import('../utils')
            .then(({ playSuccessSound }) => playSuccessSound())
            .catch(() => {});
        }

        if (updatedQuest && updatedQuest.isCompleted) {
          const xpGain = computeXpGain(updatedQuest.priority);
          setUser((prevUser) => {
            const newXp = (prevUser.xp || 0) + xpGain;
            const newLevel = Math.floor(newXp / 100) + 1;
            const updatedUser = { ...prevUser, xp: newXp, level: newLevel };
            api.updateUser(prevUser.id, { xp: newXp, level: newLevel });
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
            return updatedUser;
          });
        }

        if (
          updatedQuest &&
          updatedQuest.isCompleted &&
          updatedQuest.repeatType &&
          updatedQuest.repeatType !== RepeatType.NONE
        ) {
          const repeatedQuest: Reminder = {
            ...updatedQuest,
            id: generateId(),
            isCompleted: false,
            completedAt: undefined,
            status: ReminderStatus.TODO,
            dueDateTime: computeNextRepeatDate(updatedQuest.dueDateTime, updatedQuest.repeatType),
            createdAt: Date.now(),
          };
          setTimeout(() => {
            setReminders((current) => [...current, repeatedQuest]);
          }, REPEAT_INSERT_DELAY_MS);
        }

        return updated;
      });
    },
    [setReminders, setUser],
  );

  const deleteReminder = useCallback(
    (id: string) => {
      setReminders((prev) => prev.filter((r) => r.id !== id));
    },
    [setReminders],
  );

  return { saveReminder, toggleComplete, deleteReminder };
}
