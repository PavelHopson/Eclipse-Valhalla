/**
 * Eclipse Valhalla — Paywall Service
 *
 * Soft paywall triggers that surface Pro value at the right moment.
 * Not aggressive. Shows value, not barriers.
 */

import { isPro, canUseFeature, Feature, getUsageLimits, isWithinLimit } from './subscriptionService';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface PaywallTrigger {
  show: boolean;
  feature: Feature;
  title: string;
  message: string;
  cta: string;
}

// ═══════════════════════════════════════════
// USAGE COUNTERS (session-based)
// ═══════════════════════════════════════════

const SESSION_KEY = 'eclipse_paywall_session';

interface SessionUsage {
  oracleMessages: number;
  imageAttempts: number;
  widgetsCreated: number;
  sourcesAdded: number;
  date: string;
}

function getSession(): SessionUsage {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const s = raw ? JSON.parse(raw) : null;
    const today = new Date().toISOString().split('T')[0];
    if (s && s.date === today) return s;
    return { oracleMessages: 0, imageAttempts: 0, widgetsCreated: 0, sourcesAdded: 0, date: today };
  } catch {
    return { oracleMessages: 0, imageAttempts: 0, widgetsCreated: 0, sourcesAdded: 0, date: new Date().toISOString().split('T')[0] };
  }
}

function saveSession(s: SessionUsage): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

// ═══════════════════════════════════════════
// TRIGGER CHECKS
// ═══════════════════════════════════════════

/**
 * Check if Oracle usage should trigger paywall.
 */
export function checkOraclePaywall(): PaywallTrigger {
  if (isPro()) return noTrigger('full_oracle');
  const session = getSession();
  session.oracleMessages++;
  saveSession(session);

  const limits = getUsageLimits();
  if (session.oracleMessages >= (limits.maxOracleMessagesPerDay as number)) {
    return {
      show: true,
      feature: 'full_oracle',
      title: 'Oracle daily limit reached.',
      message: `Free tier: ${limits.maxOracleMessagesPerDay} messages/day. Pro: unlimited access to Oracle AI.`,
      cta: 'Unlock Full Oracle',
    };
  }
  return noTrigger('full_oracle');
}

/**
 * Check if Image generation should trigger paywall.
 */
export function checkImagePaywall(): PaywallTrigger {
  if (isPro()) return noTrigger('image_generation');
  return {
    show: true,
    feature: 'image_generation',
    title: 'Image Forge requires Pro.',
    message: 'AI image generation is a Pro feature.',
    cta: 'Unlock Image Forge',
  };
}

/**
 * Check if adding more widgets should trigger paywall.
 */
export function checkWidgetPaywall(currentCount: number): PaywallTrigger {
  if (isPro()) return noTrigger('advanced_widgets');
  const limits = getUsageLimits();
  if (currentCount >= (limits.maxWidgets as number)) {
    return {
      show: true,
      feature: 'advanced_widgets',
      title: `Widget limit reached (${limits.maxWidgets}).`,
      message: 'Pro unlocks unlimited widgets, including blocker and focus overlay modes.',
      cta: 'Unlock Widgets',
    };
  }
  return noTrigger('advanced_widgets');
}

/**
 * Check if adding more Nexus sources should trigger paywall.
 */
export function checkNexusPaywall(currentSources: number): PaywallTrigger {
  if (isPro()) return noTrigger('cloud_sync');
  const limits = getUsageLimits();
  if (currentSources >= (limits.maxNexusSources as number)) {
    return {
      show: true,
      feature: 'cloud_sync',
      title: `Source limit reached (${limits.maxNexusSources}).`,
      message: 'Pro unlocks unlimited intelligence sources with AI summaries.',
      cta: 'Unlock Full Nexus',
    };
  }
  return noTrigger('cloud_sync');
}

// ═══════════════════════════════════════════
// PAYWALL UI COMPONENT HELPER
// ═══════════════════════════════════════════

/**
 * Generic feature gate check. Returns trigger if feature is blocked.
 */
export function checkFeatureAccess(feature: Feature): PaywallTrigger {
  if (canUseFeature(feature)) return noTrigger(feature);
  return {
    show: true,
    feature,
    title: 'Pro feature.',
    message: `This requires Valhalla Pro.`,
    cta: 'Upgrade to Pro',
  };
}

function noTrigger(feature: Feature): PaywallTrigger {
  return { show: false, feature, title: '', message: '', cta: '' };
}
