/**
 * Eclipse Valhalla — Funnel Analytics
 *
 * Tracks user progression through key funnels:
 *   Activation: onboarding → first quest → first complete → day 1 → day 7
 *   Conversion: free → paywall seen → upgrade → pro active
 *   Engagement: sessions/day, quests/day, streak, features used
 */

import { trackEvent } from './analyticsService';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface FunnelStep {
  name: string;
  completedAt: string | null;
}

export interface FunnelState {
  activation: FunnelStep[];
  conversion: FunnelStep[];
  engagement: {
    sessionsToday: number;
    questsToday: number;
    featuresUsed: Set<string>;
    lastSessionDate: string;
    consecutiveDays: number;
  };
}

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const KEY = 'eclipse_funnels';

interface StoredFunnel {
  activation: Record<string, string | null>;
  conversion: Record<string, string | null>;
  engagement: {
    sessionsToday: number;
    questsToday: number;
    featuresUsed: string[];
    lastSessionDate: string;
    consecutiveDays: number;
  };
}

function getStored(): StoredFunnel {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : defaultStored();
  } catch { return defaultStored(); }
}

function save(s: StoredFunnel): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function defaultStored(): StoredFunnel {
  return {
    activation: {
      onboarding_started: null,
      onboarding_completed: null,
      first_quest: null,
      first_complete: null,
      day_1_return: null,
      day_7_return: null,
    },
    conversion: {
      paywall_seen: null,
      upgrade_clicked: null,
      pro_activated: null,
    },
    engagement: {
      sessionsToday: 0,
      questsToday: 0,
      featuresUsed: [],
      lastSessionDate: '',
      consecutiveDays: 0,
    },
  };
}

// ═══════════════════════════════════════════
// ACTIVATION FUNNEL
// ═══════════════════════════════════════════

export function markActivationStep(step: string): void {
  const s = getStored();
  if (step in s.activation && !s.activation[step]) {
    s.activation[step] = new Date().toISOString();
    save(s);
    trackEvent('funnel_activation', { step });
  }
}

export function getActivationFunnel(): Record<string, string | null> {
  return { ...getStored().activation };
}

// ═══════════════════════════════════════════
// CONVERSION FUNNEL
// ═══════════════════════════════════════════

export function markConversionStep(step: string): void {
  const s = getStored();
  if (step in s.conversion && !s.conversion[step]) {
    s.conversion[step] = new Date().toISOString();
    save(s);
    trackEvent('funnel_conversion', { step });
  }
}

export function getConversionFunnel(): Record<string, string | null> {
  return { ...getStored().conversion };
}

// ═══════════════════════════════════════════
// ENGAGEMENT TRACKING
// ═══════════════════════════════════════════

export function trackEngagementSession(): void {
  const s = getStored();
  const today = new Date().toISOString().split('T')[0];

  if (s.engagement.lastSessionDate !== today) {
    // New day
    if (s.engagement.lastSessionDate) {
      const lastDate = new Date(s.engagement.lastSessionDate);
      const diff = Math.floor((Date.now() - lastDate.getTime()) / 86400000);
      s.engagement.consecutiveDays = diff <= 1 ? s.engagement.consecutiveDays + 1 : 1;
    } else {
      s.engagement.consecutiveDays = 1;
    }
    s.engagement.sessionsToday = 1;
    s.engagement.questsToday = 0;
    s.engagement.lastSessionDate = today;

    // Check day-based activation milestones
    if (s.engagement.consecutiveDays >= 1 && !s.activation.day_1_return) {
      s.activation.day_1_return = new Date().toISOString();
      trackEvent('funnel_activation', { step: 'day_1_return' });
    }
    if (s.engagement.consecutiveDays >= 7 && !s.activation.day_7_return) {
      s.activation.day_7_return = new Date().toISOString();
      trackEvent('funnel_activation', { step: 'day_7_return' });
    }
  } else {
    s.engagement.sessionsToday++;
  }

  save(s);
}

export function trackEngagementQuest(): void {
  const s = getStored();
  s.engagement.questsToday++;
  save(s);
}

export function trackFeatureUsed(feature: string): void {
  const s = getStored();
  if (!s.engagement.featuresUsed.includes(feature)) {
    s.engagement.featuresUsed.push(feature);
    save(s);
    trackEvent('feature_used', { feature });
  }
}

// ═══════════════════════════════════════════
// REPORT
// ═══════════════════════════════════════════

export function getFunnelReport() {
  const s = getStored();

  const activationComplete = Object.values(s.activation).filter(Boolean).length;
  const activationTotal = Object.keys(s.activation).length;

  const conversionComplete = Object.values(s.conversion).filter(Boolean).length;
  const conversionTotal = Object.keys(s.conversion).length;

  return {
    activation: {
      steps: s.activation,
      progress: Math.round((activationComplete / activationTotal) * 100),
    },
    conversion: {
      steps: s.conversion,
      progress: Math.round((conversionComplete / conversionTotal) * 100),
    },
    engagement: {
      ...s.engagement,
      featuresUsed: s.engagement.featuresUsed.length,
    },
  };
}
