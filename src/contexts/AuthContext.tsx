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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setLoading(false);

        if (event === "SIGNED_IN" && session?.user) {
          // Auto-link unlinked vet record by email match (uses service role
          // via edge function because vets PII columns are not directly
          // selectable from the client).
          if (session.user.email) {
            supabase.functions.invoke("link-vet-by-email").catch(() => {});
          }

          // Check if new Google user
          const provider = session.user.app_metadata?.provider;
          if (provider === "google") {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name, phone")
              .eq("id", session.user.id)
              .single();

            if (!profile?.phone && (!profile?.full_name || profile.full_name === "PawSocial User" || profile.full_name?.includes("_"))) {
              setIsNewGoogleUser(true);
            }
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
