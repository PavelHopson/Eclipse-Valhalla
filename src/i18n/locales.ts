/**
 * Eclipse Valhalla — Locale Registry
 *
 * Architecture for multi-language expansion.
 * Currently: EN, RU. Ready for: DE, ES, FR, PT, JA, ZH, KO.
 *
 * Adding a new language:
 * 1. Add entry to SUPPORTED_LOCALES
 * 2. Create translation file or extend translations object in index.tsx
 * 3. That's it. All UI auto-adapts.
 */

export interface LocaleConfig {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  dateFormat: string;
  ready: boolean;
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'en', name: 'English',    nativeName: 'English',   direction: 'ltr', dateFormat: 'MM/DD/YYYY', ready: true },
  { code: 'ru', name: 'Russian',    nativeName: 'Русский',   direction: 'ltr', dateFormat: 'DD.MM.YYYY', ready: true },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',   direction: 'ltr', dateFormat: 'DD.MM.YYYY', ready: false },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',   direction: 'ltr', dateFormat: 'DD/MM/YYYY', ready: false },
  { code: 'fr', name: 'French',     nativeName: 'Français',  direction: 'ltr', dateFormat: 'DD/MM/YYYY', ready: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', direction: 'ltr', dateFormat: 'DD/MM/YYYY', ready: false },
  { code: 'ja', name: 'Japanese',   nativeName: '日本語',     direction: 'ltr', dateFormat: 'YYYY/MM/DD', ready: false },
  { code: 'zh', name: 'Chinese',    nativeName: '中文',       direction: 'ltr', dateFormat: 'YYYY-MM-DD', ready: false },
  { code: 'ko', name: 'Korean',     nativeName: '한국어',     direction: 'ltr', dateFormat: 'YYYY.MM.DD', ready: false },
];

export function getReadyLocales(): LocaleConfig[] {
  return SUPPORTED_LOCALES.filter(l => l.ready);
}

export function getLocaleConfig(code: string): LocaleConfig | undefined {
  return SUPPORTED_LOCALES.find(l => l.code === code);
}

export function detectBrowserLocale(): string {
  const lang = navigator.language?.toLowerCase().split('-')[0] || 'en';
  const supported = SUPPORTED_LOCALES.find(l => l.code === lang && l.ready);
  return supported?.code || 'en';
}
