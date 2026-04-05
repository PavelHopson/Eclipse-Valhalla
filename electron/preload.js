/**
 * Eclipse Valhalla — Preload Script
 *
 * Secure bridge between Electron main process and renderer.
 * Exposes window.valhalla API via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('valhalla', {

  // ── PLATFORM ──
  platform: process.platform,
  isDesktop: true,

  // ═══════════════════════════════════════
  // WIDGET / OVERLAY
  // ═══════════════════════════════════════

  /** Toggle overlay mode (transparent, always-on-top) */
  toggleOverlayMode: (enabled) =>
    ipcRenderer.invoke('widget:toggleOverlay', enabled),

  /** Set click-through (mouse events pass through window) */
  setClickThrough: (enabled) =>
    ipcRenderer.invoke('widget:setClickThrough', enabled),

  /** Set window opacity (0.1 – 1.0) */
  setOpacity: (opacity) =>
    ipcRenderer.invoke('widget:setOpacity', opacity),

  /** Enter mini/focus mode (small overlay window) */
  enterFocusMode: () =>
    ipcRenderer.invoke('widget:enterFocusMode'),

  /** Exit mini/focus mode */
  exitFocusMode: () =>
    ipcRenderer.invoke('widget:exitFocusMode'),

  /** Get current window state */
  getWindowState: () =>
    ipcRenderer.invoke('widget:getState'),

  /**
   * Dynamic per-region click-through control.
   * Call with (true, { forward: true }) when mouse is over non-widget area.
   * Call with (false) when mouse enters a widget.
   */
  setIgnoreMouseEvents: (ignore, options) =>
    ipcRenderer.send('widget:setIgnoreMouseEvents', ignore, options),

  // ═══════════════════════════════════════
  // SYSTEM
  // ═══════════════════════════════════════

  /** Show native OS notification */
  showNotification: ({ title, body, urgency }) =>
    ipcRenderer.invoke('system:notify', { title, body, urgency }),

  /** Minimize window to system tray */
  minimizeToTray: () =>
    ipcRenderer.invoke('system:minimizeToTray'),

  /** Restore window from tray */
  restore: () =>
    ipcRenderer.invoke('system:restore'),

  /** Set always-on-top */
  setAlwaysOnTop: (enabled) =>
    ipcRenderer.invoke('system:setAlwaysOnTop', enabled),

  /** Set auto-start on login */
  setAutoStart: (enabled) =>
    ipcRenderer.invoke('system:setAutoStart', enabled),

  /** Get auto-start status */
  getAutoStart: () =>
    ipcRenderer.invoke('system:getAutoStart'),

  /** Get app info */
  getAppInfo: () =>
    ipcRenderer.invoke('system:getInfo'),

  /** Pick a local workout video file */
  pickVideoFile: () =>
    ipcRenderer.invoke('system:pickVideoFile'),
});
