/**
 * Eclipse Valhalla — RSS Parser
 *
 * Fetches and parses RSS/Atom feeds into NewsItem format.
 * Uses a CORS proxy for client-side fetching.
 */

import { NewsItem } from '../newsTypes';

// ═══════════════════════════════════════════
// CORS PROXY OPTIONS
// ═══════════════════════════════════════════

const CORS_PROXIES = [
  (url: string) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

// ═══════════════════════════════════════════
// FETCH + PARSE
// ═══════════════════════════════════════════

export async function parseRSSFeed(
  feedUrl: string,
  sourceId: string,
  userId: string
): Promise<NewsItem[]> {
  // Try rss2json API first (returns structured JSON)
  try {
    const items = await fetchViaRss2Json(feedUrl, sourceId, userId);
    if (items.length > 0) return items;
  } catch (e) {
    console.warn('[RSS] rss2json failed, trying raw XML:', e);
  }

  // Fallback: fetch raw XML via proxy
  try {
    const items = await fetchViaXMLProxy(feedUrl, sourceId, userId);
    return items;
  } catch (e) {
    console.error('[RSS] All parsers failed for:', feedUrl, e);
    return [];
  }
}

// ═══════════════════════════════════════════
// RSS2JSON API
// ═══════════════════════════════════════════

async function fetchViaRss2Json(
  feedUrl: string,
  sourceId: string,
  userId: string
): Promise<NewsItem[]> {
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=30`;
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`rss2json HTTP ${response.status}`);

  const data = await response.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) {
    throw new Error('rss2json returned invalid data');
  }

  return data.items.map((item: any): NewsItem => ({
    id: generateItemId(item.link || item.guid || item.title),
    sourceId,
    userId,
    title: cleanText(item.title || ''),
    summary: cleanText(stripHTML(item.description || '').slice(0, 300)),
    content: item.content || item.description || '',
    url: item.link || '',
    imageUrl: item.thumbnail || item.enclosure?.link || extractImageFromContent(item.content),
    publishedAt: item.pubDate || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    tags: extractTags(item.categories || []),
    category: undefined,
    importanceScore: 50, // Default; ranking adjusts later
    read: false,
    saved: false,
    archived: false,
    convertedToQuest: false,
    dedupeKey: normalizeForDedupe(item.title || ''),
  }));
}

// ═══════════════════════════════════════════
// RAW XML PARSER (fallback)
// ═══════════════════════════════════════════

async function fetchViaXMLProxy(
  feedUrl: string,
  sourceId: string,
  userId: string
): Promise<NewsItem[]> {
  const proxyUrl = CORS_PROXIES[1](feedUrl);
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`Proxy HTTP ${response.status}`);

  const text = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');

  // Try RSS 2.0 format
  let items = doc.querySelectorAll('item');
  if (items.length === 0) {
    // Try Atom format
    items = doc.querySelectorAll('entry');
  }

  const results: NewsItem[] = [];

  items.forEach((item) => {
    const title = getTagText(item, 'title');
    const link = getTagText(item, 'link') || item.querySelector('link')?.getAttribute('href') || '';
    const description = getTagText(item, 'description') || getTagText(item, 'summary') || getTagText(item, 'content');
    const pubDate = getTagText(item, 'pubDate') || getTagText(item, 'published') || getTagText(item, 'updated');

    if (!title) return;

    results.push({
      id: generateItemId(link || title),
      sourceId,
      userId,
      title: cleanText(title),
      summary: cleanText(stripHTML(description || '').slice(0, 300)),
      content: description || '',
      url: link,
      imageUrl: extractImageFromContent(description || ''),
      publishedAt: pubDate || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      tags: [],
      importanceScore: 50,
      read: false,
      saved: false,
      archived: false,
      convertedToQuest: false,
      dedupeKey: normalizeForDedupe(title),
    });
  });

  return results;
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

function getTagText(parent: Element, tagName: string): string {
  const el = parent.querySelector(tagName);
  return el?.textContent?.trim() || '';
}

function stripHTML(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  } catch {
    // Fallback: regex strip (safe, no DOM execution)
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
  }
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function extractImageFromContent(html: string): string | undefined {
  if (!html) return undefined;
  const match = html.match(/<img[^>]+src="([^"]+)"/i);
  return match?.[1] || undefined;
}

function extractTags(categories: any[]): string[] {
  if (!Array.isArray(categories)) return [];
  return categories
    .map(c => typeof c === 'string' ? c.toLowerCase().trim() : '')
    .filter(Boolean)
    .slice(0, 5);
}

function generateItemId(input: string): string {
  // Simple hash
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const chr = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return `nxi_${Math.abs(hash).toString(36)}_${Date.now().toString(36).slice(-4)}`;
}

export function normalizeForDedupe(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u0400-\u04ff]/g, '').slice(0, 80);
}
