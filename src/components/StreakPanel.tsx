/**
 * Eclipse Valhalla — Streak Panel
 *
 * Shows current discipline streak, XP, and daily progress.
 */

import React from 'react';
import { Flame, Zap, Target } from 'lucide-react';

interface StreakPanelProps {
  streak: number;
  todayCompleted: number;
  todayTotal: number;
  focusSessions: number;
}

const StreakPanel: React.FC<StreakPanelProps> = ({
  streak,
  todayCompleted,
  todayTotal,
  focusSessions,
}) => {
  const dailyProgress = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

  return (
    <div className="bg-[#1A1A26] border border-[#2A2A3C] rounded-xl p-4 space-y-4">
      {/* Streak display */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          streak > 0
            ? 'bg-[#FF6B3510] border border-[#FF6B3525]'
            : 'bg-[#1E1E2E] border border-[#2A2A3C]'
        }`}>
          <Flame className={`w-5 h-5 ${streak > 0 ? 'text-[#FF6B35]' : 'text-[#3A3A4A]'}`} />
        </div>
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-black ${streak > 0 ? 'text-[#FF6B35]' : 'text-[#3A3A4A]'}`}>
              {streak}
            </span>
            <span className="text-[10px] text-[#55556A] uppercase tracking-wider">day streak</span>
          </div>
          <p className="text-[10px] text-[#3A3A4A]">
            {streak === 0 ? 'Streak broken. Rebuild discipline.'
              : streak < 7 ? 'Streak preserved. Maintain focus.'
              : 'Discipline proven. Keep advancing.'}
          </p>
        </div>
      </div>

      {/* Daily objective progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-[#5DAEFF]" />
            <span className="text-[10px] text-[#55556A] uppercase tracking-wider">Daily Progress</span>
          </div>
          <span className="text-[10px] font-bold text-[#8888A0]">{todayCompleted}/{todayTotal}</span>
        </div>
        <div className="h-1 bg-[#1E1E2E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${dailyProgress}%`,
              background: dailyProgress >= 80 ? 'linear-gradient(90deg, #4ADE80, #22C55E)' :
                          dailyProgress >= 40 ? 'linear-gradient(90deg, #5DAEFF, #3B8CD9)' :
                          'linear-gradient(90deg, #FBBF24, #F59E0B)',
            }}
          />
        </div>
      </div>

      {/* Focus sessions */}
      <div className="flex items-center gap-2 text-[10px]">
        <Zap className="w-3 h-3 text-[#FBBF24]" />
        <span className="text-[#55556A] uppercase tracking-wider">Focus Sessions</span>
        <span className="ml-auto font-bold text-[#8888A0]">{focusSessions}</span>
      </div>
    </div>
  );
};

export default StreakPanel;
