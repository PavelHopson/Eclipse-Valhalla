/**
 * Eclipse Valhalla — Progress Ring
 *
 * Daily execution arc. Cold under pressure, gold when sealed.
 */

import React from 'react';

interface ProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

const ProgressRing: React.FC<ProgressRingProps> = ({
  completed,
  total,
  size = 64,
  strokeWidth = 3,
  showLabel = true,
}) => {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? Math.min(completed / total, 1) : 0;
  const offset = circumference * (1 - progress);

  // Color based on progress
  const color = progress >= 1 ? '#B89B5E' : progress >= 0.5 ? '#6C8FB8' : '#5F5A54';
  const trackColor = '#232323';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={trackColor} strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>

      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-bold" style={{ color }}>{completed}</span>
          <span className="text-[8px]" style={{ color: '#5F5A54' }}>/{total}</span>
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
