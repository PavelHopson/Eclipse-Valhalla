import { useEffect } from 'react';
import type { ViewMode } from '../types';

const VIEW_TO_FEATURE: Partial<Record<ViewMode, string>> = {
  dashboard: 'dashboard',
  reminders: 'quests',
  workouts: 'workouts',
  oracle: 'oracle',
  nexus: 'news',
  stickers: 'notes',
  calendar: 'calendar',
  achievements: 'achievements',
  image: 'image',
  tts: 'tts',
};

interface UseFeatureTrackingParams {
  currentView: ViewMode;
  isDataLoaded: boolean;
}

/**
 * Sends a `feature_use` achievement event whenever the active view changes
 * (after initial data load). Used to power achievements that reward breadth
 * of app usage.
 */
export function useFeatureTracking({ currentView, isDataLoaded }: UseFeatureTrackingParams): void {
  useEffect(() => {
    if (!isDataLoaded) return;
    const feature = VIEW_TO_FEATURE[currentView];
    if (!feature) return;

    import('../services/achievementService')
      .then(({ trackEvent }) => {
        trackEvent('feature_use', feature as never);
      })
      .catch(() => {});
  }, [currentView, isDataLoaded]);
}
