/**
 * Eclipse Valhalla — Nexus Feed Types
 *
 * Domain model for the News Intelligence system.
 * Module name: Nexus
 */

// ═══════════════════════════════════════════
// SOURCE
// ═══════════════════════════════════════════

export type SourceType = 'rss' | 'telegram' | 'website';

export interface NewsSource {
  id: string;
  userId: string;
  name: string;
  type: SourceType;
  url: string;
  enabled: boolean;
  categories: string[];
  pollingIntervalMin: number;
  lastFetchedAt?: string;
  errorCount: number;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════
// NEWS ITEM
// ═══════════════════════════════════════════

export interface NewsItem {
  id: string;
  sourceId: string;
  userId: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  fetchedAt: string;
  tags: string[];
  category?: string;
  importanceScore: number;   // 0-100
  aiSummary?: string;
  aiTags?: string[];
  read: boolean;
  saved: boolean;
  archived: boolean;
  convertedToQuest: boolean;
  dedupeKey: string;        // normalized title hash
}

// ═══════════════════════════════════════════
// DIGEST
// ═══════════════════════════════════════════

export interface NewsDigest {
  id: string;
  userId: string;
  title: string;
  summary?: string;
  generatedAt: string;
  itemIds: string[];
}

// ═══════════════════════════════════════════
// PREFERENCES
// ═══════════════════════════════════════════

export type DigestFrequency = 'manual' | 'daily' | 'weekly';

export interface NewsPreference {
  userId: string;
  preferredTopics: string[];
  mutedTopics: string[];
  digestFrequency: DigestFrequency;
  minImportance: number;         // 0-100 threshold
  aiSummariesEnabled: boolean;
  autoConvertSuggestionsEnabled: boolean;
  updatedAt: string;
}

// ═══════════════════════════════════════════
// FEED FILTER STATE
// ═══════════════════════════════════════════

export interface FeedFilters {
  sourceId?: string;
  category?: string;
  unreadOnly: boolean;
  savedOnly: boolean;
  minImportance: number;
  searchQuery: string;
}

export const DEFAULT_FILTERS: FeedFilters = {
  unreadOnly: false,
  savedOnly: false,
  minImportance: 0,
  searchQuery: '',
};

// ═══════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════

export const DEFAULT_NEWS_PREFERENCE: Omit<NewsPreference, 'userId'> = {
  preferredTopics: ['technology', 'business', 'science'],
  mutedTopics: [],
  digestFrequency: 'daily',
  minImportance: 20,
  aiSummariesEnabled: false,
  autoConvertSuggestionsEnabled: false,
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_POLLING_INTERVAL = 30; // minutes

// ═══════════════════════════════════════════
// CATEGORY PRESETS
// ═══════════════════════════════════════════

export const NEWS_CATEGORIES = [
  'technology', 'business', 'science', 'finance',
  'world', 'health', 'sports', 'entertainment',
  'crypto', 'ai', 'programming', 'design',
] as const;
