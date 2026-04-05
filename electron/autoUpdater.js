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
let _isChecking = false;
let _latestVersion = null;

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
    _latestVersion = info.version;

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
    _updateAvailable = false;
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
    _latestVersion = info.version;

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
    _isChecking = false;
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
    _isChecking = true;
    autoUpdater.checkForUpdates().finally(() => {
      _isChecking = false;
    }).catch(() => {});
  } catch {
    _isChecking = false;
    // Silently fail (no internet, etc.)
  }
}

export async function checkForUpdatesNow() {
  if (process.env.NODE_ENV === 'development') {
    return {
      success: false,
      status: 'disabled',
      message: 'Update checks are disabled in development mode.',
    };
  }

  if (_isChecking) {
    return {
      success: true,
      status: 'checking',
      message: 'Update check is already in progress.',
    };
  }

  try {
    _isChecking = true;
    const result = await autoUpdater.checkForUpdates();
    const updateInfo = result?.updateInfo;

    if (updateInfo?.version && updateInfo.version !== autoUpdater.currentVersion?.version) {
      _updateAvailable = true;
      _latestVersion = updateInfo.version;
      return {
        success: true,
        status: 'available',
        version: updateInfo.version,
        message: `Version ${updateInfo.version} is available.`,
      };
    }

    _updateAvailable = false;
    return {
      success: true,
      status: 'up-to-date',
      version: autoUpdater.currentVersion?.version,
      message: 'You already have the latest version.',
    };
  } catch (error) {
    return {
      success: false,
      status: 'error',
      message: String(error),
    };
  } finally {
    _isChecking = false;
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

export function getUpdaterState() {
  return {
    currentVersion: getAppVersion(),
    latestVersion: _latestVersion,
    updateAvailable: _updateAvailable,
    isChecking: _isChecking,
  };
}
