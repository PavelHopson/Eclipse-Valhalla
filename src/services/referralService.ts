/**
 * Eclipse Valhalla — Referral Service
 *
 * Invite system with tracking.
 * Referrer gets Pro trial extension. Invitee gets onboarding boost.
 *
 * Architecture:
 *   User generates invite code → shares link → invitee signs up with code
 *   → both get rewards → tracked for analytics
 *
 * Backend: Supabase table (referrals). Client: local tracking + cloud-ready.
 */

import { trackEvent } from './analyticsService';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: string;
  uses: number;
  maxUses: number;
}

export interface ReferralStats {
  code: string;
  totalInvites: number;
  acceptedInvites: number;
  rewardEarned: boolean;
}

export interface InviteReward {
  type: 'pro_trial_days' | 'xp_bonus';
  value: number;
  description: string;
}

// ═══════════════════════════════════════════
// REWARDS CONFIG
// ═══════════════════════════════════════════

export const REFERRAL_REWARDS = {
  referrer: {
    perInvite: { type: 'pro_trial_days' as const, value: 3, description: '+3 days Pro trial per invite' },
    milestones: [
      { invites: 3, reward: { type: 'pro_trial_days' as const, value: 7, description: '3 invites → +7 days Pro' } },
      { invites: 10, reward: { type: 'pro_trial_days' as const, value: 30, description: '10 invites → +30 days Pro' } },
    ],
  },
  invitee: {
    signupBonus: { type: 'xp_bonus' as const, value: 100, description: '+100 XP welcome bonus' },
  },
};

// ═══════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════

const KEY = 'eclipse_referral';

interface ReferralState {
  myCode: string | null;
  invitesSent: string[];    // timestamps
  invitesAccepted: number;
  referredBy: string | null;
  rewardsEarned: InviteReward[];
}

function getState(): ReferralState {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null') || defaultState();
  } catch { return defaultState(); }
}

function saveState(s: ReferralState): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function defaultState(): ReferralState {
  return { myCode: null, invitesSent: [], invitesAccepted: 0, referredBy: null, rewardsEarned: [] };
}

// ═══════════════════════════════════════════
// CODE GENERATION
// ═══════════════════════════════════════════

export function getOrCreateCode(userId: string): string {
  const s = getState();
  if (s.myCode) return s.myCode;

  // Generate: EV-{4chars from userId}-{4 random}
  const prefix = userId.replace(/[^a-z0-9]/gi, '').slice(0, 4).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  s.myCode = `EV-${prefix}-${suffix}`;
  saveState(s);

  // TODO: Register in Supabase
  // await supabase.from('referrals').insert({ code: s.myCode, user_id: userId });

  return s.myCode;
}

// ═══════════════════════════════════════════
// INVITE LINK
// ═══════════════════════════════════════════

export function getInviteLink(code: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://eclipse-valhalla.app';
  return `${base}?ref=${code}`;
}

export function getInviteMessage(code: string): { title: string; text: string; url: string } {
  const url = getInviteLink(code);
  return {
    title: 'Eclipse Valhalla — Control your chaos.',
    text: `Join Eclipse Valhalla. Use my code ${code} for a welcome bonus. ${url}`,
    url,
  };
}

// ═══════════════════════════════════════════
// SHARE
// ═══════════════════════════════════════════

export async function shareInvite(code: string): Promise<boolean> {
  const msg = getInviteMessage(code);
  const s = getState();

  // Track
  s.invitesSent.push(new Date().toISOString());
  saveState(s);
  trackEvent('invite_shared', { code });

  // Web Share API
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: msg.title, text: msg.text, url: msg.url });
      return true;
    } catch {}
  }

  // Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(msg.text);
    return true;
  } catch {}

  return false;
}

// ═══════════════════════════════════════════
// REFERRAL DETECTION (on signup/load)
// ═══════════════════════════════════════════

export function detectReferralCode(): string | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('ref') || null;
}

export function applyReferralCode(code: string): void {
  const s = getState();
  if (s.referredBy) return; // Already referred
  s.referredBy = code;
  saveState(s);
  trackEvent('referral_applied', { code });

  // TODO: Notify referrer via backend
  // await supabase.rpc('accept_referral', { code });
}

// ═══════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════

export function getReferralStats(): ReferralStats {
  const s = getState();
  return {
    code: s.myCode || '',
    totalInvites: s.invitesSent.length,
    acceptedInvites: s.invitesAccepted,
    rewardEarned: s.rewardsEarned.length > 0,
  };
}
