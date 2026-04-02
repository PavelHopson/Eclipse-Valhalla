/**
 * Eclipse Valhalla — Analytics Service
 *
 * Tracks usage metrics for product insights.
 * Local-first. Cloud-ready for aggregation.
 *
 * Privacy: no PII collection. Only behavioral metrics.
 */

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
}

export interface UsageMetrics {
  sessionsTotal: number;
  sessionStartedAt: number | null;
  questsCreated: number;
  questsCompleted: number;
  questsFailed: number;
  focusSessionsCompleted: number;
  focusMinutesTotal: number;
  oracleMessagesTotal: number;
  nexusItemsRead: number;
  nexusItemsConverted: number;
  widgetsCreated: number;
  streakBest: number;
  lastActiveAt: string;
}

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const METRICS_KEY = 'eclipse_analytics_metrics';
const EVENTS_KEY = 'eclipse_analytics_events';

function getMetrics(): UsageMetrics {
  try {
    const raw = localStorage.getItem(METRICS_KEY);
    return raw ? JSON.parse(raw) : defaultMetrics();
  } catch { return defaultMetrics(); }
}

function saveMetrics(m: UsageMetrics): void {
  localStorage.setItem(METRICS_KEY, JSON.stringify(m));
}

function defaultMetrics(): UsageMetrics {
  return {
    sessionsTotal: 0,
    sessionStartedAt: null,
    questsCreated: 0,
    questsCompleted: 0,
    questsFailed: 0,
    focusSessionsCompleted: 0,
    focusMinutesTotal: 0,
    oracleMessagesTotal: 0,
    nexusItemsRead: 0,
    nexusItemsConverted: 0,
    widgetsCreated: 0,
    streakBest: 0,
    lastActiveAt: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════
// TRACKING API
// ═══════════════════════════════════════════

export function trackEvent(event: string, properties?: Record<string, any>): void {
  // Store locally
  try {
    const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    events.push({ event, properties, timestamp: Date.now() });
    // Keep last 500
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.slice(-500)));
  } catch {}

  // TODO: Send to analytics backend
  // fetch('/api/analytics/track', { method: 'POST', body: JSON.stringify({ event, properties }) });
}

export function trackSessionStart(): void {
  const m = getMetrics();
  m.sessionsTotal++;
  m.sessionStartedAt = Date.now();
  m.lastActiveAt = new Date().toISOString();
  saveMetrics(m);
  trackEvent('session_start');
}

export function trackQuestCreated(): void {
  const m = getMetrics();
  m.questsCreated++;
  saveMetrics(m);
  trackEvent('quest_created');
}

export function trackQuestCompleted(): void {
  const m = getMetrics();
  m.questsCompleted++;
  saveMetrics(m);
  trackEvent('quest_completed');
}

export function trackQuestFailed(): void {
  const m = getMetrics();
  m.questsFailed++;
  saveMetrics(m);
  trackEvent('quest_failed');
}

export function trackFocusCompleted(durationMinutes: number): void {
  const m = getMetrics();
  m.focusSessionsCompleted++;
  m.focusMinutesTotal += durationMinutes;
  saveMetrics(m);
  trackEvent('focus_completed', { durationMinutes });
}

export function trackOracleMessage(): void {
  const m = getMetrics();
  m.oracleMessagesTotal++;
  saveMetrics(m);
}

export function trackNexusRead(): void {
  const m = getMetrics();
  m.nexusItemsRead++;
  saveMetrics(m);
}

export function trackNexusConverted(): void {
  const m = getMetrics();
  m.nexusItemsConverted++;
  saveMetrics(m);
  trackEvent('nexus_to_quest');
}

export function trackWidgetCreated(): void {
  const m = getMetrics();
  m.widgetsCreated++;
  saveMetrics(m);
}

export function updateStreakBest(streak: number): void {
  const m = getMetrics();
  if (streak > m.streakBest) {
    m.streakBest = streak;
    saveMetrics(m);
  }
}

// ═══════════════════════════════════════════
// READ
// ═══════════════════════════════════════════

export function getUsageMetrics(): UsageMetrics {
  return getMetrics();
}

export function getRecentEvents(limit: number = 50): AnalyticsEvent[] {
  try {
    const events: AnalyticsEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    return events.slice(-limit);
  } catch { return []; }
}

export function resetAnalytics(): void {
  localStorage.removeItem(METRICS_KEY);
  localStorage.removeItem(EVENTS_KEY);
}
