/**
 * Eclipse Valhalla — Normalize Processor
 *
 * Ensures all NewsItem fields are consistent and well-typed.
 * Fixes dates, generates missing IDs, computes dedupe keys.
 */

import { NewsItem } from '../../../news/newsTypes';
import type { PipelineStage } from '../pipeline';

export const normalizeStage: PipelineStage = async (items, ctx) => {
  return items
    .filter(item => item.title && item.title.length > 3) // Drop empty/garbage items
    .map(item => ({
      ...item,
      // Ensure IDs
      id: item.id || generateId(),
      userId: ctx.userId,
      sourceId: item.sourceId || ctx.source.id,

      // Normalize dates
      publishedAt: normalizeDate(item.publishedAt),
      fetchedAt: item.fetchedAt || new Date().toISOString(),

      // Ensure strings
      summary: item.summary || '',
      content: item.content || '',
      url: normalizeUrl(item.url),

      // Default scores
      importanceScore: item.importanceScore || 50,

      // Compute dedupe key
      dedupeKey: item.dedupeKey || computeDedupeKey(item.title),

      // Default flags
      read: item.read ?? false,
      saved: item.saved ?? false,
      archived: item.archived ?? false,
      convertedToQuest: item.convertedToQuest ?? false,

      // Ensure tags array
      tags: Array.isArray(item.tags) ? item.tags : [],
    }));
};

function generateId(): string {
  return `nxi_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeDate(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString();
    // Reject dates too far in future (likely parse error)
    if (d.getTime() > Date.now() + 86400000) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function normalizeUrl(url: string): string {
  if (!url) return '';
  try {
    // Remove tracking params
    const u = new URL(url);
    u.searchParams.delete('utm_source');
    u.searchParams.delete('utm_medium');
    u.searchParams.delete('utm_campaign');
    u.searchParams.delete('utm_content');
    u.searchParams.delete('utm_term');
    return u.toString();
  } catch {
    return url;
  }
}

export function computeDedupeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff\u4e00-\u9fff]/g, '')
    .slice(0, 80);
}
