/**
 * Eclipse Valhalla — Sync Types
 *
 * Architecture:
 *   localStorage (instant) → syncQueue (pending) → Supabase (truth)
 *   Supabase (realtime) → localStorage (cache) → UI
 */

// ═══════════════════════════════════════════
// SYNC QUEUE
// ═══════════════════════════════════════════

export type SyncOperation = 'upsert' | 'delete';
export type SyncTable = 'quests' | 'user_progress' | 'settings' | 'focus_sessions';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncQueueItem {
  id: string;
  table: SyncTable;
  operation: SyncOperation;
  data: Record<string, any>;
  timestamp: number;
  status: SyncStatus;
  retryCount: number;
  userId: string;
}

// ═══════════════════════════════════════════
// USER PROGRESS (single row per user)
// ═══════════════════════════════════════════

export interface UserProgress {
  userId: string;
  streak: number;
  lastActiveDate: string;
  completedToday: number;
  totalCompleted: number;
  totalFailed: number;
  escapeCount: number;
  focusSessions: number;
  disciplineMode: 'hardcore' | 'balanced';
  rareMomentsShown: string[];   // IDs of rare moments already triggered
  updatedAt: string;
}

// ═══════════════════════════════════════════
// CLOUD QUEST (normalized for Supabase)
// ═══════════════════════════════════════════

export interface CloudQuest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  repeat_type: string;
  due_at: string;
  is_completed: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════
// CLOUD SETTINGS
// ═══════════════════════════════════════════

export interface CloudSettings {
  user_id: string;
  language: string;
  discipline_mode: string;
  accent_theme: string;
  updated_at: string;
}

// ═══════════════════════════════════════════
// SYNC STATE
// ═══════════════════════════════════════════

export interface SyncState {
  lastSyncAt: string | null;
  pendingCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  error: string | null;
}
