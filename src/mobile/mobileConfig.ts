/**
 * Eclipse Valhalla — Mobile Config
 *
 * Feature flags and capability detection for mobile platforms.
 */

import { getPlatform, isNative } from './mobileBridge';

export interface MobileCapabilities {
  hasPush: boolean;
  hasHaptics: boolean;
  hasLocalNotifications: boolean;
  hasStatusBar: boolean;
  hasBiometrics: boolean;
  hasShare: boolean;
  overlaySupported: boolean;
}

/**
 * Detect what native capabilities are available.
 */
export function detectCapabilities(): MobileCapabilities {
  const native = isNative();
  const platform = getPlatform();

  return {
    hasPush: native,
    hasHaptics: native && (platform === 'ios' || platform === 'android'),
    hasLocalNotifications: native,
    hasStatusBar: native,
    hasBiometrics: native,
    hasShare: native || typeof navigator?.share === 'function',
    overlaySupported: platform === 'electron', // Only desktop
  };
}

/**
 * Get recommended UI mode based on platform.
 */
export function getUIMode(): 'desktop' | 'tablet' | 'phone' {
  const platform = getPlatform();
  if (platform === 'electron') return 'desktop';

  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  if (w >= 1024) return 'desktop';
  if (w >= 640) return 'tablet';
  return 'phone';
}
