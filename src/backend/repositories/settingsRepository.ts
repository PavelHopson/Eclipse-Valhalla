/**
 * Eclipse Valhalla — Settings Repository
 */

import { getSupabase } from '../supabaseClient';
import { AppSettings, AccentTheme } from '../schema/entities';

const LOCAL_KEY = 'eclipse_app_settings';

const DEFAULT_SETTINGS: Omit<AppSettings, 'userId'> = {
  accentTheme: 'ice',
  reducedMotion: false,
  widgetTransparency: 100,
  atmosphereLevel: 80,
  compactMode: false,
  glowIntensity: 70,
  locale: 'en',
  updatedAt: new Date().toISOString(),
};

export function getLocal(): AppSettings | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function getLocalOrDefault(userId: string): AppSettings {
  return getLocal() || { ...DEFAULT_SETTINGS, userId };
}

export function saveLocal(settings: AppSettings): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(settings));
  } catch {}
}

export async function fetchCloud(userId: string): Promise<AppSettings | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('app_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return {
    userId: data.user_id,
    accentTheme: data.accent_theme as AccentTheme,
    reducedMotion: data.reduced_motion,
    widgetTransparency: data.widget_transparency,
    atmosphereLevel: data.atmosphere_level,
    compactMode: data.compact_mode,
    glowIntensity: data.glow_intensity,
    locale: data.locale as 'en' | 'ru',
    updatedAt: data.updated_at,
  };
}

export async function upsertCloud(settings: AppSettings): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('app_settings').upsert({
    user_id: settings.userId,
    accent_theme: settings.accentTheme,
    reduced_motion: settings.reducedMotion,
    widget_transparency: settings.widgetTransparency,
    atmosphere_level: settings.atmosphereLevel,
    compact_mode: settings.compactMode,
    glow_intensity: settings.glowIntensity,
    locale: settings.locale,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('[SettingsRepo] Cloud upsert failed:', error.message);
    return false;
  }
  return true;
}
