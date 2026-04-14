import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Heart, MessageCircle, Send, Bookmark, Plus } from "lucide-react";
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
        {/* Header */}
        <header className="sticky top-0 bg-card/80 backdrop-blur-lg z-40 px-5 py-3.5 flex items-center justify-between border-b border-border">
          <h1 className="text-xl font-heading font-extrabold tracking-tight">
            <span className="text-primary">🦕 </span>
            <span className="text-primary" style={{ fontSize: "1.1em" }}>P</span>
            <span className="text-primary">etosauras</span>
          </h1>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-[10px] bg-surface-alt flex items-center justify-center text-muted-foreground hover:bg-primary-light transition-colors">
              <Search className="w-5 h-5" strokeWidth={1.8} />
            </button>
            <button onClick={() => navigate("/notifications")} className="w-10 h-10 rounded-[10px] bg-surface-alt flex items-center justify-center text-muted-foreground hover:bg-primary-light transition-colors relative">
              <Bell className="w-5 h-5" strokeWidth={1.8} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Stories */}
        <div className="px-5 py-3.5 flex gap-3 overflow-x-auto no-scrollbar bg-card border-b border-border">
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-primary bg-primary-light">
              <Plus className="w-6 h-6 text-primary" strokeWidth={1.8} />
            </div>
            <span className="text-[10px] font-body font-semibold text-muted-foreground">Add</span>
          </div>
          {stories.map((s: any) => (
            <div key={s.id} className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-16 h-16 rounded-full p-[2.5px]" style={{ background: "linear-gradient(135deg, #7B5EA7, #FF8C66)" }}>
                <div className="w-full h-full rounded-full bg-primary-light flex items-center justify-center text-2xl">
                  {s.pets?.avatar_emoji || "🐾"}
                </div>
              </div>
              <span className="text-[10px] font-body font-semibold text-muted-foreground truncate w-16 text-center">
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
                <div className="aspect-square bg-muted rounded-[22px]" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <span className="text-6xl mb-4">🦕</span>
            <h3 className="font-heading font-bold text-lg">No posts yet</h3>
            <p className="text-sm text-muted-foreground mt-1 font-body">Be the first to share your pet on Petosauras!</p>
            <button onClick={() => setShowUpload(true)} className="mt-4 text-sm font-heading font-bold text-primary hover:underline">Share your pet 🐾</button>
          </div>
        ) : (
          <div className="space-y-2.5 px-4 mt-2">
            {posts.map((post: any, idx: number) => {
              const profile = post.profiles;
              const pet = post.pets;
              const isLiked = likedPostIds.includes(post.id);
              const isSaved = savedPostIds.includes(post.id);

              return (
                <article key={post.id} className="paw-card overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="flex items-center gap-3 p-3.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-sm font-heading font-extrabold text-primary-foreground">
                      {getInitials(profile?.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-heading font-bold truncate">{profile?.full_name || "User"}</p>
                      <p className="text-xs text-muted-foreground font-body">
                        {pet?.name && `${pet.name} • ${pet.pet_type} • `}
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="relative aspect-square bg-gradient-to-br from-primary-light to-[#C8B8F0]">
                    <img src={getMediaUrl(post.media_url)} alt={post.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="absolute bottom-3 left-3 flex gap-1.5">
                        {post.hashtags.map((tag: string) => (
                          <span key={tag} className="text-[11px] font-body font-bold bg-white/20 backdrop-blur-[10px] border border-white/30 px-2.5 py-1 rounded-full text-white">
                            #{tag.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleLikeMutation.mutate(post.id)} className={`flex items-center gap-1.5 transition-all rounded-[10px] px-1.5 py-1 hover:bg-primary-light ${isLiked ? "animate-heart-pop" : ""}`}>
                          <Heart className="w-5 h-5" strokeWidth={1.8} fill={isLiked ? "#FF6B6B" : "none"} color={isLiked ? "#FF6B6B" : "hsl(var(--text-hint))"} />
                          <span className="text-sm font-body font-medium">{post.like_count || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-text-hint rounded-[10px] px-1.5 py-1 hover:bg-primary-light hover:text-primary transition-colors">
                          <MessageCircle className="w-5 h-5" strokeWidth={1.8} />
                          <span className="text-sm font-body font-medium">{post.comment_count || 0}</span>
                        </button>
                        <button className="text-text-hint rounded-[10px] p-1 hover:bg-primary-light hover:text-primary transition-colors"><Send className="w-5 h-5" strokeWidth={1.8} /></button>
                      </div>
                      <button onClick={() => toggleSaveMutation.mutate(post.id)} className="rounded-[10px] p-1 hover:bg-primary-light transition-colors">
                        <Bookmark className="w-5 h-5" strokeWidth={1.8} fill={isSaved ? "hsl(var(--primary))" : "none"} color={isSaved ? "hsl(var(--primary))" : "hsl(var(--text-hint))"} />
                      </button>
                    </div>
                    <p className="text-sm font-body">
                      <span className="font-heading font-bold">@{profile?.username || "user"}</span>{" "}
                      <span className="text-muted-foreground">{post.caption}</span>
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
