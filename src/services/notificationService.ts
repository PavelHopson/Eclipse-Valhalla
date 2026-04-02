/**
 * Eclipse Valhalla — Notification Service
 *
 * Multi-channel notification system with escalation.
 *
 * Channels:
 *   1. In-App (toast/modal) — IMPLEMENTED
 *   2. Browser Push          — IMPLEMENTED
 *   3. Email                 — STUB (ready for backend)
 *   4. SMS                   — STUB (ready for backend)
 *
 * Escalation:
 *   t+0    → in-app
 *   t+5m   → push
 *   t+30m  → email
 *   t+2h   → SMS
 */

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type NotificationType = 'info' | 'warning' | 'critical';
export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';

export interface NotificationPayload {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  questId?: string;
  timestamp: number;
  channel: NotificationChannel;
  read: boolean;
  dismissed: boolean;
}

export interface EscalationState {
  questId: string;
  currentLevel: number;     // 0=in-app, 1=push, 2=email, 3=sms
  lastEscalatedAt: number;
  startedAt: number;
}

// ═══════════════════════════════════════════
// ESCALATION CONFIG
// ═══════════════════════════════════════════

const ESCALATION_THRESHOLDS_MS = [
  0,                     // Level 0: immediate in-app
  5 * 60 * 1000,         // Level 1: +5 min → push
  30 * 60 * 1000,        // Level 2: +30 min → email
  2 * 60 * 60 * 1000,    // Level 3: +2 hours → SMS
];

const ESCALATION_CHANNELS: NotificationChannel[] = ['in_app', 'push', 'email', 'sms'];

// ═══════════════════════════════════════════
// NOTIFICATION STORE (in-memory + localStorage)
// ═══════════════════════════════════════════

let notifications: NotificationPayload[] = [];
let escalations: Map<string, EscalationState> = new Map();
let listeners: Set<() => void> = new Set();

// Load from localStorage
try {
  const saved = localStorage.getItem('eclipse_notifications');
  if (saved) notifications = JSON.parse(saved);
} catch {}

function persist() {
  try {
    // Keep last 100 notifications
    const trimmed = notifications.slice(-100);
    localStorage.setItem('eclipse_notifications', JSON.stringify(trimmed));
  } catch {}
}

function notifyListeners() {
  listeners.forEach(fn => fn());
}

// ═══════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════

/**
 * Subscribe to notification changes.
 */
export function subscribeNotifications(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Get all notifications.
 */
export function getNotifications(): NotificationPayload[] {
  return [...notifications];
}

/**
 * Get unread count.
 */
export function getUnreadCount(): number {
  return notifications.filter(n => !n.read && !n.dismissed).length;
}

/**
 * Mark notification as read.
 */
export function markRead(id: string): void {
  notifications = notifications.map(n =>
    n.id === id ? { ...n, read: true } : n
  );
  persist();
  notifyListeners();
}

/**
 * Dismiss notification.
 */
export function dismissNotification(id: string): void {
  notifications = notifications.map(n =>
    n.id === id ? { ...n, dismissed: true } : n
  );
  persist();
  notifyListeners();
}

/**
 * Clear all notifications.
 */
export function clearAllNotifications(): void {
  notifications = [];
  persist();
  notifyListeners();
}

// ═══════════════════════════════════════════
// CHANNEL IMPLEMENTATIONS
// ═══════════════════════════════════════════

/**
 * In-App notification (toast). Returns the created notification.
 */
export function notifyInApp(
  title: string,
  message: string,
  type: NotificationType = 'info',
  questId?: string
): NotificationPayload {
  const notification: NotificationPayload = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    title,
    message,
    type,
    questId,
    timestamp: Date.now(),
    channel: 'in_app',
    read: false,
    dismissed: false,
  };

  notifications.push(notification);
  persist();
  notifyListeners();

  // Play sound for critical
  if (type === 'critical') {
    playNotifSound(660, 0.15);
  } else if (type === 'warning') {
    playNotifSound(440, 0.08);
  }

  return notification;
}

/**
 * Browser Push notification.
 * Uses Electron native notification when available, falls back to browser API.
 */
