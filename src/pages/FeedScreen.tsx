import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Heart, MessageCircle, Share2, Bookmark, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const FeedScreen = () => {
  const [showUpload, setShowUpload] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles!posts_user_id_fkey(full_name, username, avatar_url), pets!posts_pet_id_fkey(name, pet_type)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: likedPostIds = [] } = useQuery({
    queryKey: ["my-likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("post_likes").select("post_id").eq("user_id", user!.id);
      return (data || []).map((l) => l.post_id);
    },
  });

  const { data: savedPostIds = [] } = useQuery({
    queryKey: ["my-saves", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("saved_posts").select("post_id").eq("user_id", user!.id);
      return (data || []).map((s) => s.post_id);
    },
  });

  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*, profiles!stories_user_id_fkey(full_name, avatar_url), pets!stories_pet_id_fkey(name, avatar_emoji)")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const isLiked = likedPostIds.includes(postId);
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user!.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user!.id });
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["my-likes"] });
      const prev = queryClient.getQueryData<string[]>(["my-likes", user?.id]) || [];
      const isLiked = prev.includes(postId);
      queryClient.setQueryData(["my-likes", user?.id], isLiked ? prev.filter((id) => id !== postId) : [...prev, postId]);
      return { prev };
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(["my-likes", user?.id], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const isSaved = savedPostIds.includes(postId);
      if (isSaved) {
        await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", user!.id);
      } else {
        await supabase.from("saved_posts").insert({ post_id: postId, user_id: user!.id });
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["my-saves"] });
      const prev = queryClient.getQueryData<string[]>(["my-saves", user?.id]) || [];
      const isSaved = prev.includes(postId);
      queryClient.setQueryData(["my-saves", user?.id], isSaved ? prev.filter((id) => id !== postId) : [...prev, postId]);
      return { prev };
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(["my-saves", user?.id], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-saves"] });
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

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold">
            <span className="text-primary">Paw</span>Social
          </h1>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid hover:bg-muted transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button onClick={() => navigate("/notifications")} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid hover:bg-muted transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Stories */}
        <div className="px-4 py-2 flex gap-3 overflow-x-auto no-scrollbar">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-primary bg-primary/5">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            <span className="text-[10px] font-medium text-text-mid">Add</span>
          </div>
          {stories.map((s: any) => (
            <div key={s.id} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent p-[3px]">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl">
                  {s.pets?.avatar_emoji || "🐾"}
                </div>
              </div>
              <span className="text-[10px] font-medium text-text-mid truncate w-16 text-center">
                {s.pets?.name || s.profiles?.full_name?.split(" ")[0] || "Pet"}
              </span>
            </div>
          ))}
        </div>

        {/* Posts */}
        {isLoading ? (
          <div className="space-y-4 px-4 mt-2">
            {[1, 2].map((i) => (
              <div key={i} className="paw-card p-4 animate-pulse">
                <div className="flex gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-2 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="aspect-square bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <span className="text-5xl mb-4">📸</span>
            <h3 className="font-heading font-bold text-lg">No posts yet</h3>
            <p className="text-sm text-text-muted mt-1">Be the first to share a moment with your pet!</p>
          </div>
        ) : (
          <div className="space-y-4 px-4 mt-2">
            {posts.map((post: any) => {
              const profile = post.profiles;
              const pet = post.pets;
              const isLiked = likedPostIds.includes(post.id);
              const isSaved = savedPostIds.includes(post.id);

              return (
                <article key={post.id} className="paw-card overflow-hidden animate-fade-in">
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
                      {getInitials(profile?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-text-muted">
                        {pet?.name && `${pet.name} • ${pet.pet_type} • `}
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="relative aspect-square bg-muted">
                    <img src={getMediaUrl(post.media_url)} alt={post.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="absolute bottom-3 left-3 flex gap-1.5">
                        {post.hashtags.map((tag: string) => (
                          <span key={tag} className="text-xs font-medium bg-card/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-foreground">
                            #{tag.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleLikeMutation.mutate(post.id)} className="flex items-center gap-1.5 transition-colors">
                          <Heart className={`w-5 h-5 ${isLiked ? "fill-destructive text-destructive" : "text-text-mid"}`} />
                          <span className="text-sm font-medium">{post.like_count || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-text-mid">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.comment_count || 0}</span>
                        </button>
                        <button className="text-text-mid"><Share2 className="w-5 h-5" /></button>
                      </div>
                      <button onClick={() => toggleSaveMutation.mutate(post.id)}>
                        <Bookmark className={`w-5 h-5 ${isSaved ? "fill-primary text-primary" : "text-text-mid"}`} />
                      </button>
                    </div>
                    <p className="text-sm">
                      <span className="font-semibold">@{profile?.username || "user"}</span>{" "}
                      <span className="text-text-mid">{post.caption}</span>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav onPostClick={() => setShowUpload(true)} />
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </MobileLayout>
  );
};

export default FeedScreen;
