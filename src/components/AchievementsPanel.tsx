/**
 * Eclipse Valhalla — Achievements Panel
 *
 * Displays all achievements with categories, progress bars, unlock status.
 */

import React, { useState, useMemo } from 'react';
import { X, Trophy, Lock, ChevronRight, Flame, Swords, Brain, Target, Compass } from 'lucide-react';
import { useLanguage } from '../i18n';
import { getAllAchievements, getUnlockedCount, getTotalCount, AchievementCategory, Achievement } from '../services/achievementService';

interface AchievementsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_CONFIG: { id: AchievementCategory; icon: React.ReactNode; colorClass: string }[] = [
  { id: 'combat',       icon: <Swords className="w-4 h-4" />,  colorClass: '#6C8FB8' },
  { id: 'discipline',   icon: <Flame className="w-4 h-4" />,   colorClass: '#D8C18E' },
  { id: 'endurance',    icon: <Target className="w-4 h-4" />,   colorClass: '#B89B5E' },
  { id: 'intelligence', icon: <Brain className="w-4 h-4" />,    colorClass: '#9B8FD8' },
  { id: 'mastery',      icon: <Compass className="w-4 h-4" />,  colorClass: '#5DA888' },
];

const TIER_BORDERS: Record<string, string> = {
  bronze: '#8B6914',
  silver: '#9CA3AF',
  gold: '#D8C18E',
  legendary: '#9B8FD8',
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

  const unlockedFirst = [...filtered].sort((a, b) => {
    if (a.unlockedAt && !b.unlockedAt) return -1;
    if (!a.unlockedAt && b.unlockedAt) return 1;
    if (a.unlockedAt && b.unlockedAt) return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
    return (b.current / b.target) - (a.current / a.target);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col bg-[#0A0A0F] border border-[#1E1E2E] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1E1E2E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B89B5E15] border border-[#B89B5E30] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#D8C18E]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#F2F1EE]">{t('achievements.title')}</h2>
              <p className="text-xs text-[#7F7A72]">{unlocked}/{total} {t('achievements.unlocked')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-[#5F5A54] hover:text-[#B4B0A7] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 border-b border-[#1E1E2E]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#7F7A72]">{t('achievements.progress')}</span>
            <span className="text-xs font-bold text-[#D8C18E]">{percent}%</span>
          </div>
          <div className="h-2 bg-[#121218] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${percent}%`,
                background: 'linear-gradient(90deg, #B89B5E, #D8C18E)',
                boxShadow: '0 0 8px rgba(184,155,94,0.3)',
              }}
            />
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 px-6 py-3 overflow-x-auto border-b border-[#1E1E2E]">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-[#B89B5E] text-[#0A0A0A]'
                : 'text-[#7F7A72] hover:text-[#B4B0A7] hover:bg-[#16162A]'
            }`}
          >
            {t('achievements.all')} ({total})
          </button>
          {CATEGORY_CONFIG.map(cat => {
            const count = achievements.filter(a => a.category === cat.id).length;
            const catUnlocked = achievements.filter(a => a.category === cat.id && a.unlockedAt).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'text-[#0A0A0A]'
                    : 'text-[#7F7A72] hover:text-[#B4B0A7] hover:bg-[#16162A]'
                }`}
                style={activeCategory === cat.id ? { background: cat.colorClass } : {}}
              >
                {cat.icon}
                {t(`achievements.cat_${cat.id}`)} ({catUnlocked}/{count})
              </button>
            );
          })}
        </div>

        {/* Achievements list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {unlockedFirst.map(a => (
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
  const borderColor = TIER_BORDERS[a.tier] || '#1E1E2E';

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
        isUnlocked
          ? 'bg-[#121218] border-opacity-40'
          : 'bg-[#0C0C12] border-[#1E1E2E] opacity-60'
      }`}
      style={{ borderColor: isUnlocked ? borderColor : undefined }}
    >
      {/* Icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${
        isUnlocked ? 'bg-[#1A1A26]' : 'bg-[#0E0E16]'
      }`}
        style={isUnlocked ? { boxShadow: `0 0 12px ${borderColor}20` } : {}}
      >
        {isUnlocked ? a.icon : <Lock className="w-4 h-4 text-[#3A3A4A]" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isUnlocked ? 'text-[#F2F1EE]' : 'text-[#5F5A54]'}`}>
            {t(`achievements.${a.id}`)}
          </span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
            a.tier === 'legendary' ? 'bg-[#9B8FD820] text-[#9B8FD8]' :
            a.tier === 'gold' ? 'bg-[#D8C18E20] text-[#D8C18E]' :
            a.tier === 'silver' ? 'bg-[#9CA3AF20] text-[#9CA3AF]' :
            'bg-[#8B691420] text-[#8B6914]'
          }`}>
            {t(`achievements.tier_${a.tier}`)}
          </span>
        </div>
        <p className="text-[11px] text-[#5F5A54] mt-0.5">{t(`achievements.${a.id}_desc`)}</p>

        {/* Progress bar (for locked) */}
        {!isUnlocked && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1 bg-[#1A1A26] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-[#5F5A54] transition-all" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-[#5F5A54] font-mono">{a.current}/{a.target}</span>
          </div>
        )}
      </div>

      {/* XP / Status */}
      <div className="shrink-0 text-right">
        {isUnlocked ? (
          <div className="text-[10px] font-bold text-[#D8C18E]">+{a.xpReward} XP</div>
        ) : (
          <div className="text-[10px] text-[#3A3A4A]">{a.xpReward} XP</div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPanel;
