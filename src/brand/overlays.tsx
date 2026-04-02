/**
 * Eclipse Valhalla — Decorative Overlays
 *
 * Lightweight React components for atmospheric effects.
 * All overlays use pointer-events: none and are purely visual.
 */

import React from 'react';
import { eclipseRing, atmosphere, voidDivider, runeSeparator } from './motifs';
import { sigilPaths, sigilColors, SigilName } from './sigils';

// ═══════════════════════════════════════════
// ECLIPSE AMBIENT — page-level background glow
// ═══════════════════════════════════════════

interface EclipseAmbientProps {
  variant?: 'cold' | 'void' | 'oracle' | 'blood';
  intensity?: number; // 0.0 - 1.0, default 1.0
}

export const EclipseAmbient: React.FC<EclipseAmbientProps> = ({
  variant = 'cold',
  intensity = 1,
}) => {
  const gradients: Record<string, string> = {
    cold: eclipseRing.cold,
    void: eclipseRing.void,
    oracle: eclipseRing.oracle,
    blood: eclipseRing.blood,
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none"
      style={{
        backgroundImage: `${eclipseRing.ambient}, ${gradients[variant]}`,
        opacity: intensity,
        zIndex: 0,
      }}
    />
  );
};

// ═══════════════════════════════════════════
// DOT GRID OVERLAY — subtle depth pattern
// ═══════════════════════════════════════════

export const DotGridOverlay: React.FC<{ opacity?: number }> = ({ opacity = 0.4 }) => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{
      backgroundImage: atmosphere.dotGrid,
      backgroundSize: atmosphere.dotGridSize,
      opacity,
      zIndex: 0,
    }}
  />
);

// ═══════════════════════════════════════════
// MIST OVERLAY — bottom fog gradient
// ═══════════════════════════════════════════

export const MistOverlay: React.FC = () => (
  <div
    className="fixed bottom-0 left-0 right-0 h-32 pointer-events-none"
    style={{
      backgroundImage: atmosphere.mist,
      zIndex: 1,
    }}
  />
);

// ═══════════════════════════════════════════
// VIGNETTE OVERLAY — top depth shadow
// ═══════════════════════════════════════════

export const VignetteOverlay: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none"
    style={{
      backgroundImage: atmosphere.vignette,
      zIndex: 1,
    }}
  />
);

// ═══════════════════════════════════════════
// SIGIL ICON — renders a brand sigil as SVG
// ═══════════════════════════════════════════

interface SigilIconProps {
  name: SigilName;
  size?: number;
  color?: string;
  className?: string;
}

export const SigilIcon: React.FC<SigilIconProps> = ({
  name,
  size = 16,
  color,
  className = '',
}) => {
  const path = sigilPaths[name];
  const fill = color || sigilColors[name] || '#55556A';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      className={className}
    >
      <path
        d={path}
        fill={name === 'completed' || name === 'failed' || name === 'active' || name === 'focus' ? 'none' : fill}
        stroke={name === 'completed' || name === 'failed' || name === 'active' || name === 'focus' ? fill : 'none'}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ═══════════════════════════════════════════
// VOID DIVIDER — atmospheric section separator
// ═══════════════════════════════════════════

interface VoidDividerProps {
  variant?: 'default' | 'accent' | 'oracle';
  withMark?: boolean;
}

export const VoidDivider: React.FC<VoidDividerProps> = ({
  variant = 'default',
  withMark = false,
}) => {
  if (withMark) {
    return (
      <div className={runeSeparator.container}>
        <div className={runeSeparator.line} />
        <div className={variant === 'accent' ? runeSeparator.markAccent : runeSeparator.mark} />
        <div className={runeSeparator.line} />
      </div>
    );
  }

  const classes = variant === 'accent' ? voidDivider.accent
    : variant === 'oracle' ? voidDivider.oracle
    : voidDivider.horizontal;

  return <div className={classes} />;
};

// ═══════════════════════════════════════════
// CORNER ORNAMENT — premium panel accent
// ═══════════════════════════════════════════

interface CornerOrnamentProps {
  position?: 'tl' | 'tr' | 'bl' | 'br';
  color?: string;
  size?: number;
}

export const CornerOrnament: React.FC<CornerOrnamentProps> = ({
  position = 'tl',
  color = '#5DAEFF20',
  size = 24,
}) => {
  const positionClasses: Record<string, string> = {
    tl: 'top-0 left-0',
    tr: 'top-0 right-0 rotate-90',
    bl: 'bottom-0 left-0 -rotate-90',
    br: 'bottom-0 right-0 rotate-180',
  };

  return (
    <svg
      className={`absolute pointer-events-none ${positionClasses[position]}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d={`M0 0h${size}M0 0v${size}`} stroke={color} strokeWidth={1} />
      <path d={`M0 0h8`} stroke={color} strokeWidth={1.5} />
      <path d={`M0 0v8`} stroke={color} strokeWidth={1.5} />
    </svg>
  );
};

// ═══════════════════════════════════════════
// PANEL WITH ORNAMENTS — premium framed panel
// ═══════════════════════════════════════════

interface PremiumPanelProps {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
  withCorners?: boolean;
}

export const PremiumPanel: React.FC<PremiumPanelProps> = ({
  children,
  className = '',
  accentColor = '#5DAEFF20',
  withCorners = true,
}) => {
  return (
    <div className={`relative bg-[#1A1A26] border border-[#2A2A3C] rounded-xl overflow-hidden ${className}`}>
      {withCorners && (
        <>
          <CornerOrnament position="tl" color={accentColor} />
          <CornerOrnament position="tr" color={accentColor} />
          <CornerOrnament position="bl" color={accentColor} />
          <CornerOrnament position="br" color={accentColor} />
        </>
      )}
      {children}
    </div>
  );
};

// ═══════════════════════════════════════════
// BARREL EXPORT
// ═══════════════════════════════════════════

export { eclipseRing, voidDivider, runeSeparator, oracleGlow, atmosphere } from './motifs';
