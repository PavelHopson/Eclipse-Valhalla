/**
 * Eclipse Valhalla — Desktop Bridge
 *
 * Abstraction layer between renderer code and Electron's preload API.
 * Falls back to no-ops when running in browser (non-Electron).
 *
 * Usage: import { desktop } from './services/desktopBridge';
 *        if (desktop.isDesktop) { desktop.setAlwaysOnTop(true); }
 */

// ═══════════════════════════════════════════
// TYPE DECLARATION
// ═══════════════════════════════════════════

interface ValhallaElectronAPI {
  platform: string;
  isDesktop: boolean;

  // Widget / Overlay
  toggleOverlayMode: (enabled: boolean) => Promise<any>;
  setClickThrough: (enabled: boolean) => Promise<any>;
  setOpacity: (opacity: number) => Promise<any>;
  enterFocusMode: () => Promise<any>;
  exitFocusMode: () => Promise<any>;
  getWindowState: () => Promise<{ overlay: boolean; alwaysOnTop: boolean; clickThrough: boolean; opacity: number }>;
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward?: boolean }) => void;

  // System
  showNotification: (opts: { title: string; body: string; urgency?: string }) => Promise<any>;
  minimizeToTray: () => Promise<any>;
  restore: () => Promise<any>;
  setAlwaysOnTop: (enabled: boolean) => Promise<any>;
  setAutoStart: (enabled: boolean) => Promise<{ success: boolean; enabled?: boolean }>;
  getAutoStart: () => Promise<{ enabled: boolean }>;
  getAppInfo: () => Promise<{ version: string; name: string; platform: string; isPackaged: boolean }>;
  pickVideoFile: () => Promise<{ canceled: boolean; path?: string; fileUrl?: string; error?: string }>;
}

declare global {
  interface Window {
    valhalla?: ValhallaElectronAPI;
  }
}

// ═══════════════════════════════════════════
// BRIDGE IMPLEMENTATION
// ═══════════════════════════════════════════

const noop = async (..._args: any[]) => ({});
const noopVoid = (..._args: any[]) => {};

class DesktopBridge {
  /** True when running inside Electron */
  get isDesktop(): boolean {
    return !!(typeof window !== 'undefined' && window.valhalla?.isDesktop);
  }

  get platform(): string {
    return window.valhalla?.platform || 'web';
  }

  private get api(): ValhallaElectronAPI | null {
    return typeof window !== 'undefined' ? window.valhalla || null : null;
  }

  // ── OVERLAY ──

  async toggleOverlayMode(enabled: boolean) {
    return this.api?.toggleOverlayMode(enabled) ?? {};
  }

  async setClickThrough(enabled: boolean) {
    return this.api?.setClickThrough(enabled) ?? {};
  }

  async setOpacity(opacity: number) {
    return this.api?.setOpacity(opacity) ?? {};
  }

  setIgnoreMouseEvents(ignore: boolean, options?: { forward?: boolean }) {
    this.api?.setIgnoreMouseEvents(ignore, options);
  }

  // ── FOCUS MODE ──

  async enterFocusMode() {
    return this.api?.enterFocusMode() ?? {};
  }

  async exitFocusMode() {
    return this.api?.exitFocusMode() ?? {};
  }

  // ── WINDOW STATE ──

  async getWindowState() {
    return this.api?.getWindowState() ?? {
      overlay: false,
      alwaysOnTop: false,
      clickThrough: false,
      opacity: 1.0,
    };
  }

  // ── NOTIFICATIONS ──

  async showNotification(title: string, body: string, urgency: 'low' | 'normal' | 'critical' = 'normal') {
    if (this.api) {
      return this.api.showNotification({ title, body, urgency });
    }
    // Fallback: browser Notification API
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    return {};
  }

  // ── TRAY ──

  async minimizeToTray() {
    return this.api?.minimizeToTray() ?? {};
  }

  async restore() {
    return this.api?.restore() ?? {};
  }

  // ── ALWAYS ON TOP ──

  async setAlwaysOnTop(enabled: boolean) {
    return this.api?.setAlwaysOnTop(enabled) ?? {};
  }

  // ── AUTO START ──

  async setAutoStart(enabled: boolean) {
    return this.api?.setAutoStart(enabled) ?? { success: false };
  }

  async getAutoStart() {
    return this.api?.getAutoStart() ?? { enabled: false };
  }

  // ── APP INFO ──

  async getAppInfo() {
    return this.api?.getAppInfo() ?? {
      version: '2.0.0',
      name: 'Eclipse Valhalla',
      platform: 'web',
      isPackaged: false,
    };
  }

  async pickVideoFile() {
    return this.api?.pickVideoFile() ?? { canceled: true };
  }
}

// ═══════════════════════════════════════════
// SINGLETON EXPORT
// ═══════════════════════════════════════════

export const desktop = new DesktopBridge();
