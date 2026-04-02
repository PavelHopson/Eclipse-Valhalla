/**
 * Eclipse Valhalla — Mobile Bridge
 *
 * Abstraction for Capacitor native APIs.
 * Graceful fallback for web/desktop.
 */

// ═══════════════════════════════════════════
// PLATFORM DETECTION
// ═══════════════════════════════════════════

export function getPlatform(): 'ios' | 'android' | 'web' | 'electron' {
  if (typeof window !== 'undefined') {
    if ((window as any).valhalla?.isDesktop) return 'electron';
    const ua = navigator.userAgent.toLowerCase();
    // Capacitor injects this
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      return ua.includes('iphone') || ua.includes('ipad') ? 'ios' : 'android';
    }
    if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
    if (ua.includes('android')) return 'android';
  }
  return 'web';
}

export function isMobile(): boolean {
  const p = getPlatform();
  return p === 'ios' || p === 'android';
}

export function isNative(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Capacitor?.isNativePlatform?.();
}

export function isIOS(): boolean {
  return getPlatform() === 'ios';
}

export function isAndroid(): boolean {
  return getPlatform() === 'android';
}

// ═══════════════════════════════════════════
// HAPTICS (stub — requires @capacitor/haptics)
// ═══════════════════════════════════════════

export async function hapticsImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  if (!isNative()) return;
  try {
    // Dynamic import so it doesn't break web builds
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics' as any);
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy };
    await Haptics.impact({ style: map[style] });
  } catch {
    // Plugin not installed — silent fallback
  }
}

// ═══════════════════════════════════════════
// LOCAL NOTIFICATIONS (stub — requires @capacitor/local-notifications)
// ═══════════════════════════════════════════

export async function scheduleLocalNotification(opts: {
  title: string;
  body: string;
  id?: number;
  scheduleAt?: Date;
}): Promise<void> {
  if (!isNative()) {
    // Web fallback
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(opts.title, { body: opts.body });
    }
    return;
  }
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications' as any);
    await LocalNotifications.schedule({
      notifications: [{
        id: opts.id || Date.now(),
        title: opts.title,
        body: opts.body,
        schedule: opts.scheduleAt ? { at: opts.scheduleAt } : undefined,
      }],
    });
  } catch {
    // Plugin not installed
  }
}

// ═══════════════════════════════════════════
// PUSH REGISTRATION (stub — requires @capacitor/push-notifications)
// ═══════════════════════════════════════════

export async function registerPush(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications' as any);
    const result = await PushNotifications.requestPermissions();
    if (result.receive === 'granted') {
      await PushNotifications.register();
      // Token comes via listener — return null here, handle via event
      return null;
    }
  } catch {}
  return null;
}

// ═══════════════════════════════════════════
// STATUS BAR (stub)
// ═══════════════════════════════════════════

export async function setStatusBarStyle(style: 'dark' | 'light'): Promise<void> {
  if (!isNative()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar' as any);
    await StatusBar.setStyle({ style: style === 'dark' ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: '#0A0A0F' });
  } catch {}
}
