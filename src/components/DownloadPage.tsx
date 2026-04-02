/**
 * Eclipse Valhalla — Download Page
 *
 * Platform-aware download center.
 * Auto-detects OS, highlights correct download.
 */

import React, { useState, useEffect } from 'react';
import { Monitor, Apple, Terminal, Smartphone, ChevronRight, Download, ExternalLink } from 'lucide-react';

interface Platform {
  id: string;
  name: string;
  icon: any;
  filename: string;
  size: string;
  available: boolean;
  primary: boolean;
  url: string;
}

const VERSION = '2.1.0';
const BASE_URL = 'https://github.com/PavelHopson/Eclipse-Valhalla/releases/latest/download';

function detectPlatform(): string {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || navigator.platform?.toLowerCase() || '';

  if (platform.includes('mac') || ua.includes('macintosh')) return 'mac';
  if (ua.includes('linux') && !ua.includes('android')) return 'linux';
  if (ua.includes('android')) return 'android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'ios';
  return 'windows';
}

const DownloadPage: React.FC = () => {
  const [currentPlatform, setCurrentPlatform] = useState('windows');

  useEffect(() => {
    setCurrentPlatform(detectPlatform());
  }, []);

  const platforms: Platform[] = [
    {
      id: 'windows',
      name: 'Windows',
      icon: Monitor,
      filename: `EclipseValhalla-${VERSION}-win-x64.exe`,
      size: '~85 MB',
      available: true,
      primary: currentPlatform === 'windows',
      url: `${BASE_URL}/EclipseValhalla-${VERSION}-win-x64.exe`,
    },
    {
      id: 'windows-portable',
      name: 'Windows (Portable)',
      icon: Monitor,
      filename: `EclipseValhalla-${VERSION}-win-x64-portable.exe`,
      size: '~80 MB',
      available: true,
      primary: false,
      url: `${BASE_URL}/EclipseValhalla-${VERSION}-win-x64-portable.exe`,
    },
    {
      id: 'mac',
      name: 'macOS',
      icon: Apple,
      filename: `EclipseValhalla-${VERSION}-mac-universal.dmg`,
      size: '~90 MB',
      available: true,
      primary: currentPlatform === 'mac',
      url: `${BASE_URL}/EclipseValhalla-${VERSION}-mac-universal.dmg`,
    },
    {
      id: 'linux',
      name: 'Linux (AppImage)',
      icon: Terminal,
      filename: `EclipseValhalla-${VERSION}-linux-x64.AppImage`,
      size: '~85 MB',
      available: true,
      primary: currentPlatform === 'linux',
      url: `${BASE_URL}/EclipseValhalla-${VERSION}-linux-x64.AppImage`,
    },
    {
      id: 'android',
      name: 'Android',
      icon: Smartphone,
      filename: 'Play Store',
      size: '',
      available: false,
      primary: currentPlatform === 'android',
      url: '#',
    },
    {
      id: 'ios',
      name: 'iOS',
      icon: Smartphone,
      filename: 'App Store',
      size: '',
      available: false,
      primary: currentPlatform === 'ios',
      url: '#',
    },
  ];

  // Put primary platform first
  const sorted = [...platforms].sort((a, b) => {
    if (a.primary && !b.primary) return -1;
    if (!a.primary && b.primary) return 1;
    return 0;
  });

  const primary = sorted.find(p => p.primary && p.available) || sorted.find(p => p.available);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#E8E8F0] flex flex-col items-center justify-center px-6 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-wide mb-3">Download Eclipse Valhalla</h1>
        <p className="text-sm text-[#55556A]">Version {VERSION} · Free to download · Pro features require subscription</p>
      </div>

      {/* Primary CTA */}
      {primary && (
        <a
          href={primary.url}
          className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#5DAEFF] to-[#7A5CFF] text-white rounded-xl text-base font-bold shadow-[0_0_30px_rgba(93,174,255,0.2)] hover:shadow-[0_0_50px_rgba(93,174,255,0.3)] transition-shadow mb-4"
        >
          <Download className="w-5 h-5" />
          Download for {primary.name}
        </a>
      )}

      {primary && (
        <p className="text-xs text-[#3A3A4A] mb-12">
          {primary.filename} · {primary.size}
        </p>
      )}

      {/* All platforms */}
      <div className="w-full max-w-2xl space-y-2">
        <h3 className="text-[10px] font-bold text-[#3A3A4A] uppercase tracking-[0.2em] mb-3 px-1">All Platforms</h3>

        {sorted.map(p => {
          const Icon = p.icon;
          return (
            <a
              key={p.id}
              href={p.available ? p.url : undefined}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl border transition-all ${
                p.available
                  ? 'bg-[#12121A] border-[#1E1E2E] hover:border-[#2A2A3C] hover:bg-[#1A1A26] cursor-pointer'
                  : 'bg-[#0E0E16] border-[#1E1E2E] opacity-40 cursor-default'
              } ${p.primary ? 'border-[#5DAEFF20]' : ''}`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                p.primary ? 'bg-[#5DAEFF08] border-[#5DAEFF20]' : 'bg-[#12121A] border-[#1E1E2E]'
              }`}>
                <Icon className={`w-4 h-4 ${p.primary ? 'text-[#5DAEFF]' : 'text-[#55556A]'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-[10px] text-[#3A3A4A]">
                  {p.available ? `${p.filename} ${p.size ? `· ${p.size}` : ''}` : 'Coming soon'}
                </div>
              </div>

              {p.primary && p.available && (
                <span className="text-[9px] font-bold text-[#5DAEFF] bg-[#5DAEFF10] px-2 py-0.5 rounded-full border border-[#5DAEFF20]">
                  Recommended
                </span>
              )}

              {p.available && <ChevronRight className="w-4 h-4 text-[#2A2A3C]" />}
            </a>
          );
        })}
      </div>

      {/* Web version */}
      <div className="mt-8 text-center">
        <p className="text-xs text-[#3A3A4A] mb-2">Don't want to install?</p>
        <a href="/" className="inline-flex items-center gap-1.5 text-xs text-[#5DAEFF] hover:text-[#4A9AEE] transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
          Use the web version
        </a>
      </div>

      {/* Requirements */}
      <div className="mt-12 text-center text-[10px] text-[#2A2A3C] space-y-1 max-w-md">
        <p>Windows 10+ · macOS 11+ · Ubuntu 20.04+</p>
        <p>Android 8+ · iOS 15+ (coming soon)</p>
      </div>
    </div>
  );
};

export default DownloadPage;
