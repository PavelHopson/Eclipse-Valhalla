/**
 * Eclipse Valhalla — The Seal (Official Logo)
 *
 * The Spear through the Broken Circle.
 *
 * Circle = containment, the system's boundary, focus
 * Break in circle = the gap, the vulnerability, the entry point
 * Spear/blade = execution, the cut through chaos
 * Point/sphere = the watcher, the observer at the tip
 *
 * Based on the official logo design.
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
  const c = color || getVariantColor(variant);
  const sw = size < 40 ? 2 : size < 80 ? 2.5 : 3;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={`${animated ? 'seal-enter' : ''} ${className}`}
      style={{ display: 'inline-block' }}
    >
      {/* ═══ THE CIRCLE — containment ring, broken at top ═══ */}
      {variant === 'broken' ? (
        // Broken: dashed, faded
        <circle cx="50" cy="50" r="38" stroke={c} strokeWidth={sw} opacity={0.25} strokeDasharray="6 5" />
      ) : (
        // Open circle — gap at top where the spear enters
        <path
          d={describeArc(50, 50, 38, 25, 335)}
          stroke={c}
          strokeWidth={sw}
          strokeLinecap="round"
          opacity={0.85}
        />
      )}

      {/* ═══ INNER ARC — subtle structural depth ═══ */}
      {variant !== 'broken' && (
        <path
          d={describeArc(50, 50, 26, 40, 320)}
          stroke={c}
          strokeWidth={sw * 0.4}
          strokeLinecap="round"
          opacity={0.12}
        />
      )}

      {/* ═══ THE SPEAR — vertical execution blade ═══ */}
      {variant !== 'broken' && (
        <path
          d="M50 8 L50 92 M48 8 L50 2 L52 8"
          stroke={c}
          strokeWidth={sw * 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={variant === 'complete' ? 0.95 : 0.7}
          fill="none"
        />
      )}

      {/* ═══ THE WATCHER — sphere on the spear ═══ */}
      {variant !== 'broken' && variant !== 'complete' && (
        <circle
          cx="50" cy="32"
          r={size < 40 ? 2.5 : 3.5}
          fill={c}
          opacity={variant === 'watching' ? 0.9 : 0.6}
        />
      )}

      {/* ═══ COMPLETE — the point becomes the seal mark ═══ */}
      {variant === 'complete' && (
        <circle
          cx="50" cy="50"
          r={size < 40 ? 3 : 4}
          fill={c}
          opacity={0.9}
        />
      )}

      {/* ═══ BROKEN — scattered fragments ═══ */}
      {variant === 'broken' && (
        <>
          <line x1="50" y1="30" x2="50" y2="70" stroke={c} strokeWidth={sw * 0.6} opacity={0.2} strokeLinecap="round" strokeDasharray="4 6" />
          <circle cx="50" cy="50" r="2" fill={c} opacity={0.15} />
        </>
      )}
    </svg>
  );
};

// ═══════════════════════════════════════════
// SVG ARC HELPER
// ═══════════════════════════════════════════

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function getVariantColor(variant: SealVariant): string {
  switch (variant) {
    case 'complete': return '#3DD68C';
    case 'watching': return '#EAEAF2';
    case 'broken':   return '#E03030';
    default:         return '#EAEAF2';
  }
}

export default Seal;
