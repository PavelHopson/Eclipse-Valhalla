/**
 * Eclipse Valhalla — Contextual Telegram CTA
 *
 * Telegram as behavioral intervention, not just "contact us".
 * Placed at critical psychological moments:
 *   - After streak break (accountability)
 *   - After repeated escapes (intervention)
 *   - After success streak (push further)
 *
 * + Click tracking for conversion analysis.
 */

import { trackEvent } from './analyticsService';

// ═══════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════

const TELEGRAM_URL = 'https://t.me/pfrfrpfr';

// ═══════════════════════════════════════════
// CONTEXTUAL MESSAGES
// ═══════════════════════════════════════════

export type CTAContext = 'streak_break' | 'escape_repeat' | 'success_streak' | 'generic' | 'landing';

interface CTAConfig {
  text: string;
  subtext?: string;
  buttonLabel: string;
  tone: 'challenge' | 'support' | 'neutral';
}

const CTA_CONFIGS: Record<CTAContext, CTAConfig> = {
  streak_break: {
    text: 'Streak broken.',
    subtext: 'Need accountability?',
    buttonLabel: 'Get direct guidance',
    tone: 'challenge',
  },
  escape_repeat: {
    text: 'Multiple escapes detected.',
    subtext: 'This pattern needs intervention.',
    buttonLabel: 'Talk to the system creator',
    tone: 'challenge',
  },
  success_streak: {
    text: 'You\'re executing consistently.',
    subtext: 'Ready to push further?',
    buttonLabel: 'Get advanced guidance',
    tone: 'support',
  },
  generic: {
    text: 'Direct access to the creator.',
    buttonLabel: 'Message on Telegram',
    tone: 'neutral',
  },
  landing: {
    text: 'Questions? Feedback?',
    buttonLabel: 'Message the creator',
    tone: 'neutral',
  },
};

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

export function getCTAConfig(context: CTAContext): CTAConfig {
  return CTA_CONFIGS[context];
}

export function getTelegramURL(): string {
  return TELEGRAM_URL;
}

/**
 * Open Telegram with tracking.
 */
export function openTelegram(context: CTAContext, source: string): void {
  // Track click
  trackEvent('telegram_cta_click', { context, source });

  // Log locally for admin analytics
  try {
    const key = 'eclipse_telegram_clicks';
    const clicks = JSON.parse(localStorage.getItem(key) || '[]');
    clicks.push({ context, source, timestamp: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(clicks.slice(-100)));
  } catch {}

  // Open
  window.open(TELEGRAM_URL, '_blank', 'noopener');
}

/**
 * Get total click count (for admin).
 */
export function getTelegramClickCount(): number {
  try {
    return JSON.parse(localStorage.getItem('eclipse_telegram_clicks') || '[]').length;
  } catch { return 0; }
}

// ═══════════════════════════════════════════
// TRIGGER CONDITIONS
// ═══════════════════════════════════════════

/**
 * Should we show Telegram CTA? Returns context or null.
 */
export function shouldShowCTA(opts: {
  streakBroken: boolean;
  escapeCount: number;
  completedToday: number;
  streak: number;
}): CTAContext | null {
  // After streak break (high priority)
  if (opts.streakBroken) return 'streak_break';

  // After 3+ escapes in session
  if (opts.escapeCount >= 3) return 'escape_repeat';

  // After 3+ day streak with 2+ completions today (positive)
  if (opts.streak >= 3 && opts.completedToday >= 2) return 'success_streak';

  return null;
}
