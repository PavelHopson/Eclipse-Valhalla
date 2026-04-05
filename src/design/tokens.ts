/**
 * Eclipse Valhalla - Design Tokens v3
 *
 * Personal operating system for execution, discipline, and pressure.
 * 80% readable command surface.
 * 20% sacred, brutal symbolic layer.
 */

export const colors = {
  void: {
    black: '#0A0A0A',
    graphite: '#121212',
    iron: '#171717',
    basalt: '#1D1D1D',
    slate: '#232323',
    steel: '#2A2A2A',
    ridge: '#343434',
  },

  border: {
    ghost: '#FFFFFF08',
    subtle: '#FFFFFF0D',
    default: '#FFFFFF16',
    strong: '#FFFFFF24',
    etched: '#8EA7C61F',
  },

  text: {
    primary: '#F2F1EE',
    secondary: '#B4B0A7',
    tertiary: '#7F7A72',
    ghost: '#5F5A54',
    inverse: '#0A0A0A',
  },

  accent: {
    cold: '#6C8FB8',
    coldDim: '#6C8FB866',
    coldGlow: '#6C8FB81F',
    coldSurface: '#6C8FB80F',
    coldLine: '#91ABC633',
  },

  danger: {
    red: '#7A1F24',
    redBright: '#A33036',
    redDim: '#7A1F2466',
    redGlow: '#7A1F241F',
    redSurface: '#7A1F240F',
  },

  gold: {
    pale: '#B89B5E',
    paleDim: '#B89B5E66',
    paleGlow: '#B89B5E1F',
    paleSurface: '#B89B5E0F',
  },

  success: {
    muted: '#8E9B79',
    glow: '#8E9B791A',
  },

  bg: {
    void: '#0A0A0A',
    abyss: '#121212',
    surface: '#171717',
    card: '#1D1D1D',
    raised: '#232323',
    hover: '#2A2A2A',
    active: '#343434',
  },
} as const;

export const typography = {
  fontFamily: {
    body: "'Manrope', 'Segoe UI', sans-serif",
    display: "'Cinzel', Georgia, serif",
    mono: "'JetBrains Mono', 'SF Mono', monospace",
  },
  fontSize: {
    xs: '11px',
    sm: '13px',
    base: '15px',
    md: '16px',
    lg: '18px',
    xl: '22px',
    '2xl': '30px',
    '3xl': '42px',
    '4xl': '56px',
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 800,
  },
  tracking: {
    tight: '-0.03em',
    base: '0em',
    wide: '0.12em',
    ritual: '0.24em',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '96px',
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '18px',
  panel: '20px',
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 8px 24px rgba(0, 0, 0, 0.25)',
  md: '0 18px 40px rgba(0, 0, 0, 0.34)',
  lg: '0 26px 80px rgba(0, 0, 0, 0.48)',
  inner: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)',
  glowCold: '0 0 28px rgba(108, 143, 184, 0.16)',
  glowDanger: '0 0 28px rgba(122, 31, 36, 0.22)',
  glowGold: '0 0 24px rgba(184, 155, 94, 0.18)',
} as const;

export const transitions = {
  fast: '160ms cubic-bezier(0.4, 0, 0.2, 1)',
  default: '280ms cubic-bezier(0.22, 1, 0.36, 1)',
  slow: '520ms cubic-bezier(0.16, 1, 0.3, 1)',
  heavy: '900ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
  widget: 60,
  blocker: 100,
} as const;
