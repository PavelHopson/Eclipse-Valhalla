/**
 * Eclipse Valhalla — IPC: Widget Channel
 *
 * Handles communication between renderer (widget system)
 * and main process (window management).
 */

import { ipcMain } from 'electron';
import {
  setOverlayMode,
  setClickThrough,
  setWindowOpacity,
  enterFocusMode,
  exitFocusMode,
  getWindowState,
  getMainWindow,
} from '../windowManager.js';

// ═══════════════════════════════════════════
// REGISTER IPC HANDLERS
// ═══════════════════════════════════════════

export function registerWidgetIPC() {

  // Toggle overlay mode
  ipcMain.handle('widget:toggleOverlay', (_event, enabled) => {
    setOverlayMode(enabled);
    return getWindowState();
  });

  // Set click-through (for overlay widget gaps)
  ipcMain.handle('widget:setClickThrough', (_event, enabled) => {
    setClickThrough(enabled);
    return { success: true };
  });

  // Set widget layer opacity
  ipcMain.handle('widget:setOpacity', (_event, opacity) => {
    setWindowOpacity(opacity);
    return { success: true };
  });

  // Enter focus/mini mode
  ipcMain.handle('widget:enterFocusMode', () => {
    enterFocusMode();
    return { success: true };
  });

  // Exit focus/mini mode
  ipcMain.handle('widget:exitFocusMode', () => {
    exitFocusMode();
    return { success: true };
  });

  // Get current window state
  ipcMain.handle('widget:getState', () => {
    return getWindowState();
  });

  // Dynamic ignore mouse events (per-region click-through)
  // Called by renderer when mouse enters/leaves widget areas
  ipcMain.on('widget:setIgnoreMouseEvents', (_event, ignore, options) => {
    const win = getMainWindow();
    if (win) {
      win.setIgnoreMouseEvents(ignore, options || {});
    }
  });
}
