/**
 * Eclipse Valhalla — Ingestion Scheduler
 *
 * Manages periodic ingestion cycles.
 * Respects per-source polling intervals.
 */

import { NewsSource } from '../../news/newsTypes';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface SchedulerConfig {
  defaultIntervalMs: number;  // Default: 15 minutes
  minIntervalMs: number;      // Minimum: 5 minutes
  maxConcurrent: number;      // Max concurrent fetches
  enabled: boolean;
}

const DEFAULT_CONFIG: SchedulerConfig = {
  defaultIntervalMs: 15 * 60 * 1000,
  minIntervalMs: 5 * 60 * 1000,
  maxConcurrent: 3,
  enabled: true,
};

// ═══════════════════════════════════════════
// SCHEDULER
// ═══════════════════════════════════════════

type IngestionFn = (source: NewsSource) => Promise<void>;

let _timer: ReturnType<typeof setInterval> | null = null;
let _config: SchedulerConfig = { ...DEFAULT_CONFIG };
let _running = false;

/**
 * Start the ingestion scheduler.
 * Calls `onIngest` for each source that's due.
 */
export function startScheduler(
  getSources: () => NewsSource[],
  onIngest: IngestionFn,
  config?: Partial<SchedulerConfig>
): void {
  stopScheduler();
  _config = { ...DEFAULT_CONFIG, ...config };

  if (!_config.enabled) return;

  _timer = setInterval(async () => {
    if (_running) return; // Skip if previous cycle still running
    _running = true;

    try {
      const sources = getSources().filter(s => s.enabled);
      const now = Date.now();

      // Find sources due for refresh
      const due = sources.filter(source => {
        if (!source.lastFetchedAt) return true; // Never fetched
        const interval = Math.max(
          _config.minIntervalMs,
          (source.pollingIntervalMin || 15) * 60 * 1000
        );
        return now - new Date(source.lastFetchedAt).getTime() >= interval;
      });

      if (due.length === 0) {
        _running = false;
        return;
      }

      // Process in batches
      for (let i = 0; i < due.length; i += _config.maxConcurrent) {
        const batch = due.slice(i, i + _config.maxConcurrent);
        await Promise.allSettled(batch.map(s => onIngest(s)));
      }
    } catch (e) {
      console.error('[Scheduler] Cycle error:', e);
    } finally {
      _running = false;
    }
  }, _config.defaultIntervalMs);

  console.info(`[Scheduler] Started (interval: ${_config.defaultIntervalMs / 1000}s)`);
}

/**
 * Stop the scheduler.
 */
export function stopScheduler(): void {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    _running = false;
    console.info('[Scheduler] Stopped');
  }
}

/**
 * Check if scheduler is running.
 */
export function isSchedulerRunning(): boolean {
  return _timer !== null;
}

/**
 * Update scheduler config at runtime.
 */
export function updateSchedulerConfig(config: Partial<SchedulerConfig>): void {
  _config = { ..._config, ...config };
}

/**
 * Get current config.
 */
export function getSchedulerConfig(): SchedulerConfig {
  return { ..._config };
}
