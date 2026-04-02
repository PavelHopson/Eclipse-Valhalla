/**
 * Eclipse Valhalla — The Seal
 *
 * Sacred Execution Sigil.
 * Containment ring + watcher point.
 *
 * The circle = the system's boundary. Focus. Control.
 * The line = the cut. Action. Decision. Execution.
 * The point = the watcher. The system sees.
 *
 * Usage:
 *   <Seal />                    — default (sidebar, small)
 *   <Seal size={80} />          — Focus Mode (large, ritual)
 *   <Seal variant="complete" /> — Done state (seal of confirmation)
 *   <Seal variant="watching" /> — Idle/return (the system observes)
 *   <Seal animated />           — Ritual entrance animation
 */

import React from 'react';

export type SealVariant = 'default' | 'complete' | 'watching' | 'broken';

interface SealProps {
  size?: number;
  variant?: SealVariant;
  color?: string;
  animated?: boolean;
  className?: string;
}

export const Seal: React.FC<SealProps> = ({
  size = 32,
  variant = 'default',
  color,
  animated = false,
  className = '',
}) => {
  const strokeColor = color || getVariantColor(variant);
  const strokeWidth = size < 40 ? 1.5 : size < 80 ? 2 : 2.5;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={`${animated ? 'seal-enter' : ''} ${className}`}
      style={{ display: 'inline-block' }}
    >
      {/* Outer containment ring */}
      <circle
        cx="50" cy="50" r="44"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        opacity={variant === 'broken' ? 0.3 : 0.6}
        strokeDasharray={variant === 'broken' ? '8 6' : 'none'}
      />

      {/* Inner ring (subtle, structural) */}
      <circle
        cx="50" cy="50" r="32"
        stroke={strokeColor}
        strokeWidth={strokeWidth * 0.5}
        opacity={0.15}
      />

      {/* The Cut — vertical execution line */}
      {variant !== 'broken' && (
        <line
          x1="50" y1="20" x2="50" y2="80"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={variant === 'complete' ? 0.8 : 0.4}
          strokeLinecap="round"
        />
      )}

      {/* The Watcher — offset point */}
      {(variant === 'default' || variant === 'watching') && (
        <circle
          cx="50" cy="38"
          r={size < 40 ? 2.5 : 3.5}
          fill={strokeColor}
          opacity={variant === 'watching' ? 0.8 : 0.5}
        />
      )}

      {/* Complete: checkmark-like cross at center */}
      {variant === 'complete' && (
        <>
          <line x1="40" y1="50" x2="48" y2="58" stroke={strokeColor} strokeWidth={strokeWidth * 1.2} strokeLinecap="round" opacity={0.9} />
          <line x1="48" y1="58" x2="62" y2="42" stroke={strokeColor} strokeWidth={strokeWidth * 1.2} strokeLinecap="round" opacity={0.9} />
        </>
      )}

      {/* Broken: scattered fragments */}
      {variant === 'broken' && (
        <>
          <line x1="35" y1="35" x2="45" y2="45" stroke={strokeColor} strokeWidth={strokeWidth} opacity={0.3} strokeLinecap="round" />
          <line x1="55" y1="55" x2="65" y2="65" stroke={strokeColor} strokeWidth={strokeWidth} opacity={0.3} strokeLinecap="round" />
        </>
      )}
    </svg>
  );
};

function getVariantColor(variant: SealVariant): string {
  switch (variant) {
    case 'complete': return '#3DD68C';
    case 'watching': return '#5DA8FF';
    case 'broken':   return '#E03030';
    default:         return '#EAEAF2';
  }
}

export default Seal;
