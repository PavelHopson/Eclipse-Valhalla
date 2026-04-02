/**
 * Eclipse Valhalla — Push Device Repository
 *
 * Manages push notification device tokens in Supabase.
 * Architecture-ready — table needs to be created via migration.
 */

import { getSupabase } from '../supabaseClient';

export interface PushDeviceRecord {
  id: string;
  user_id: string;
  platform: string;
  token: string;
  app_version: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  last_seen_at: string;
}

export async function registerDeviceCloud(
  userId: string,
  platform: string,
  token: string
): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb.from('push_devices').upsert({
    id: `${userId}_${platform}`,
    user_id: userId,
    platform,
    token,
    app_version: '2.0.0',
    enabled: true,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'id' });

  if (error) {
    console.error('[PushRepo] Register failed:', error.message);
    return false;
  }
  return true;
}

export async function unregisterDeviceCloud(userId: string, platform: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('push_devices')
    .update({ enabled: false })
    .eq('id', `${userId}_${platform}`);

  if (error) {
    console.error('[PushRepo] Unregister failed:', error.message);
    return false;
  }
  return true;
}

export async function getActiveDevices(userId: string): Promise<PushDeviceRecord[]> {
  const sb = getSupabase();
  if (!sb) return [];

  const { data, error } = await sb
    .from('push_devices')
    .select('*')
    .eq('user_id', userId)
    .eq('enabled', true);

  if (error) return [];
  return (data || []) as PushDeviceRecord[];
}
