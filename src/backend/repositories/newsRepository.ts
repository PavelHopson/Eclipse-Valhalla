/**
 * Eclipse Valhalla — News Repository
 *
 * Dual-layer persistence for Nexus news items and sources.
 * localStorage (local/offline) + Supabase (cloud).
 */

import { getSupabase, isCloudAvailable } from '../supabaseClient';
import { NewsItem, NewsSource, NewsPreference, DEFAULT_NEWS_PREFERENCE } from '../../news/newsTypes';

// ═══════════════════════════════════════════
// LOCAL STORAGE KEYS
// ═══════════════════════════════════════════

const SOURCES_KEY = (uid: string) => `nexus_sources_${uid}`;
const ITEMS_KEY = (uid: string) => `nexus_items_${uid}`;
const PREFS_KEY = (uid: string) => `nexus_prefs_${uid}`;

// ═══════════════════════════════════════════
// SOURCES — LOCAL
// ═══════════════════════════════════════════

export function getLocalSources(userId: string): NewsSource[] {
  try { return JSON.parse(localStorage.getItem(SOURCES_KEY(userId)) || '[]'); }
  catch { return []; }
}

export function saveLocalSources(userId: string, sources: NewsSource[]): void {
  localStorage.setItem(SOURCES_KEY(userId), JSON.stringify(sources));
}

// ═══════════════════════════════════════════
// SOURCES — CLOUD
// ═══════════════════════════════════════════

export async function fetchCloudSources(userId: string): Promise<NewsSource[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('news_sources')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return (data as any[]).map(row => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    url: row.url,
    enabled: row.enabled,
    categories: row.categories || [],
    pollingIntervalMin: row.polling_interval_min,
    lastFetchedAt: row.last_fetched_at,
    errorCount: row.error_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function upsertCloudSource(source: NewsSource): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('news_sources').upsert({
    id: source.id,
    user_id: source.userId,
    name: source.name,
    type: source.type,
    url: source.url,
    enabled: source.enabled,
    categories: source.categories,
    polling_interval_min: source.pollingIntervalMin,
    last_fetched_at: source.lastFetchedAt,
    error_count: source.errorCount,
  }, { onConflict: 'id' });

  return !error;
}

// ═══════════════════════════════════════════
// ITEMS — LOCAL
// ═══════════════════════════════════════════

export function getLocalItems(userId: string): NewsItem[] {
  try { return JSON.parse(localStorage.getItem(ITEMS_KEY(userId)) || '[]'); }
  catch { return []; }
}

export function saveLocalItems(userId: string, items: NewsItem[]): void {
  localStorage.setItem(ITEMS_KEY(userId), JSON.stringify(items.slice(0, 500)));
}

// ═══════════════════════════════════════════
// ITEMS — CLOUD
// ═══════════════════════════════════════════

export async function upsertCloudItems(items: NewsItem[]): Promise<number> {
  const sb = getSupabase();
  if (!sb || items.length === 0) return 0;

  let pushed = 0;
  // Batch upsert in chunks of 50
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50).map(item => ({
      id: item.id,
      source_id: item.sourceId,
      user_id: item.userId,
      title: item.title,
      summary: item.summary,
      content: item.content.slice(0, 10000), // Limit content size
      url: item.url,
      image_url: item.imageUrl,
      published_at: item.publishedAt,
      fetched_at: item.fetchedAt,
      tags: item.tags,
      category: item.category,
      importance_score: item.importanceScore,
      ai_summary: item.aiSummary,
      ai_tags: item.aiTags,
      read: item.read,
      saved: item.saved,
      archived: item.archived,
      converted_to_quest: item.convertedToQuest,
      dedupe_key: item.dedupeKey,
    }));

    const { error } = await sb.from('news_items').upsert(batch, { onConflict: 'id' });
    if (!error) pushed += batch.length;
  }

  return pushed;
}

export async function fetchCloudFeed(userId: string, opts?: {
  limit?: number;
  unreadOnly?: boolean;
  savedOnly?: boolean;
}): Promise<NewsItem[]> {
  const sb = getSupabase();
  if (!sb) return [];

  let query = sb
    .from('news_items')
    .select('*')
    .eq('user_id', userId)
    .eq('archived', false)
    .order('importance_score', { ascending: false })
    .limit(opts?.limit || 100);

  if (opts?.unreadOnly) query = query.eq('read', false);
  if (opts?.savedOnly) query = query.eq('saved', true);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as any[]).map(row => ({
    id: row.id,
    sourceId: row.source_id,
    userId: row.user_id,
    title: row.title,
    summary: row.summary,
    content: row.content,
    url: row.url,
    imageUrl: row.image_url,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
    tags: row.tags || [],
    category: row.category,
    importanceScore: row.importance_score,
    aiSummary: row.ai_summary,
    aiTags: row.ai_tags,
    read: row.read,
    saved: row.saved,
    archived: row.archived,
    convertedToQuest: row.converted_to_quest,
    dedupeKey: row.dedupe_key,
  }));
}

export async function markReadCloud(userId: string, itemId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('news_items').update({ read: true }).eq('id', itemId).eq('user_id', userId);
}

export async function markSavedCloud(userId: string, itemId: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('news_items').update({ saved: true }).eq('id', itemId).eq('user_id', userId);
}

// ═══════════════════════════════════════════
// PREFERENCES
// ═══════════════════════════════════════════

export function getLocalPreferences(userId: string): NewsPreference {
  try {
    const raw = localStorage.getItem(PREFS_KEY(userId));
    return raw ? JSON.parse(raw) : { ...DEFAULT_NEWS_PREFERENCE, userId };
  } catch { return { ...DEFAULT_NEWS_PREFERENCE, userId }; }
}

export function saveLocalPreferences(userId: string, prefs: NewsPreference): void {
  localStorage.setItem(PREFS_KEY(userId), JSON.stringify(prefs));
}

// ═══════════════════════════════════════════
// INGESTION STORAGE ADAPTER
// ═══════════════════════════════════════════

/**
 * Creates an IngestionStorage adapter for the ingestion service.
 * Uses local storage as cache, syncs to cloud when available.
 */
export function createIngestionStorageAdapter() {
  return {
    getSources: (userId: string) => getLocalSources(userId),
    getItems: (userId: string) => getLocalItems(userId),
    saveItems: (userId: string, items: NewsItem[]) => {
      saveLocalItems(userId, items);
      // Async cloud sync (fire-and-forget)
      if (isCloudAvailable()) {
        upsertCloudItems(items).catch(() => {});
      }
    },
    updateSource: (userId: string, sourceId: string, updates: Partial<NewsSource>) => {
      const sources = getLocalSources(userId).map(s =>
        s.id === sourceId ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      );
      saveLocalSources(userId, sources);
    },
    getPreferences: (userId: string) => getLocalPreferences(userId),
  };
}
