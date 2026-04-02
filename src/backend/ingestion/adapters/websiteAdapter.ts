/**
 * Eclipse Valhalla — Website Adapter
 *
 * Attempts to extract news from generic websites.
 *
 * Strategy:
 * 1. Try common RSS feed paths (/feed, /rss, /atom.xml)
 * 2. Try to detect RSS link in HTML <head>
 * 3. Fallback: basic metadata extraction (title, description)
 *
 * NOTE: Full website scraping requires a backend service.
 * This adapter handles what's possible from the client.
 */

import { NewsSource, NewsItem } from '../../../news/newsTypes';
import { fetchRSS } from './rssAdapter';

const COMMON_FEED_PATHS = [
  '/feed',
  '/rss',
  '/rss.xml',
  '/atom.xml',
  '/feed.xml',
  '/feeds/posts/default',
  '/index.xml',
  '/?feed=rss2',
];

export async function fetchWebsite(source: NewsSource, userId: string): Promise<NewsItem[]> {
  const baseUrl = normalizeBaseUrl(source.url);

  // 1. Try common RSS paths
  for (const path of COMMON_FEED_PATHS) {
    try {
      const feedUrl = baseUrl + path;
      const feedSource: NewsSource = { ...source, url: feedUrl, type: 'rss' };
      const items = await fetchRSS(feedSource, userId);
      if (items.length > 0) {
        console.info(`[Website] Found feed at ${feedUrl}`);
        return items.map(i => ({ ...i, sourceId: source.id }));
      }
    } catch {
      continue;
    }
  }

  // 2. Try detecting RSS link from HTML
  try {
    const rssUrl = await detectRSSFromHTML(source.url);
    if (rssUrl) {
      const feedSource: NewsSource = { ...source, url: rssUrl, type: 'rss' };
      const items = await fetchRSS(feedSource, userId);
      if (items.length > 0) {
        return items.map(i => ({ ...i, sourceId: source.id }));
      }
    }
  } catch {}

  // 3. Fallback: try treating the URL directly as RSS
  try {
    const items = await fetchRSS(source, userId);
    if (items.length > 0) return items;
  } catch {}

  console.info(`[Website] No feed detected for ${source.url}. Backend scraping required.`);
  return [];
}

async function detectRSSFromHTML(url: string): Promise<string | null> {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) return null;

    const html = await res.text();
    // Look for <link rel="alternate" type="application/rss+xml" href="..." />
    const rssMatch = html.match(/<link[^>]+type=["']application\/(?:rss|atom)\+xml["'][^>]+href=["']([^"']+)["']/i);
    if (rssMatch?.[1]) {
      let feedUrl = rssMatch[1];
      // Handle relative URLs
      if (feedUrl.startsWith('/')) {
        const base = new URL(url);
        feedUrl = `${base.origin}${feedUrl}`;
      }
      return feedUrl;
    }
  } catch {}
  return null;
}

function normalizeBaseUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.origin}`;
  } catch {
    return url.replace(/\/+$/, '');
  }
}
