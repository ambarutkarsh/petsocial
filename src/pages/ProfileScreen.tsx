import { Settings, MapPin, Calendar, Grid3X3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: primaryPet } = useQuery({
    queryKey: ["primary-pet", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("*").eq("owner_id", user!.id).eq("is_primary", true).limit(1);
      return data?.[0] || null;
    },
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["user-posts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("id, media_url").eq("user_id", user!.id).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getMediaUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="h-[155px] bg-gradient-to-r from-primary via-accent to-secondary relative">
          <button className="absolute top-4 right-4 bg-card/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" /> Edit Profile
          </button>
          <button onClick={handleSignOut} className="absolute top-4 left-4 bg-card/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>

        <div className="px-4 -mt-10 relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-card flex items-center justify-center text-2xl font-bold text-primary shadow-paw">
            {getInitials(profile?.full_name)}
          </div>
          <h2 className="text-xl font-heading font-bold mt-2">{profile?.full_name || "Loading…"}</h2>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
            {profile?.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Pet parent since {profile?.pet_parent_since || new Date().getFullYear()}</span>
          </div>
        </div>

        <div className="px-4 mt-4">
          <div className="flex items-center justify-around paw-card p-3">
            <div className="text-center">
              <p className="text-lg font-heading font-bold">{profile?.post_count || 0}</p>
              <p className="text-xs text-text-muted">Posts</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-heading font-bold">{profile?.follower_count || 0}</p>
              <p className="text-xs text-text-muted">Followers</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-heading font-bold">{profile?.following_count || 0}</p>
              <p className="text-xs text-text-muted">Following</p>
            </div>
          </div>
        </div>

        {primaryPet && (
          <div className="px-4 mt-4">
            <div className="paw-card p-4 flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">{primaryPet.avatar_emoji || "🐾"}</div>
              <div className="flex-1">
                <h3 className="font-heading font-bold">{primaryPet.name}</h3>
                <p className="text-xs text-text-muted">{primaryPet.species || primaryPet.pet_type} • {primaryPet.age_years ? `${primaryPet.age_years} yrs` : ""} • {primaryPet.gender || ""}</p>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Grid3X3 className="w-4 h-4 text-text-mid" />
            <span className="text-sm font-semibold">Posts</span>
          </div>
          {userPosts.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl">📸</span>
              <p className="text-sm text-text-muted mt-2">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
              {userPosts.map((post: any) => (
                <div key={post.id} className="aspect-square">
                  <img src={getMediaUrl(post.media_url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default ProfileScreen;
