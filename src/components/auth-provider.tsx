'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

interface AuthContextValue {
  signedIn: boolean;
  ready: boolean;
  signIn: () => void;
  signOut: () => void;
}

const STORAGE_KEY = 'gardenkeeper.signedIn';

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Mock auth provider. Holds a `signedIn` flag in React state and mirrors it to
 * localStorage so a refresh on /garden doesn't bounce the user back to landing.
 * This is a stand-in for real Firebase Auth, which will replace it in Phase 2.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setSignedIn(window.localStorage.getItem(STORAGE_KEY) === 'true');
    } catch {
      // localStorage unavailable (e.g. private mode) — stay signed out.
    }
    setReady(true);
  }, []);

  const signIn = useCallback(() => {
    setSignedIn(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
  }, []);

  const signOut = useCallback(() => {
    setSignedIn(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(
    () => ({ signedIn, ready, signIn, signOut }),
    [signedIn, ready, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
