/**
 * Eclipse Valhalla — RSS Adapter (Backend)
 *
 * Full RSS/Atom ingestion adapter.
 * Dual strategy: rss2json API → raw XML fallback.
 */

import { NewsSource, NewsItem } from '../../../news/newsTypes';

const RSS2JSON_API = 'https://api.rss2json.com/v1/api.json';
const CORS_PROXY = 'https://api.allorigins.win/raw';

export async function fetchRSS(source: NewsSource, userId: string): Promise<NewsItem[]> {
  // Strategy 1: rss2json (structured JSON)
  try {
    const items = await fetchViaRss2Json(source, userId);
    if (items.length > 0) return items;
  } catch {}

  // Strategy 2: raw XML via CORS proxy
  try {
    return await fetchViaXmlProxy(source, userId);
  } catch {}

  return [];
}

async function fetchViaRss2Json(source: NewsSource, userId: string): Promise<NewsItem[]> {
  const url = `${RSS2JSON_API}?rss_url=${encodeURIComponent(source.url)}&count=30`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const data = await res.json();
  if (data.status !== 'ok' || !Array.isArray(data.items)) throw new Error('Invalid response');

  return data.items.map((item: any): NewsItem => ({
    id: hashId(item.link || item.guid || item.title),
    sourceId: source.id,
    userId,
    title: item.title || '',
    summary: stripHtml(item.description || '').slice(0, 500),
    content: item.content || item.description || '',
    url: item.link || '',
    imageUrl: item.thumbnail || item.enclosure?.link || extractImg(item.content),
    publishedAt: item.pubDate || new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    tags: normalizeTags(item.categories),
    importanceScore: 50,
    dedupeKey: dedupeKey(item.title || ''),
    read: false, saved: false, archived: false, convertedToQuest: false,
  }));
}

async function fetchViaXmlProxy(source: NewsSource, userId: string): Promise<NewsItem[]> {
  const url = `${CORS_PROXY}?url=${encodeURIComponent(source.url)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);

  const text = await res.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/xml');

  let entries = doc.querySelectorAll('item');
  if (entries.length === 0) entries = doc.querySelectorAll('entry');

  const items: NewsItem[] = [];
  entries.forEach(entry => {
    const title = tag(entry, 'title');
    if (!title) return;
    const link = tag(entry, 'link') || entry.querySelector('link')?.getAttribute('href') || '';
    const desc = tag(entry, 'description') || tag(entry, 'summary') || tag(entry, 'content');
    const date = tag(entry, 'pubDate') || tag(entry, 'published') || tag(entry, 'updated');

    items.push({
      id: hashId(link || title),
      sourceId: source.id,
      userId,
      title,
      summary: stripHtml(desc || '').slice(0, 500),
      content: desc || '',
      url: link,
      imageUrl: extractImg(desc || ''),
      publishedAt: date || new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      tags: [],
      importanceScore: 50,
      dedupeKey: dedupeKey(title),
      read: false, saved: false, archived: false, convertedToQuest: false,
    });
  });

  return items;
}

// ── Helpers ──

function tag(el: Element, name: string): string {
  return el.querySelector(name)?.textContent?.trim() || '';
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractImg(html: string): string | undefined {
  const m = html?.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] || undefined;
}

function normalizeTags(cats: any): string[] {
  if (!Array.isArray(cats)) return [];
  return cats.map((c: any) => String(c).toLowerCase().trim()).filter(Boolean).slice(0, 5);
}

function hashId(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h) + input.charCodeAt(i);
    h |= 0;
  }
  return `nxi_${Math.abs(h).toString(36)}_${Date.now().toString(36).slice(-4)}`;
}

function dedupeKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9\u0400-\u04ff]/g, '').slice(0, 80);
}
