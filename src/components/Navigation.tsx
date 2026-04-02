/**
 * Eclipse Valhalla — Navigation
 *
 * Sections:
 *   CORE     — Dashboard
 *   QUESTS   — Quest Log, Calendar
 *   FOCUS    — Workouts, Stickers
 *   ORACLE   — Oracle AI
 *   FORGE    — Image Gen, TTS
 *   SYSTEM   — Settings, Admin
 */

import React from 'react';
import { ViewMode, User, PlanTier } from '../types';
import {
  Hammer, Swords, Calendar as CalendarIcon, Settings, Crown, ShieldCheck,
  Home, Search, Dumbbell, StickyNote, Sparkles, Image, AudioLines,
  ChevronRight, Rss,
} from 'lucide-react';
import { useLanguage } from '../i18n';

interface NavigationProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  onSearchClick: () => void;
  user?: User | null;
  onUpgrade: () => void;
}

interface NavSection {
  label: string;
  items: { id: string; label: string; icon: any; accent?: string }[];
}

const Navigation: React.FC<NavigationProps> = ({ currentView, setView, onSearchClick, user, onUpgrade }) => {
  const { t } = useLanguage();

  const sections: NavSection[] = [
    {
      label: 'CORE',
      items: [
        { id: 'dashboard', label: t('nav.home'), icon: Home },
      ],
    },
    {
      label: 'QUESTS',
      items: [
        { id: 'reminders', label: t('nav.tasks'), icon: Swords, accent: '#5DAEFF' },
        { id: 'calendar',  label: t('nav.calendar'), icon: CalendarIcon },
      ],
    },
    {
      label: 'FOCUS',
      items: [
        { id: 'workouts', label: t('nav.workouts'), icon: Dumbbell, accent: '#FF6B35' },
        { id: 'stickers', label: t('nav.notes'), icon: StickyNote },
      ],
    },
    {
      label: 'ORACLE',
      items: [
        { id: 'oracle', label: t('nav.oracle'), icon: Sparkles, accent: '#4ADE80' },
      ],
    },
    {
      label: 'NEXUS',
      items: [
        { id: 'nexus', label: 'Nexus Feed', icon: Rss, accent: '#FBBF24' },
      ],
    },
    {
      label: 'FORGE',
      items: [
        { id: 'image', label: t('nav.ai_image'), icon: Image, accent: '#7A5CFF' },
        { id: 'tts',   label: t('nav.ai_tts'), icon: AudioLines, accent: '#7A5CFF' },
      ],
    },
  ];

  const isActive = (id: string) => currentView === id;

  return (
    <>
      {/* ═══ DESKTOP SIDEBAR ═══ */}
      <div className="hidden md:flex w-60 bg-[#08080D] text-[#EAEAF2] flex-col h-full shrink-0 z-30 border-r border-[#16162240]">

        {/* Brand */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-[#16162240]">
          <div className="w-8 h-8 rounded-md bg-[#5DA8FF08] border border-[#5DA8FF20] flex items-center justify-center">
            <Hammer className="w-4 h-4 text-[#5DA8FF]" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-[0.12em] uppercase text-[#EAEAF2]">Eclipse</h1>
            <span className="text-[7px] font-semibold text-[#3D3D52] uppercase tracking-[0.25em]">Valhalla</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={onSearchClick}
            className="w-full bg-[#0B0B12] hover:bg-[#0F0F18] border border-[#1E1E3050] hover:border-[#2A2A3C70] text-[#5E5E78] rounded-md px-3 py-2 flex items-center gap-2 text-xs transition-all group"
          >
            <Search className="w-3.5 h-3.5 group-hover:text-[#9494AD] transition-colors" />
            <span className="group-hover:text-[#9494AD]">{t('nav.search')}</span>
            <span className="ml-auto text-[9px] bg-[#0A0A0F] px-1.5 py-0.5 rounded border border-[#1E1E2E] text-[#3A3A4A] font-mono">^K</span>
          </button>
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-1">
          {sections.map((section) => (
            <div key={section.label} className="mb-1">
              {/* Section Label */}
              <div className="px-3 pt-4 pb-1.5">
                <span className="text-[9px] font-bold text-[#3A3A4A] uppercase tracking-[0.2em]">{section.label}</span>
              </div>

              {/* Section Items */}
              {section.items.map((item) => {
                const active = isActive(item.id);
                const Icon = item.icon;
                const accentColor = item.accent || '#5DAEFF';

                return (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id as ViewMode)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                      active
                        ? 'bg-[#1A1A26] text-[#E8E8F0]'
                        : 'text-[#8888A0] hover:bg-[#12121A] hover:text-[#E8E8F0]'
                    }`}
                    style={active ? {
                      boxShadow: `inset 3px 0 0 ${accentColor}, 0 0 15px ${accentColor}08`,
                    } : undefined}
                  >
                    <Icon
                      className="w-4 h-4 transition-colors shrink-0"
                      style={active ? { color: accentColor } : undefined}
                    />
                    <span className="text-sm font-medium truncate">{item.label.split('(')[0].trim()}</span>
                    {active && (
                      <div className="ml-auto w-1 h-1 rounded-full" style={{ backgroundColor: accentColor }} />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {/* Settings */}
          <div className="pt-2">
            <div className="px-3 pt-4 pb-1.5">
              <span className="text-[9px] font-bold text-[#3A3A4A] uppercase tracking-[0.2em]">SYSTEM</span>
            </div>
            <button
              onClick={() => setView('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive('settings') ? 'bg-[#1A1A26] text-[#E8E8F0]' : 'text-[#55556A] hover:bg-[#12121A] hover:text-[#8888A0]'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span className="text-sm font-medium">{t('nav.settings').split('(')[0].trim()}</span>
            </button>
          </div>
        </nav>

        {/* Bottom — Upgrade + Admin */}
        <div className="p-3 space-y-2 border-t border-[#1E1E2E]">
          {user?.plan !== PlanTier.PRO && (
            <button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-[#5DAEFF10] to-[#7A5CFF10] border border-[#5DAEFF20] rounded-lg p-3 text-left group hover:border-[#5DAEFF40] transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-3.5 h-3.5 text-[#FFD700]" />
                <span className="text-[10px] font-bold text-[#E8E8F0] tracking-wide uppercase">{t('nav.pro_access')}</span>
                <ChevronRight className="w-3 h-3 text-[#3A3A4A] ml-auto group-hover:text-[#55556A] transition-colors" />
              </div>
              <p className="text-[9px] text-[#55556A] leading-relaxed">{t('nav.pro_desc')}</p>
            </button>
          )}

          {/* Admin: only visible to dev account */}
          {user?.id === 'user_pavel_hopson_admin' && <button
            onClick={() => setView('admin')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs ${
              isActive('admin')
                ? 'bg-[#8B000015] text-[#FF4444] border border-[#8B000030]'
                : 'text-[#3A3A4A] hover:text-[#55556A] hover:bg-[#12121A]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-bold uppercase tracking-wider text-[10px]">{t('nav.admin').split('(')[0].trim()}</span>
          </button>}
        </div>
      </div>

      {/* ═══ MOBILE BOTTOM NAV ═══ */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#050508]/95 backdrop-blur-xl border-t border-[#16162240] z-50 pb-safe">
        <div className="flex items-center justify-around px-1 pt-2 pb-1">
          {[
            { id: 'dashboard', icon: Home, label: 'Home' },
            { id: 'reminders', icon: Swords, label: 'Quests' },
            { id: 'calendar', icon: CalendarIcon, label: 'Calendar' },
            { id: 'oracle', icon: Sparkles, label: 'Oracle' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => {
            const active = isActive(item.id);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id as ViewMode)}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all flex-1 active:scale-95 ${
                  active ? 'text-[#5DAEFF]' : 'text-[#3A3A4A]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[9px] font-medium ${active ? 'text-[#5DAEFF]' : 'text-[#3A3A4A]'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navigation;
