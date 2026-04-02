/**
 * Eclipse Valhalla — News Ranking Engine
 *
 * Scores and ranks news items based on:
 * - Recency
 * - Source priority
 * - Topic match with user preferences
 * - Cross-source mention frequency
 * - Category importance
 */

import { NewsItem, NewsPreference, NewsSource } from './newsTypes';

// ═══════════════════════════════════════════
// RANKING WEIGHTS
// ═══════════════════════════════════════════

const WEIGHTS = {
  recency: 30,          // max 30 points for fresh items
  topicMatch: 25,       // max 25 points for preferred topics
  sourcePriority: 15,   // max 15 points based on source config
  crossMention: 15,     // max 15 points if mentioned across multiple sources
  categoryBoost: 10,    // max 10 points for preferred categories
  mutedPenalty: -50,    // penalty for muted topics
} as const;

// ═══════════════════════════════════════════
// MAIN RANKING
// ═══════════════════════════════════════════

/**
 * Rank a list of news items. Returns items sorted by importance score (desc).
 */
export function rankItems(
  items: NewsItem[],
  preferences: NewsPreference,
  sources: NewsSource[]
): NewsItem[] {
  const sourceMap = new Map(sources.map(s => [s.id, s]));
  const titleIndex = buildCrossMentionIndex(items);

  const scored = items.map(item => ({
    ...item,
    importanceScore: computeScore(item, preferences, sourceMap, titleIndex),
  }));

  return scored.sort((a, b) => b.importanceScore - a.importanceScore);
}

function computeScore(
  item: NewsItem,
  prefs: NewsPreference,
  sourceMap: Map<string, NewsSource>,
  crossIndex: Map<string, number>
): number {
  let score = 0;

  // 1. Recency (newer = higher, decay over 24h)
  const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / 3600000;
  score += Math.max(0, WEIGHTS.recency * (1 - ageHours / 24));

  // 2. Topic match
  const itemTopics = [...item.tags, item.category].filter(Boolean).map(t => t!.toLowerCase());
  const preferredMatch = prefs.preferredTopics.some(t => itemTopics.includes(t.toLowerCase()));
  if (preferredMatch) score += WEIGHTS.topicMatch;

  // 3. Muted topic penalty
  const mutedMatch = prefs.mutedTopics.some(t =>
    itemTopics.includes(t.toLowerCase()) ||
    item.title.toLowerCase().includes(t.toLowerCase())
  );
  if (mutedMatch) score += WEIGHTS.mutedPenalty;

  // 4. Source priority (based on categories count — more specific = higher)
  const source = sourceMap.get(item.sourceId);
  if (source) {
    const specificity = Math.min(source.categories.length, 3) / 3;
    score += WEIGHTS.sourcePriority * specificity;
  }

  // 5. Cross-source mentions
  const mentionCount = crossIndex.get(item.dedupeKey) || 1;
  if (mentionCount > 1) {
    score += Math.min(WEIGHTS.crossMention, mentionCount * 5);
  }

  // 6. Category boost
  if (item.category && prefs.preferredTopics.includes(item.category)) {
    score += WEIGHTS.categoryBoost;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

// ═══════════════════════════════════════════
// CROSS-MENTION DETECTION
// ═══════════════════════════════════════════

function buildCrossMentionIndex(items: NewsItem[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const item of items) {
    const key = item.dedupeKey;
    index.set(key, (index.get(key) || 0) + 1);
  }
  return index;
}

// ═══════════════════════════════════════════
// DEDUPLICATION
// ═══════════════════════════════════════════

/**
 * Remove duplicate items based on dedupeKey and URL.
 * Keeps the first (most recent fetch) occurrence.
 */
export function dedupeItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const seenUrls = new Set<string>();
  const result: NewsItem[] = [];

  for (const item of items) {
    if (seen.has(item.dedupeKey)) continue;
    if (item.url && seenUrls.has(item.url)) continue;

    seen.add(item.dedupeKey);
    if (item.url) seenUrls.add(item.url);
    result.push(item);
  }

  return result;
}
