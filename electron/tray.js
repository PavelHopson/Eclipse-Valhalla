/**
 * Eclipse Valhalla — System Tray
 *
 * Persistent tray icon with context menu.
 * Allows: open, toggle overlay, quit.
 */

import { Tray, Menu, nativeImage, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { getMainWindow, restoreFromTray, setOverlayMode, getWindowState } from './windowManager.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Tray | null} */
let tray = null;

// ═══════════════════════════════════════════
// CREATE TRAY
// ═══════════════════════════════════════════

export function createTray() {
  // Try to load icon, fallback to empty 16x16
  let icon;
  try {
    icon = nativeImage.createFromPath(path.join(__dirname, '../public/favicon.ico'));
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty();
    }
    icon = icon.resize({ width: 16, height: 16 });
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip('Eclipse Valhalla');

  updateTrayMenu();

  // Click to restore
  tray.on('click', () => {
    restoreFromTray();
  });

  return tray;
}

// ═══════════════════════════════════════════
// UPDATE MENU
// ═══════════════════════════════════════════

export function updateTrayMenu() {
  if (!tray) return;

  const state = getWindowState();

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Eclipse Valhalla',
      click: () => restoreFromTray(),
    },
    { type: 'separator' },
    {
      label: 'Overlay Mode',
      type: 'checkbox',
      checked: state.overlay,
      click: (menuItem) => {
        setOverlayMode(menuItem.checked);
        updateTrayMenu();
      },
    },
    {
      label: 'Always on Top',
      type: 'checkbox',
      checked: state.alwaysOnTop,
      click: (menuItem) => {
        const { setAlwaysOnTop } = require('./windowManager.js');
        setAlwaysOnTop(menuItem.checked);
        updateTrayMenu();
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

// ═══════════════════════════════════════════
// DESTROY
// ═══════════════════════════════════════════

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
