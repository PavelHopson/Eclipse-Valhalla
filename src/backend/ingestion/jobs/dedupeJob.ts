/**
 * Eclipse Valhalla — Dedupe Job
 *
 * Removes duplicate items based on:
 * 1. Exact dedupe key match
 * 2. Exact URL match
 * 3. Against existing items in database/cache
 */

import { NewsItem } from '../../../news/newsTypes';
import type { PipelineStage } from '../pipeline';

export const dedupeStage: PipelineStage = async (items, ctx) => {
  const seen = new Set<string>();
  const seenUrls = new Set<string>();
  const result: NewsItem[] = [];

  // Pre-populate with existing keys
  ctx.existingDedupeKeys.forEach(key => seen.add(key));

  for (const item of items) {
    // Skip if dedupe key already exists
    if (item.dedupeKey && seen.has(item.dedupeKey)) continue;

    // Skip if URL already exists
    if (item.url && seenUrls.has(item.url)) continue;

    // Skip very similar titles (fuzzy)
    const normalizedTitle = item.dedupeKey || '';
    let isDuplicate = false;
    for (const existing of seen) {
      if (normalizedTitle.length > 20 && existing.length > 20) {
        if (similarity(normalizedTitle, existing) > 0.85) {
          isDuplicate = true;
          break;
        }
      }
    }
    if (isDuplicate) continue;

    if (item.dedupeKey) seen.add(item.dedupeKey);
    if (item.url) seenUrls.add(item.url);
    result.push(item);
  }

  return result;
};

/**
 * Simple Jaccard similarity for short strings.
 */
function similarity(a: string, b: string): number {
  if (a === b) return 1;
  const setA = new Set(a.match(/.{1,3}/g) || []);
  const setB = new Set(b.match(/.{1,3}/g) || []);
  let intersection = 0;
  setA.forEach(tri => { if (setB.has(tri)) intersection++; });
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}
