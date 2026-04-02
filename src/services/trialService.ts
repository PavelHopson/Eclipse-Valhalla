/**
 * Eclipse Valhalla — Trial Service
 *
 * Manages Pro trial periods, discount triggers, and urgency messaging.
 *
 * Trial: 7 days Pro access on signup (or via referral extension).
 * Urgency: countdown messaging as trial expires.
 * Discount: triggered at specific moments for conversion optimization.
 */

import { trackEvent } from './analyticsService';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface TrialState {
  active: boolean;
  startedAt: string | null;
  expiresAt: string | null;
  daysTotal: number;
  extensionDays: number;       // from referrals
  converted: boolean;          // upgraded to paid
  discountOffered: boolean;
  discountCode: string | null;
}

export interface TrialStatus {
  active: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  expired: boolean;
  converted: boolean;
  urgencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════

const DEFAULT_TRIAL_DAYS = 7;
const DISCOUNT_PERCENT = 30;

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const KEY = 'eclipse_trial';

function getState(): TrialState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || defaultState();
  } catch { return defaultState(); }
}

function saveState(s: TrialState): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function defaultState(): TrialState {
  return {
    active: false, startedAt: null, expiresAt: null,
    daysTotal: DEFAULT_TRIAL_DAYS, extensionDays: 0,
    converted: false, discountOffered: false, discountCode: null,
  };
}

// ═══════════════════════════════════════════
// START TRIAL
// ═══════════════════════════════════════════

export function startTrial(extraDays: number = 0): void {
  const s = getState();
  if (s.active || s.converted) return; // Already trialing or converted

  const totalDays = DEFAULT_TRIAL_DAYS + extraDays;
  const now = new Date();
  const expires = new Date(now.getTime() + totalDays * 86400000);

  s.active = true;
  s.startedAt = now.toISOString();
  s.expiresAt = expires.toISOString();
  s.daysTotal = totalDays;
  s.extensionDays = extraDays;
  saveState(s);

  trackEvent('trial_started', { days: totalDays });
}

/**
 * Extend trial (e.g., from referral reward).
 */
export function extendTrial(days: number): void {
  const s = getState();
  if (!s.active || !s.expiresAt) return;

  const current = new Date(s.expiresAt);
  current.setDate(current.getDate() + days);
  s.expiresAt = current.toISOString();
  s.extensionDays += days;
  s.daysTotal += days;
  saveState(s);

  trackEvent('trial_extended', { days, total: s.daysTotal });
}

/**
 * Mark trial as converted (user upgraded to paid).
 */
export function markConverted(): void {
  const s = getState();
  s.converted = true;
  s.active = false;
  saveState(s);
  trackEvent('trial_converted');
}

// ═══════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════

export function getTrialStatus(): TrialStatus {
  const s = getState();

  if (s.converted) {
    return { active: false, daysRemaining: 0, hoursRemaining: 0, expired: false, converted: true, urgencyLevel: 'none', message: '' };
  }

  if (!s.active || !s.expiresAt) {
    return { active: false, daysRemaining: 0, hoursRemaining: 0, expired: false, converted: false, urgencyLevel: 'none', message: 'No active trial.' };
  }

  const now = Date.now();
  const expires = new Date(s.expiresAt).getTime();
  const remaining = expires - now;
  const hoursRemaining = Math.max(0, Math.floor(remaining / 3600000));
  const daysRemaining = Math.max(0, Math.floor(remaining / 86400000));
  const expired = remaining <= 0;

  // Auto-expire
  if (expired && s.active) {
    const state = getState();
    state.active = false;
    saveState(state);
    trackEvent('trial_expired');
  }

  // Urgency levels
  let urgencyLevel: TrialStatus['urgencyLevel'] = 'none';
  let message = '';

  if (expired) {
    urgencyLevel = 'critical';
    message = 'Trial expired. Pro features locked. Upgrade to continue.';
  } else if (daysRemaining <= 1) {
    urgencyLevel = 'critical';
    message = `${hoursRemaining} hours remaining. Pro access expires soon.`;
  } else if (daysRemaining <= 2) {
    urgencyLevel = 'high';
    message = `${daysRemaining} days left on your trial. Don't lose access.`;
  } else if (daysRemaining <= 4) {
    urgencyLevel = 'medium';
    message = `${daysRemaining} days of Pro remaining.`;
  } else {
    urgencyLevel = 'low';
    message = `Pro trial: ${daysRemaining} days remaining.`;
  }

  return { active: !expired, daysRemaining, hoursRemaining, expired, converted: false, urgencyLevel, message };
}

// ═══════════════════════════════════════════
// DISCOUNT TRIGGERS
// ═══════════════════════════════════════════

/**
 * Check if a discount should be offered.
 * Triggered at: trial day 5, trial expiry, comeback after churning.
 */
export function checkDiscountTrigger(opts: {
  isComeback?: boolean;
}): { offer: boolean; percent: number; code: string; message: string } | null {
  const s = getState();
  const status = getTrialStatus();

  // Already offered or converted
  if (s.discountOffered || s.converted) return null;

  // Trigger: trial about to expire (2 days left)
  if (status.active && status.daysRemaining <= 2 && status.daysRemaining > 0) {
    return offerDiscount(s, 'Your trial is ending. Lock in Pro now.');
  }

  // Trigger: trial just expired
  if (status.expired) {
    return offerDiscount(s, 'Trial expired. Get Pro at a discount before this offer ends.');
  }

  // Trigger: comeback after 5+ days inactive
  if (opts.isComeback) {
    return offerDiscount(s, 'Welcome back. A special offer awaits.');
  }

  return null;
}

function offerDiscount(s: TrialState, message: string) {
  const code = `EV${DISCOUNT_PERCENT}OFF`;
  s.discountOffered = true;
  s.discountCode = code;
  saveState(s);
  trackEvent('discount_offered', { percent: DISCOUNT_PERCENT, code });

  return {
    offer: true,
    percent: DISCOUNT_PERCENT,
    code,
    message,
  };
}
