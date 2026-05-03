import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewGoogleUser, setIsNewGoogleUser] = useState(false);

  useEffect(() => {
    let initialResolved = false;
    const markReady = () => {
      initialResolved = true;
      setLoading(false);
    };

    // IMPORTANT: never await Supabase calls directly inside onAuthStateChange —
    // it can deadlock the auth client and leave `loading` stuck on true,
    // which causes ProtectedRoute / AdminLayout to render nothing.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        // INITIAL_SESSION fires once on mount with the restored session (or null).
        // Only after this event is it safe to consider auth "ready".
        if (event === "INITIAL_SESSION") markReady();

        if (event === "SIGNED_IN" && newSession?.user) {
          markReady();
          // Defer any Supabase calls to a microtask so we don't block the
          // auth state change handler.
          setTimeout(() => {
            if (newSession.user.email) {
              supabase.functions.invoke("link-vet-by-email").catch(() => {});
            }

            const provider = newSession.user.app_metadata?.provider;
            if (provider === "google") {
              supabase
                .from("profiles")
                .select("full_name, phone")
                .eq("id", newSession.user.id)
                .single()
                .then(({ data: profile }) => {
                  if (
                    !profile?.phone &&
                    (!profile?.full_name ||
                      profile.full_name === "PawSocial User" ||
                      profile.full_name?.includes("_"))
                  ) {
                    setIsNewGoogleUser(true);
                  }
                });
            }
          }, 0);
        }

        if (event === "SIGNED_OUT") {
          setIsNewGoogleUser(false);
        }

        // Stale/expired refresh token — Supabase emits this when refresh fails.
        // Force sign-out so the app doesn't hang in a 401 retry loop on return.
        if ((event as string) === "TOKEN_REFRESHED" && !newSession) {
          setIsNewGoogleUser(false);
          setTimeout(() => {
            supabase.auth.signOut().catch(() => {});
          }, 0);
        }
      }
    );

    // Initial session fetch — guard against stale/invalid refresh tokens that
    // throw and would otherwise leave loading=true forever.
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession((prev) => prev ?? initialSession);
        markReady();
      })
      .catch(async (err) => {
        console.warn("[Auth] getSession failed, clearing stale session:", err);
        try {
          await supabase.auth.signOut();
        } catch {}
        setSession(null);
        markReady();
      });

    // Safety net: if neither path resolves within 5s, unblock the UI so the
    // admin panel (and other guards) don't get stuck on a blank screen.
    // Safety net: unblock UI fast (1.5s) so a slow token refresh on return
    // visits doesn't keep the app on a blank screen. Session keeps resolving
    // in the background; queries gated by `enabled: !!user` will pick it up.
    const safety = setTimeout(() => {
      setLoading((prev) => {
        if (prev) console.warn("[Auth] safety timeout — forcing loading=false");
        return false;
      });
    }, 1500);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safety);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsNewGoogleUser(false);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut, isNewGoogleUser }}>
      {children}
    </AuthContext.Provider>
  );
};
