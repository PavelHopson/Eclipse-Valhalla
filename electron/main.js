/**
 * Eclipse Valhalla — Electron Main Process
 *
 * Entry point for the desktop application.
 * Orchestrates: window, tray, IPC, auto-start.
 */

import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { createMainWindow, getMainWindow } from './windowManager.js';
import { createTray, destroyTray } from './tray.js';
import { registerWidgetIPC } from './ipc/widget.js';
import { registerSystemIPC } from './ipc/system.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ═══════════════════════════════════════════
// SINGLE INSTANCE LOCK
// ═══════════════════════════════════════════

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {

  // Second instance tried to launch → focus existing window
  app.on('second-instance', () => {
    const win = getMainWindow();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });

  // ═══════════════════════════════════════
  // APP READY
  // ═══════════════════════════════════════

  app.whenReady().then(() => {

    // 1. Register IPC handlers BEFORE creating windows
    registerWidgetIPC();
    registerSystemIPC();

    // 2. Create main window
    const mainWindow = createMainWindow();

    // 3. Load content
    if (!app.isPackaged && process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:5173');
      mainWindow.webContents.openDevTools({ mode: 'detach' });
      console.log('[Eclipse Valhalla] Development mode — localhost:5173');
    } else {
      const indexPath = path.join(__dirname, '../dist/index.html');
      mainWindow.loadFile(indexPath).catch(err => {
        console.error('[Eclipse Valhalla] Failed to load index.html:', err);
      });
    }

    // 4. Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // 5. Create system tray
    createTray();

    // 6. Handle close → minimize to tray instead
    mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
    });

    // macOS: re-create window on dock click
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      } else {
        const win = getMainWindow();
        if (win) win.show();
      }
    });
  });

  // ═══════════════════════════════════════
  // APP LIFECYCLE
  // ═══════════════════════════════════════

  // Mark as quitting before quit (for close handler above)
  app.on('before-quit', () => {
    app.isQuitting = true;
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      destroyTray();
      app.quit();
    }
  });
}
