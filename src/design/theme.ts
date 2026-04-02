/**
 * Eclipse Valhalla — Theme System
 *
 * Tailwind utility class mappings built on design tokens.
 * Use these instead of raw Tailwind classes for consistency.
 */

// ═══════════════════════════════════════════
// TAILWIND CSS CLASSES (mapped from tokens)
// ═══════════════════════════════════════════

export const theme = {
  // --- Layout Backgrounds ---
  bg: {
    app:     'bg-[#0A0A0F]',
    main:    'bg-[#0E0E16]',
    surface: 'bg-[#12121A]',
    card:    'bg-[#1A1A26]',
    raised:  'bg-[#1F1F2B]',
    hover:   'hover:bg-[#262636]',
    active:  'bg-[#2D2D40]',
  },

  // --- Borders ---
  border: {
    subtle:  'border-[#1E1E2E]',
    default: 'border-[#2A2A3C]',
    strong:  'border-[#3A3A52]',
    accent:  'border-[#5DAEFF40]',
    purple:  'border-[#7A5CFF40]',
    danger:  'border-[#8B000060]',
  },

  // --- Text ---
  text: {
    primary:   'text-[#E8E8F0]',
    secondary: 'text-[#8888A0]',
    tertiary:  'text-[#55556A]',
    disabled:  'text-[#3A3A4A]',
    accent:    'text-[#5DAEFF]',
    purple:    'text-[#7A5CFF]',
    oracle:    'text-[#4ADE80]',
    danger:    'text-[#DC2626]',
    gold:      'text-[#FFD700]',
    warning:   'text-[#FBBF24]',
  },

  // --- Accent Buttons ---
  btn: {
    primary:  'bg-[#5DAEFF] hover:bg-[#4A9AEE] text-[#0A0A0F] font-semibold',
    secondary:'bg-[#7A5CFF] hover:bg-[#6B4DEE] text-white font-semibold',
    ghost:    'bg-transparent hover:bg-[#1F1F2B] text-[#8888A0] hover:text-[#E8E8F0]',
    danger:   'bg-[#8B0000] hover:bg-[#A00000] text-white font-semibold',
    oracle:   'bg-[#4ADE80] hover:bg-[#3ACF70] text-[#0A0A0F] font-semibold',
    disabled: 'bg-[#1F1F2B] text-[#3A3A4A] cursor-not-allowed',
  },

  // --- Cards ---
  card: {
    base:    'bg-[#1A1A26] border border-[#2A2A3C] rounded-xl',
    hover:   'bg-[#1A1A26] border border-[#2A2A3C] rounded-xl hover:border-[#3A3A52] hover:bg-[#1F1F2B] transition-all',
    glow:    'bg-[#1A1A26] border border-[#5DAEFF30] rounded-xl shadow-[0_0_20px_rgba(93,174,255,0.08)]',
    danger:  'bg-[#1A1A26] border border-[#8B000040] rounded-xl',
    raised:  'bg-[#1F1F2B] border border-[#3A3A52] rounded-xl shadow-lg',
  },

  // --- Input ---
  input: {
    base:  'bg-[#12121A] border border-[#2A2A3C] rounded-lg px-4 py-3 text-[#E8E8F0] placeholder-[#55556A] outline-none focus:border-[#5DAEFF60] focus:ring-1 focus:ring-[#5DAEFF30] transition-all',
    error: 'bg-[#12121A] border border-[#8B000060] rounded-lg px-4 py-3 text-[#E8E8F0] outline-none focus:border-[#DC2626] transition-all',
  },

  // --- Glow Effects ---
  glow: {
    accent:  'shadow-[0_0_20px_rgba(93,174,255,0.15)]',
    purple:  'shadow-[0_0_20px_rgba(122,92,255,0.15)]',
    oracle:  'shadow-[0_0_20px_rgba(74,222,128,0.15)]',
    danger:  'shadow-[0_0_20px_rgba(139,0,0,0.3)]',
    gold:    'shadow-[0_0_20px_rgba(255,215,0,0.2)]',
  },

  // --- Glassmorphism ---
  glass: {
    dark:   'bg-[#12121A]/80 backdrop-blur-xl border border-[#2A2A3C]',
    medium: 'bg-[#1A1A26]/70 backdrop-blur-lg border border-[#2A2A3C]',
    light:  'bg-[#1F1F2B]/60 backdrop-blur-md border border-[#3A3A52]',
  },

  // --- Badges / Pills ---
  badge: {
    accent:  'bg-[#5DAEFF15] text-[#5DAEFF] border border-[#5DAEFF30] text-xs font-bold px-2 py-0.5 rounded-full',
    purple:  'bg-[#7A5CFF15] text-[#7A5CFF] border border-[#7A5CFF30] text-xs font-bold px-2 py-0.5 rounded-full',
    danger:  'bg-[#8B000020] text-[#FF4444] border border-[#8B000040] text-xs font-bold px-2 py-0.5 rounded-full',
    success: 'bg-[#4ADE8015] text-[#4ADE80] border border-[#4ADE8030] text-xs font-bold px-2 py-0.5 rounded-full',
    gold:    'bg-[#FFD70015] text-[#FFD700] border border-[#FFD70030] text-xs font-bold px-2 py-0.5 rounded-full',
    neutral: 'bg-[#1F1F2B] text-[#8888A0] border border-[#2A2A3C] text-xs font-medium px-2 py-0.5 rounded-full',
  },

  // --- Scrollbar ---
  scrollbar: 'scrollbar-thin scrollbar-thumb-[#2A2A3C] scrollbar-track-transparent',
} as const;


// ═══════════════════════════════════════════
// NOISE TEXTURE (CSS background)
// ═══════════════════════════════════════════

export const noiseOverlay = `
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.02'/%3E%3C/svg%3E");
`;


// ═══════════════════════════════════════════
// STATUS COLOR MAP
// ═══════════════════════════════════════════

export const questStatusColors = {
  todo:        { bg: 'bg-[#5DAEFF10]', text: 'text-[#5DAEFF]', border: 'border-[#5DAEFF30]', label: 'Pending' },
  in_progress: { bg: 'bg-[#7A5CFF10]', text: 'text-[#7A5CFF]', border: 'border-[#7A5CFF30]', label: 'In Progress' },
  done:        { bg: 'bg-[#4ADE8010]', text: 'text-[#4ADE80]', border: 'border-[#4ADE8030]', label: 'Completed' },
  failed:      { bg: 'bg-[#8B000015]', text: 'text-[#FF4444]', border: 'border-[#8B000040]', label: 'Failed' },
} as const;

export const priorityColors = {
  High:   { bg: 'bg-[#8B000020]', text: 'text-[#FF4444]', border: 'border-[#8B000040]', glow: 'shadow-[0_0_10px_rgba(139,0,0,0.2)]' },
  Medium: { bg: 'bg-[#FBBF2415]', text: 'text-[#FBBF24]', border: 'border-[#FBBF2430]', glow: '' },
  Low:    { bg: 'bg-[#5DAEFF10]', text: 'text-[#5DAEFF]', border: 'border-[#5DAEFF20]', glow: '' },
} as const;
