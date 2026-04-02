/**
 * Eclipse Valhalla — Auth Context
 *
 * React context providing auth state across the app.
 * Initializes auth on mount, subscribes to state changes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  AuthState,
  AuthMode,
  initAuth,
  signUp,
  signIn,
  signOut,
  enterGuestMode,
  subscribeAuth,
  getAuthState,
  isSignedIn as checkSignedIn,
  isGuest as checkGuest,
} from '../services/authService';
import { UserProfile } from '../backend/schema/entities';

// ═══════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════

interface AuthContextValue {
  // State
  mode: AuthMode;
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  isSignedIn: boolean;
  isGuest: boolean;

  // Actions
  handleSignUp: (email: string, password: string, displayName: string) => Promise<void>;
  handleSignIn: (email: string, password: string) => Promise<void>;
  handleSignOut: () => Promise<void>;
  handleGuestMode: (name: string) => void;
}

const AuthContext = createContext<AuthContextValue>({
  mode: 'guest',
  user: null,
  loading: true,
  error: null,
  isSignedIn: false,
  isGuest: true,
  handleSignUp: async () => {},
  handleSignIn: async () => {},
  handleSignOut: async () => {},
  handleGuestMode: () => {},
});

// ═══════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>(getAuthState());

  // Init on mount
  useEffect(() => {
    initAuth();
    const unsub = subscribeAuth((newState) => setState({ ...newState }));
    return unsub;
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, displayName: string) => {
    await signUp(email, password, displayName);
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    await signIn(email, password);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, []);

  const handleGuestMode = useCallback((name: string) => {
    enterGuestMode(name);
  }, []);

  return (
    <AuthContext.Provider value={{
      mode: state.mode,
      user: state.user,
      loading: state.loading,
      error: state.error,
      isSignedIn: state.mode === 'cloud' && state.user !== null,
      isGuest: state.mode === 'guest',
      handleSignUp,
      handleSignIn,
      handleSignOut,
      handleGuestMode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ═══════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════

export function useAuth() {
  return useContext(AuthContext);
}
