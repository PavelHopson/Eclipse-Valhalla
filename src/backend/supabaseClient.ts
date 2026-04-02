/**
 * Eclipse Valhalla — Supabase Client
 *
 * Typed Supabase client with env-safe initialization.
 * Gracefully falls back to null when env vars are missing (local-only mode).
 *
 * ENV REQUIRED:
 *   VITE_SUPABASE_URL
 *   VITE_SUPABASE_ANON_KEY
 */

/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './schema/database.types';

// ═══════════════════════════════════════════
// ENV
// ═══════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// ═══════════════════════════════════════════
// CLIENT
// ═══════════════════════════════════════════

let _client: SupabaseClient | null = null;

/**
 * Get the Supabase client. Returns null if not configured.
 * Safe to call in web/electron/dev without env vars.
 */
export function getSupabase(): SupabaseClient | null {
  if (_client) return _client;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.info('[Supabase] Not configured — running in local-only mode.');
    return null;
  }

  try {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof localStorage !== 'undefined' ? localStorage : undefined,
      },
    });
    console.info('[Supabase] Client initialized.');
    return _client;
  } catch (e) {
    console.error('[Supabase] Failed to initialize:', e);
    return null;
  }
}

/**
 * Check if cloud backend is available.
 */
export function isCloudAvailable(): boolean {
  return getSupabase() !== null;
}

/**
 * Get Supabase client or throw. Use in contexts where cloud is required.
 */
export function requireSupabase(): SupabaseClient {
  const client = getSupabase();
  if (!client) throw new Error('Cloud backend not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  return client;
}
