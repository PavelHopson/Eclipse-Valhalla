/**
 * Eclipse Valhalla — Push Service
 *
 * Unified push notification management across platforms:
 * - Web Push API (browser)
 * - Capacitor PushNotifications (iOS/Android)
 * - Electron native Notification (desktop)
 *
 * Device registration + token management + permission flow.
 */

import { getPlatform, isNative } from '../mobile/mobileBridge';
import { desktop } from './desktopBridge';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface PushDevice {
  id: string;
  userId: string;
  platform: 'web' | 'ios' | 'android' | 'electron';
  token: string;
  appVersion: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushStatus {
  permission: PushPermissionStatus;
  registered: boolean;
  token: string | null;
  platform: string;
}

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════

let _token: string | null = null;
let _permission: PushPermissionStatus = 'default';

const DEVICE_KEY = 'eclipse_push_device';

// ═══════════════════════════════════════════
// PERMISSION
// ═══════════════════════════════════════════

export async function requestPermission(): Promise<PushPermissionStatus> {
  const platform = getPlatform();

  if (platform === 'electron') {
    // Electron notifications don't need explicit permission on most OS
    _permission = 'granted';
    return 'granted';
  }

  if (isNative()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications' as any);
      const result = await PushNotifications.requestPermissions();
      _permission = result.receive === 'granted' ? 'granted' : 'denied';
      return _permission;
    } catch {
      _permission = 'unsupported';
      return 'unsupported';
    }
  }

  // Web
  if (typeof Notification === 'undefined') {
    _permission = 'unsupported';
    return 'unsupported';
  }

  const result = await Notification.requestPermission();
  _permission = result as PushPermissionStatus;
  return _permission;
}

// ═══════════════════════════════════════════
// REGISTRATION
// ═══════════════════════════════════════════

export async function registerDevice(): Promise<string | null> {
  const platform = getPlatform();

  if (platform === 'electron') {
    // Electron doesn't use push tokens — uses local Notification API
    _token = `electron_${Date.now()}`;
    saveDeviceLocally(_token);
    return _token;
  }

  if (isNative()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications' as any);
      await PushNotifications.register();

      // Listen for token
      return new Promise((resolve) => {
        PushNotifications.addListener('registration', (token: any) => {
          _token = token.value;
          saveDeviceLocally(_token!);
          resolve(_token);
        });
        PushNotifications.addListener('registrationError', () => {
          resolve(null);
        });
        // Timeout fallback
        setTimeout(() => resolve(null), 10000);
      });
    } catch {
      return null;
    }
  }

  // Web Push — requires VAPID key and service worker
  // Architecture-ready, but needs backend VAPID configuration
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        _token = JSON.stringify(subscription.toJSON());
        saveDeviceLocally(_token);
        return _token;
      }
      // TODO: Subscribe with VAPID key from backend
      // const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: VAPID_KEY });
      console.info('[Push] Web Push requires VAPID key configuration.');
      return null;
    } catch {
      return null;
    }
  }

  return null;
}

export async function unregisterDevice(): Promise<void> {
  _token = null;
  localStorage.removeItem(DEVICE_KEY);

  if (isNative()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications' as any);
      await PushNotifications.removeAllListeners();
    } catch {}
  }
}

// ═══════════════════════════════════════════
// STATUS
// ═══════════════════════════════════════════

export function getPushStatus(): PushStatus {
  return {
    permission: _permission,
    registered: _token !== null,
    token: _token,
    platform: getPlatform(),
  };
}

// ═══════════════════════════════════════════
// SEND (test/local)
// ═══════════════════════════════════════════

/**
 * Send a test notification using available platform method.
 */
export async function sendTestPush(title: string, body: string): Promise<boolean> {
  const platform = getPlatform();

  if (platform === 'electron') {
    await desktop.showNotification(title, body, 'normal');
    return true;
  }

  if (isNative()) {
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications' as any);
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now(),
          title,
          body,
        }],
      });
      return true;
    } catch {}
  }

  // Web fallback
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    new Notification(title, { body });
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════
// LOCAL PERSISTENCE
// ═══════════════════════════════════════════

function saveDeviceLocally(token: string): void {
  try {
    const device: Partial<PushDevice> = {
      platform: getPlatform() as any,
      token,
      updatedAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      enabled: true,
    };
    localStorage.setItem(DEVICE_KEY, JSON.stringify(device));
  } catch {}
}

export function getLocalDevice(): Partial<PushDevice> | null {
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
