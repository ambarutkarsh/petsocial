import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isNewGoogleUser: boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
  isNewGoogleUser: false,
});

export const useAuth = () => useContext(AuthContext);

const AUTH_TIMEOUT_MS = 4000;

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(label)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const clearAuthStorageOnly = () => {
  try {
    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i);
      if (key?.startsWith("sb-") || key === "user_profile") localStorage.removeItem(key);
    }
  } catch (error) {
    console.warn("[Auth] failed to clear auth storage", error);
  }
};

const hardResetBrowserState = () => {
  try { localStorage.clear(); } catch (error) { console.warn("[Auth] localStorage clear failed", error); }
  try { sessionStorage.clear(); } catch (error) { console.warn("[Auth] sessionStorage clear failed", error); }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);
  const previousUserIdRef = useRef<string | null | undefined>(undefined);
  const authSideEffectUserRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const markReady = () => {
      if (active) setLoading(false);
    };

    // IMPORTANT: never await Supabase calls directly inside onAuthStateChange —
    // it can deadlock the auth client and leave `loading` stuck on true,
    // which causes ProtectedRoute / AdminLayout to render nothing.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.info("[Auth] state", event, newSession?.user?.id ?? null);
        setSession(newSession);
        setIsNewGoogleUser((prev) => (newSession?.user ? prev : false));
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "SIGNED_OUT") markReady();
      }
    );

    // Initial session fetch — guard against stale/invalid refresh tokens that
    // throw and would otherwise leave loading=true forever.
    withTimeout(supabase.auth.getSession(), AUTH_TIMEOUT_MS, "getSession timeout")
      .then(({ data: { session: initialSession } }) => {
        if (!active) return;
        console.info("[Auth] hydrated", initialSession?.user?.id ?? null);
        setSession((prev) => prev ?? initialSession);
        markReady();
      })
      .catch((err) => {
        console.warn("[Auth] getSession failed or timed out; clearing stale auth storage", err);
        clearAuthStorageOnly();
        if (!active) return;
        setSession(null);
        markReady();
      });

    // Safety net: if session restore stalls on a corrupted refresh token,
    // unblock the UI and let the failed getSession path clear auth storage.
    const safety = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn("[Auth] safety timeout — forcing loading=false");
        return false;
      });
    }, AUTH_TIMEOUT_MS + 500);

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id ?? null;
    const previousUserId = previousUserIdRef.current;
    if (previousUserId !== undefined && previousUserId !== userId) {
      if (!userId) {
        console.info("[Auth] session cleared; clearing React Query cache");
        queryClient.clear();
      } else {
        console.info("[Auth] session changed; invalidating cached queries");
        queryClient.invalidateQueries();
      }
    }
    previousUserIdRef.current = userId;
  }, [queryClient, session?.user?.id]);

  useEffect(() => {
    const user = session?.user;
    if (!user || authSideEffectUserRef.current === user.id) return;
    authSideEffectUserRef.current = user.id;

    console.info("[Auth] running post-login checks", user.id);
    supabase.functions.invoke("link-vet-by-email").catch((error) => {
      console.warn("[Auth] link-vet-by-email failed", error);
    });

    if (user.app_metadata?.provider !== "google") {
      setIsNewGoogleUser(false);
      return;
    }

    supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .single()
      .then(({ data: profile, error }) => {
        if (error) console.warn("[Auth] Google profile check failed", error);
        const needsRegistration =
          !profile?.phone &&
          (!profile?.full_name ||
            profile.full_name === "PawSocial User" ||
            profile.full_name?.includes("_"));
        setIsNewGoogleUser(Boolean(needsRegistration));
      });
  }, [session?.user]);

  const signOut = useCallback(async () => {
    console.info("[Auth] hard sign-out started");
    try {
      await withTimeout(supabase.auth.signOut(), AUTH_TIMEOUT_MS, "signOut timeout");
    } catch (error) {
      console.warn("[Auth] remote signOut failed or timed out; forcing local cleanup", error);
      try {
        await withTimeout(supabase.auth.signOut({ scope: "local" }), 1500, "local signOut timeout");
      } catch (localError) {
        console.warn("[Auth] local signOut failed", localError);
      }
    }
    setSession(null);
    setIsNewGoogleUser(false);
    authSideEffectUserRef.current = null;
    queryClient.clear();
    hardResetBrowserState();
    window.location.replace("/auth");
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut, isNewGoogleUser }}>
      {children}
    </AuthContext.Provider>
  );
};
