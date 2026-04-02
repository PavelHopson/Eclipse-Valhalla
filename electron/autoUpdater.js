/**
 * Eclipse Valhalla — Auto Updater
 *
 * Checks GitHub Releases for new versions.
 * Downloads and installs in background.
 *
 * Requires: electron-updater package.
 * Publish config in package.json "build.publish".
 */

import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';

let _updateAvailable = false;

/**
 * Initialize auto-updater. Call after app is ready.
 */
export function initAutoUpdater(mainWindow) {
  // Config
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = console;

  // Events
  autoUpdater.on('checking-for-update', () => {
    console.log('[Updater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    console.log('[Updater] Update available:', info.version);
    _updateAvailable = true;

    // Notify renderer
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    console.log('[Updater] No updates available.');
  });

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update:progress', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[Updater] Update downloaded:', info.version);

    if (mainWindow?.webContents) {
      mainWindow.webContents.send('update:downloaded', {
        version: info.version,
      });
    }

    // Show dialog
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Eclipse Valhalla — Update Ready',
      message: `Version ${info.version} is ready to install.`,
      detail: 'The update will be applied when you restart.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    });
  });

  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err.message);
  });

  // Check on startup (after 10 seconds)
  setTimeout(() => {
    checkForUpdates();
  }, 10000);

  // Check every 4 hours
  setInterval(() => {
    checkForUpdates();
  }, 4 * 60 * 60 * 1000);
}

/**
 * Manual check trigger.
 */
export function checkForUpdates() {
  try {
    autoUpdater.checkForUpdates().catch(() => {});
  } catch {
    // Silently fail (no internet, etc.)
  }
}

/**
 * Install pending update.
 */
export function installUpdate() {
  if (_updateAvailable) {
    autoUpdater.quitAndInstall(false, true);
  }
}

/**
 * Get current app version.
 */
export function getAppVersion() {
  return autoUpdater.currentVersion?.version || '2.1.0';
}
