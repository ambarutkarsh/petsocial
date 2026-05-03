import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  feed_preferences: string[] | null;
  is_seed_user: boolean | null;
  community_default_tab: string | null;
}

interface UserProfileContextValue {
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

const CACHE_KEY = "user_profile";

export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    console.info("[Profile] fetch", userId);
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, username, avatar_url, city, state, bio, feed_preferences, is_seed_user, community_default_tab"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) console.warn("[Profile] fetch failed", error);

    if (data) {
      setProfile(data as UserProfile);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      } catch {}
    }
    setLoading(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) await fetchProfile(user.id);
  }, [fetchProfile, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      try { localStorage.removeItem(CACHE_KEY); } catch {}
      return;
    }

    let cancelled = false;
    setLoading(true);
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserProfile;
        if (parsed?.id === user.id) setProfile(parsed);
      }
    } catch (error) {
      console.warn("[Profile] cached profile parse failed", error);
      try { localStorage.removeItem(CACHE_KEY); } catch {}
    }

    fetchProfile(user.id).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [authLoading, fetchProfile, user?.id]);

  return (
    <UserProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);
