import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Heart, MessageCircle, Share2, Bookmark, Search, Bell, Plus, MapPin } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import FeedVideoPlayer from "@/components/FeedVideoPlayer";
import CommentSheet from "@/components/CommentSheet";
import ShareSheet from "@/components/ShareSheet";
import StoryViewer from "@/components/StoryViewer";
import StoryCreator from "@/components/StoryCreator";

const FeedScreen = () => {
  const [showUpload, setShowUpload] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [sharePostData, setSharePostData] = useState<{ url: string; text: string } | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["feed-posts"],
    queryFn: async () => {
      const { data: rawPosts } = await supabase
        .from("posts")
        .select("*, pets!posts_pet_id_fkey(name, pet_type)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (!rawPosts || rawPosts.length === 0) return [];
      const userIds = Array.from(new Set(rawPosts.map((p: any) => p.user_id).filter(Boolean)));
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id, full_name, username, avatar_url")
        .in("id", userIds);
      const profMap = new Map((profs || []).map((p: any) => [p.id, p]));
      return rawPosts.map((p: any) => ({ ...p, profiles: profMap.get(p.user_id) || null }));
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
      const { data: rawStories } = await supabase
        .from("stories")
        .select("*, pets!stories_pet_id_fkey(name, avatar_emoji)")
        .order("created_at", { ascending: false });
      if (!rawStories || rawStories.length === 0) return [];
      const userIds = Array.from(new Set(rawStories.map((s: any) => s.user_id).filter(Boolean)));
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      const profMap = new Map((profs || []).map((p: any) => [p.id, p]));
      return rawStories.map((s: any) => ({ ...s, profiles: profMap.get(s.user_id) || null }));
    },
  });

  const { data: viewedStoryIds = [] } = useQuery({
    queryKey: ["viewed-stories", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("story_views").select("story_id").eq("viewer_id", user!.id);
      return (data || []).map((v) => v.story_id);
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const isLiked = likedPostIds.includes(postId);
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user!.id);
        trackEvent("post_unliked");
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user!.id });
        trackEvent("post_liked", { post_id: postId });
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["my-likes"] });
      await queryClient.cancelQueries({ queryKey: ["feed-posts"] });
      const prevLikes = queryClient.getQueryData<string[]>(["my-likes", user?.id]) || [];
      const prevPosts = queryClient.getQueryData<any[]>(["feed-posts"]) || [];
      const isLiked = prevLikes.includes(postId);
      queryClient.setQueryData(["my-likes", user?.id], isLiked ? prevLikes.filter((id) => id !== postId) : [...prevLikes, postId]);
      queryClient.setQueryData(["feed-posts"], prevPosts.map(p =>
        p.id === postId ? { ...p, like_count: (p.like_count || 0) + (isLiked ? -1 : 1) } : p
      ));
      return { prevLikes, prevPosts };
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(["my-likes", user?.id], context?.prevLikes);
      queryClient.setQueryData(["feed-posts"], context?.prevPosts);
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
        trackEvent("post_saved");
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["my-saves"] });
      const prev = queryClient.getQueryData<string[]>(["my-saves", user?.id]) || [];
      const isSaved = prev.includes(postId);
      queryClient.setQueryData(["my-saves", user?.id], isSaved ? prev.filter((id) => id !== postId) : [...prev, postId]);
      return { prev };
    },
    onSuccess: (_data, postId) => {
      const wasSaved = !savedPostIds.includes(postId);
      toast.success(wasSaved ? "Saved 🔖" : "Removed from saved", { duration: 1500 });
    },
    onError: (_err, _postId, context) => {
      queryClient.setQueryData(["my-saves", user?.id], context?.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-saves"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("post_comments").delete().eq("post_id", postId);
      await supabase.from("post_likes").delete().eq("post_id", postId);
      await supabase.from("saved_posts").delete().eq("post_id", postId);
      await supabase.from("posts").delete().eq("id", postId).eq("user_id", user!.id);
      trackEvent("post_deleted", { post_id: postId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["my-saves"] });
      toast.success("Post deleted 🗑️");
    },
    onError: () => toast.error("Failed to delete post"),
  });
  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getMediaUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
  };

  const sharePost = (post: any) => {
    trackEvent("post_shared");
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const profile = post.profiles;
    const text = post.caption
      ? `${post.caption.toString().slice(0, 80)} — on Petosauras 🐾`
      : `${profile?.full_name || "Someone"}'s pet on Petosauras 🐾`;
    setSharePostData({ url: shareUrl, text });
  };

  const handleStoryTap = (idx: number) => {
    trackEvent("story_viewed");
    setStoryStartIndex(idx);
    setShowStoryViewer(true);
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <header className="sticky top-0 bg-card/80 backdrop-blur-lg z-40 px-5 py-3.5 flex items-center justify-between border-b border-border">
          {/* LOGO LOCKED — Do not change without explicit user instruction */}
          <img src="/petosauras-icon.png" alt="Petosauras" style={{ height: 36, objectFit: "contain" }} />
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-[10px] bg-surface-alt flex items-center justify-center text-muted-foreground hover:bg-primary-light transition-colors">
              <Search size={20} strokeWidth={1.5} />
            </button>
            <button onClick={() => navigate("/notifications")} className="w-10 h-10 rounded-[10px] bg-surface-alt flex items-center justify-center text-muted-foreground hover:bg-primary-light transition-colors relative">
              <Bell size={20} strokeWidth={1.5} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Stories */}
        <div className="px-5 py-3.5 flex gap-3 overflow-x-auto no-scrollbar bg-card border-b border-border">
          <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => setShowStoryCreator(true)}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-primary bg-primary-light">
              <Plus size={24} strokeWidth={1.5} className="text-primary" />
            </div>
            <span className="text-[10px] font-body font-semibold text-muted-foreground">Your Story</span>
          </div>
          {stories.map((s: any, idx: number) => {
            const isViewed = viewedStoryIds.includes(s.id);
            return (
              <div key={s.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => handleStoryTap(idx)}>
                <div className="w-16 h-16 rounded-full p-[2.5px]" style={{ background: isViewed ? "#ccc" : "linear-gradient(135deg, #7B5EA7, #FF8C66)" }}>
                  <div className="w-full h-full rounded-full bg-primary-light flex items-center justify-center text-2xl">
                    {s.pets?.avatar_emoji || "🐾"}
                  </div>
                </div>
                <span className="text-[10px] font-body font-semibold text-muted-foreground truncate w-16 text-center">
                  {s.pets?.name || s.profiles?.full_name?.split(" ")[0] || "Pet"}
                </span>
              </div>
            );
          })}
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
                    <UserAvatar
                      name={profile?.full_name}
                      avatarUrl={profile?.avatar_url}
                      size={40}
                      onClick={() => navigate(`/profile/${post.user_id}`)}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        onClick={() => navigate(`/profile/${post.user_id}`)}
                        className="text-sm font-heading font-bold truncate cursor-pointer hover:text-primary transition-colors"
                      >
                        {profile?.full_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground font-body">
                        {pet?.name && `${pet.name} • ${pet.pet_type} • `}
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                      {post.location && (
                        <p className="text-[11px] text-muted-foreground font-body flex items-center gap-1 mt-0.5">
                          <MapPin size={10} strokeWidth={1.5} />
                          <span className="truncate">{post.location}</span>
                        </p>
                      )}
                    </div>
                    {post.user_id === user?.id && (
                      <button
                        onClick={() => {
                          if (confirm("Delete this post? This cannot be undone.")) {
                            deletePostMutation.mutate(post.id);
                          }
                        }}
                        className="w-8 h-8 rounded-[10px] flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                  <div className="relative aspect-[9/16] bg-gradient-to-br from-primary-light to-[#C8B8F0]">
                    {post.media_type === "video" ? (
                      <FeedVideoPlayer src={getMediaUrl(post.media_url)} maxDuration={30} autoLoops={3} />
                    ) : (
                      <img src={getMediaUrl(post.media_url)} alt={post.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                    )}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="absolute bottom-3 left-3 flex gap-1.5 pointer-events-none">
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
                          <Heart size={20} strokeWidth={1.5} fill={isLiked ? "#FF6B6B" : "none"} color={isLiked ? "#FF6B6B" : "#9B96B0"} />
                          <span className={`text-[13px] font-body font-semibold ${isLiked ? "text-primary" : "text-muted-foreground"}`}>{post.like_count || 0}</span>
                        </button>
                        <button onClick={() => { setCommentPostId(post.id); trackEvent("comment_submitted", { post_id: post.id }); }} className="flex items-center gap-1.5 text-text-hint rounded-[10px] px-1.5 py-1 hover:bg-primary-light hover:text-primary transition-colors">
                          <MessageCircle size={20} strokeWidth={1.5} />
                          <span className="text-[13px] font-body font-semibold text-muted-foreground">{post.comment_count || 0}</span>
                        </button>
                        <button onClick={() => sharePost(post)} className="text-text-hint rounded-[10px] p-1 hover:bg-primary-light hover:text-primary transition-colors"><Share2 size={20} strokeWidth={1.5} /></button>
                      </div>
                      <button onClick={() => toggleSaveMutation.mutate(post.id)} className="rounded-[10px] p-1 hover:bg-primary-light transition-colors">
                        <Bookmark size={20} strokeWidth={1.5} fill={isSaved ? "#7B5EA7" : "none"} color={isSaved ? "#7B5EA7" : "#9B96B0"} />
                      </button>
                    </div>
                    <p className="text-sm font-body">
                      <span className="font-heading font-bold cursor-pointer" onClick={() => navigate(`/profile/${post.user_id}`)}>@{profile?.username || "user"}</span>{" "}
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
      <CommentSheet postId={commentPostId || ""} open={!!commentPostId} onClose={() => setCommentPostId(null)} />
      {sharePostData && <ShareSheet open={!!sharePostData} url={sharePostData.url} text={sharePostData.text} onClose={() => setSharePostData(null)} />}
      {showStoryViewer && stories.length > 0 && (
        <StoryViewer stories={stories} initialIndex={storyStartIndex} onClose={() => { setShowStoryViewer(false); queryClient.invalidateQueries({ queryKey: ["viewed-stories"] }); }} />
      )}
      <StoryCreator open={showStoryCreator} onClose={() => setShowStoryCreator(false)} />
    </MobileLayout>
  );
};

export default FeedScreen;
