/**
 * Eclipse Valhalla — useMobile Hook
 *
 * React hook for platform detection and responsive state.
 */

import { useState, useEffect } from 'react';
import { getPlatform, isMobile, isNative, isIOS, isAndroid } from './mobileBridge';

interface MobileState {
  platform: 'ios' | 'android' | 'web' | 'electron';
  isMobile: boolean;
  isNative: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSmallScreen: boolean;  // < 640px
  isMediumScreen: boolean; // 640-1024px
  isLargeScreen: boolean;  // > 1024px
  isLandscape: boolean;
  safeAreaTop: number;
  safeAreaBottom: number;
}

export function useMobile(): MobileState {
  const [state, setState] = useState<MobileState>(() => computeState());

  useEffect(() => {
    const handleResize = () => setState(computeState());
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return state;
}

function computeState(): MobileState {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const h = typeof window !== 'undefined' ? window.innerHeight : 800;

  return {
    platform: getPlatform(),
    isMobile: isMobile() || w < 768,
    isNative: isNative(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    isSmallScreen: w < 640,
    isMediumScreen: w >= 640 && w <= 1024,
    isLargeScreen: w > 1024,
    isLandscape: w > h,
    safeAreaTop: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0') || 0,
    safeAreaBottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0') || 0,
  };
}
