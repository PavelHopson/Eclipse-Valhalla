import { useEffect } from 'react';
import type { Note, Reminder, Routine, WorkoutLog } from '../types';
import { api } from '../services/storageService';
import type { QuestTemplate } from '../constants/questTemplates';
import { QUEST_TEMPLATES_STORAGE_KEY } from '../constants/questTemplates';

const DEBOUNCE_MS = 500;

interface UseAutosaveParams {
  userId: string;
  isDataLoaded: boolean;
  reminders: Reminder[];
  notes: Note[];
  routines: Routine[];
  workoutLogs: WorkoutLog[];
  questTemplates: QuestTemplate[];
}

/**
 * Persists user collections to storage whenever they change, waiting until
 * the initial bootstrap load has completed. Reminders and notes use a 500ms
 * debounce to avoid thrashing storage during rapid edits; routines and
 * workout logs save immediately; quest templates go straight to localStorage.
 */
export function useAutosave(params: UseAutosaveParams): void {
  const { userId, isDataLoaded, reminders, notes, routines, workoutLogs, questTemplates } = params;

  // Reminders (debounced)
  useEffect(() => {
    if (!isDataLoaded) return;
    const timer = setTimeout(() => api.saveData('reminders', userId, reminders), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [reminders, isDataLoaded, userId]);

  // Notes (debounced)
  useEffect(() => {
    if (!isDataLoaded) return;
    const timer = setTimeout(() => api.saveData('notes', userId, notes), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [notes, isDataLoaded, userId]);

  // Routines + workout logs (immediate)
  useEffect(() => {
    if (!isDataLoaded) return;
    api.saveData('routines', userId, routines);
    api.saveData('workout_logs', userId, workoutLogs);
  }, [routines, workoutLogs, isDataLoaded, userId]);

  // Quest templates (immediate, localStorage directly)
  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem(QUEST_TEMPLATES_STORAGE_KEY, JSON.stringify(questTemplates));
  }, [questTemplates, isDataLoaded]);
}
