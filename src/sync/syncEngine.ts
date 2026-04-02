/**
 * Eclipse Valhalla — Sync Engine
 *
 * Processes the sync queue against Supabase.
 * Handles: push (local→cloud), pull (cloud→local), realtime.
 *
 * Architecture:
 *   1. User writes → localStorage (instant) + syncQueue.enqueue()
 *   2. syncEngine.processQueue() → pushes pending to Supabase
 *   3. Supabase Realtime → updates other devices
 *   4. On app open → pull latest from cloud → merge with local
 */

import { getSupabase, isCloudAvailable } from '../backend/supabaseClient';
import { getPending, markSyncing, markSynced, markFailed, getPendingCount } from './syncQueue';
import { SyncQueueItem, SyncState, UserProgress, CloudQuest } from './types';

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════

let _syncState: SyncState = {
  lastSyncAt: null,
  pendingCount: 0,
  isSyncing: false,
  isOnline: navigator.onLine,
  error: null,
};

let _listeners: Set<(s: SyncState) => void> = new Set();

function setState(updates: Partial<SyncState>) {
  _syncState = { ..._syncState, ...updates };
  _listeners.forEach(fn => fn(_syncState));
}

export function getSyncState(): SyncState { return { ..._syncState }; }
export function onSyncStateChange(fn: (s: SyncState) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ═══════════════════════════════════════════
// INIT — setup online/offline listeners
// ═══════════════════════════════════════════

export function initSync(): void {
  window.addEventListener('online', () => {
    setState({ isOnline: true });
    processQueue(); // Auto-sync when back online
  });
  window.addEventListener('offline', () => {
    setState({ isOnline: false });
  });
  setState({ pendingCount: getPendingCount(), isOnline: navigator.onLine });
}

// ═══════════════════════════════════════════
// PUSH — process queue items to Supabase
// ═══════════════════════════════════════════

export async function processQueue(): Promise<void> {
  if (_syncState.isSyncing || !_syncState.isOnline) return;

  const sb = getSupabase();
  if (!sb) return;

  const pending = getPending();
  if (pending.length === 0) return;

  setState({ isSyncing: true, error: null });

  for (const item of pending) {
    try {
      markSyncing(item.id);
      await pushItem(sb, item);
      markSynced(item.id);
    } catch (e: any) {
      console.error(`[Sync] Failed to push ${item.table}:`, e.message);
      markFailed(item.id);
      setState({ error: e.message });
    }
  }

  setState({
    isSyncing: false,
    lastSyncAt: new Date().toISOString(),
    pendingCount: getPendingCount(),
  });
}

async function pushItem(sb: any, item: SyncQueueItem): Promise<void> {
  if (item.operation === 'delete') {
    const { error } = await sb.from(item.table).delete().eq('id', item.data.id);
    if (error) throw error;
    return;
  }

  // Upsert
  const { error } = await sb.from(item.table).upsert(item.data, { onConflict: 'id' });
  if (error) throw error;
}

// ═══════════════════════════════════════════
// PULL — load latest from Supabase → merge with local
// ═══════════════════════════════════════════

export async function pullQuests(userId: string): Promise<CloudQuest[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Sync] Pull quests failed:', error.message);
    return [];
  }

  return (data || []) as CloudQuest[];
}

export async function pullProgress(userId: string): Promise<UserProgress | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    streak: data.streak,
    lastActiveDate: data.last_active_date,
    completedToday: data.completed_today,
    totalCompleted: data.total_completed,
    totalFailed: data.total_failed,
    escapeCount: data.escape_count,
    focusSessions: data.focus_sessions,
    disciplineMode: data.discipline_mode,
    rareMomentsShown: data.rare_moments_shown || [],
    updatedAt: data.updated_at,
  };
}

// ═══════════════════════════════════════════
// MERGE — newest wins per-field
// ═══════════════════════════════════════════

export function mergeQuests(local: any[], cloud: CloudQuest[]): any[] {
  const merged = new Map<string, any>();

  // Local first
  for (const q of local) merged.set(q.id, q);

  // Cloud overwrites if newer
  for (const q of cloud) {
    const localQ = merged.get(q.id);
    if (!localQ) {
      // Cloud-only quest — add to local
      merged.set(q.id, cloudQuestToLocal(q));
    } else {
      // Newest wins
      const cloudTime = new Date(q.updated_at).getTime();
      const localTime = localQ.createdAt || 0;
      if (cloudTime > localTime) {
        merged.set(q.id, cloudQuestToLocal(q));
      }
    }
  }

  return Array.from(merged.values());
}

function cloudQuestToLocal(q: CloudQuest): any {
  return {
    id: q.id,
    title: q.title,
    description: q.description,
    dueDateTime: q.due_at,
    repeatType: q.repeat_type || 'None',
    priority: q.priority || 'Medium',
    category: q.category || 'Personal',
    isCompleted: q.is_completed,
    status: q.status || 'todo',
    createdAt: new Date(q.created_at).getTime(),
    subtasks: [],
  };
}

// ═══════════════════════════════════════════
// REALTIME — subscribe to changes from other devices
// ═══════════════════════════════════════════

let _realtimeChannel: any = null;

export function subscribeRealtime(userId: string, onQuestChange: (quest: CloudQuest) => void): void {
  const sb = getSupabase();
  if (!sb) return;

  // Unsubscribe previous
  if (_realtimeChannel) {
    sb.removeChannel(_realtimeChannel);
  }

  _realtimeChannel = sb
    .channel('quest-sync')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'quests',
      filter: `user_id=eq.${userId}`,
    }, (payload: any) => {
      if (payload.new) {
        onQuestChange(payload.new as CloudQuest);
      }
    })
    .subscribe();
}

export function unsubscribeRealtime(): void {
  const sb = getSupabase();
  if (sb && _realtimeChannel) {
    sb.removeChannel(_realtimeChannel);
    _realtimeChannel = null;
  }
}

// ═══════════════════════════════════════════
// AUTO-SYNC — periodic queue processing
// ═══════════════════════════════════════════

let _autoSyncTimer: ReturnType<typeof setInterval> | null = null;

export function startAutoSync(intervalMs: number = 30000): void {
  stopAutoSync();
  _autoSyncTimer = setInterval(() => {
    if (_syncState.isOnline && !_syncState.isSyncing) {
      processQueue();
    }
  }, intervalMs);
}

export function stopAutoSync(): void {
  if (_autoSyncTimer) {
    clearInterval(_autoSyncTimer);
    _autoSyncTimer = null;
  }
}
