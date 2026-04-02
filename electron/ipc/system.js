/**
 * Eclipse Valhalla — IPC: System Channel
 *
 * Handles system-level operations:
 * - Native notifications
 * - Tray control
 * - Auto-start
 * - App info
 */

import { ipcMain, Notification, app } from 'electron';
import { minimizeToTray, restoreFromTray, setAlwaysOnTop } from '../windowManager.js';
import { updateTrayMenu } from '../tray.js';

// ═══════════════════════════════════════════
// REGISTER IPC HANDLERS
// ═══════════════════════════════════════════

export function registerSystemIPC() {

  // ── NATIVE NOTIFICATION ──
  ipcMain.handle('system:notify', (_event, { title, body, urgency }) => {
    if (!Notification.isSupported()) {
      return { success: false, reason: 'Notifications not supported' };
    }

    const notification = new Notification({
      title: title || 'Eclipse Valhalla',
      body: body || '',
      icon: undefined, // Uses app icon
      urgency: urgency || 'normal', // 'low' | 'normal' | 'critical'
      silent: urgency !== 'critical',
    });

    notification.show();

    // Click notification → restore window
    notification.on('click', () => {
      restoreFromTray();
    });

    return { success: true };
  });

  // ── MINIMIZE TO TRAY ──
  ipcMain.handle('system:minimizeToTray', () => {
    minimizeToTray();
    return { success: true };
  });

  // ── RESTORE FROM TRAY ──
  ipcMain.handle('system:restore', () => {
    restoreFromTray();
    return { success: true };
  });

  // ── ALWAYS ON TOP ──
  ipcMain.handle('system:setAlwaysOnTop', (_event, enabled) => {
    setAlwaysOnTop(enabled);
    updateTrayMenu();
    return { success: true };
  });

  // ── AUTO START ──
  ipcMain.handle('system:setAutoStart', (_event, enabled) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true,
      });
      return { success: true, enabled };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });

  ipcMain.handle('system:getAutoStart', () => {
    try {
      const settings = app.getLoginItemSettings();
      return { enabled: settings.openAtLogin };
    } catch {
      return { enabled: false };
    }
  });

  // ── APP INFO ──
  ipcMain.handle('system:getInfo', () => {
    return {
      version: app.getVersion(),
      name: app.getName(),
      platform: process.platform,
      isPackaged: app.isPackaged,
    };
  });
}
