/**
 * Eclipse Valhalla — Fetch Job
 *
 * Fetches raw content from a source via the appropriate adapter.
 * Returns raw parsed NewsItem[] (pre-pipeline).
 */

import { NewsSource, NewsItem } from '../../../news/newsTypes';
import { fetchRSS } from '../adapters/rssAdapter';
import { fetchTelegram } from '../adapters/telegramAdapter';
import { fetchWebsite } from '../adapters/websiteAdapter';

/**
 * Fetch items from a source using the correct adapter.
 */
export async function fetchFromSource(source: NewsSource, userId: string): Promise<NewsItem[]> {
  const timeout = 15000; // 15s timeout per source

  try {
    const fetchPromise = (() => {
      switch (source.type) {
        case 'rss':      return fetchRSS(source, userId);
        case 'telegram':  return fetchTelegram(source, userId);
        case 'website':   return fetchWebsite(source, userId);
        default:          return Promise.resolve([]);
      }
    })();

    // Race against timeout
    const items = await Promise.race([
      fetchPromise,
      new Promise<NewsItem[]>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout fetching ${source.name}`)), timeout)
      ),
    ]);

    console.info(`[Fetch] ${source.name}: ${items.length} items`);
    return items;

  } catch (e: any) {
    console.error(`[Fetch] ${source.name} failed:`, e.message || e);
    return [];
  }
}
