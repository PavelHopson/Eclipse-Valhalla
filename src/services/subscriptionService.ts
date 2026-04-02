/**
 * Eclipse Valhalla — Subscription Service
 *
 * Feature gating and tier management.
 * No payment integration yet — architecture-ready.
 *
 * Tiers: free, pro
 */

import { Tier } from '../backend/schema/entities';

// ═══════════════════════════════════════════
// FEATURE DEFINITIONS
// ═══════════════════════════════════════════

export type Feature =
  | 'advanced_widgets'
  | 'full_oracle'
  | 'image_generation'
  | 'tts'
  | 'cloud_sync'
  | 'advanced_gamification'
  | 'custom_themes'
  | 'sms_notifications'
  | 'email_notifications'
  | 'unlimited_quests'
  | 'focus_analytics'
  | 'data_export';

interface FeatureConfig {
  name: string;
  description: string;
  tiers: Tier[];
}

const FEATURE_MAP: Record<Feature, FeatureConfig> = {
  advanced_widgets:      { name: 'Advanced Widgets', description: 'Blocker and focus overlay widgets', tiers: ['pro'] },
  full_oracle:           { name: 'Full Oracle Access', description: 'Unlimited AI conversations', tiers: ['pro'] },
  image_generation:      { name: 'Image Forge', description: 'AI image generation', tiers: ['pro'] },
  tts:                   { name: 'Voice Synthesis', description: 'Text-to-speech', tiers: ['pro'] },
  cloud_sync:            { name: 'Cloud Sync', description: 'Cross-device synchronization', tiers: ['pro'] },
  advanced_gamification: { name: 'Full Discipline System', description: 'XP, levels, streaks', tiers: ['pro'] },
  custom_themes:         { name: 'Custom Themes', description: 'Accent theme selection', tiers: ['pro'] },
  sms_notifications:     { name: 'SMS Notifications', description: 'Critical quest alerts via SMS', tiers: ['pro'] },
  email_notifications:   { name: 'Email Notifications', description: 'Quest reminders via email', tiers: ['pro'] },
  unlimited_quests:      { name: 'Unlimited Quests', description: 'No quest limit', tiers: ['free', 'pro'] },
  focus_analytics:       { name: 'Focus Analytics', description: 'Detailed focus session reports', tiers: ['pro'] },
  data_export:           { name: 'Data Export', description: 'Export all data as JSON', tiers: ['free', 'pro'] },
};

// ═══════════════════════════════════════════
// USAGE LIMITS
// ═══════════════════════════════════════════

interface UsageLimits {
  maxQuests: number;
  maxWidgets: number;
  maxOracleMessagesPerDay: number;
  maxImageGenerationsPerDay: number;
  maxFocusSessionsPerDay: number;
  maxNexusSources: number;
}

const TIER_LIMITS: Record<Tier, UsageLimits> = {
  free: {
    maxQuests: 50,
    maxWidgets: 3,
    maxOracleMessagesPerDay: 10,
    maxImageGenerationsPerDay: 0,
    maxFocusSessionsPerDay: 5,
    maxNexusSources: 5,
  },
  pro: {
    maxQuests: Infinity,
    maxWidgets: Infinity,
    maxOracleMessagesPerDay: Infinity,
    maxImageGenerationsPerDay: Infinity,
    maxFocusSessionsPerDay: Infinity,
    maxNexusSources: Infinity,
  },
};

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════

let _currentTier: Tier = 'free';

export function setCurrentTier(tier: Tier): void {
  _currentTier = tier;
}

export function getCurrentTier(): Tier {
  return _currentTier;
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Check if current tier has access to a feature.
 */
export function canUseFeature(feature: Feature): boolean {
  const config = FEATURE_MAP[feature];
  if (!config) return false;
  return config.tiers.includes(_currentTier);
}

/**
 * Check if user is Pro tier.
 */
export function isPro(): boolean {
  return _currentTier === 'pro';
}

/**
 * Get usage limits for current tier.
 */
export function getUsageLimits(): UsageLimits {
  return { ...TIER_LIMITS[_currentTier] };
}

/**
 * Check if a specific usage is within limits.
 */
export function isWithinLimit(metric: keyof UsageLimits, currentValue: number): boolean {
  const limits = TIER_LIMITS[_currentTier];
  return currentValue < limits[metric];
}

/**
 * Get all features with their availability for current tier.
 */
export function getFeatureList(): Array<FeatureConfig & { feature: Feature; available: boolean }> {
  return Object.entries(FEATURE_MAP).map(([key, config]) => ({
    ...config,
    feature: key as Feature,
    available: config.tiers.includes(_currentTier),
  }));
}

// ═══════════════════════════════════════════
// UPGRADE (STUB — no payment integration)
// ═══════════════════════════════════════════

/**
 * Upgrade user to Pro. In production: integrate with Stripe/Paddle.
 * Currently: just sets the tier locally.
 *
 * NOTE: In production, tier changes MUST be validated server-side
 * via Supabase RLS or edge functions. Client-side tier setting
 * is for development/demo only.
 */
export async function upgradeToPro(): Promise<boolean> {
  // TODO: Implement payment flow
  // const { sessionUrl } = await fetch('/api/create-checkout-session').then(r => r.json());
  // window.location.href = sessionUrl;

  console.warn('[Subscription] upgradeToPro() called — demo mode, no payment.');
  _currentTier = 'pro';
  return true;
}
