/**
 * Eclipse Valhalla — Sync Service
 *
 * Architecture layer for local ↔ cloud data synchronization.
 * Currently uses localStorage. Ready for Supabase/Firebase backend.
 *
 * Pattern: Adapter-based storage with conflict resolution.
 */

// ═══════════════════════════════════════════
// STORAGE ADAPTER INTERFACE
// ═══════════════════════════════════════════

export interface StorageAdapter {
  name: string;
  available: boolean;

  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

// ═══════════════════════════════════════════
// LOCAL STORAGE ADAPTER
// ═══════════════════════════════════════════

export class LocalStorageAdapter implements StorageAdapter {
  name = 'localStorage';
  available = typeof localStorage !== 'undefined';

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`[LocalStorage] Write failed for ${key}:`, e);
    }
  }

  async delete(key: string): Promise<void> {
    localStorage.removeItem(key);
  }

  async keys(): Promise<string[]> {
    const result: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) result.push(key);
    }
    return result;
  }
}

// ═══════════════════════════════════════════
// CLOUD STORAGE ADAPTER (STUB)
// ═══════════════════════════════════════════

export class CloudStorageAdapter implements StorageAdapter {
  name = 'cloud';
  available = false; // Will be true once backend is configured

  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.available = !!baseUrl;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.available) return null;

    // TODO: Implement with Supabase/Firebase
    // const { data } = await supabase.from('user_data').select().eq('key', key).single();
    // return data?.value as T;

    console.log(`[Cloud] GET ${key} — stub`);
    return null;
  }

  async set<T>(key: string, data: T): Promise<void> {
    if (!this.available) return;

    // TODO: Implement
    // await supabase.from('user_data').upsert({ key, value: data, updated_at: new Date() });

    console.log(`[Cloud] SET ${key} — stub`);
  }

  async delete(key: string): Promise<void> {
    if (!this.available) return;

    // TODO: Implement
    console.log(`[Cloud] DELETE ${key} — stub`);
  }

  async keys(): Promise<string[]> {
    if (!this.available) return [];

    // TODO: Implement
    console.log(`[Cloud] KEYS — stub`);
    return [];
  }
}

// ═══════════════════════════════════════════
// CONFLICT RESOLUTION
// ═══════════════════════════════════════════

export type ConflictStrategy = 'local_wins' | 'cloud_wins' | 'newest_wins' | 'manual';

interface SyncMetadata {
  lastSyncedAt: number;
  checksum: string;
}

/**
 * Resolve conflict between local and cloud data.
 */
export function resolveConflict<T extends { updatedAt?: number }>(
  local: T,
  cloud: T,
  strategy: ConflictStrategy = 'newest_wins'
): T {
  switch (strategy) {
    case 'local_wins':
      return local;
    case 'cloud_wins':
      return cloud;
    case 'newest_wins':
      const localTime = (local as any).updatedAt || 0;
      const cloudTime = (cloud as any).updatedAt || 0;
      return localTime >= cloudTime ? local : cloud;
    case 'manual':
      // In manual mode, return local and flag for user review
      console.warn('[Sync] Manual conflict resolution required');
      return local;
    default:
      return local;
  }
}

// ═══════════════════════════════════════════
// SYNC SERVICE
// ═══════════════════════════════════════════

export class SyncService {
  private local: StorageAdapter;
  private cloud: StorageAdapter;
  private strategy: ConflictStrategy;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    local: StorageAdapter = new LocalStorageAdapter(),
    cloud: StorageAdapter = new CloudStorageAdapter(),
    strategy: ConflictStrategy = 'newest_wins'
  ) {
    this.local = local;
    this.cloud = cloud;
    this.strategy = strategy;
  }

  /**
   * Pull data from cloud → local.
   */
  async syncPull<T>(key: string): Promise<T | null> {
    if (!this.cloud.available) {
      // Cloud not available, read from local
      return this.local.get<T>(key);
    }

    try {
      const cloudData = await this.cloud.get<T>(key);
      const localData = await this.local.get<T>(key);

      if (cloudData && localData) {
        const resolved = resolveConflict(localData, cloudData, this.strategy);
        await this.local.set(key, resolved);
        return resolved;
      }

      if (cloudData) {
        await this.local.set(key, cloudData);
        return cloudData;
      }

      return localData;
    } catch (e) {
      console.error('[Sync] Pull failed:', e);
      return this.local.get<T>(key);
    }
  }

  /**
   * Push data from local → cloud.
   */
  async syncPush<T>(key: string, data: T): Promise<void> {
    // Always write to local first
    await this.local.set(key, data);

    if (!this.cloud.available) return;

    try {
      await this.cloud.set(key, data);
    } catch (e) {
      console.error('[Sync] Push failed, data saved locally:', e);
      // Queue for retry — TODO: implement retry queue
    }
  }

  /**
   * Full sync: pull all keys, resolve conflicts, push back.
   */
  async fullSync(): Promise<{ synced: number; conflicts: number }> {
    if (!this.cloud.available) {
      return { synced: 0, conflicts: 0 };
    }

    let synced = 0;
    let conflicts = 0;

    try {
      const localKeys = await this.local.keys();
      const cloudKeys = await this.cloud.keys();
      const allKeys = new Set([...localKeys, ...cloudKeys]);

      for (const key of allKeys) {
        const localData = await this.local.get(key);
        const cloudData = await this.cloud.get(key);

        if (localData && cloudData) {
          conflicts++;
          const resolved = resolveConflict(localData as any, cloudData as any, this.strategy);
          await this.local.set(key, resolved);
          await this.cloud.set(key, resolved);
        } else if (localData) {
          await this.cloud.set(key, localData);
        } else if (cloudData) {
          await this.local.set(key, cloudData);
        }

        synced++;
      }
    } catch (e) {
      console.error('[Sync] Full sync failed:', e);
    }

    return { synced, conflicts };
  }

  /**
   * Start periodic sync.
   */
  startAutoSync(intervalMs: number = 5 * 60 * 1000): void {
    this.stopAutoSync();
    this.syncInterval = setInterval(() => {
      this.fullSync().then(result => {
        if (result.synced > 0) {
          console.log(`[Sync] Auto-sync complete: ${result.synced} keys, ${result.conflicts} conflicts`);
        }
      });
    }, intervalMs);
  }

  /**
   * Stop periodic sync.
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Check if cloud is available.
   */
  isCloudAvailable(): boolean {
    return this.cloud.available;
  }
}

// ═══════════════════════════════════════════
// DEFAULT INSTANCE
// ═══════════════════════════════════════════

export const syncService = new SyncService();
