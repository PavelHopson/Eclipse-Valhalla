/**
 * Eclipse Valhalla — Visual Motifs
 *
 * Reusable CSS/SVG motifs that form the brand's visual DNA.
 * Void + Discipline + Myth + Premium Technology.
 *
 * Usage: inline styles, CSS custom properties, or className strings.
 */

// ═══════════════════════════════════════════
// ECLIPSE RING
// ═══════════════════════════════════════════

/**
 * Radial gradient mimicking a solar eclipse.
 * Use as background on hero sections or behind key elements.
 */
export const eclipseRing = {
  /** Centered eclipse — cold blue corona */
  cold: `radial-gradient(ellipse 50% 50% at 50% 50%, transparent 48%, #5DAEFF08 52%, #5DAEFF04 60%, transparent 70%)`,
  /** Centered eclipse — void purple corona */
  void: `radial-gradient(ellipse 50% 50% at 50% 50%, transparent 48%, #7A5CFF08 52%, #7A5CFF04 60%, transparent 70%)`,
  /** Top-positioned ambient — for page headers */
  ambient: `radial-gradient(ellipse 80% 40% at 50% -10%, #5DAEFF06 0%, transparent 70%)`,
  /** Oracle variant — emerald haze */
  oracle: `radial-gradient(ellipse 60% 50% at 50% 30%, #4ADE8006 0%, transparent 65%)`,
  /** Danger variant — blood haze */
  blood: `radial-gradient(ellipse 60% 50% at 50% 50%, #8B000008 0%, transparent 60%)`,
} as const;


// ═══════════════════════════════════════════
// VOID DIVIDER
// ═══════════════════════════════════════════

/**
 * Horizontal separator line with faded edges.
 * Tailwind class composition.
 */
export const voidDivider = {
  /** Standard horizontal divider */
  horizontal: 'h-px bg-gradient-to-r from-transparent via-[#2A2A3C] to-transparent',
  /** Accented divider with cold glow */
  accent: 'h-px bg-gradient-to-r from-transparent via-[#5DAEFF20] to-transparent',
  /** Oracle green divider */
  oracle: 'h-px bg-gradient-to-r from-transparent via-[#4ADE8018] to-transparent',
  /** Vertical divider */
  vertical: 'w-px bg-gradient-to-b from-transparent via-[#2A2A3C] to-transparent',
} as const;


// ═══════════════════════════════════════════
// QUEST FRAME
// ═══════════════════════════════════════════

/**
 * Subtle corner accents for premium panels.
 * Applied as CSS border-image or pseudo-element styles.
 */
export const questFrame = {
  /** Top-left corner accent line */
  cornerTL: `
    before:content-[''] before:absolute before:top-0 before:left-0
    before:w-6 before:h-px before:bg-gradient-to-r before:from-[#5DAEFF30] before:to-transparent
    after:content-[''] after:absolute after:top-0 after:left-0
    after:h-6 after:w-px after:bg-gradient-to-b after:from-[#5DAEFF30] after:to-transparent
  `,
  /** Full subtle corner frame — all four corners */
  full: 'ring-1 ring-[#5DAEFF08] ring-inset',
} as const;


// ═══════════════════════════════════════════
// RUNE SEPARATOR
// ═══════════════════════════════════════════

/**
 * Section separator with a centered sigil mark.
 * The sigil is a thin diamond / lozenge shape.
 */
export const runeSeparator = {
  /** CSS classes for the container */
  container: 'flex items-center gap-3 py-3',
  /** Left/right line */
  line: 'flex-1 h-px bg-gradient-to-r from-transparent via-[#2A2A3C] to-transparent',
  /** Center mark — a small rotated square */
  mark: 'w-1.5 h-1.5 rotate-45 bg-[#2A2A3C] shrink-0',
  /** Accented mark */
  markAccent: 'w-1.5 h-1.5 rotate-45 bg-[#5DAEFF30] shrink-0',
} as const;


// ═══════════════════════════════════════════
// ORACLE GLOW
// ═══════════════════════════════════════════

/**
 * Ambient glow effects for Oracle-related surfaces.
 */
export const oracleGlow = {
  /** Subtle emerald ambient behind oracle panels */
  ambient: `radial-gradient(ellipse 70% 50% at 50% 0%, #4ADE800A 0%, transparent 70%)`,
  /** Stronger glow for active oracle states */
  active: 'shadow-[0_0_40px_rgba(74,222,128,0.06)]',
  /** Pulsing ring for "oracle is thinking" */
  thinking: 'animate-pulse shadow-[0_0_30px_rgba(74,222,128,0.1)]',
} as const;


// ═══════════════════════════════════════════
// ATMOSPHERIC PATTERNS
// ═══════════════════════════════════════════

/**
 * Very faint background patterns for depth.
 * Opacity should be 0.01–0.03 max.
 */
export const atmosphere = {
  /** Subtle dot grid */
  dotGrid: `radial-gradient(circle, #ffffff03 1px, transparent 1px)`,
  dotGridSize: '24px 24px',

  /** Faint mist / fog gradient at bottom of screens */
  mist: `linear-gradient(to top, #0A0A0F 0%, transparent 30%)`,

  /** Top vignette for depth */
  vignette: `radial-gradient(ellipse 100% 60% at 50% 0%, transparent 50%, #0A0A0F40 100%)`,
} as const;
