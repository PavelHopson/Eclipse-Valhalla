/**
 * Eclipse Valhalla — Level Badge
 *
 * Displays user level with sigil and glow.
 */

import React from 'react';
import { SigilIcon } from '../brand';

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
}

const LevelBadge: React.FC<LevelBadgeProps> = ({ level, size = 'md' }) => {
  const sizes = {
    sm: { container: 'w-8 h-8', text: 'text-xs', sigil: 10 },
    md: { container: 'w-12 h-12', text: 'text-lg', sigil: 14 },
    lg: { container: 'w-16 h-16', text: 'text-2xl', sigil: 18 },
  };

  const s = sizes[size];

  // Color escalation by level
  const color = level >= 10 ? '#FFD700'
    : level >= 7 ? '#7A5CFF'
    : level >= 4 ? '#5DAEFF'
    : '#8888A0';

  return (
    <div
      className={`${s.container} rounded-xl flex items-center justify-center relative border`}
      style={{
        borderColor: `${color}30`,
        backgroundColor: `${color}08`,
        boxShadow: `0 0 15px ${color}10`,
      }}
    >
      {/* Level number */}
      <span className={`${s.text} font-black`} style={{ color }}>
        {level}
      </span>

      {/* Tiny sigil in corner */}
      <div className="absolute -top-1 -right-1">
        <SigilIcon name="discipline" size={s.sigil} color={`${color}60`} />
      </div>
    </div>
  );
};

export default LevelBadge;
