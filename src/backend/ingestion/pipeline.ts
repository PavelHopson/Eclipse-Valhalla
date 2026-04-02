/**
 * Eclipse Valhalla — Ingestion Pipeline
 *
 * FETCH → PARSE → CLEAN → NORMALIZE → ENRICH → DEDUPE → RANK → STORE
 *
 * Each stage is a pure function that transforms data.
 * Pipeline is composable and each stage can be skipped.
 */

import { NewsItem, NewsSource, NewsPreference } from '../../news/newsTypes';

// ═══════════════════════════════════════════
// PIPELINE TYPES
// ═══════════════════════════════════════════

export interface PipelineContext {
  source: NewsSource;
  userId: string;
  preferences: NewsPreference;
  existingDedupeKeys: Set<string>;
  aiAvailable: boolean;
}

export interface PipelineResult {
  items: NewsItem[];
  stats: PipelineStats;
}

export interface PipelineStats {
  fetched: number;
  parsed: number;
  cleaned: number;
  enriched: number;
  deduped: number;
  stored: number;
  errors: string[];
  durationMs: number;
}

export type PipelineStage = (items: NewsItem[], ctx: PipelineContext) => Promise<NewsItem[]>;

// ═══════════════════════════════════════════
// PIPELINE RUNNER
// ═══════════════════════════════════════════

/**
 * Execute a pipeline of stages sequentially.
 * Each stage receives items from the previous stage.
 */
export async function runPipeline(
  stages: PipelineStage[],
  initialItems: NewsItem[],
  ctx: PipelineContext
): Promise<PipelineResult> {
  const startTime = Date.now();
  const stats: PipelineStats = {
    fetched: initialItems.length,
    parsed: 0,
    cleaned: 0,
    enriched: 0,
    deduped: 0,
    stored: 0,
    errors: [],
    durationMs: 0,
  };

  let items = [...initialItems];

  for (const stage of stages) {
    try {
      const before = items.length;
      items = await stage(items, ctx);
      // Track pipeline progression
      if (stats.parsed === 0) stats.parsed = items.length;
      else if (stats.cleaned === 0) stats.cleaned = items.length;
      else if (stats.enriched === 0) stats.enriched = items.length;
      else if (stats.deduped === 0) stats.deduped = items.length;
    } catch (e: any) {
      stats.errors.push(`Pipeline stage failed: ${e.message || 'unknown'}`);
      console.error('[Pipeline] Stage error:', e);
    }
  }

  stats.stored = items.length;
  stats.durationMs = Date.now() - startTime;

  return { items, stats };
}

// ═══════════════════════════════════════════
// STANDARD PIPELINE FACTORY
// ═══════════════════════════════════════════

import { cleanStage } from './processors/cleanProcessor';
import { normalizeStage } from './processors/normalizeProcessor';
import { contentStage } from './processors/contentProcessor';
import { dedupeStage } from './jobs/dedupeJob';
import { rankStage } from './jobs/rankJob';
import { enrichStage } from './jobs/enrichJob';

/**
 * Create the standard ingestion pipeline.
 */
export function createStandardPipeline(opts?: { skipEnrich?: boolean }): PipelineStage[] {
  const stages: PipelineStage[] = [
    cleanStage,
    normalizeStage,
    contentStage,
  ];

  if (!opts?.skipEnrich) {
    stages.push(enrichStage);
  }

  stages.push(dedupeStage);
  stages.push(rankStage);

  return stages;
}
