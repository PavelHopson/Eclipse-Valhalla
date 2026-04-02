/**
 * Eclipse Valhalla — XP Progress Bar
 *
 * Horizontal XP progress with level display.
 * Gold accent. Subtle glow on progress edge.
 */

import React from 'react';
import { Trophy } from 'lucide-react';

interface XPBarProps {
  xp: number;
  level: number;
  nextLevelXp: number;
  compact?: boolean;
}

const XPBar: React.FC<XPBarProps> = ({ xp, level, nextLevelXp, compact = false }) => {
  const currentLevelXp = nextLevelXp - (nextLevelXp > 0 ? 100 * level : 0); // simplified
  const progress = nextLevelXp > 0 ? Math.min(1, xp / nextLevelXp) : 1;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Trophy className="w-3 h-3 text-[#FFD700]" />
          <span className="text-[10px] font-bold text-[#FFD700]">{level}</span>
        </div>
        <div className="flex-1 h-1 bg-[#1E1E2E] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #FFD700, #FFA500)',
              boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)',
            }}
          />
        </div>
        <span className="text-[9px] text-[#55556A] font-mono">{xp}/{nextLevelXp}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FFD70010] border border-[#FFD70025] flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#E8E8F0]">Level {level}</span>
            <span className="text-[9px] text-[#55556A] ml-2">Glory Rank</span>
          </div>
        </div>
        <span className="text-xs font-mono text-[#55556A]">{xp} / {nextLevelXp} XP</span>
      </div>

      <div className="h-1.5 bg-[#1E1E2E] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
            boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)',
          }}
        />
      </div>
    </div>
  );
};

export default XPBar;
