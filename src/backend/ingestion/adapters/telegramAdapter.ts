/**
 * Eclipse Valhalla — Telegram Adapter
 *
 * Architecture-ready Telegram channel ingestion.
 *
 * Current: RSS bridge approach (RSSHub, etc.)
 * Future: Backend with Telegram Bot API or MTProto
 *
 * INTEGRATION NOTES:
 * 1. For public channels: RSSHub bridge works for many channels
 * 2. For private/restricted: Needs Telegram Bot API (backend-only)
 * 3. For real-time: Webhook via Bot API updateHandler
 * 4. For full history: MTProto (complex, needs separate service)
 */

import { NewsSource, NewsItem } from '../../../news/newsTypes';
import { fetchRSS } from './rssAdapter';

// RSS bridge URLs for Telegram channels
const TELEGRAM_BRIDGES = [
  (channel: string) => `https://rsshub.app/telegram/channel/${channel}`,
];

export async function fetchTelegram(source: NewsSource, userId: string): Promise<NewsItem[]> {
  const channel = extractChannel(source.url);
  if (!channel) {
    console.warn('[Telegram] Cannot extract channel from:', source.url);
    return [];
  }

  // Try each bridge
  for (const bridgeFn of TELEGRAM_BRIDGES) {
    const bridgeUrl = bridgeFn(channel);
    try {
      const bridgeSource: NewsSource = {
        ...source,
        url: bridgeUrl,
        type: 'rss', // Treat bridge as RSS
      };
      const items = await fetchRSS(bridgeSource, userId);
      if (items.length > 0) {
        // Tag items with telegram source
        return items.map(item => ({
          ...item,
          sourceId: source.id, // Keep original source ID
          tags: [...new Set([...item.tags, 'telegram', channel])],
        }));
      }
    } catch {
      continue;
    }
  }

  // TODO: Backend integration point
  // When backend is available:
  // const res = await fetch(`/api/ingestion/telegram/${channel}`);
  // return res.json();

  console.info(`[Telegram] No bridge for @${channel}. Backend ingestion required.`);
  return [];
}

function extractChannel(url: string): string | null {
  const match = url.match(/(?:t\.me\/|@)([a-zA-Z0-9_]+)/);
  return match?.[1] || null;
}
