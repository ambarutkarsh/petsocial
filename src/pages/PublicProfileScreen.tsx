import { useState } from "react";
import { ChevronLeft, MoreHorizontal, MapPin, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import { trackEvent } from "@/lib/analytics";

const PublicProfileScreen = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isOwnProfile = user?.id === userId;
  const [showUpload, setShowUpload] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["public-profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      trackEvent("profile_viewed_other", { user_id: userId });
      const { data } = await supabase.from("profiles").select("*").eq("id", userId!).single();
      return data;
    },
  });

  const { data: pets = [] } = useQuery({
    queryKey: ["public-pets", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("*").eq("owner_id", userId!);
      return data || [];
    },
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["public-posts", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("id, media_url, media_type").eq("user_id", userId!).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: isFollowing = false } = useQuery({
    queryKey: ["is-following", userId, user?.id],
    enabled: !!userId && !!user && !isOwnProfile,
    queryFn: async () => {
      const { data } = await supabase.from("follows").select("id").eq("follower_id", user!.id).eq("following_id", userId!).limit(1);
      return (data || []).length > 0;
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!user || !userId) return;
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", userId);
      } else {
        await supabase.from("follows").insert({ follower_id: user.id, following_id: userId });
        trackEvent("follow_user", { user_id: userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["is-following", userId] });
      queryClient.invalidateQueries({ queryKey: ["public-profile", userId] });
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

  const locationText = [profile?.city, profile?.state].filter(Boolean).join(", ");

  return (
    <MobileLayout>
      <div className="min-h-screen pb-20">
        {/* Header */}
        <header className="sticky top-0 bg-card/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between border-b border-border">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-[10px] bg-surface-alt flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" strokeWidth={1.8} />
          </button>
          <h1 className="text-base font-heading font-bold">@{profile?.username || "user"}</h1>
          <button className="w-8 h-8 rounded-[10px] bg-surface-alt flex items-center justify-center">
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.8} />
          </button>
        </header>

        {/* Cover */}
        <div className="h-[120px]" style={{ background: "linear-gradient(135deg, #7B5EA7 0%, #9B7EC8 50%, #FF8C66 100%)" }} />

        {/* Profile info */}
        <div className="px-4 -mt-10 relative z-10">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full border-4 border-card object-cover shadow-petosauras" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-light to-primary border-4 border-card flex items-center justify-center text-2xl font-heading font-extrabold text-primary-foreground shadow-petosauras">
              {getInitials(profile?.full_name)}
            </div>
          )}
          <h2 className="text-xl font-heading font-extrabold mt-2">{profile?.full_name || "User"}</h2>
          <p className="text-[13px] text-muted-foreground font-body">@{profile?.username || "user"}</p>
          {locationText && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-body">
              <MapPin className="w-3 h-3" strokeWidth={1.8} /> {locationText}
            </p>
          )}
          {profile?.bio && (
            <p className="text-sm font-body text-center mt-2 line-clamp-3">{profile.bio}</p>
          )}
        </div>

        {/* Stats */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-around paw-card p-3">
            <div className="text-center">
              <p className="text-lg font-heading font-extrabold text-primary">{profile?.post_count || 0}</p>
              <p className="text-xs text-muted-foreground font-body">Posts</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-heading font-extrabold text-primary">{profile?.follower_count || 0}</p>
              <p className="text-xs text-muted-foreground font-body">Followers</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-heading font-extrabold text-primary">{profile?.following_count || 0}</p>
              <p className="text-xs text-muted-foreground font-body">Following</p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {!isOwnProfile && user && (
          <div className="px-4 mt-3 flex gap-2">
            <button
              onClick={() => followMutation.mutate()}
              className={`flex-1 h-10 rounded-full text-sm font-heading font-bold transition-colors ${
                isFollowing
                  ? "border-2 border-success text-success bg-transparent"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {isFollowing ? "Following ✓" : "Follow"}
            </button>
            <button
              onClick={() => toast.info("Messaging coming soon!")}
              className="flex-1 h-10 rounded-full text-sm font-heading font-bold border-2 border-border text-foreground"
            >
              Message
            </button>
          </div>
        )}

        {/* Pet card */}
        {pets.length > 0 && (
          <div className="px-4 mt-4">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {pets.map((pet: any) => (
                <div key={pet.id} className="paw-card p-3 flex items-center gap-2 shrink-0 min-w-[140px]">
                  <span className="text-2xl">{pet.avatar_emoji || "🐾"}</span>
                  <div>
                    <p className="text-sm font-heading font-bold">{pet.name}</p>
                    <p className="text-[11px] text-muted-foreground font-body">{pet.species || pet.pet_type}</p>
                  </div>
                  {pet.is_primary && (
                    <span className="text-[9px] bg-primary-light text-primary px-1.5 py-0.5 rounded-full font-bold ml-auto">Primary</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Posts grid */}
        <div className="px-4 mt-4">
          <p className="text-sm font-heading font-bold mb-3">Posts</p>
          {posts.length === 0 ? (
            <div className="text-center py-10">
              <span className="text-4xl">🦕</span>
              <p className="text-sm text-muted-foreground mt-2 font-body">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5 rounded-[16px] overflow-hidden">
              {posts.map((post: any) => (
                <div key={post.id} className="aspect-square relative">
                  <img src={getMediaUrl(post.media_url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  {post.media_type === "video" && (
                    <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-foreground/60 flex items-center justify-center">
                      <Play className="w-3 h-3 text-primary-foreground" fill="white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav onPostClick={() => setShowUpload(true)} />
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </MobileLayout>
  );
};

export default PublicProfileScreen;
