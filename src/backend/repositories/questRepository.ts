/**
 * Eclipse Valhalla — Quest Repository
 *
 * Dual-layer: localStorage (cache/offline) + Supabase (cloud source of truth).
 * Signed-out → local only. Signed-in → local cache + cloud sync.
 */

import { getSupabase, isCloudAvailable } from '../supabaseClient';
import { Quest } from '../schema/entities';
import * as mapper from '../mappers/questMapper';

const LOCAL_KEY = (userId: string) => `quests_${userId}`;

// ═══════════════════════════════════════════
// LOCAL OPERATIONS
// ═══════════════════════════════════════════

export function getLocal(userId: string): Quest[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(userId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveLocal(userId: string, quests: Quest[]): void {
  try {
    localStorage.setItem(LOCAL_KEY(userId), JSON.stringify(quests));
  } catch (e) {
    console.error('[QuestRepo] Local save failed:', e);
  }
}

// ═══════════════════════════════════════════
// CLOUD OPERATIONS
// ═══════════════════════════════════════════

export async function fetchCloud(userId: string): Promise<Quest[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .is('archived_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[QuestRepo] Cloud fetch failed:', error.message);
    return [];
  }

  return (data || []).map((row: any) => mapper.fromRow(row));
}

export async function upsertCloud(quest: Quest): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('quests')
    .upsert(mapper.toInsert(quest), { onConflict: 'id' });

  if (error) {
    console.error('[QuestRepo] Cloud upsert failed:', error.message);
    return false;
  }
  return true;
}

export async function deleteCloud(questId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('quests')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', questId);

  if (error) {
    console.error('[QuestRepo] Cloud delete failed:', error.message);
    return false;
  }
  return true;
}

export async function pushAllToCloud(userId: string, quests: Quest[]): Promise<number> {
  const sb = getSupabase();
  if (!sb) return 0;

  let pushed = 0;
  for (const quest of quests) {
    const ok = await upsertCloud({ ...quest, userId });
    if (ok) pushed++;
  }
  return pushed;
}

// ═══════════════════════════════════════════
// SYNC OPERATIONS
// ═══════════════════════════════════════════

/**
 * Pull from cloud → merge with local → save local.
 * Strategy: newest wins per entity.
 */
export async function syncPull(userId: string): Promise<Quest[]> {
  const local = getLocal(userId);
  if (!isCloudAvailable()) return local;

  const cloud = await fetchCloud(userId);
  if (cloud.length === 0) return local;

  // Merge: build map, newest wins
  const merged = new Map<string, Quest>();

  for (const q of local) merged.set(q.id, q);

  for (const q of cloud) {
    const existing = merged.get(q.id);
    if (!existing || new Date(q.updatedAt) > new Date(existing.updatedAt)) {
      merged.set(q.id, q);
    }
  }

  const result = Array.from(merged.values());
  saveLocal(userId, result);
  return result;
}

/**
 * Push local → cloud.
 */
export async function syncPush(userId: string): Promise<number> {
  const local = getLocal(userId);
  return pushAllToCloud(userId, local);
}
