/**
 * Eclipse Valhalla — Discipline Panel
 *
 * Compact gamification overview. Shows level, XP, streak, discipline score.
 * Used in Dashboard and optionally in sidebar.
 */

import React from 'react';
import XPBar from './XPBar';
import LevelBadge from './LevelBadge';
import { Flame, Shield, Zap } from 'lucide-react';
import { useLanguage } from '../i18n';

interface DisciplinePanelProps {
  xp: number;
  level: number;
  nextLevelXp: number;
  streak: number;
  disciplineScore: number;
  focusSessions: number;
}

const DisciplinePanel: React.FC<DisciplinePanelProps> = ({
  xp,
  level,
  nextLevelXp,
  streak,
  disciplineScore,
  focusSessions,
}) => {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dColor = disciplineScore >= 80 ? '#4ADE80'
    : disciplineScore >= 50 ? '#FBBF24'
    : '#FF4444';

  return (
    <div className="bg-[#1A1A26] border border-[#2A2A3C] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1E1E2E] flex items-center justify-between">
        <span className="text-[10px] font-bold text-[#55556A] uppercase tracking-[0.15em]">{isRu ? 'Путь дисциплины' : 'Path of Discipline'}</span>
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border"
          style={{ color: dColor, borderColor: `${dColor}30`, backgroundColor: `${dColor}08` }}
        >
          <Shield className="w-3 h-3" />
          {disciplineScore}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Level + XP */}
        <div className="flex items-center gap-3">
          <LevelBadge level={level} size="md" />
          <div className="flex-1">
            <XPBar xp={xp} level={level} nextLevelXp={nextLevelXp} />
          </div>
        </div>

        {/* Micro stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-[#FF6B35]' : 'text-[#3A3A4A]'}`} />
            <span className={`text-xs font-bold ${streak > 0 ? 'text-[#FF6B35]' : 'text-[#3A3A4A]'}`}>{streak}d</span>
            <span className="text-[9px] text-[#3A3A4A]">{isRu ? 'серия' : 'streak'}</span>
          </div>

          <div className="w-px h-3 bg-[#1E1E2E]" />

          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#FBBF24]" />
            <span className="text-xs font-bold text-[#8888A0]">{focusSessions}</span>
            <span className="text-[9px] text-[#3A3A4A]">{isRu ? 'фокус' : 'focus'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisciplinePanel;
