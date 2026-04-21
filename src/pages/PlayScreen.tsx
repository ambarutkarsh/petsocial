import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Heart, MessageCircle, Send, Bookmark, Plus, Trash2, Sparkles, MapPin, Star, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";
import CommentSheet from "@/components/CommentSheet";
import StoryViewer from "@/components/StoryViewer";
import StoryCreator from "@/components/StoryCreator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

type SubTab = "reels" | "news" | "facts" | "nearby";
type ReelPill = "reel" | "adopt" | "walker" | "groomer" | "vet";

const SUB_TABS: { key: SubTab; label: string; emoji: string }[] = [
  { key: "reels", label: "Feeds", emoji: "🎬" },
  { key: "news", label: "News", emoji: "📰" },
  { key: "facts", label: "Facts", emoji: "⭐" },
  { key: "nearby", label: "Nearby", emoji: "🗺️" },
];

const REEL_PILLS: { key: ReelPill; label: string; emoji: string }[] = [
  { key: "reel", label: "Reels", emoji: "🎬" },
  { key: "adopt", label: "Adopt", emoji: "🏠" },
  { key: "walker", label: "Walker", emoji: "🚶" },
  { key: "groomer", label: "Groomer", emoji: "✂️" },
  { key: "vet", label: "Vet", emoji: "🩺" },
];

