import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '../types';
import { api } from '../services/storageService';

const TOAST_VISIBLE_MS = 4000;
const SESSION_STORAGE_KEY = 'lumina_active_session';

export interface AchievementToast {
  text: string;
  xp: number;
}

interface UseAchievementToastsParams {
  t: (key: string) => string;
  setUser: Dispatch<SetStateAction<User>>;
}

/**
 * Subscribes to achievement unlocks and:
 * - displays a toast for TOAST_VISIBLE_MS
 * - plays the achievement sound effect
 * - credits the user with the achievement's XP reward and recomputes level
 * - persists the updated user to storage and session
 *
 * Returns the current toast state so the caller can render it.
 */
export function useAchievementToasts(params: UseAchievementToastsParams): AchievementToast | null {
  const { t, setUser } = params;
  const [toast, setToast] = useState<AchievementToast | null>(null);

  useEffect(() => {
    let cancelled = false;
    let hideTimer: ReturnType<typeof setTimeout> | undefined;

    import('../services/achievementService')
      .then(({ onAchievementUnlock }) => {
        if (cancelled) return;
        onAchievementUnlock((achievement) => {
          const name = t(`achievements.${achievement.id}`);
          setToast({ text: name, xp: achievement.xpReward });

          import('../utils')
            .then(({ playAchievementSound }) => playAchievementSound())
            .catch(() => {});

          setUser((prev) => {
            const newXp = (prev.xp || 0) + achievement.xpReward;
            const newLevel = Math.floor(newXp / 100) + 1;
            const updatedUser = { ...prev, xp: newXp, level: newLevel };
            api.updateUser(prev.id, { xp: newXp, level: newLevel });
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedUser));
            return updatedUser;
          });

          if (hideTimer) clearTimeout(hideTimer);
          hideTimer = setTimeout(() => setToast(null), TOAST_VISIBLE_MS);
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (hideTimer) clearTimeout(hideTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return toast;
}
