/**
 * Eclipse Valhalla — Sync Queue
 *
 * Offline-first change queue.
 * Writes go to localStorage immediately, then queue for Supabase push.
 * Queue processes when online. Retries on failure.
 */

import { SyncQueueItem, SyncTable, SyncOperation } from './types';

const QUEUE_KEY = 'eclipse_sync_queue';
const MAX_RETRIES = 3;

// ═══════════════════════════════════════════
// QUEUE OPERATIONS
// ═══════════════════════════════════════════

export function getQueue(): SyncQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch { return []; }
}

function saveQueue(queue: SyncQueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Enqueue a change for cloud sync.
 * Deduplicates: if same table+id already pending, replace it.
 */
export function enqueue(table: SyncTable, operation: SyncOperation, data: Record<string, any>, userId: string): void {
  const queue = getQueue();
  const itemId = data.id || `${table}_${userId}`;

  // Remove existing entry for same item (latest wins)
  const filtered = queue.filter(q => !(q.table === table && q.data.id === itemId));

  filtered.push({
    id: `sq_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
    table,
    operation,
    data: { ...data, id: itemId },
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
    userId,
  });

  // Keep max 200 items
  saveQueue(filtered.slice(-200));
}

/**
 * Mark item as syncing.
 */
export function markSyncing(queueId: string): void {
  const queue = getQueue().map(q =>
    q.id === queueId ? { ...q, status: 'syncing' as const } : q
  );
  saveQueue(queue);
}

/**
 * Mark item as synced (remove from queue).
 */
export function markSynced(queueId: string): void {
  const queue = getQueue().filter(q => q.id !== queueId);
  saveQueue(queue);
}

/**
 * Mark item as failed. Increment retry count.
 */
export function markFailed(queueId: string): void {
  const queue = getQueue().map(q => {
    if (q.id !== queueId) return q;
    const retryCount = q.retryCount + 1;
    if (retryCount >= MAX_RETRIES) {
      return { ...q, status: 'failed' as const, retryCount };
    }
    return { ...q, status: 'pending' as const, retryCount };
  });
  saveQueue(queue);
}

/**
 * Get pending items ready for sync.
 */
export function getPending(): SyncQueueItem[] {
  return getQueue().filter(q => q.status === 'pending');
}

/**
 * Get count of pending items.
 */
export function getPendingCount(): number {
  return getPending().length;
}

/**
 * Clear failed items (user-triggered).
 */
export function clearFailed(): void {
  const queue = getQueue().filter(q => q.status !== 'failed');
  saveQueue(queue);
}
