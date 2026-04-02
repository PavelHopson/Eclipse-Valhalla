/**
 * Eclipse Valhalla — Ingestion Service
 *
 * Main orchestrator for the intelligence pipeline.
 *
 * Flow:
 *   Source → FetchJob → Pipeline(clean→normalize→content→enrich→dedupe→rank) → Store
 *
 * Manages: source cycling, pipeline execution, error handling, stats.
 */

import { NewsSource, NewsItem, NewsPreference, DEFAULT_NEWS_PREFERENCE } from '../../news/newsTypes';
import { fetchFromSource } from './jobs/fetchJob';
import { runPipeline, createStandardPipeline, PipelineContext, PipelineStats } from './pipeline';
import { isAIAvailable } from './jobs/enrichJob';
import { startScheduler, stopScheduler, isSchedulerRunning } from './scheduler';

// ═══════════════════════════════════════════
// STORAGE INTERFACE
// ═══════════════════════════════════════════

// Pluggable storage — can be localStorage or Supabase repository
export interface IngestionStorage {
  getSources(userId: string): NewsSource[];
  getItems(userId: string): NewsItem[];
  saveItems(userId: string, items: NewsItem[]): void;
  updateSource(userId: string, sourceId: string, updates: Partial<NewsSource>): void;
  getPreferences(userId: string): NewsPreference;
}

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════

let _storage: IngestionStorage | null = null;
let _userId: string | null = null;
let _lastStats: Map<string, PipelineStats> = new Map();

// ═══════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════

/**
 * Initialize the ingestion service with a storage adapter.
 */
export function initIngestion(storage: IngestionStorage, userId: string): void {
  _storage = storage;
  _userId = userId;
  console.info('[Ingestion] Initialized for user:', userId);
}

/**
 * Start automatic ingestion.
 */
export function startAutoIngestion(intervalMs?: number): void {
  if (!_storage || !_userId) {
    console.warn('[Ingestion] Not initialized. Call initIngestion first.');
    return;
  }

  const storage = _storage;
  const userId = _userId;

  startScheduler(
    () => storage.getSources(userId),
    async (source) => { await runSource(source.id); },
    { defaultIntervalMs: intervalMs || 10 * 60 * 1000 }
  );
}

/**
 * Stop automatic ingestion.
 */
export function stopAutoIngestion(): void {
  stopScheduler();
}

// ═══════════════════════════════════════════
// SINGLE SOURCE INGESTION
// ═══════════════════════════════════════════

/**
 * Run ingestion for a single source.
 */
export async function runSource(sourceId: string): Promise<PipelineStats | null> {
  if (!_storage || !_userId) return null;

  const sources = _storage.getSources(_userId);
  const source = sources.find(s => s.id === sourceId);
  if (!source) {
    console.warn('[Ingestion] Source not found:', sourceId);
    return null;
  }

  console.info(`[Ingestion] Processing: ${source.name} (${source.type})`);

  try {
    // 1. FETCH
    const rawItems = await fetchFromSource(source, _userId);
    if (rawItems.length === 0) {
      _storage.updateSource(_userId, sourceId, {
        lastFetchedAt: new Date().toISOString(),
      });
      return { fetched: 0, parsed: 0, cleaned: 0, enriched: 0, deduped: 0, stored: 0, errors: [], durationMs: 0 };
    }

    // 2. Build pipeline context
    const existingItems = _storage.getItems(_userId);
    const existingKeys = new Set(existingItems.map(i => i.dedupeKey));
    const preferences = _storage.getPreferences(_userId);

    const ctx: PipelineContext = {
      source,
      userId: _userId,
      preferences,
      existingDedupeKeys: existingKeys,
      aiAvailable: isAIAvailable(),
    };

    // 3. RUN PIPELINE
    const pipeline = createStandardPipeline({
      skipEnrich: !ctx.aiAvailable,
    });

    const result = await runPipeline(pipeline, rawItems, ctx);

    // 4. STORE — merge with existing items
    const merged = mergeItems(existingItems, result.items);
    _storage.saveItems(_userId, merged);

    // 5. Update source metadata
    _storage.updateSource(_userId, sourceId, {
      lastFetchedAt: new Date().toISOString(),
      errorCount: 0,
    });

    // Track stats
    _lastStats.set(sourceId, result.stats);
    console.info(`[Ingestion] ${source.name}: ${result.stats.stored} items stored (${result.stats.durationMs}ms)`);

    return result.stats;

  } catch (e: any) {
    console.error(`[Ingestion] ${source.name} failed:`, e.message);
    _storage.updateSource(_userId, sourceId, {
      errorCount: (source.errorCount || 0) + 1,
    });
    return null;
  }
}

// ═══════════════════════════════════════════
// FULL CYCLE
// ═══════════════════════════════════════════

/**
 * Run ingestion for all enabled sources.
 */
export async function runAllSources(): Promise<{ sourceStats: Map<string, PipelineStats>; totalItems: number }> {
  if (!_storage || !_userId) return { sourceStats: new Map(), totalItems: 0 };

  const sources = _storage.getSources(_userId).filter(s => s.enabled);
  const sourceStats = new Map<string, PipelineStats>();

  // Process sources sequentially to avoid overwhelming APIs
  for (const source of sources) {
    const stats = await runSource(source.id);
    if (stats) sourceStats.set(source.id, stats);
  }

  const totalItems = _storage.getItems(_userId).length;
  return { sourceStats, totalItems };
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function mergeItems(existing: NewsItem[], newItems: NewsItem[]): NewsItem[] {
  const map = new Map<string, NewsItem>();

  // Existing items first
  for (const item of existing) {
    map.set(item.id, item);
  }

  // New items: add or update if newer
  for (const item of newItems) {
    const ex = map.get(item.id);
    if (!ex) {
      // Also check by dedupeKey
      let isDupe = false;
      for (const [_, v] of map) {
        if (v.dedupeKey === item.dedupeKey) { isDupe = true; break; }
      }
      if (!isDupe) map.set(item.id, item);
    }
  }

  // Sort by importance desc, keep max 500
  return Array.from(map.values())
    .sort((a, b) => b.importanceScore - a.importanceScore)
    .slice(0, 500);
}

// ═══════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════

export function getIngestionStatus() {
  return {
    initialized: _storage !== null,
    userId: _userId,
    schedulerRunning: isSchedulerRunning(),
    lastStats: Object.fromEntries(_lastStats),
  };
}

export function getSourceStats(sourceId: string): PipelineStats | undefined {
  return _lastStats.get(sourceId);
}
