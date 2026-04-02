/**
 * Eclipse Valhalla — Admin Service
 *
 * Analytics engine, user oversight, system health, AI governance.
 * Local-first (reads localStorage aggregates). Cloud-ready.
 */

import {
  AdminRole, ADMIN_IDS, OverviewMetrics, RetentionCohort,
  AIUsageMetrics, UserOverview, SystemHealth, TelemetryEvent,
} from './types';
import { getUsageLogs } from '../ai';
import { getUsageMetrics, getRecentEvents } from '../services/analyticsService';
import { getUserSegment } from '../services/cohortService';
import { getDisciplineState } from '../services/gamificationService';

// ═══════════════════════════════════════════
// AUTH / RBAC
// ═══════════════════════════════════════════

export function isAdmin(userId: string): boolean {
  return userId in ADMIN_IDS;
}

export function getAdminRole(userId: string): AdminRole | null {
  return ADMIN_IDS[userId] || null;
}

export function hasPermission(userId: string, permission: string): boolean {
  const role = getAdminRole(userId);
  if (!role) return false;
  const perms = import('./types').then(m => m.ROLE_PERMISSIONS[role]);
  // Sync check for hardcoded roles
  if (role === 'super_admin') return true;
  const rolePerms: Record<AdminRole, string[]> = {
    super_admin: ['*'],
    admin: ['view_users', 'view_analytics', 'view_ai_usage', 'view_health', 'manage_users'],
    analyst: ['view_analytics', 'view_ai_usage', 'view_health'],
  };
  return rolePerms[role]?.includes(permission) || rolePerms[role]?.includes('*') || false;
}

// ═══════════════════════════════════════════
// OVERVIEW METRICS
// ═══════════════════════════════════════════

export function getOverviewMetrics(): OverviewMetrics {
  const metrics = getUsageMetrics();
  const discipline = getDisciplineState();

  // Count users from localStorage (MVP — single-user, but structured for multi)
  let totalUsers = 0;
  let proUsers = 0;
  try {
    const usersRaw = localStorage.getItem('lumina_users_db');
    const users = usersRaw ? JSON.parse(usersRaw) : [];
    totalUsers = users.length;
    proUsers = users.filter((u: any) => u.plan === 'Pro').length;
  } catch {}

  return {
    totalUsers,
    activeToday: metrics.sessionsTotal > 0 ? 1 : 0,
    activeThisWeek: metrics.sessionsTotal > 0 ? 1 : 0,
    newThisWeek: 0,
    totalQuests: metrics.questsCreated,
    questsCompletedToday: metrics.questsCompleted,
    completionRate: metrics.questsCreated > 0 ? Math.round((metrics.questsCompleted / metrics.questsCreated) * 100) : 0,
    avgDisciplineScore: discipline.disciplineScore,
    proUsers,
    revenue: proUsers * 12,
  };
}

// ═══════════════════════════════════════════
// AI USAGE ANALYTICS
// ═══════════════════════════════════════════

export function getAIUsageMetrics(): AIUsageMetrics {
  const logs = getUsageLogs();

  const byProvider: Record<string, { requests: number; tokens: number; errors: number }> = {};
  const byCapability: Record<string, number> = {};
  const errorCounts: Record<string, number> = {};
  let totalDuration = 0;
  let successCount = 0;

  for (const log of logs) {
    // By provider
    if (!byProvider[log.providerType]) byProvider[log.providerType] = { requests: 0, tokens: 0, errors: 0 };
    byProvider[log.providerType].requests++;
    byProvider[log.providerType].tokens += log.tokensUsed;
    if (!log.success) byProvider[log.providerType].errors++;

    // By capability
    byCapability[log.capability] = (byCapability[log.capability] || 0) + 1;

    // Errors
    if (!log.success && log.error) {
      const key = log.error.slice(0, 80);
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    }

    if (log.success) successCount++;
    totalDuration += log.durationMs;
  }

  const topErrors = Object.entries(errorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([error, count]) => ({ error, count }));

  return {
    totalRequests: logs.length,
    successRate: logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 100,
    avgDurationMs: logs.length > 0 ? Math.round(totalDuration / logs.length) : 0,
    byProvider,
    byCapability,
    topErrors,
  };
}

// ═══════════════════════════════════════════
// SYSTEM HEALTH
// ═══════════════════════════════════════════

export function getSystemHealth(): SystemHealth {
  let sources = 0, healthy = 0, errors = 0, lastIngestion = '';

  try {
    // Scan for nexus sources
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('nexus_sources_')) {
        const data = JSON.parse(localStorage.getItem(key) || '[]');
        sources += data.length;
        for (const s of data) {
          if (s.errorCount > 3) errors++;
          else healthy++;
          if (s.lastFetchedAt && (!lastIngestion || s.lastFetchedAt > lastIngestion)) {
            lastIngestion = s.lastFetchedAt;
          }
        }
      }
    }
  } catch {}

  // Storage usage
  let storageUsed = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) storageUsed += (localStorage.getItem(key) || '').length;
    }
  } catch {}

  // Active AI providers
  let activeProviders = 0;
  try {
    const provs = JSON.parse(localStorage.getItem('eclipse_ai_providers') || '[]');
    activeProviders = provs.filter((p: any) => p.enabled).length;
  } catch {}

  // Errors in last 24h
  const events = getRecentEvents(200);
  const dayAgo = Date.now() - 86400000;
  const errors24h = events.filter(e => e.timestamp > dayAgo && e.event.includes('error')).length;

  return {
    ingestionSources: sources,
    ingestionHealthy: healthy,
    ingestionErrors: errors,
    lastIngestionAt: lastIngestion,
    storageUsedKB: Math.round(storageUsed / 1024),
    storageMaxKB: 5120, // ~5MB localStorage limit
    activeProviders,
    errors24h,
  };
}

// ═══════════════════════════════════════════
// RECENT EVENTS (telemetry feed)
// ═══════════════════════════════════════════

export function getEventFeed(limit: number = 50): TelemetryEvent[] {
  const events = getRecentEvents(limit);
  return events.map(e => ({
    id: `${e.timestamp}_${e.event}`,
    event: e.event,
    userId: 'current',
    properties: e.properties || {},
    timestamp: new Date(e.timestamp).toISOString(),
    sessionId: '',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
  }));
}
