/**
 * Eclipse Valhalla — Window Manager
 *
 * Controls main window behavior:
 * - Overlay mode (transparent, always-on-top, click-through)
 * - Normal mode (standard desktop window)
 * - Mini/Focus mode (small overlay)
 */

import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {BrowserWindow | null} */
let mainWindow = null;

/** @type {{ overlay: boolean, alwaysOnTop: boolean, clickThrough: boolean, opacity: number }} */
let windowState = {
  overlay: false,
  alwaysOnTop: false,
  clickThrough: false,
  opacity: 1.0,
};

// ═══════════════════════════════════════════
// CREATE MAIN WINDOW
// ═══════════════════════════════════════════

export function createMainWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    x: Math.round((width - 1200) / 2),
    y: Math.round((height - 800) / 2),
    backgroundColor: '#0A0A0F',
    title: 'Eclipse Valhalla',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true,
    show: false,
    // These enable overlay mode support
    transparent: false,    // Will be toggled dynamically
    frame: true,           // Will be toggled for overlay
    skipTaskbar: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// ═══════════════════════════════════════════
// GETTERS
// ═══════════════════════════════════════════

export function getMainWindow() {
  return mainWindow;
}

export function getWindowState() {
  return { ...windowState };
}

// ═══════════════════════════════════════════
// OVERLAY MODE
// ═══════════════════════════════════════════

/**
 * Enable/disable overlay mode.
 * In overlay mode: always on top, can be click-through except widget areas.
 */
export function setOverlayMode(enabled) {
  if (!mainWindow) return;

  windowState.overlay = enabled;

  if (enabled) {
    mainWindow.setAlwaysOnTop(true, 'screen-saver');
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    windowState.alwaysOnTop = true;

    // Start with click-through disabled (widgets need clicks)
    // Renderer will control this per-region
    mainWindow.setIgnoreMouseEvents(false);
  } else {
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setVisibleOnAllWorkspaces(false);
    mainWindow.setIgnoreMouseEvents(false);
    windowState.alwaysOnTop = false;
    windowState.clickThrough = false;
  }
}

// ═══════════════════════════════════════════
// ALWAYS ON TOP
// ═══════════════════════════════════════════

export function setAlwaysOnTop(enabled) {
  if (!mainWindow) return;
  windowState.alwaysOnTop = enabled;
  mainWindow.setAlwaysOnTop(enabled, enabled ? 'floating' : undefined);
}

// ═══════════════════════════════════════════
// CLICK-THROUGH (for overlay mode)
// ═══════════════════════════════════════════

/**
 * Toggle click-through. When enabled, mouse events pass through
 * the window EXCEPT when hovering over widget regions.
 */
export function setClickThrough(enabled) {
  if (!mainWindow) return;
  windowState.clickThrough = enabled;

  if (enabled) {
    // forward: true allows the renderer to still receive mouse enter/leave
    // so we can dynamically re-enable clicks on widget hover
    mainWindow.setIgnoreMouseEvents(true, { forward: true });
  } else {
    mainWindow.setIgnoreMouseEvents(false);
  }
}

// ═══════════════════════════════════════════
// OPACITY
// ═══════════════════════════════════════════

export function setWindowOpacity(opacity) {
  if (!mainWindow) return;
  const clamped = Math.max(0.1, Math.min(1.0, opacity));
  windowState.opacity = clamped;
  mainWindow.setOpacity(clamped);
}

// ═══════════════════════════════════════════
// MINI / FOCUS MODE
// ═══════════════════════════════════════════

let savedBounds = null;

export function enterFocusMode() {
  if (!mainWindow) return;

  // Save current bounds
  savedBounds = mainWindow.getBounds();

  // Resize to small overlay
  const { width: screenW } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow.setBounds({
    x: screenW - 340,
    y: 20,
    width: 320,
    height: 200,
  });

  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setResizable(false);
  windowState.alwaysOnTop = true;
}

export function exitFocusMode() {
  if (!mainWindow) return;

  if (savedBounds) {
    mainWindow.setBounds(savedBounds);
    savedBounds = null;
  }

  mainWindow.setResizable(true);

  if (!windowState.overlay) {
    mainWindow.setAlwaysOnTop(false);
    windowState.alwaysOnTop = false;
  }
}

// ═══════════════════════════════════════════
// MINIMIZE TO TRAY
// ═══════════════════════════════════════════

export function minimizeToTray() {
  if (!mainWindow) return;
  mainWindow.hide();
}

export function restoreFromTray() {
  if (!mainWindow) return;
  mainWindow.show();
  mainWindow.focus();
}