export function notifyPush(
  title: string,
  message: string,
  type: NotificationType = 'info',
  questId?: string
): NotificationPayload | null {
  const notification = notifyInApp(title, message, type, questId);
  notification.channel = 'push';

  // Try Electron native notification first
  if (typeof window !== 'undefined' && window.valhalla?.isDesktop) {
    const urgency = type === 'critical' ? 'critical' : type === 'warning' ? 'normal' : 'low';
    window.valhalla.showNotification({ title, body: message, urgency }).catch(() => {});
    return notification;
  }

  // Fallback: browser Notification API
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: questId || notification.id,
      });
    } catch (e) {
      console.warn('Push notification failed:', e);
    }
  }

  return notification;
}

/**
 * Email notification — STUB.
 * In production: POST to backend API endpoint.
 */
export function notifyEmail(
  title: string,
  message: string,
  type: NotificationType = 'info',
  questId?: string
): NotificationPayload {
  const notification = notifyInApp(title, `[EMAIL STUB] ${message}`, type, questId);
  notification.channel = 'email';

  console.log(`[NOTIFICATION] Email would be sent: "${title}" — ${message}`);

  // TODO: Implement with backend
  // await fetch('/api/notifications/email', { method: 'POST', body: JSON.stringify({ title, message, questId }) });

  return notification;
}

/**
 * SMS notification — STUB.
 * In production: POST to backend API with Twilio/SNS integration.
 */
export function notifySMS(
  title: string,
  message: string,
  type: NotificationType = 'info',
  questId?: string
): NotificationPayload {
  const notification = notifyInApp(title, `[SMS STUB] ${message}`, type, questId);
  notification.channel = 'sms';

  console.log(`[NOTIFICATION] SMS would be sent: "${title}" — ${message}`);

  // TODO: Implement with backend
  // await fetch('/api/notifications/sms', { method: 'POST', body: JSON.stringify({ title, message, questId }) });

  return notification;
}

// ═══════════════════════════════════════════
// ESCALATION ENGINE
// ═══════════════════════════════════════════

/**
 * Start escalation tracking for a quest.
 */
export function startEscalation(questId: string): void {
  if (escalations.has(questId)) return;
  escalations.set(questId, {
    questId,
    currentLevel: 0,
    lastEscalatedAt: Date.now(),
    startedAt: Date.now(),
  });
}

/**
 * Stop escalation (quest completed or dismissed).
 */
export function stopEscalation(questId: string): void {
  escalations.delete(questId);
}

/**
 * Process escalation tick. Call periodically (e.g., every 60s).
 * Returns list of notifications triggered.
 */
export function processEscalations(
  getQuestTitle: (questId: string) => string | undefined
): NotificationPayload[] {
  const now = Date.now();
  const triggered: NotificationPayload[] = [];

  escalations.forEach((state, questId) => {
    const elapsed = now - state.startedAt;
    const nextLevel = state.currentLevel + 1;

    if (nextLevel >= ESCALATION_THRESHOLDS_MS.length) return;
    if (elapsed < ESCALATION_THRESHOLDS_MS[nextLevel]) return;

    // Time to escalate
    const channel = ESCALATION_CHANNELS[nextLevel];
    const title = getQuestTitle(questId) || 'Quest';
    const type: NotificationType = nextLevel >= 2 ? 'critical' : 'warning';

    let notification: NotificationPayload;

    switch (channel) {
      case 'push':
        notification = notifyPush(
          `Quest Overdue: ${title}`,
          `You've been ignoring this for ${Math.round(elapsed / 60000)} minutes.`,
          type,
          questId
        )!;
        break;
      case 'email':
        notification = notifyEmail(
          `URGENT: ${title}`,
          `Quest "${title}" has been overdue for ${Math.round(elapsed / 60000)} minutes. Act now.`,
          type,
          questId
        );
        break;
      case 'sms':
        notification = notifySMS(
          `CRITICAL: ${title}`,
          `Quest "${title}" overdue ${Math.round(elapsed / 3600000)}h. This is your final warning.`,
          'critical',
          questId
        );
        break;
      default:
        notification = notifyInApp(`Quest Reminder: ${title}`, 'This quest needs your attention.', type, questId);
    }

    triggered.push(notification);

    // Update escalation state
    state.currentLevel = nextLevel;
    state.lastEscalatedAt = now;
  });

  return triggered;
}

// ═══════════════════════════════════════════
// SOUND
// ═══════════════════════════════════════════

function playNotifSound(frequency: number, volume: number) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
    setTimeout(() => osc.stop(), 500);
  } catch {}
}
