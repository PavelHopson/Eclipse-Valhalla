/**
 * Eclipse Valhalla — Telegram Channel Parser (Architecture Stub)
 *
 * Direct Telegram parsing is limited on the client side.
 * Production approach: backend service using Telegram Bot API or MTProto.
 *
 * This stub uses t.me/s/{channel} public preview pages where available.
 * For full implementation: connect via backend adapter.
 */

import { NewsItem } from '../newsTypes';
import { normalizeForDedupe } from './rssParser';

/**
 * Attempt to fetch public Telegram channel posts.
 * Limited: only works for channels with public preview enabled.
 *
 * NOTE: This is architecture-ready. Full implementation requires:
 * 1. Backend service with Telegram Bot API access
 * 2. OR user-provided Telegram API credentials (MTProto)
 * 3. Webhook-based real-time ingestion
 *
 * Current: tries RSS bridge services for Telegram channels.
 */
export async function parseTelegramChannel(
  channelUrl: string,
  sourceId: string,
  userId: string
): Promise<NewsItem[]> {
  // Extract channel name
  const channelName = extractChannelName(channelUrl);
  if (!channelName) {
    console.warn('[Telegram] Could not extract channel name from:', channelUrl);
    return [];
  }

  // Try RSS bridge for Telegram
  // Several community bridges exist that convert Telegram channels to RSS
  const rssBridges = [
    `https://rsshub.app/telegram/channel/${channelName}`,
    // Add more bridges as discovered
  ];

  for (const bridgeUrl of rssBridges) {
    try {
      const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(bridgeUrl)}&count=20`);
      if (!response.ok) continue;

      const data = await response.json();
      if (data.status !== 'ok' || !Array.isArray(data.items)) continue;

      return data.items.map((item: any): NewsItem => ({
        id: `tg_${channelName}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        sourceId,
        userId,
        title: (item.title || item.description?.slice(0, 100) || 'Telegram Post').replace(/<[^>]*>/g, ''),
        summary: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 300),
        content: item.content || item.description || '',
        url: item.link || `https://t.me/${channelName}`,
        imageUrl: item.thumbnail || undefined,
        publishedAt: item.pubDate || new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        tags: ['telegram', channelName],
        category: undefined,
        importanceScore: 50,
        read: false,
        saved: false,
        archived: false,
        convertedToQuest: false,
        dedupeKey: normalizeForDedupe(item.title || item.description || ''),
      }));
    } catch {
      continue;
    }
  }

  console.info(`[Telegram] No RSS bridge available for @${channelName}. Backend integration required.`);
  return [];
}

function extractChannelName(url: string): string | null {
  // Handle: https://t.me/channel, @channel, channel
  const match = url.match(/(?:t\.me\/|@)?([a-zA-Z0-9_]+)/);
  return match?.[1] || null;
}
