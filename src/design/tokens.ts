/**
 * Eclipse Valhalla — Design Tokens
 *
 * Dark. Brutal. Cold. Cosmic. Nordic minimal.
 * Every pixel serves a purpose.
 */

// ═══════════════════════════════════════════
// COLORS
// ═══════════════════════════════════════════

export const colors = {
  // Backgrounds
  bg: {
    void:    '#0A0A0F',   // deepest background — the void
    abyss:   '#0E0E16',   // main app background
    surface: '#12121A',   // elevated surface
    card:    '#1A1A26',   // card backgrounds
    raised:  '#1F1F2B',   // raised elements (modals, popover)
    hover:   '#262636',   // hover state
    active:  '#2D2D40',   // active/pressed state
  },

  // Borders
  border: {
    subtle:  '#1E1E2E',   // barely visible
    default: '#2A2A3C',   // standard border
    strong:  '#3A3A52',   // emphasized border
    glow:    '#5DAEFF20', // glowing border (accent with alpha)
  },

  // Text
  text: {
    primary:   '#E8E8F0',  // main text
    secondary: '#8888A0',  // secondary/muted
    tertiary:  '#55556A',  // very muted (labels, hints)
    disabled:  '#3A3A4A',  // disabled text
    inverse:   '#0A0A0F',  // text on light backgrounds
  },

  // Accent — Primary (Ice Blue)
  accent: {
    primary:    '#5DAEFF',
    primaryDim: '#5DAEFF80',
    primaryGlow:'#5DAEFF30',
    primaryBg:  '#5DAEFF10',
  },

  // Accent — Secondary (Void Purple)
  purple: {
    primary:    '#7A5CFF',
    primaryDim: '#7A5CFF80',
    primaryGlow:'#7A5CFF30',
    primaryBg:  '#7A5CFF10',
  },

  // Accent — Oracle (Emerald)
  oracle: {
    primary:    '#4ADE80',
    primaryDim: '#4ADE8080',
    primaryGlow:'#4ADE8030',
    primaryBg:  '#4ADE8010',
  },

  // Status
  status: {
    success:   '#4ADE80',
    warning:   '#FBBF24',
    danger:    '#8B0000',
    dangerLit: '#DC2626',
    failed:    '#FF4444',
    info:      '#5DAEFF',
  },

  // XP & Gamification
  xp: {
    gold:    '#FFD700',
    goldDim: '#FFD70060',
    goldGlow:'#FFD70020',
    streak:  '#FF6B35',
  },
} as const;


// ═══════════════════════════════════════════
// SPACING
// ═══════════════════════════════════════════

export const spacing = {
  xs:  '4px',
  sm:  '8px',
  md:  '12px',
  lg:  '16px',
  xl:  '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
} as const;


// ═══════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════

export const typography = {
  fontFamily: {
    body:    "'Inter', -apple-system, sans-serif",
    heading: "'Cinzel', serif",
    mono:    "'JetBrains Mono', 'Fira Code', monospace",
    hand:    "'Patrick Hand', cursive",
  },
  fontSize: {
    xs:   '11px',
    sm:   '13px',
    base: '14px',
    md:   '16px',
    lg:   '18px',
    xl:   '22px',
    '2xl':'28px',
    '3xl':'36px',
  },
  fontWeight: {
    normal:   400,
    medium:   500,
    semibold: 600,
    bold:     700,
    black:    900,
  },
} as const;


// ═══════════════════════════════════════════
// BORDERS & RADIUS
// ═══════════════════════════════════════════

export const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '18px',
  full: '9999px',
} as const;


// ═══════════════════════════════════════════
// SHADOWS & EFFECTS
// ═══════════════════════════════════════════

export const shadows = {
  sm:    '0 2px 8px rgba(0, 0, 0, 0.3)',
  md:    '0 4px 16px rgba(0, 0, 0, 0.4)',
  lg:    '0 8px 32px rgba(0, 0, 0, 0.5)',
  xl:    '0 16px 64px rgba(0, 0, 0, 0.6)',
  glow:  '0 0 20px rgba(93, 174, 255, 0.15)',
  glowPurple: '0 0 20px rgba(122, 92, 255, 0.15)',
  glowDanger: '0 0 20px rgba(139, 0, 0, 0.3)',
  inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
} as const;


// ═══════════════════════════════════════════
// TRANSITIONS
// ═══════════════════════════════════════════

export const transitions = {
  fast:    '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  default: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow:    '400ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce:  '500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;


// ═══════════════════════════════════════════
// Z-INDEX LAYERS
// ═══════════════════════════════════════════

export const zIndex = {
  base:      0,
  dropdown:  10,
  sticky:    20,
  overlay:   30,
  modal:     40,
  toast:     50,
  widget:    60,
  blocker:   100,
} as const;
