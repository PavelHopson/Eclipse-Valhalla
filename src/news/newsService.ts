/**
 * Eclipse Valhalla — Nexus News Service (Frontend Layer)
 *
 * Frontend API for the Nexus intelligence feed.
 *
 * Architecture:
 *   Backend ingestion pipeline → localStorage/Supabase → this service → UI
 *
 * This service:
 *   ✅ Reads feed data from storage
 *   ✅ Manages sources (CRUD)
 *   ✅ Triggers ingestion via backend service
 *   ✅ Handles UI actions (read, save, archive, convert)
 *   ❌ Does NOT parse RSS/HTML directly (delegated to ingestion pipeline)
 */

import { NewsSource, NewsItem, NewsPreference, NewsDigest, DEFAULT_NEWS_PREFERENCE, DEFAULT_POLLING_INTERVAL, SourceType } from './newsTypes';
import { initIngestion, runAllSources as runBackendIngestion, runSource as runBackendSource, startAutoIngestion, stopAutoIngestion } from '../backend/ingestion';
import { createIngestionStorageAdapter, getLocalSources, saveLocalSources, getLocalItems, saveLocalItems, getLocalPreferences, saveLocalPreferences } from '../backend/repositories/newsRepository';

// ═══════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════

let _initialized = false;

/**
 * Initialize the Nexus feed system for a user.
 * Connects frontend to backend ingestion pipeline.
 */
export function initNexus(userId: string): void {
  if (_initialized) return;
  const adapter = createIngestionStorageAdapter();
  initIngestion(adapter, userId);
  _initialized = true;
  console.info('[Nexus] Initialized for user:', userId);
}

/**
 * Start automatic background ingestion.
 */
export function startNexusAutoRefresh(intervalMs?: number): void {
  startAutoIngestion(intervalMs);
}

/**
 * Stop automatic ingestion.
 */
export function stopNexusAutoRefresh(): void {
  stopAutoIngestion();
}

// ═══════════════════════════════════════════
// SOURCE MANAGEMENT
// ═══════════════════════════════════════════

export function getSources(userId: string): NewsSource[] {
  return getLocalSources(userId);
}

export function addSource(userId: string, opts: {
  name: string;
  type: SourceType;
  url: string;
  categories?: string[];
}): NewsSource {
  const sources = getLocalSources(userId);
  const source: NewsSource = {
    id: `src_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    name: opts.name,
    type: opts.type,
    url: opts.url.trim(),
    enabled: true,
    categories: opts.categories || [],
    pollingIntervalMin: DEFAULT_POLLING_INTERVAL,
    errorCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sources.push(source);
  saveLocalSources(userId, sources);
  return source;
}

export function updateSource(userId: string, sourceId: string, updates: Partial<NewsSource>): void {
  const sources = getLocalSources(userId).map(s =>
    s.id === sourceId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
  );
  saveLocalSources(userId, sources);
}

export function removeSource(userId: string, sourceId: string): void {
  const sources = getLocalSources(userId).filter(s => s.id !== sourceId);
  saveLocalSources(userId, sources);
  const items = getLocalItems(userId).filter(i => i.sourceId !== sourceId);
  saveLocalItems(userId, items);
}

// ═══════════════════════════════════════════
// FEED ACCESS
// ═══════════════════════════════════════════

export function getItems(userId: string): NewsItem[] {
  return getLocalItems(userId);
}

/**
 * Trigger a full refresh via the backend ingestion pipeline.
 * Returns all items after ingestion.
 */
export async function fetchAllSources(userId: string): Promise<NewsItem[]> {
  initNexus(userId);
  await runBackendIngestion();
  return getLocalItems(userId);
}

/**
 * Trigger ingestion for a single source.
 */
export async function fetchSource(userId: string, sourceId: string): Promise<NewsItem[]> {
  initNexus(userId);
  await runBackendSource(sourceId);
  return getLocalItems(userId);
}

// ═══════════════════════════════════════════
// ITEM ACTIONS
// ═══════════════════════════════════════════

export function markAsRead(userId: string, itemId: string): void {
  const items = getLocalItems(userId).map(i =>
    i.id === itemId ? { ...i, read: true } : i
  );
  saveLocalItems(userId, items);
}

export function saveItem(userId: string, itemId: string): void {
  const items = getLocalItems(userId).map(i =>
    i.id === itemId ? { ...i, saved: true } : i
  );
  saveLocalItems(userId, items);
}

export function archiveItem(userId: string, itemId: string): void {
  const items = getLocalItems(userId).map(i =>
    i.id === itemId ? { ...i, archived: true } : i
  );
  saveLocalItems(userId, items);
}

// ═══════════════════════════════════════════
// PREFERENCES
// ═══════════════════════════════════════════

export function getPreferences(userId: string): NewsPreference {
  return getLocalPreferences(userId);
}

export function savePreferences(userId: string, prefs: NewsPreference): void {
  saveLocalPreferences(userId, prefs);
}

// ═══════════════════════════════════════════
// NEWS → QUEST CONVERSION
// ═══════════════════════════════════════════

export interface QuestFromNews {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  dueAt: string;
}

export function convertNewsToQuest(item: NewsItem, userId: string): QuestFromNews {
  const priority = item.importanceScore >= 70 ? 'high'
    : item.importanceScore >= 40 ? 'medium'
    : 'low';

  const items = getLocalItems(userId).map(i =>
    i.id === item.id ? { ...i, convertedToQuest: true } : i
  );
  saveLocalItems(userId, items);

  const due = new Date();
  due.setDate(due.getDate() + 1);
  due.setHours(18, 0, 0, 0);

  return {
    title: `Review: ${item.title.slice(0, 80)}`,
    description: `Source: ${item.url}\n\n${item.aiSummary || item.summary || item.title}`,
    priority,
    category: 'education',
    dueAt: due.toISOString(),
  };
}

// ═══════════════════════════════════════════
// DIGEST
// ═══════════════════════════════════════════

export function generateDigest(userId: string): NewsDigest {
  const items = getLocalItems(userId)
    .filter(i => !i.archived && !i.read)
    .slice(0, 10);

  return {
    id: `digest_${Date.now().toString(36)}`,
    userId,
    title: `Intel Digest — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
    summary: items.length > 0
      ? `${items.length} unread signals. Top: "${items[0]?.title}"`
      : 'No new intelligence.',
    generatedAt: new Date().toISOString(),
    itemIds: items.map(i => i.id),
  };
}
