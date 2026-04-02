/**
 * Eclipse Valhalla — Auth Service
 *
 * Wraps Supabase Auth with local session management.
 * Supports: guest/local mode + cloud signed-in mode.
 *
 * Flows: sign up, sign in (email/password), sign out, session restore.
 * Architecture-ready: magic link, social auth.
 */

import { getSupabase, isCloudAvailable } from '../backend/supabaseClient';
import { UserProfile, Tier } from '../backend/schema/entities';
import * as userRepo from '../backend/repositories/userRepository';

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export type AuthMode = 'guest' | 'cloud';

export interface AuthState {
  mode: AuthMode;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}

// ═══════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════

let _currentState: AuthState = {
  mode: 'guest',
  user: null,
  loading: true,
  error: null,
};

let _listeners: Set<(state: AuthState) => void> = new Set();

function setState(updates: Partial<AuthState>) {
  _currentState = { ..._currentState, ...updates };
  _listeners.forEach(fn => fn(_currentState));
}

export function getAuthState(): AuthState {
  return { ..._currentState };
}

export function subscribeAuth(fn: (state: AuthState) => void): () => void {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// ═══════════════════════════════════════════
// INITIALIZE — call on app start
// ═══════════════════════════════════════════

export async function initAuth(): Promise<AuthState> {
  setState({ loading: true, error: null });

  // 1. Check for cloud session
  const sb = getSupabase();
  if (sb) {
    try {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const profile = await userRepo.fetchCloudProfile(session.user.id);
        if (profile) {
          userRepo.saveLocalProfile(profile);
          setState({ mode: 'cloud', user: profile, loading: false });
          return getAuthState();
        }
        // Profile doesn't exist yet — create from auth data
        const newProfile: UserProfile = {
          id: session.user.id,
          email: session.user.email || '',
          displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'Warrior',
          tier: 'free',
          locale: 'en',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await userRepo.upsertCloudProfile(newProfile);
        userRepo.saveLocalProfile(newProfile);
        setState({ mode: 'cloud', user: newProfile, loading: false });
        return getAuthState();
      }
    } catch (e) {
      console.warn('[Auth] Session restore failed:', e);
    }
  }

  // 2. Check for local-only profile (guest mode from old auth)
  const localProfile = userRepo.getLocalProfile();
  if (localProfile) {
    setState({ mode: 'guest', user: localProfile, loading: false });
    return getAuthState();
  }

  // 3. Check legacy auth (lumina_active_session)
  try {
    const legacyRaw = localStorage.getItem('lumina_active_session');
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      const guestProfile: UserProfile = {
        id: legacy.id || `guest_${Date.now()}`,
        email: legacy.email || '',
        displayName: legacy.name || 'Warrior',
        tier: 'free',
        locale: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      userRepo.saveLocalProfile(guestProfile);
      setState({ mode: 'guest', user: guestProfile, loading: false });
      return getAuthState();
    }
  } catch {}

  // 4. No session at all
  setState({ mode: 'guest', user: null, loading: false });
  return getAuthState();
}

// ═══════════════════════════════════════════
// SIGN UP
// ═══════════════════════════════════════════

export async function signUp(email: string, password: string, displayName: string): Promise<AuthState> {
  const sb = getSupabase();
  if (!sb) {
    setState({ error: 'Cloud not configured. Running in guest mode.' });
    return getAuthState();
  }

  setState({ loading: true, error: null });

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
    },
  });

  if (error) {
    setState({ loading: false, error: error.message });
    return getAuthState();
  }

  if (data.user) {
    const profile: UserProfile = {
      id: data.user.id,
      email,
      displayName,
      tier: 'free',
      locale: 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userRepo.upsertCloudProfile(profile);
    userRepo.saveLocalProfile(profile);
    setState({ mode: 'cloud', user: profile, loading: false });
  } else {
    setState({ loading: false, error: 'Check your email for confirmation.' });
  }

  return getAuthState();
}

// ═══════════════════════════════════════════
// SIGN IN
// ═══════════════════════════════════════════

export async function signIn(email: string, password: string): Promise<AuthState> {
  const sb = getSupabase();
  if (!sb) {
    setState({ error: 'Cloud not configured.' });
    return getAuthState();
  }

  setState({ loading: true, error: null });

  const { data, error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    setState({ loading: false, error: error.message });
    return getAuthState();
  }

  if (data.user) {
    let profile = await userRepo.fetchCloudProfile(data.user.id);
    if (!profile) {
      profile = {
        id: data.user.id,
        email,
        displayName: data.user.user_metadata?.display_name || email.split('@')[0],
        tier: 'free',
        locale: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await userRepo.upsertCloudProfile(profile);
    }
    userRepo.saveLocalProfile(profile);
    setState({ mode: 'cloud', user: profile, loading: false });
  }

  return getAuthState();
}

// ═══════════════════════════════════════════
// SIGN OUT
// ═══════════════════════════════════════════

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (sb) {
    await sb.auth.signOut().catch(() => {});
  }
  // Keep local data (non-destructive sign-out)
  // Clear only the profile, not quest data
  userRepo.clearLocalProfile();
  setState({ mode: 'guest', user: null, loading: false, error: null });
}

// ═══════════════════════════════════════════
// GUEST MODE
// ═══════════════════════════════════════════

export function enterGuestMode(name: string): AuthState {
  const profile: UserProfile = {
    id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    email: '',
    displayName: name,
    tier: 'free',
    locale: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  userRepo.saveLocalProfile(profile);
  setState({ mode: 'guest', user: profile, loading: false, error: null });
  return getAuthState();
}

// ═══════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════

export function isSignedIn(): boolean {
  return _currentState.mode === 'cloud' && _currentState.user !== null;
}

export function isGuest(): boolean {
  return _currentState.mode === 'guest';
}

export function getCurrentUserId(): string | null {
  return _currentState.user?.id || null;
}
