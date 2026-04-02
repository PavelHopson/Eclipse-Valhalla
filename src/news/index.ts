// Eclipse Valhalla — Nexus Feed Entry Point

export type { NewsSource, NewsItem, NewsDigest, NewsPreference, FeedFilters, SourceType, DigestFrequency } from './newsTypes';
export { DEFAULT_FILTERS, DEFAULT_NEWS_PREFERENCE, NEWS_CATEGORIES, DEFAULT_POLLING_INTERVAL } from './newsTypes';
export {
  initNexus, startNexusAutoRefresh, stopNexusAutoRefresh,
  getSources, addSource, updateSource, removeSource,
  getItems, fetchAllSources, fetchSource,
  markAsRead, saveItem, archiveItem,
  getPreferences, savePreferences,
  convertNewsToQuest, generateDigest,
} from './newsService';
export type { QuestFromNews } from './newsService';
export { rankItems, dedupeItems } from './newsRanking';
