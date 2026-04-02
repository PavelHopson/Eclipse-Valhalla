/**
 * Eclipse Valhalla — Admin Types
 *
 * RBAC, telemetry events, analytics aggregates, admin views.
 */

// ═══════════════════════════════════════════
// RBAC
// ═══════════════════════════════════════════

export type AdminRole = 'super_admin' | 'admin' | 'analyst';

export interface AdminUser {
  userId: string;
  role: AdminRole;
  grantedAt: string;
  grantedBy: string;
}

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: ['*'],
  admin: ['view_users', 'view_analytics', 'view_ai_usage', 'view_health', 'manage_users'],
  analyst: ['view_analytics', 'view_ai_usage', 'view_health'],
};

// Admin user IDs — hardcoded for MVP, move to DB later
export const ADMIN_IDS: Record<string, AdminRole> = {
  'user_pavel_hopson_admin': 'super_admin',
};

// ═══════════════════════════════════════════
// TELEMETRY EVENT
// ═══════════════════════════════════════════

export interface TelemetryEvent {
  id: string;
  event: string;
  userId: string;
  properties: Record<string, any>;
  timestamp: string;
  sessionId: string;
  platform: string;
}

// ═══════════════════════════════════════════
// ANALYTICS AGGREGATES
// ═══════════════════════════════════════════

export interface OverviewMetrics {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  newThisWeek: number;
  totalQuests: number;
  questsCompletedToday: number;
  completionRate: number;     // 0-100
  avgDisciplineScore: number;
  proUsers: number;
  revenue: number;            // MRR estimate
}

export interface RetentionCohort {
  installDate: string;
  totalUsers: number;
  d1: number;
  d3: number;
  d7: number;
  d14: number;
  d30: number;
}

export interface AIUsageMetrics {
  totalRequests: number;
  successRate: number;
  avgDurationMs: number;
  byProvider: Record<string, { requests: number; tokens: number; errors: number }>;
  byCapability: Record<string, number>;
  topErrors: { error: string; count: number }[];
}

export interface UserOverview {
  id: string;
  name: string;
  email: string;
  tier: string;
  createdAt: string;
  lastActiveAt: string;
  questsCreated: number;
  questsCompleted: number;
  disciplineScore: number;
  streak: number;
  level: number;
  platform: string;
  segment: string;
}

export interface SystemHealth {
  ingestionSources: number;
  ingestionHealthy: number;
  ingestionErrors: number;
  lastIngestionAt: string;
  storageUsedKB: number;
  storageMaxKB: number;
  activeProviders: number;
  errors24h: number;
}
