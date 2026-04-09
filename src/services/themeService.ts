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
  unlockRequirement?: string; // achievement ID needed
}

export const THEMES: ThemeConfig[] = [
  { id: 'default', name: 'Eclipse', nameRu: 'Затмение', accent: '#5DAEFF', accentGlow: 'rgba(93,174,255,0.15)', surface: '#12121A', border: '#1E1E2E', gold: '#D8C18E', icon: '🌑' },
  { id: 'blood', name: 'Blood', nameRu: 'Кровь', accent: '#E03030', accentGlow: 'rgba(224,48,48,0.15)', surface: '#1A1214', border: '#2E1E1E', gold: '#E8A080', icon: '🩸', unlockRequirement: 'war_machine' },
  { id: 'gold', name: 'Valhalla Gold', nameRu: 'Золото Вальхаллы', accent: '#D8C18E', accentGlow: 'rgba(216,193,142,0.15)', surface: '#1A1812', border: '#2E2A1E', gold: '#F0D8A0', icon: '✨', unlockRequirement: 'eternal_flame' },
  { id: 'void', name: 'Void', nameRu: 'Пустота', accent: '#8878C8', accentGlow: 'rgba(136,120,200,0.15)', surface: '#0E0E14', border: '#1A1A28', gold: '#A898D8', icon: '🌀', unlockRequirement: 'zen_master' },
  { id: 'arctic', name: 'Arctic', nameRu: 'Арктика', accent: '#40D8D0', accentGlow: 'rgba(64,216,208,0.15)', surface: '#101818', border: '#1E2E2E', gold: '#80E8D8', icon: '❄️' },
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
}

// Apply on load
applyTheme();
