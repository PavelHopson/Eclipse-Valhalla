/**
 * Eclipse Valhalla — Gamification Repository
 */

import { getSupabase } from '../supabaseClient';
import { GamificationProfile } from '../schema/entities';
import * as mapper from '../mappers/gamificationMapper';

const LOCAL_KEY = 'eclipse_discipline';

export function getLocal(): GamificationProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveLocal(profile: GamificationProfile): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(profile));
  } catch {}
}

export async function fetchCloud(userId: string): Promise<GamificationProfile | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data, error } = await sb
    .from('gamification_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return mapper.fromRow(data);
}

export async function upsertCloud(profile: GamificationProfile): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('gamification_profiles')
    .upsert(mapper.toRow(profile), { onConflict: 'user_id' });

  if (error) {
    console.error('[GamRepo] Cloud upsert failed:', error.message);
    return false;
  }
  return true;
}

export async function syncGamification(userId: string): Promise<GamificationProfile | null> {
  const local = getLocal();
  const cloud = await fetchCloud(userId);

  if (local && cloud) {
    // Newest wins
    const winner = new Date(local.updatedAt) >= new Date(cloud.updatedAt) ? local : cloud;
    saveLocal(winner);
    await upsertCloud({ ...winner, userId });
    return winner;
  }

  if (local) {
    await upsertCloud({ ...local, userId });
    return local;
  }

  if (cloud) {
    saveLocal(cloud);
    return cloud;
  }

  return null;
}
