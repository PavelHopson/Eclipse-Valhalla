/**
 * Eclipse Valhalla — Design Tokens v2
 *
 * SACRED BRUTALISM — Mythic Discipline Interface
 *
 * Not a theme. An identity.
 * Every pixel serves execution. Every shadow implies judgment.
 * 80% clean brutalist clarity. 20% mythic symbolic depth.
 */

// ═══════════════════════════════════════════
// COLORS — THE VOID PALETTE
// ═══════════════════════════════════════════

export const colors = {
  // Void layers — the system's depth
  void: {
    black:    '#050508',   // True void — page bg
    deep:     '#08080D',   // App shell
    abyss:    '#0B0B12',   // Surface 1
    obsidian: '#0F0F18',   // Surface 2 (cards)
    slate:    '#14141F',   // Surface 3 (raised)
    iron:     '#1A1A28',   // Surface 4 (interactive)
    steel:    '#222233',   // Hover
    ash:      '#2A2A3D',   // Active
  },

  // Borders
  border: {
    ghost:    '#16162240',
    subtle:   '#1E1E3050',
    default:  '#2A2A3C70',
    strong:   '#3A3A5080',
    ritual:   '#5DA8FF15',
  },

  // Text hierarchy
  text: {
    primary:   '#EAEAF2',
    secondary: '#9494AD',
    tertiary:  '#5E5E78',
    ghost:     '#3D3D52',
    inverse:   '#050508',
  },

  // Accent — Ice Fire
  accent: {
    ice:       '#5DA8FF',
    iceDim:    '#5DA8FF60',
    iceGlow:   '#5DA8FF20',
    iceSurface:'#5DA8FF08',
    iceHover:  '#4A95EE',
  },

  // Oracle — Emerald
  oracle: {
    green:      '#3DD68C',
    greenDim:   '#3DD68C60',
    greenGlow:  '#3DD68C18',
    greenSurface:'#3DD68C08',
  },

  // Forge — Void Purple
  forge: {
    purple:      '#7B5CFF',
    purpleDim:   '#7B5CFF60',
    purpleGlow:  '#7B5CFF18',
    purpleSurface:'#7B5CFF08',
  },

  // Danger — Blood Rune
  danger: {
    blood:      '#E03030',
    bloodDim:   '#E0303060',
    bloodGlow:  '#E0303020',
    bloodSurface:'#E0303008',
    bloodDeep:  '#6B0000',
  },

  // Warning
  warning: {
    flame:      '#E8A820',
    flameDim:   '#E8A82060',
    flameGlow:  '#E8A82018',
    flameSurface:'#E8A82008',
  },

  // Streak
  streak: { fire: '#E86835', fireGlow: '#E8683518' },

  // XP
  glory: { gold: '#D4A828', goldGlow: '#D4A82818' },

  // Completion
  completion: { mark: '#3DD68C', markGlow: '#3DD68C10' },

  // Legacy compat (used across components)
  bg: {
    void:    '#050508',
    abyss:   '#08080D',
    surface: '#0B0B12',
    card:    '#0F0F18',
    raised:  '#14141F',
    hover:   '#222233',
    active:  '#2A2A3D',
  },
} as const;


// ═══════════════════════════════════════════
// TYPOGRAPHY
// ═══════════════════════════════════════════

export const typography = {
  fontFamily: {
    body: "'Inter', -apple-system, sans-serif",
    display: "'Inter', sans-serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
    hand: "'Patrick Hand', cursive",
  },
  fontSize: {
    xs:    '11px',
    sm:    '13px',
    base:  '14px',
    md:    '16px',
    lg:    '18px',
    xl:    '22px',
    '2xl': '28px',
    '3xl': '36px',
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
// RADIUS
// ═══════════════════════════════════════════

export const radius = {
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '18px',
  full: '9999px',
} as const;


// ═══════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════

export const shadows = {
  sm:    '0 2px 8px rgba(0, 0, 0, 0.4)',
  md:    '0 4px 16px rgba(0, 0, 0, 0.5)',
  lg:    '0 8px 32px rgba(0, 0, 0, 0.6)',
  xl:    '0 16px 64px rgba(0, 0, 0, 0.7)',
  glow:  '0 0 20px rgba(93, 168, 255, 0.12)',
  glowPurple: '0 0 20px rgba(123, 92, 255, 0.12)',
  glowDanger: '0 0 20px rgba(224, 48, 48, 0.15)',
  inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.02)',
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
// Z-INDEX
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
