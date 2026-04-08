/**
 * Eclipse Valhalla — Achievements Panel (v2)
 */

import React, { useState, useMemo } from 'react';
import { X, Trophy, Lock, Flame, Swords, Brain, Target, Compass } from 'lucide-react';
import { useLanguage } from '../i18n';
import { getAllAchievements, getUnlockedCount, getTotalCount, AchievementCategory, Achievement, AchievementTier } from '../services/achievementService';

interface AchievementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_CONFIG: { id: AchievementCategory | 'all'; icon: React.ReactNode; color: string }[] = [
  { id: 'all',          icon: <Trophy className="w-3.5 h-3.5" />,  color: '#B89B5E' },
  { id: 'combat',       icon: <Swords className="w-3.5 h-3.5" />,  color: '#6C8FB8' },
  { id: 'discipline',   icon: <Flame className="w-3.5 h-3.5" />,   color: '#D8C18E' },
  { id: 'endurance',    icon: <Target className="w-3.5 h-3.5" />,   color: '#B89B5E' },
  { id: 'intelligence', icon: <Brain className="w-3.5 h-3.5" />,    color: '#9B8FD8' },
  { id: 'mastery',      icon: <Compass className="w-3.5 h-3.5" />,  color: '#5DA888' },
];

const TIER_STYLES: Record<AchievementTier, { bg: string; border: string; text: string; glow: string }> = {
  bronze:    { bg: '#8B691415', border: '#8B691440', text: '#C49A2A', glow: 'rgba(139,105,20,0.15)' },
  silver:    { bg: '#9CA3AF15', border: '#9CA3AF40', text: '#C0C7D0', glow: 'rgba(156,163,175,0.15)' },
  gold:      { bg: '#D8C18E15', border: '#D8C18E50', text: '#D8C18E', glow: 'rgba(216,193,142,0.2)' },
  legendary: { bg: '#9B8FD815', border: '#9B8FD860', text: '#B8AEEC', glow: 'rgba(155,143,216,0.25)' },
};

