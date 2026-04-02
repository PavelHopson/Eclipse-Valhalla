/**
 * Eclipse Valhalla — Migration Service
 *
 * Handles local → cloud data migration when user signs in.
 *
 * Strategy:
 *   1. Detect local data (legacy + new format)
 *   2. Export local state as domain entities
 *   3. On first cloud sign-in: upload local → cloud
 *   4. If cloud has data: merge with newest-wins strategy
 */

import { Quest, Note as NoteEntity, GamificationProfile } from '../backend/schema/entities';
import * as questMapper from '../backend/mappers/questMapper';
import * as noteMapper from '../backend/mappers/noteMapper';
import * as questRepo from '../backend/repositories/questRepository';
import * as gamificationRepo from '../backend/repositories/gamificationRepository';
import { isCloudAvailable } from '../backend/supabaseClient';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface LocalDataSummary {
  quests: number;
  notes: number;
  hasGamification: boolean;
  hasSettings: boolean;
  legacyUserId: string | null;
}

export type MergeStrategy = 'local_wins' | 'cloud_wins' | 'newest_wins';

export interface MigrationResult {
  questsPushed: number;
  questsMerged: number;
  success: boolean;
  errors: string[];
}

// ═══════════════════════════════════════════
// DETECT LOCAL DATA
// ═══════════════════════════════════════════

/**
 * Scan localStorage for existing Eclipse Valhalla / legacy VALHALLA data.
 */
export function detectLocalData(): LocalDataSummary {
  let quests = 0;
  let notes = 0;
  let legacyUserId: string | null = null;

  // Check for legacy session
  try {
    const session = localStorage.getItem('lumina_active_session');
    if (session) {
      const user = JSON.parse(session);
      legacyUserId = user.id || null;
    }
  } catch {}

  // Count legacy data by scanning keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('reminders_')) quests += countItems(key);
    if (key.startsWith('notes_')) notes += countItems(key);
    if (key.startsWith('quests_')) quests += countItems(key);
  }

  return {
    quests,
    notes,
    hasGamification: localStorage.getItem('eclipse_discipline') !== null,
    hasSettings: localStorage.getItem('eclipse_app_settings') !== null,
    legacyUserId,
  };
}

function countItems(key: string): number {
  try {
    const data = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(data) ? data.length : 0;
  } catch { return 0; }
}

// ═══════════════════════════════════════════
// EXPORT LOCAL STATE
// ═══════════════════════════════════════════

/**
 * Export all local data as domain entities.
 */
export function exportLocalState(userId: string): {
  quests: Quest[];
  notes: NoteEntity[];
  gamification: GamificationProfile | null;
} {
  const quests: Quest[] = [];
  const notes: NoteEntity[] = [];

  // Scan all localStorage keys for quest/reminder data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Legacy reminders_* format
    if (key.startsWith('reminders_')) {
      try {
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        for (const item of items) {
          quests.push(questMapper.fromLegacyReminder(item, userId));
        }
      } catch {}
    }

    // New quests_* format
    if (key.startsWith('quests_')) {
      try {
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        for (const item of items) {
          if (item.userId) quests.push(item as Quest);
          else quests.push(questMapper.fromLegacyReminder(item, userId));
        }
      } catch {}
    }

    // Legacy notes
    if (key.startsWith('notes_')) {
      try {
        const items = JSON.parse(localStorage.getItem(key) || '[]');
        for (const item of items) {
          notes.push(noteMapper.fromLegacyNote(item, userId));
        }
      } catch {}
    }
  }

  // Gamification
  const gamification = gamificationRepo.getLocal();

  // Deduplicate by id
  const questMap = new Map<string, Quest>();
  for (const q of quests) questMap.set(q.id, q);

  return {
    quests: Array.from(questMap.values()),
    notes,
    gamification: gamification ? { ...gamification, userId } : null,
  };
}

// ═══════════════════════════════════════════
// IMPORT LOCAL → CLOUD
// ═══════════════════════════════════════════

/**
 * Push local data to cloud. Used on first sign-in.
 */
export async function importLocalToCloud(
  userId: string,
  strategy: MergeStrategy = 'newest_wins'
): Promise<MigrationResult> {
  if (!isCloudAvailable()) {
    return { questsPushed: 0, questsMerged: 0, success: false, errors: ['Cloud not available'] };
  }

  const result: MigrationResult = {
    questsPushed: 0,
    questsMerged: 0,
    success: true,
    errors: [],
  };

  try {
    const local = exportLocalState(userId);

    // 1. Push quests
    if (local.quests.length > 0) {
      if (strategy === 'local_wins') {
        result.questsPushed = await questRepo.pushAllToCloud(userId, local.quests);
      } else {
        // Pull cloud first, then merge
        const cloudQuests = await questRepo.fetchCloud(userId);

        if (cloudQuests.length === 0) {
          // Cloud empty → just push
          result.questsPushed = await questRepo.pushAllToCloud(userId, local.quests);
        } else {
          // Merge
          const merged = mergeQuests(local.quests, cloudQuests, strategy);
          result.questsPushed = await questRepo.pushAllToCloud(userId, merged);
          result.questsMerged = merged.length;
          questRepo.saveLocal(userId, merged);
        }
      }
    }

    // 2. Push gamification
    if (local.gamification) {
      await gamificationRepo.upsertCloud({ ...local.gamification, userId });
    }

  } catch (e: any) {
    result.success = false;
    result.errors.push(e.message || 'Unknown error');
  }

  return result;
}

// ═══════════════════════════════════════════
// MERGE LOGIC
// ═══════════════════════════════════════════

function mergeQuests(local: Quest[], cloud: Quest[], strategy: MergeStrategy): Quest[] {
  const map = new Map<string, Quest>();

  // Start with cloud
  for (const q of cloud) map.set(q.id, q);

  // Overlay local
  for (const q of local) {
    const existing = map.get(q.id);
    if (!existing) {
      map.set(q.id, q);
    } else {
      if (strategy === 'local_wins') {
        map.set(q.id, q);
      } else if (strategy === 'cloud_wins') {
        // Keep cloud version (already in map)
      } else {
        // newest_wins
        if (new Date(q.updatedAt) > new Date(existing.updatedAt)) {
          map.set(q.id, q);
        }
      }
    }
  }

  return Array.from(map.values());
}

// ═══════════════════════════════════════════
// MIGRATION STATUS
// ═══════════════════════════════════════════

const MIGRATION_KEY = 'eclipse_migration_completed';

export function isMigrationCompleted(): boolean {
  return localStorage.getItem(MIGRATION_KEY) === 'true';
}

export function markMigrationCompleted(): void {
  localStorage.setItem(MIGRATION_KEY, 'true');
}
