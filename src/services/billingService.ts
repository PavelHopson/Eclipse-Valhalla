/**
 * Eclipse Valhalla — Billing Service
 *
 * Abstracted subscription management.
 * Backend: Stripe (recommended). Architecture supports any provider.
 *
 * Flow:
 *   User → subscribe() → redirect to checkout → webhook confirms → tier updated
 *
 * Client-side: manages local tier state + validation via Supabase profile.
 * Server-side (future): Stripe webhooks → update profiles.tier via Edge Function.
 *
 * SECURITY NOTE:
 *   Tier changes MUST be validated server-side in production.
 *   Client-side tier is for UI rendering only.
 *   RLS policies should enforce feature access based on profiles.tier.
 */

import { Tier } from '../backend/schema/entities';
import { getSupabase, isCloudAvailable } from '../backend/supabaseClient';
import { setCurrentTier, getCurrentTier } from './subscriptionService';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface PlanConfig {
  id: string;
  tier: Tier;
  name: string;
  tagline: string;
  price: number;        // monthly USD, 0 = free
  priceAnnual: number;  // annual USD, 0 = free
  features: string[];
  limits: {
    quests: number | 'unlimited';
    widgets: number | 'unlimited';
    oracleMessages: number | 'unlimited';
    nexusSources: number | 'unlimited';
    imageGenerations: number | 'unlimited';
  };
  cta: string;
  highlighted: boolean;
}

export interface BillingState {
  currentTier: Tier;
  subscriptionId: string | null;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  loading: boolean;
}

export type BillingInterval = 'monthly' | 'annual';

// ═══════════════════════════════════════════
// PLAN DEFINITIONS
// ═══════════════════════════════════════════

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    tier: 'free',
    name: 'Wanderer',
    tagline: 'Begin the path.',
    price: 0,
    priceAnnual: 0,
    features: [
      'Up to 50 quests',
      'Basic calendar',
      'Basic Oracle (10 msgs/day)',
      '3 widgets',
      '5 news sources',
      'Local storage only',
    ],
    limits: {
      quests: 50,
      widgets: 3,
      oracleMessages: 10,
      nexusSources: 5,
      imageGenerations: 0,
    },
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    id: 'pro_monthly',
    tier: 'pro',
    name: 'Valhalla Pro',
    tagline: 'Total dominion.',
    price: 12,
    priceAnnual: 96,
    features: [
      'Unlimited quests',
      'Unlimited widgets',
      'Full Oracle access',
      'Unlimited Nexus sources',
      'AI summaries & enrichment',
      'Image Forge + TTS',
      'Cloud sync',
      'Custom themes',
      'Advanced gamification',
      'Priority support',
    ],
    limits: {
      quests: 'unlimited',
      widgets: 'unlimited',
      oracleMessages: 'unlimited',
      nexusSources: 'unlimited',
      imageGenerations: 'unlimited',
    },
    cta: 'Enter Valhalla Pro',
    highlighted: true,
  },
];

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════

let _billingState: BillingState = {
  currentTier: 'free',
  subscriptionId: null,
  periodEnd: null,
  cancelAtPeriodEnd: false,
  loading: false,
};

const BILLING_KEY = 'eclipse_billing';

function loadState(): void {
  try {
    const raw = localStorage.getItem(BILLING_KEY);
    if (raw) _billingState = { ..._billingState, ...JSON.parse(raw) };
    setCurrentTier(_billingState.currentTier);
  } catch {}
}

function saveState(): void {
  localStorage.setItem(BILLING_KEY, JSON.stringify(_billingState));
}

// Init on import
loadState();

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export function getBillingState(): BillingState {
  return { ..._billingState };
}

export function getPlans(): PlanConfig[] {
  return PLANS;
}

export function getCurrentPlan(): PlanConfig {
  return PLANS.find(p => p.tier === _billingState.currentTier) || PLANS[0];
}

/**
 * Initiate subscription. In production: redirects to Stripe Checkout.
 * Currently: sets tier locally (demo mode).
 */
export async function subscribe(tier: Tier, _interval: BillingInterval = 'monthly'): Promise<{ success: boolean; error?: string }> {
  _billingState.loading = true;

  // TODO: Production implementation
  // 1. Call backend: POST /api/billing/create-checkout-session
  //    Body: { tier, interval, userId }
  // 2. Backend creates Stripe Checkout Session
  // 3. Redirect to session.url
  // 4. Stripe webhook confirms payment → updates profiles.tier in Supabase
  //
  // const res = await fetch('/api/billing/checkout', {
  //   method: 'POST',
  //   body: JSON.stringify({ tier, interval }),
  // });
  // const { url } = await res.json();
  // window.location.href = url;

  // Demo mode: instant upgrade
  _billingState.currentTier = tier;
  _billingState.subscriptionId = `sub_demo_${Date.now()}`;
  _billingState.periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();
  _billingState.cancelAtPeriodEnd = false;
  _billingState.loading = false;

  setCurrentTier(tier);
  saveState();

  // Update cloud profile tier if available
  if (isCloudAvailable()) {
    const sb = getSupabase();
    const session = await sb?.auth.getSession();
    if (session?.data?.session?.user) {
      await sb?.from('profiles').update({ tier }).eq('id', session.data.session.user.id);
    }
  }

  return { success: true };
}

export async function cancelSubscription(): Promise<{ success: boolean }> {
  // TODO: Call Stripe API to cancel at period end
  _billingState.cancelAtPeriodEnd = true;
  saveState();
  return { success: true };
}

export function getUsage(): Record<string, { current: number; limit: number | 'unlimited' }> {
  const plan = getCurrentPlan();
  // TODO: Track real usage from localStorage/backend
  return {
    quests: { current: 0, limit: plan.limits.quests },
    widgets: { current: 0, limit: plan.limits.widgets },
    oracleMessages: { current: 0, limit: plan.limits.oracleMessages },
    nexusSources: { current: 0, limit: plan.limits.nexusSources },
  };
}
