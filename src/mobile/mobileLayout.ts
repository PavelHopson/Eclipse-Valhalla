/**
 * Eclipse Valhalla — Mobile Layout Config
 *
 * Layout constants and rules for mobile adaptation.
 */

// ═══════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// ═══════════════════════════════════════════
// MOBILE NAVIGATION CONFIG
// ═══════════════════════════════════════════

export const mobileNavItems = [
  { id: 'dashboard', label: 'Home', icon: 'Home' },
  { id: 'reminders', label: 'Quests', icon: 'Swords' },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { id: 'oracle', label: 'Oracle', icon: 'Sparkles' },
  { id: 'settings', label: 'More', icon: 'Menu' },
] as const;

// Secondary screens accessible from "More" or specific actions
export const mobileSecondaryScreens = [
  'stickers', 'workouts', 'image', 'tts', 'admin', 'nexus',
] as const;

// ═══════════════════════════════════════════
// SPACING
// ═══════════════════════════════════════════

export const mobileSpacing = {
  /** Bottom nav height + safe area */
  bottomNavHeight: 64,
  /** Top header height + safe area */
  topHeaderHeight: 56,
  /** Content padding */
  contentPadding: 16,
  /** Card gap */
  cardGap: 12,
} as const;

// ═══════════════════════════════════════════
// WIDGET RULES
// ═══════════════════════════════════════════

export const mobileWidgetRules = {
  /** Disable system-level overlay on mobile */
  overlayEnabled: false,
  /** Max widgets visible in mobile board */
  maxVisibleWidgets: 5,
  /** Force inline rendering (no absolute positioning) */
  forceInline: true,
  /** Simplified widget height */
  compactHeight: 80,
} as const;

// ═══════════════════════════════════════════
// DASHBOARD SECTIONS (mobile order)
// ═══════════════════════════════════════════

export const mobileDashboardSections = [
  'hero',
  'activeQuests',
  'discipline',
  'nexusDigest',
  'focusSession',
] as const;