const AchievementsPanel: React.FC<AchievementsPanelProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<AchievementCategory | 'all'>('all');

  const achievements = useMemo(() => getAllAchievements(), [isOpen]);
  const unlocked = getUnlockedCount();
  const total = getTotalCount();
  const percent = Math.round((unlocked / total) * 100);

  const filtered = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  const sorted = [...filtered].sort((a, b) => {
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    if (a.unlockedAt && b.unlockedAt) return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    return (b.current / b.target) - (a.current / a.target);
  });

  if (!isOpen) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 md:px-8 md:py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #B89B5E20, #D8C18E10)', border: '1px solid #B89B5E30' }}>
              <Trophy className="w-5 h-5 text-[#D8C18E]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#F2F1EE] tracking-tight">{t('achievements.title')}</h1>
              <p className="text-xs text-[#7F7A72]">{unlocked} / {total} {t('achievements.unlocked')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#5F5A54] hover:text-[#B4B0A7] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big progress block */}
        <div className="rounded-2xl border border-[#1E1E2E] bg-[#0E0E16] p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] uppercase tracking-[0.24em] text-[#7F7A72] font-semibold">{t('achievements.progress')}</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-[#D8C18E]">{percent}</span>
              <span className="text-sm font-bold text-[#7F7A72]">%</span>
            </div>
          </div>
          <div className="h-4 bg-[#0A0A0F] rounded-full overflow-hidden border border-[#1A1A26]">
            <div
              className="h-full rounded-full transition-all duration-1000 relative"
              style={{
                width: `${Math.max(percent, 2)}%`,
                background: 'linear-gradient(90deg, #8B6914, #B89B5E, #D8C18E)',
                boxShadow: '0 0 16px rgba(184,155,94,0.4)',
              }}
            >
              <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 60%)' }} />
            </div>
          </div>
          <div className="flex justify-between mt-3">
            {CATEGORY_CONFIG.slice(1).map(cat => {
              const catAch = achievements.filter(a => a.category === cat.id);
              const catUnlocked = catAch.filter(a => a.unlockedAt).length;
              return (
                <div key={cat.id} className="flex items-center gap-1.5 text-[10px] text-[#5F5A54]">
                  <div className="w-2 h-2 rounded-full" style={{ background: catUnlocked > 0 ? cat.color : '#2A2A3A' }} />
                  <span>{catUnlocked}/{catAch.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {CATEGORY_CONFIG.map(cat => {
            const isActive = activeCategory === cat.id;
            const count = cat.id === 'all' ? total : achievements.filter(a => a.category === cat.id).length;
            const catUnlocked = cat.id === 'all' ? unlocked : achievements.filter(a => a.category === cat.id && a.unlockedAt).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all ${
                  isActive ? 'text-[#0A0A0A]' : 'text-[#5F5A54] hover:text-[#B4B0A7] bg-[#0E0E16] border border-[#1E1E2E] hover:border-[#2A2A3C]'
                }`}
                style={isActive ? { background: cat.color, boxShadow: `0 2px 12px ${cat.color}40` } : {}}
              >
                {cat.icon}
                {cat.id === 'all' ? t('achievements.all') : t(`achievements.cat_${cat.id}`)}
                <span className={`ml-0.5 ${isActive ? 'opacity-70' : ''}`}>{catUnlocked}/{count}</span>
              </button>
            );
          })}
        </div>

        {/* Achievements grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sorted.map(a => (
            <AchievementCard key={a.id} achievement={a} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
};

const AchievementCard: React.FC<{ achievement: Achievement; t: (k: string) => string }> = ({ achievement: a, t }) => {
  const isUnlocked = !!a.unlockedAt;
  const progress = Math.min(100, Math.round((a.current / a.target) * 100));
  const tier = TIER_STYLES[a.tier];

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-all ${
        isUnlocked ? 'bg-[#0E0E16]' : 'bg-[#0A0A0F] opacity-50 hover:opacity-70'
      }`}
      style={{
        borderColor: isUnlocked ? tier.border : '#1A1A26',
        boxShadow: isUnlocked ? `0 0 20px ${tier.glow}, inset 0 1px 0 rgba(255,255,255,0.03)` : 'none',
      }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{
          background: isUnlocked ? tier.bg : '#0C0C14',
          border: `1px solid ${isUnlocked ? tier.border : '#1A1A26'}`,
          boxShadow: isUnlocked ? `0 0 12px ${tier.glow}` : 'none',
        }}
      >
        {isUnlocked ? a.icon : <Lock className="w-4 h-4 text-[#2A2A3A]" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-sm font-bold ${isUnlocked ? 'text-[#F2F1EE]' : 'text-[#5F5A54]'}`}>
            {t(`achievements.${a.id}`)}
          </span>
          <span
            className="text-[8px] font-extrabold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full"
            style={{ background: tier.bg, color: tier.text, border: `1px solid ${tier.border}` }}
          >
            {t(`achievements.tier_${a.tier}`)}
          </span>
        </div>

        <p className="text-[11px] text-[#5F5A54] mb-2">{t(`achievements.${a.id}_desc`)}</p>

        {/* Progress */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[#0A0A0F] rounded-full overflow-hidden border border-[#1A1A26]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${isUnlocked ? 100 : progress}%`,
                background: isUnlocked
                  ? `linear-gradient(90deg, ${tier.text}80, ${tier.text})`
                  : '#3A3A4A',
                boxShadow: isUnlocked ? `0 0 6px ${tier.glow}` : 'none',
              }}
            />
          </div>
          <span className={`text-[10px] font-mono font-bold ${isUnlocked ? 'text-[#B4B0A7]' : 'text-[#3A3A4A]'}`}>
            {a.current}/{a.target}
          </span>
        </div>
      </div>

      {/* XP badge */}
      <div className="shrink-0 mt-0.5">
        <div
          className={`text-[10px] font-extrabold px-2 py-1 rounded-lg ${
            isUnlocked ? 'text-[#D8C18E]' : 'text-[#2A2A3A]'
          }`}
          style={isUnlocked ? { background: '#B89B5E12', border: '1px solid #B89B5E25' } : {}}
        >
          +{a.xpReward} XP
        </div>
      </div>
    </div>
  );
};

export default AchievementsPanel;