const PlayScreen = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [activeTab, setActiveTab] = useState<SubTab>("reels");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["my-profile-mini", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, full_name, state").eq("id", user!.id).single();
      return data;
    },
  });

  // ============= REELS =============
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["feed-posts"],
    enabled: activeTab === "reels",
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles!posts_user_id_fkey(full_name, username, avatar_url), pets!posts_pet_id_fkey(name, pet_type)")
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ["alerts"],
    enabled: activeTab === "reels",
    queryFn: async () => {
      const { data } = await supabase
        .from("forum_topics")
        .select("*, profiles!forum_topics_user_id_fkey(full_name, avatar_url)")
        .eq("pet_category", "alert")
        .eq("is_urgent", true)
        .order("created_at", { ascending: false })
        .limit(5);
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
    enabled: activeTab === "reels",
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*, profiles!stories_user_id_fkey(full_name, avatar_url), pets!stories_pet_id_fkey(name, avatar_emoji)")
        .order("created_at", { ascending: false });
      return data || [];
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
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user!.id });
        trackEvent("post_liked", { post_id: postId });
      }
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ["my-likes"] });
      const prevLikes = queryClient.getQueryData<string[]>(["my-likes", user?.id]) || [];
      const prevPosts = queryClient.getQueryData<any[]>(["feed-posts"]) || [];
      const isLiked = prevLikes.includes(postId);
      queryClient.setQueryData(["my-likes", user?.id], isLiked ? prevLikes.filter((id) => id !== postId) : [...prevLikes, postId]);
      queryClient.setQueryData(["feed-posts"], prevPosts.map(p => p.id === postId ? { ...p, like_count: (p.like_count || 0) + (isLiked ? -1 : 1) } : p));
      return { prevLikes, prevPosts };
    },
    onError: (_e, _id, ctx) => {
      queryClient.setQueryData(["my-likes", user?.id], ctx?.prevLikes);
      queryClient.setQueryData(["feed-posts"], ctx?.prevPosts);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["coins"] });
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const isSaved = savedPostIds.includes(postId);
      if (isSaved) await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", user!.id);
      else await supabase.from("saved_posts").insert({ post_id: postId, user_id: user!.id });
    },
    onSuccess: (_d, postId) => {
      const wasSaved = !savedPostIds.includes(postId);
      toast.success(wasSaved ? "Saved 🔖" : "Removed", { duration: 1200 });
      queryClient.invalidateQueries({ queryKey: ["my-saves"] });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await supabase.from("post_comments").delete().eq("post_id", postId);
      await supabase.from("post_likes").delete().eq("post_id", postId);
      await supabase.from("saved_posts").delete().eq("post_id", postId);
      await supabase.from("posts").delete().eq("id", postId).eq("user_id", user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
      toast.success("Post deleted 🗑️");
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

  const sharePost = async (post: any) => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Petosauras", url: shareUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied! 📋");
    }
  };

  // ============= NEWS =============
  const { data: newsArticles = [], isLoading: newsLoading, refetch: refetchNews } = useQuery({
    queryKey: ["pet-news", profile?.state],
    enabled: activeTab === "news" && !!profile?.state,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-news", { body: { state: profile?.state } });
      if (error) throw new Error("Failed to fetch news");
      return data?.articles || [];
    },
  });

  // ============= FACTS =============
  const { data: petFacts = [], isLoading: factsLoading, refetch: refetchFacts } = useQuery({
    queryKey: ["pet-facts"],
    enabled: activeTab === "facts",
    queryFn: async () => {
      const { data } = await supabase.from("pet_facts").select("*").gt("expires_at", new Date().toISOString()).order("generated_at", { ascending: false }).limit(8);
      if (!data || data.length === 0) {
        const { data: newData } = await supabase.functions.invoke("generate-pet-facts");
        return newData?.facts || [];
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // ============= NEARBY =============
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const findNearby = async () => {
    setNearbyLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      const { data, error } = await supabase.functions.invoke("fetch-nearby-places", {
        body: { lat: pos.coords.latitude, lng: pos.coords.longitude, type: "park", keyword: "pet OR dog cafe", radius: 5000 },
      });
      if (error) throw error;
      setNearbyPlaces(data?.places || []);
      if (!data?.places?.length) toast.info("No pet parks found nearby");
    } catch (e: any) {
      toast.error("Could not find nearby places");
    } finally {
      setNearbyLoading(false);
    }
  };

  // Games sub-tab and Sauras-Coins UI are temporarily disabled.

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <header className="sticky top-0 bg-card/80 backdrop-blur-lg z-40 px-5 py-3 flex items-center justify-between border-b border-border">
          <img src="/petosauras-logo.png" alt="Petosauras" style={{ height: 32, objectFit: "contain" }} />
          <div className="flex gap-2 items-center">
            <button className="w-9 h-9 rounded-[10px] bg-surface-alt flex items-center justify-center text-muted-foreground hover:bg-primary-light"><Search className="w-5 h-5" strokeWidth={1.8} /></button>
            <button onClick={() => navigate("/notifications")} className="w-9 h-9 rounded-[10px] bg-surface-alt flex items-center justify-center text-muted-foreground hover:bg-primary-light relative">
              <Bell className="w-5 h-5" strokeWidth={1.8} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </button>
            <button onClick={() => navigate("/profile")} className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-xs font-heading font-extrabold text-primary-foreground">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : getInitials(profile?.full_name)}
            </button>
          </div>
        </header>

        {/* Sub-tabs */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-card border-b border-border">
          {SUB_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-body font-bold transition-colors ${
                activeTab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* ===== REELS ===== */}
        {activeTab === "reels" && (
          <>
            {/* Stories */}
            <div className="px-5 py-3.5 flex gap-3 overflow-x-auto no-scrollbar bg-card border-b border-border">
              <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => setShowStoryCreator(true)}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-primary bg-primary-light">
                  <Plus className="w-6 h-6 text-primary" strokeWidth={1.8} />
                </div>
                <span className="text-[10px] font-body font-semibold text-muted-foreground">Your Story</span>
              </div>
              {stories.map((s: any, idx: number) => {
                const isViewed = viewedStoryIds.includes(s.id);
                return (
                  <div key={s.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => { setStoryStartIndex(idx); setShowStoryViewer(true); }}>
                    <div className="w-16 h-16 rounded-full p-[2.5px]" style={{ background: isViewed ? "#ccc" : "linear-gradient(135deg, #7B5EA7, #FF8C66)" }}>
                      <div className="w-full h-full rounded-full bg-primary-light flex items-center justify-center text-2xl">{s.pets?.avatar_emoji || "🐾"}</div>
                    </div>
                    <span className="text-[10px] font-body font-semibold text-muted-foreground truncate w-16 text-center">
                      {s.pets?.name || s.profiles?.full_name?.split(" ")[0] || "Pet"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Pinned Alerts */}
            {alerts.length > 0 && (
              <div className="px-4 mt-3 space-y-2">
                {alerts.map((a: any) => (
                  <div key={a.id} className="paw-card p-3 border-l-4 border-destructive bg-destructive/5 animate-fade-up">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-heading font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">🚨 Alert</span>
                      <span className="text-[11px] text-muted-foreground font-body">{formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm font-heading font-bold">{a.title}</p>
                    <p className="text-xs text-muted-foreground font-body mt-0.5 line-clamp-2 whitespace-pre-line">{a.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Posts */}
            {postsLoading ? (
              <div className="space-y-4 px-4 mt-2">
                {[1, 2].map((i) => (
                  <div key={i} className="paw-card p-4 animate-pulse">
                    <div className="aspect-square bg-muted rounded-[22px]" />
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
                <span className="text-6xl mb-4">🦕</span>
                <h3 className="font-heading font-bold text-lg">No posts yet</h3>
                <button onClick={() => setShowCreate(true)} className="mt-4 text-sm font-heading font-bold text-primary hover:underline">Share your pet 🐾</button>
              </div>
            ) : (
              <div className="space-y-2.5 px-4 mt-2">
                {posts.map((post: any, idx: number) => {
                  const isLiked = likedPostIds.includes(post.id);
                  const isSaved = savedPostIds.includes(post.id);
                  const profile = post.profiles;
                  const pet = post.pets;
                  return (
                    <article key={post.id} className="paw-card overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="flex items-center gap-3 p-3.5">
                        <div onClick={() => navigate(`/profile/${post.user_id}`)} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-sm font-heading font-extrabold text-primary-foreground cursor-pointer overflow-hidden">
                          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-10 h-10 object-cover" /> : getInitials(profile?.full_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p onClick={() => navigate(`/profile/${post.user_id}`)} className="text-sm font-heading font-bold truncate cursor-pointer hover:text-primary">{profile?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground font-body">
                            {pet?.name && `${pet.name} • ${pet.pet_type} • `}
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {post.user_id === user?.id && (
                          <button onClick={() => { if (confirm("Delete this post?")) deletePostMutation.mutate(post.id); }} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="relative aspect-square bg-gradient-to-br from-primary-light to-[#C8B8F0]">
                        <img src={getMediaUrl(post.media_url)} alt={post.caption || ""} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div className="p-3.5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-4">
                            <button onClick={() => toggleLikeMutation.mutate(post.id)} className={`flex items-center gap-1.5 rounded-[10px] px-1.5 py-1 hover:bg-primary-light ${isLiked ? "animate-heart-pop" : ""}`}>
                              <Heart className="w-5 h-5" strokeWidth={1.8} fill={isLiked ? "#FF6B6B" : "none"} color={isLiked ? "#FF6B6B" : "hsl(var(--text-hint))"} />
                              <span className="text-[13px] font-body font-semibold text-muted-foreground">{post.like_count || 0}</span>
                            </button>
                            <button onClick={() => setCommentPostId(post.id)} className="flex items-center gap-1.5 text-text-hint rounded-[10px] px-1.5 py-1 hover:bg-primary-light">
                              <MessageCircle className="w-5 h-5" strokeWidth={1.8} />
                              <span className="text-[13px] font-body font-semibold text-muted-foreground">{post.comment_count || 0}</span>
                            </button>
                            <button onClick={() => sharePost(post)} className="text-text-hint rounded-[10px] p-1 hover:bg-primary-light"><Send className="w-5 h-5" strokeWidth={1.8} /></button>
                          </div>
                          <button onClick={() => toggleSaveMutation.mutate(post.id)} className="rounded-[10px] p-1 hover:bg-primary-light">
                            <Bookmark className="w-5 h-5" fill={isSaved ? "hsl(var(--primary))" : "none"} color={isSaved ? "hsl(var(--primary))" : "hsl(var(--text-hint))"} />
                          </button>
                        </div>
                        {post.caption && (
                          <p className="text-sm font-body">
                            <span className="font-heading font-bold">@{profile?.username || "user"}</span>{" "}
                            <span className="text-muted-foreground">{post.caption}</span>
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== NEWS ===== */}
        {activeTab === "news" && (
          <div className="px-4 mt-3 space-y-3">
            {!profile?.state ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground font-body mb-3">Set your state in Profile to see local pet news.</p>
                <Button onClick={() => navigate("/profile")} variant="outline">Set Location</Button>
              </div>
            ) : newsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-[22px]" />)
            ) : newsArticles.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground font-body">No news right now.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchNews()}><RotateCcw className="w-3 h-3 mr-1" /> Refresh</Button>
              </div>
            ) : (
              newsArticles.map((a: any, i: number) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="paw-card p-4 block animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  {a.urlToImage && <img src={a.urlToImage} alt="" className="w-full h-40 rounded-[16px] object-cover mb-2" loading="lazy" />}
                  <h3 className="font-heading font-bold text-sm">{a.title}</h3>
                  <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-3">{a.description}</p>
                  <div className="flex items-center gap-1 text-xs text-primary font-bold mt-2"><ExternalLink className="w-3 h-3" /> Read more</div>
                </a>
              ))
            )}
          </div>
        )}

        {/* ===== FACTS ===== */}
        {activeTab === "facts" && (
          <div className="px-4 mt-3 space-y-3">
            {factsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-[22px]" />)
            ) : petFacts.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-5xl block mb-3">⭐</span>
                <Button variant="outline" size="sm" onClick={() => refetchFacts()}><RotateCcw className="w-3 h-3 mr-1" /> Generate Facts</Button>
              </div>
            ) : (
              petFacts.map((f: any, i: number) => (
                <div key={f.id || i} className="paw-card overflow-hidden animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                  {f.image_url && <img src={f.image_url} alt={f.pet_type || ""} className="w-full h-48 object-cover" loading="lazy" />}
                  <div className="p-4">
                    <p className="text-2xl mb-1">{f.emoji || "🐾"}</p>
                    <p className="text-sm font-body">{f.fact}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ===== NEARBY ===== */}
        {activeTab === "nearby" && (
          <div className="px-4 mt-3 space-y-3">
            <div className="paw-card p-4 text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-heading font-bold">Pet Parks & Cafés</h3>
              <p className="text-xs text-muted-foreground font-body mt-1 mb-3">Find pet-friendly spots near you</p>
              <Button onClick={findNearby} disabled={nearbyLoading}>
                {nearbyLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : <><MapPin className="w-4 h-4" /> Use My Location</>}
              </Button>
            </div>
            {nearbyPlaces.map((p) => (
              <div key={p.place_id} className="paw-card p-4 animate-fade-up">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-bold text-sm truncate">{p.name}</h4>
                    <p className="text-xs text-muted-foreground font-body truncate">{p.address}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      {p.rating > 0 && <span className="text-xs flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" />{p.rating}</span>}
                      <span className="text-xs text-muted-foreground">{p.distance_km} km</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}&query_place_id=${p.place_id}`, "_blank")}>
                    Directions
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Games tab removed — Sauras-Coins gamification disabled */}
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
      <CommentSheet postId={commentPostId || ""} open={!!commentPostId} onClose={() => setCommentPostId(null)} />
      {showStoryViewer && stories.length > 0 && (
        <StoryViewer stories={stories} initialIndex={storyStartIndex} onClose={() => { setShowStoryViewer(false); queryClient.invalidateQueries({ queryKey: ["viewed-stories"] }); }} />
      )}
      <StoryCreator open={showStoryCreator} onClose={() => setShowStoryCreator(false)} />
    </MobileLayout>
  );
};

export default PlayScreen;
