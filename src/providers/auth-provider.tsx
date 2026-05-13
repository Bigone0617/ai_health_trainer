"use client";

import type { User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getOAuthRedirectBase } from "@/lib/env/oauthRedirectBase";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  supabaseConfigured: boolean;
  signInWithOAuth: (provider: "google" | "kakao") => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getBrowserClient() {
  if (!isSupabasePublicConfigured()) return null;
  return createSupabaseBrowserClient();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabaseConfigured = isSupabasePublicConfigured();

  useEffect(() => {
    const client = getBrowserClient();
    if (!client) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    let cancelled = false;
    client.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithOAuth = useCallback(async (provider: "google" | "kakao") => {
    const client = getBrowserClient();
    if (!client) {
      throw new Error("Supabase가 설정되지 않았습니다.");
    }
    const base = getOAuthRedirectBase();
    await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${base}/auth/callback`,
      },
    });
  }, []);

  const signOut = useCallback(async () => {
    const client = getBrowserClient();
    if (!client) return;
    await client.auth.signOut();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      supabaseConfigured,
      signInWithOAuth,
      signOut,
    }),
    [user, loading, supabaseConfigured, signInWithOAuth, signOut]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}
