/**
 * Eclipse Valhalla — Theme Service
 * Color themes that apply via CSS custom properties
 */

export type ThemeId = 'default' | 'blood' | 'gold' | 'void' | 'arctic';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  nameRu: string;
  accent: string;
  accentGlow: string;
  surface: string;
  border: string;
  gold: string;
  icon: string;
  unlockRequirement?: string;
  colors: ThemeColors;
}

export interface ThemeColors {
  bg: string;
  bg2: string;
  bg3: string;
  cardBg: string;
  sidebarBg: string;
  textPrimary: string;
  textSecondary: string;
}

export const THEMES: ThemeConfig[] = [
  { id: 'default', name: 'Eclipse', nameRu: 'Затмение', accent: '#5DAEFF', accentGlow: 'rgba(93,174,255,0.15)', surface: '#12121A', border: '#1E1E2E', gold: '#D8C18E', icon: '🌑',
    colors: { bg: '#0A0A0F', bg2: '#0C0C14', bg3: '#12121A', cardBg: '#171717', sidebarBg: '#050508', textPrimary: '#F2F1EE', textSecondary: '#8888A0' } },
  { id: 'blood', name: 'Blood', nameRu: 'Кровь', accent: '#E03030', accentGlow: 'rgba(224,48,48,0.12)', surface: '#1A1214', border: '#2E1E1E', gold: '#E8A080', icon: '🩸', unlockRequirement: 'war_machine',
    colors: { bg: '#0F0808', bg2: '#140C0C', bg3: '#1A1214', cardBg: '#1E1416', sidebarBg: '#080404', textPrimary: '#F4E8E8', textSecondary: '#A08888' } },
  { id: 'gold', name: 'Valhalla Gold', nameRu: 'Золото Вальхаллы', accent: '#D8C18E', accentGlow: 'rgba(216,193,142,0.12)', surface: '#1A1812', border: '#2E2A1E', gold: '#F0D8A0', icon: '✨', unlockRequirement: 'eternal_flame',
    colors: { bg: '#0C0A06', bg2: '#12100A', bg3: '#1A1812', cardBg: '#1E1C14', sidebarBg: '#060504', textPrimary: '#F4F0E8', textSecondary: '#A09880' } },
  { id: 'void', name: 'Void', nameRu: 'Пустота', accent: '#8878C8', accentGlow: 'rgba(136,120,200,0.12)', surface: '#0E0E18', border: '#1E1E30', gold: '#A898D8', icon: '🌀', unlockRequirement: 'zen_master',
    colors: { bg: '#06060C', bg2: '#0A0A14', bg3: '#0E0E18', cardBg: '#14141E', sidebarBg: '#040408', textPrimary: '#E8E8F4', textSecondary: '#8080A0' } },
  { id: 'arctic', name: 'Arctic', nameRu: 'Арктика', accent: '#40D8D0', accentGlow: 'rgba(64,216,208,0.12)', surface: '#101818', border: '#1E2E2E', gold: '#80E8D8', icon: '❄️',
    colors: { bg: '#060C0C', bg2: '#0A1414', bg3: '#101818', cardBg: '#141E1E', sidebarBg: '#040808', textPrimary: '#E8F4F4', textSecondary: '#80A0A0' } },
];

const STORAGE_KEY = 'eclipse_theme';

export function getCurrentTheme(): ThemeId {
  return (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'default';
}

export function setTheme(id: ThemeId): void {
  localStorage.setItem(STORAGE_KEY, id);
  applyTheme(id);
}

export function getThemeConfig(id?: ThemeId): ThemeConfig {
  return THEMES.find(t => t.id === (id || getCurrentTheme())) || THEMES[0];
}

export function applyTheme(id?: ThemeId): void {
  const theme = getThemeConfig(id);
  const root = document.documentElement;
  root.style.setProperty('--ev-accent', theme.accent);
  root.style.setProperty('--ev-accent-glow', theme.accentGlow);
  root.style.setProperty('--ev-surface', theme.surface);
  root.style.setProperty('--ev-border', theme.border);
  root.style.setProperty('--ev-gold', theme.gold);

  // Apply theme colors throughout the app via dynamic stylesheet
  const c = theme.colors;
  const style = document.getElementById('ev-theme-style') || document.createElement('style');
  style.id = 'ev-theme-style';
  style.textContent = `
    ::selection { background: ${theme.accent}40; color: white; }
    ::-webkit-scrollbar-thumb { background: ${theme.border}; }
    ::-webkit-scrollbar-thumb:hover { background: ${theme.accent}; }

    /* ═══ BACKGROUNDS ═══ */
    body { background: radial-gradient(circle at top, ${theme.accentGlow}, transparent 28%), radial-gradient(circle at bottom right, ${theme.gold}08, transparent 26%), ${c.bg} !important; }
    .bg-\\[\\#050508\\], .bg-\\[\\#0A0A0F\\] { background-color: ${c.bg} !important; }
    .bg-\\[\\#0C0C14\\] { background-color: ${c.bg2} !important; }
    .bg-\\[\\#0E0E16\\], .bg-\\[\\#12121A\\] { background-color: ${c.bg3} !important; }
    .bg-\\[\\#171717\\], .bg-\\[\\#1A1A26\\] { background-color: ${c.cardBg} !important; }
    .bg-\\[\\#1F1F2B\\] { background-color: ${c.cardBg} !important; }

    /* Sidebar */
    .bg-\\[\\#050508\\]\\/95 { background-color: ${c.sidebarBg}F2 !important; }

    /* ═══ TEXT ═══ */
    .text-\\[\\#F2F1EE\\], .text-\\[\\#EAEAF2\\], .text-\\[\\#E8E8F0\\] { color: ${c.textPrimary} !important; }
    .text-\\[\\#8888A0\\], .text-\\[\\#B4B0A7\\] { color: ${c.textSecondary} !important; }

    /* ═══ BORDERS ═══ */
    .border-\\[\\#1E1E2E\\] { border-color: ${theme.border} !important; }
    .border-\\[\\#2A2A3C\\] { border-color: ${theme.border} !important; }
    .border-\\[\\#16162240\\] { border-color: ${theme.border}40 !important; }
    .border-white\\/8 { border-color: ${theme.border} !important; }

    /* ═══ ACCENT ═══ */
    .text-\\[\\#5DAEFF\\] { color: ${theme.accent} !important; }
    .bg-\\[\\#5DAEFF\\] { background-color: ${theme.accent} !important; }
    [style*="color: rgb(93, 174, 255)"] { color: ${theme.accent} !important; }
    [style*="background-color: rgb(93, 174, 255)"] { background-color: ${theme.accent} !important; }
    [style*="backgroundColor: rgb(93, 174, 255)"] { background-color: ${theme.accent} !important; }

    /* ═══ GOLD ═══ */
    .text-\\[\\#D8C18E\\] { color: ${theme.gold} !important; }
    .text-\\[\\#B89B5E\\] { color: ${theme.gold} !important; }
    [style*="color: rgb(216, 193, 142)"] { color: ${theme.gold} !important; }
    [style*="color: rgb(184, 155, 94)"] { color: ${theme.gold} !important; }
  `;
  if (!style.parentNode) document.head.appendChild(style);
}

// Apply on load
applyTheme();
