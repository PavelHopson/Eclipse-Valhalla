/**
 * Eclipse Valhalla — Canonical Domain Entities
 *
 * These types represent the application's domain model.
 * They are independent of storage backend (localStorage/Supabase/etc).
 */

// ═══════════════════════════════════════════
// USER / PROFILE
// ═══════════════════════════════════════════

export type Tier = 'free' | 'pro';
export type AccentTheme = 'ice' | 'void' | 'blood' | 'oracle';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  tier: Tier;
  locale: 'en' | 'ru';
  timezone?: string;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════
// QUEST
// ═══════════════════════════════════════════

export type QuestStatus = 'pending' | 'active' | 'completed' | 'failed' | 'archived';
export type QuestPriority = 'low' | 'medium' | 'high' | 'critical';
export type QuestCategory = 'work' | 'personal' | 'health' | 'shopping' | 'finance' | 'education';
export type QuestRepeat = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Quest {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: QuestStatus;
  priority: QuestPriority;
  category: QuestCategory;
  repeat: QuestRepeat;
  dueAt: string;        // ISO timestamp
  completedAt?: string;
  archivedAt?: string;
  subtasks: QuestSubtask[];
  createdAt: string;
  updatedAt: string;
}

export interface QuestSubtask {
  id: string;
  title: string;
  completed: boolean;
}

// ═══════════════════════════════════════════
// NOTE
// ═══════════════════════════════════════════

export interface Note {
  id: string;
  userId: string;
  content: string;
  color: string;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  zIndex: number;
  minimized: boolean;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════
// WIDGET CONFIG
// ═══════════════════════════════════════════

export type WidgetType = 'quest' | 'focus' | 'blocker';
export type WidgetPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WidgetConfig {
  id: string;
  userId: string;
  questId?: string;
  type: WidgetType;
  positionX: number;
  positionY: number;
  width: number;
  height: number;
  locked: boolean;
  opacity: number;
  visible: boolean;
  priority: WidgetPriority;
  desktopOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

// ═══════════════════════════════════════════
// FOCUS SESSION
// ═══════════════════════════════════════════

export interface FocusSession {
  id: string;
  userId: string;
  questId?: string;
  startedAt: string;
  endedAt?: string;
  durationSec: number;
  completed: boolean;
}

// ═══════════════════════════════════════════
// GAMIFICATION
// ═══════════════════════════════════════════

export interface GamificationProfile {
  userId: string;
  xp: number;
  level: number;
  streakDays: number;
  disciplineScore: number;
  totalCompleted: number;
  totalFailed: number;
  focusSessions: number;
  updatedAt: string;
}

// ═══════════════════════════════════════════
// NOTIFICATION PREFERENCES
// ═══════════════════════════════════════════

export interface NotificationPreferences {
  userId: string;
  inAppEnabled: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  escalationEnabled: boolean;
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string;   // HH:MM
  updatedAt: string;
}

// ═══════════════════════════════════════════
// APP SETTINGS
// ═══════════════════════════════════════════

export interface AppSettings {
  userId: string;
  accentTheme: AccentTheme;
  reducedMotion: boolean;
  widgetTransparency: number;
  atmosphereLevel: number; // 0-100
  compactMode: boolean;
  glowIntensity: number;  // 0-100
  locale: 'en' | 'ru';
  updatedAt: string;
}

// ═══════════════════════════════════════════
// ORACLE
// ═══════════════════════════════════════════

export interface OracleSession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface OracleMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'model';
  content: string;
  createdAt: string;
}

// ═══════════════════════════════════════════
// SYNC METADATA
// ═══════════════════════════════════════════

export interface SyncMeta {
  entityType: string;
  entityId: string;
  lastSyncedAt: string;
  dirty: boolean;
  version: number;
}
