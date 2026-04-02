/**
 * Eclipse Valhalla — Widget Type Definitions
 *
 * Widgets are floating UI elements that overlay the main application.
 * They track quests, enforce focus, and block distractions.
 */

// ═══════════════════════════════════════════
// WIDGET TYPES
// ═══════════════════════════════════════════

export type WidgetType = 'quest' | 'focus' | 'blocker';

export type WidgetPriority = 'low' | 'medium' | 'high' | 'critical';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  w: number;
  h: number;
}

// ═══════════════════════════════════════════
// WIDGET STATE
// ═══════════════════════════════════════════

export interface WidgetState {
  id: string;
  type: WidgetType;
  position: WidgetPosition;
  size: WidgetSize;
  locked: boolean;
  opacity: number;       // 0.0 - 1.0
  visible: boolean;
  priority: WidgetPriority;
  zIndex: number;

  // Quest binding
  questId?: string;
  questTitle?: string;
  questDeadline?: string; // ISO string

  // Focus mode
  focusDurationMs?: number;   // total focus duration
  focusStartedAt?: number;    // timestamp when focus started

  // Blocker mode
  blockerMessage?: string;
  blockerDismissable: boolean; // false = can only close by completing quest

  // Escalation
  escalationLevel: number;     // 0=normal, 1=warning, 2=urgent, 3=critical
  lastEscalatedAt?: number;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

// ═══════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════

export const DEFAULT_WIDGET_SIZES: Record<WidgetType, WidgetSize> = {
  quest:   { w: 300, h: 140 },
  focus:   { w: 320, h: 200 },
  blocker: { w: 400, h: 180 },
};

export const PRIORITY_GLOW: Record<WidgetPriority, string> = {
  low:      'shadow-[0_0_10px_rgba(93,174,255,0.05)]',
  medium:   'shadow-[0_0_15px_rgba(93,174,255,0.12)]',
  high:     'shadow-[0_0_20px_rgba(255,68,68,0.15)]',
  critical: 'shadow-[0_0_30px_rgba(139,0,0,0.35)]',
};

export const PRIORITY_BORDER: Record<WidgetPriority, string> = {
  low:      'border-[#2A2A3C]',
  medium:   'border-[#5DAEFF30]',
  high:     'border-[#FF444440]',
  critical: 'border-[#8B000080]',
};

export const ESCALATION_GLOW: Record<number, string> = {
  0: '',
  1: 'shadow-[0_0_15px_rgba(251,191,36,0.15)]',
  2: 'shadow-[0_0_25px_rgba(255,68,68,0.2)]',
  3: 'shadow-[0_0_35px_rgba(139,0,0,0.4)] animate-pulse',
};

// ═══════════════════════════════════════════
// ENVIRONMENT
// ═══════════════════════════════════════════

export const isDesktop = typeof window !== 'undefined' && !!(window as any).electronAPI;
