/**
 * Eclipse Valhalla — Rank Job
 *
 * Pipeline stage that computes importance scores.
 * Reuses the ranking engine from news module.
 */

import { NewsItem } from '../../../news/newsTypes';
import type { PipelineStage } from '../pipeline';

const WEIGHTS = {
  recency: 30,
  topicMatch: 25,
  sourcePriority: 15,
  crossMention: 15,
  categoryBoost: 10,
  mutedPenalty: -50,
};

export const rankStage: PipelineStage = async (items, ctx) => {
  // Build cross-mention index
  const mentionIndex = new Map<string, number>();
  for (const item of items) {
    const key = item.dedupeKey;
    mentionIndex.set(key, (mentionIndex.get(key) || 0) + 1);
  }

  return items.map(item => {
    let score = 0;

    // Recency (decay over 24h)
    const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / 3600000;
    score += Math.max(0, WEIGHTS.recency * (1 - Math.min(ageHours, 48) / 48));

    // Topic match
    const topics = [...item.tags, item.category].filter(Boolean).map(t => t!.toLowerCase());
    const preferred = ctx.preferences.preferredTopics.map(t => t.toLowerCase());
    if (preferred.some(t => topics.includes(t))) score += WEIGHTS.topicMatch;

    // Muted penalty
    const muted = ctx.preferences.mutedTopics.map(t => t.toLowerCase());
    if (muted.some(t => topics.includes(t) || item.title.toLowerCase().includes(t))) {
      score += WEIGHTS.mutedPenalty;
    }

    // Source priority (more specific categories = higher)
    const specificity = Math.min(ctx.source.categories.length, 3) / 3;
    score += WEIGHTS.sourcePriority * specificity;

    // Cross-mention boost
    const mentions = mentionIndex.get(item.dedupeKey) || 1;
    if (mentions > 1) score += Math.min(WEIGHTS.crossMention, mentions * 5);

    // Category boost
    if (item.category && preferred.includes(item.category)) {
      score += WEIGHTS.categoryBoost;
    }

    return {
      ...item,
      importanceScore: Math.max(0, Math.min(100, Math.round(score))),
    };
  }).sort((a, b) => b.importanceScore - a.importanceScore);
};
