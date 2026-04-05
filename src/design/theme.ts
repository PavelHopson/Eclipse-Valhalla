/**
 * Eclipse Valhalla - Theme System
 *
 * Tailwind utility mappings built on the execution-first visual system.
 */

export const theme = {
  bg: {
    app: 'bg-[#0A0A0A]',
    main: 'bg-[#121212]',
    surface: 'bg-[#171717]',
    card: 'bg-[#1D1D1D]',
    raised: 'bg-[#232323]',
    hover: 'hover:bg-[#2A2A2A]',
    active: 'bg-[#343434]',
  },

  border: {
    subtle: 'border-white/5',
    default: 'border-white/10',
    strong: 'border-white/15',
    accent: 'border-[#6C8FB833]',
    danger: 'border-[#7A1F2438]',
    gold: 'border-[#B89B5E33]',
  },

  text: {
    primary: 'text-[#F2F1EE]',
    secondary: 'text-[#B4B0A7]',
    tertiary: 'text-[#7F7A72]',
    disabled: 'text-[#5F5A54]',
    accent: 'text-[#6C8FB8]',
    danger: 'text-[#A33036]',
    gold: 'text-[#B89B5E]',
    success: 'text-[#8E9B79]',
  },

  btn: {
    primary: 'bg-[#6C8FB8] hover:bg-[#7C9FC7] text-[#0A0A0A] font-bold',
    secondary: 'bg-[#1D1D1D] hover:bg-[#232323] text-[#F2F1EE] border border-white/10 font-semibold',
    ghost: 'bg-transparent hover:bg-white/[0.04] text-[#B4B0A7] hover:text-[#F2F1EE]',
    danger: 'bg-[#7A1F24] hover:bg-[#8D262C] text-[#F2F1EE] font-bold',
    gold: 'bg-[#B89B5E] hover:bg-[#C5A76A] text-[#0A0A0A] font-bold',
    disabled: 'bg-[#1D1D1D] text-[#5F5A54] cursor-not-allowed',
  },

  card: {
    base: 'bg-[#171717]/92 border border-white/8 rounded-[20px]',
    hover: 'bg-[#171717]/92 border border-white/8 rounded-[20px] hover:border-white/14 hover:bg-[#1D1D1D] transition-all',
    etched: 'bg-[#171717]/92 border border-[#6C8FB81A] rounded-[20px] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]',
    danger: 'bg-[#171717]/94 border border-[#7A1F2433] rounded-[20px]',
    focus: 'bg-[#171717]/94 border border-[#B89B5E29] rounded-[20px] shadow-[0_0_24px_rgba(184,155,94,0.12)]',
  },

  input: {
    base: 'bg-[#121212] border border-white/10 rounded-[12px] px-4 py-3 text-[#F2F1EE] placeholder-[#5F5A54] outline-none focus:border-[#6C8FB855] focus:ring-1 focus:ring-[#6C8FB833] transition-all',
    intense: 'bg-[#121212] border border-[#6C8FB826] rounded-[14px] px-4 py-4 text-[#F2F1EE] placeholder-[#5F5A54] outline-none focus:border-[#B89B5E4D] focus:ring-1 focus:ring-[#B89B5E33] transition-all',
    error: 'bg-[#121212] border border-[#7A1F2440] rounded-[12px] px-4 py-3 text-[#F2F1EE] outline-none focus:border-[#A33036] transition-all',
  },

  glow: {
    accent: 'shadow-[0_0_28px_rgba(108,143,184,0.14)]',
    danger: 'shadow-[0_0_28px_rgba(122,31,36,0.20)]',
    gold: 'shadow-[0_0_24px_rgba(184,155,94,0.16)]',
  },

  badge: {
    accent: 'bg-[#6C8FB814] text-[#9AB7D4] border border-[#6C8FB82E] text-[10px] font-bold px-2.5 py-1 rounded-full',
    danger: 'bg-[#7A1F2414] text-[#C05A60] border border-[#7A1F2433] text-[10px] font-bold px-2.5 py-1 rounded-full',
    gold: 'bg-[#B89B5E14] text-[#D8C18E] border border-[#B89B5E33] text-[10px] font-bold px-2.5 py-1 rounded-full',
    success: 'bg-[#8E9B7914] text-[#AFBB9B] border border-[#8E9B792E] text-[10px] font-bold px-2.5 py-1 rounded-full',
    neutral: 'bg-white/[0.03] text-[#B4B0A7] border border-white/8 text-[10px] font-medium px-2.5 py-1 rounded-full',
  },

  scrollbar: 'scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent',
} as const;

export const noiseOverlay = `
  background-image:
    radial-gradient(circle at 20% 20%, rgba(108, 143, 184, 0.05), transparent 32%),
    radial-gradient(circle at 80% 0%, rgba(184, 155, 94, 0.035), transparent 26%),
    linear-gradient(180deg, rgba(255,255,255,0.01), transparent 30%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E");
`;

export const questStatusColors = {
  todo: { bg: 'bg-[#6C8FB812]', text: 'text-[#9AB7D4]', border: 'border-[#6C8FB82E]', label: 'Pending' },
  in_progress: { bg: 'bg-[#B89B5E12]', text: 'text-[#D8C18E]', border: 'border-[#B89B5E2E]', label: 'Engaged' },
  done: { bg: 'bg-[#8E9B7912]', text: 'text-[#AFBB9B]', border: 'border-[#8E9B792A]', label: 'Completed' },
  failed: { bg: 'bg-[#7A1F2412]', text: 'text-[#C05A60]', border: 'border-[#7A1F2430]', label: 'Failed' },
} as const;

export const priorityColors = {
  High: { bg: 'bg-[#7A1F2414]', text: 'text-[#C05A60]', border: 'border-[#7A1F2433]', glow: 'shadow-[0_0_16px_rgba(122,31,36,0.14)]' },
  Medium: { bg: 'bg-[#B89B5E10]', text: 'text-[#D8C18E]', border: 'border-[#B89B5E26]', glow: '' },
  Low: { bg: 'bg-[#6C8FB810]', text: 'text-[#9AB7D4]', border: 'border-[#6C8FB826]', glow: '' },
} as const;
