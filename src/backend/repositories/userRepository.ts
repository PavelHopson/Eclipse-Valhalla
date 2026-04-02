/**
 * Eclipse Valhalla — User Repository
 *
 * Manages user profile in cloud + local cache.
 */

import { getSupabase } from '../supabaseClient';
import { UserProfile, Tier } from '../schema/entities';

const LOCAL_KEY = 'eclipse_user_profile';

export function getLocalProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveLocalProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  } catch {}
}

export function clearLocalProfile(): void {
  localStorage.removeItem(LOCAL_KEY);
}

export async function fetchCloudProfile(userId: string): Promise<UserProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    avatarUrl: data.avatar_url || undefined,
    tier: data.tier as Tier,
    locale: data.locale as 'en' | 'ru',
    timezone: data.timezone || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function upsertCloudProfile(profile: UserProfile): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('profiles').upsert({
    id: profile.id,
    email: profile.email,
    display_name: profile.displayName,
    avatar_url: profile.avatarUrl || null,
    tier: profile.tier,
    locale: profile.locale,
    timezone: profile.timezone || null,
  }, { onConflict: 'id' });

  if (error) {
    console.error('[UserRepo] Cloud upsert failed:', error.message);
    return false;
  }
  return true;
}
