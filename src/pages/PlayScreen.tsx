import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Send, Bookmark, Plus, Trash2, Loader2, MapPin, Star, X, ChevronLeft, ChevronRight, Trophy, Calendar as CalIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";
import CommentSheet from "@/components/CommentSheet";
import ShareSheet from "@/components/ShareSheet";
import StoryViewer from "@/components/StoryViewer";
import StoryCreator from "@/components/StoryCreator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { FEED_PILLS, NEARBY_SUB_PILLS, type FeedPillKey, isGooglePlacesCapped, incrementGooglePlacesUsage, GPLACES_DAILY_CAP } from "@/lib/feedPills";
import { createNotification, getPostOwnerId, getActorName } from "@/lib/notifications";

const FeedScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [activePill, setActivePill] = useState<FeedPillKey>("reels");
  const [savedPrefs, setSavedPrefs] = useState<FeedPillKey[]>([]);
  const [nearbySub, setNearbySub] = useState<string>("parks");
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  // Profile (load saved feed_preferences)
  const { data: profile } = useQuery({
    queryKey: ["my-profile-feed", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("feed_preferences, state, city, full_name, avatar_url").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  // Initialize active pill: Curated if user saved 2-3 prefs, else Reels.
  useEffect(() => {
    if (!profile) return;
    const saved = ((profile.feed_preferences || []) as string[])
      .filter((s): s is FeedPillKey => FEED_PILLS.some((p) => p.key === s));
    setSavedPrefs(saved);
    if (saved.length >= 2) {
      setActivePill("curated");
    } else {
      setActivePill("reels");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, profile?.feed_preferences?.join(",")]);

  const hasCurated = savedPrefs.length >= 2;

  /**
   * Single-select pill behaviour:
   *  - Tapping a different pill activates it.
   *  - Tapping the active pill is a no-op (never zero pills active).
   *  - feed_preferences in DB is left ALONE here — it represents the user's
   *    Curated mix, edited via Profile → Feed Preferences (not by tapping).
   */
  const togglePill = (key: FeedPillKey) => {
    if (key === activePill) return;
    setActivePill(key);
    trackEvent("feed_pill_changed", { pill: key });
  };


  /**
   * A pill is "active" when either:
   *  - it is the directly selected pill, OR
   *  - the Curated pill is active AND this pill is in the user's saved mix.
   * Nearby is never auto-included via Curated (location-based, opt-in only).
   */
  const isPillActive = (key: FeedPillKey): boolean => {
    if (activePill === key) return true;
    if (activePill === "curated" && key !== "nearby" && savedPrefs.includes(key)) return true;
    return false;
  };

  // ============= POSTS (always shown if "reels" selected or in curated mix) =============
  const showReels = isPillActive("reels");
  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["feed-posts"],
    enabled: showReels,
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*, profiles!posts_user_id_fkey(full_name, username, avatar_url), pets!posts_pet_id_fkey(name, pet_type)")
        .order("created_at", { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  // Live counts: gather post IDs and run one count query each via grouped fetch
  const postIds = posts.map((p: any) => p.id);
  const { data: liveCounts = {} } = useQuery({
    queryKey: ["live-counts", postIds.join(",")],
    enabled: postIds.length > 0,
    queryFn: async () => {
      const [likesRes, commentsRes] = await Promise.all([
        supabase.from("post_likes").select("post_id").in("post_id", postIds),
        supabase.from("post_comments").select("post_id").in("post_id", postIds),
      ]);
      const likeMap: Record<string, number> = {};
      const commentMap: Record<string, number> = {};
      (likesRes.data || []).forEach((r: any) => { likeMap[r.post_id] = (likeMap[r.post_id] || 0) + 1; });
      (commentsRes.data || []).forEach((r: any) => { commentMap[r.post_id] = (commentMap[r.post_id] || 0) + 1; });
      return { likes: likeMap, comments: commentMap } as any;
    },
  });

  const { data: likedPostIds = [] } = useQuery({
    queryKey: ["my-likes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("post_likes").select("post_id").eq("user_id", user!.id);
      return (data || []).map((l: any) => l.post_id);
    },
  });

  const { data: savedPostIds = [] } = useQuery({
    queryKey: ["my-saves", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("saved_posts").select("post_id").eq("user_id", user!.id);
      return (data || []).map((s: any) => s.post_id);
    },
  });

  const { data: stories = [] } = useQuery({
    queryKey: ["stories"],
    enabled: showReels,
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
      return (data || []).map((v: any) => v.story_id);
    },
  });

  // ============= NEWS / FACTS =============
  const showNews = isPillActive("news");
  const { data: newsArticles = [], isLoading: newsLoading } = useQuery({
    queryKey: ["pet-news", profile?.state],
    enabled: showNews && !!profile?.state,
    queryFn: async () => {
      const { data } = await supabase.functions.invoke("fetch-news", { body: { state: profile?.state } });
      return data?.articles || [];
    },
  });

  const showFacts = isPillActive("facts");
  const { data: petFacts = [], isLoading: factsLoading } = useQuery({
    queryKey: ["pet-facts"],
    enabled: showFacts,
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

  // ============= ADOPT / WALKER =============
  const showAdopt = isPillActive("adopt");
  const { data: adoptTopics = [] } = useQuery({
    queryKey: ["adopt-topics"],
    enabled: showAdopt,
    queryFn: async () => {
      const { data } = await supabase.from("forum_topics").select("*, profiles!forum_topics_user_id_fkey(full_name, avatar_url, username)").eq("pet_category", "adoption").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  const showWalker = isPillActive("walker");
  const { data: walkerTopics = [] } = useQuery({
    queryKey: ["walker-topics"],
    enabled: showWalker,
    queryFn: async () => {
      const { data } = await supabase.from("forum_topics").select("*, profiles!forum_topics_user_id_fkey(full_name, avatar_url, username)").eq("pet_category", "walker").order("created_at", { ascending: false }).limit(20);
      return data || [];
    },
  });

  // ============= COMPETITIONS =============
  const showCompetition = isPillActive("competition");
  const { data: competitions = [] } = useQuery({
    queryKey: ["active-competitions"],
    enabled: showCompetition,
    queryFn: async () => {
      const { data } = await supabase.from("competitions").select("*").eq("status", "active").order("end_date", { ascending: true });
      return data || [];
    },
  });

  // ============= PET CLUB =============
  const showPetClub = isPillActive("pet_club");
  const { data: petClubEvents = [] } = useQuery({
    queryKey: ["pet-club-events"],
    enabled: showPetClub,
    queryFn: async () => {
      const { data } = await supabase.from("pet_club_events").select("*, profiles!pet_club_events_user_id_fkey(full_name, avatar_url)").order("event_date", { ascending: true }).limit(20);
      return data || [];
    },
  });

  // ============= FIND MATES =============
  const showFindMates = isPillActive("find_mates");
  const { data: matePets = [] } = useQuery({
    queryKey: ["mate-pets", user?.id, profile?.city],
    enabled: showFindMates && !!user,
    queryFn: async () => {
      // Get my primary pet
      const { data: myPets } = await supabase.from("pets").select("species, pet_type").eq("owner_id", user!.id).eq("is_primary", true).maybeSingle();
      const species = myPets?.species || myPets?.pet_type;
      // Get candidates
      let q = supabase.from("pets").select("*, profiles!pets_owner_id_fkey(full_name, username, city, avatar_url)").neq("owner_id", user!.id).limit(30);
      if (species) q = q.or(`species.eq.${species},pet_type.eq.${species}`);
      const { data } = await q;
      return (data || []).filter((p: any) => !profile?.city || p.profiles?.city === profile.city);
    },
  });
  const [mateIdx, setMateIdx] = useState(0);

  // ============= NEARBY =============
  const showNearby = activePill === "nearby"; // never auto-included by Curated
  const fetchNearby = async (subKey: string) => {
    if (subKey === "lost_found") {
      const { data } = await supabase.from("forum_topics").select("*, profiles!forum_topics_user_id_fkey(full_name, avatar_url)").eq("pet_category", "lost_found").order("created_at", { ascending: false }).limit(20);
      setNearbyPlaces((data || []).map((t: any) => ({ isTopic: true, ...t })));
      return;
    }
    if (isGooglePlacesCapped()) {
      toast.error(`Daily limit reached (${GPLACES_DAILY_CAP} searches). Try again tomorrow.`);
      return;
    }
    setNearbyLoading(true);
    try {
      const sub = NEARBY_SUB_PILLS.find(s => s.key === subKey);
      if (!sub) return;
      const city = profile?.city || "India";
      const isPark = subKey === "parks";
      const fallbackQuery = `${sub.query || subKey} ${city}`.trim();
      const body: any = isPark
        ? { type: "park", keyword: "dog", radius: 5000, query: fallbackQuery }
        : { query: fallbackQuery };
      try {
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
        );
        body.lat = pos.coords.latitude;
        body.lng = pos.coords.longitude;
      } catch {
        // keep query as fallback for geocoding
      }
      const { data } = await supabase.functions.invoke("fetch-nearby-places", { body });
      incrementGooglePlacesUsage();
      setNearbyPlaces(data?.places || []);
    } catch {
      toast.error("Could not load nearby places");
    } finally {
      setNearbyLoading(false);
    }
  };

  useEffect(() => {
    if (showNearby) fetchNearby(nearbySub);
    // eslint-disable-next-line
  }, [showNearby, nearbySub]);

  // ============= MUTATIONS =============
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const isLiked = likedPostIds.includes(postId);
      if (isLiked) {
        await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user!.id);
      } else {
        await supabase.from("post_likes").insert({ post_id: postId, user_id: user!.id });
        // Notification
        const ownerId = await getPostOwnerId(postId);
        if (ownerId && ownerId !== user!.id) {
          const name = await getActorName(user!.id);
          await createNotification({
            user_id: ownerId,
            from_user_id: user!.id,
            type: "like",
            title: `${name} liked your post`,
            post_id: postId,
            redirect_url: `/post/${postId}`,
          });
        }
        trackEvent("post_liked", { post_id: postId });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["my-likes"] });
      queryClient.invalidateQueries({ queryKey: ["live-counts"] });
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

  const mateInterestMutation = useMutation({
    mutationFn: async (targetPet: any) => {
      if (!user) return;
      const { data: myPet } = await supabase.from("pets").select("id").eq("owner_id", user.id).eq("is_primary", true).maybeSingle();
      if (!myPet) {
        toast.error("Add a pet first to use Find Mates");
        return;
      }
      await supabase.from("mate_interests").insert({
        from_user_id: user.id,
        to_user_id: targetPet.owner_id,
        from_pet_id: (myPet as any).id,
        to_pet_id: targetPet.id,
        status: "interested",
      });
      // Check mutual
      const { data: mutual } = await supabase.from("mate_interests").select("id").eq("from_user_id", targetPet.owner_id).eq("to_user_id", user.id).eq("from_pet_id", targetPet.id).eq("to_pet_id", (myPet as any).id).maybeSingle();
      if (mutual) {
        await supabase.from("mate_matches").insert({ user_id_1: user.id, user_id_2: targetPet.owner_id, pet_id_1: (myPet as any).id, pet_id_2: targetPet.id });
        const myName = await getActorName(user.id);
        const theirName = await getActorName(targetPet.owner_id);
        await createNotification({ user_id: user.id, from_user_id: targetPet.owner_id, type: "match", title: `It's a Match! 🐾 You matched with ${theirName}` });
        await createNotification({ user_id: targetPet.owner_id, from_user_id: user.id, type: "match", title: `It's a Match! 🐾 You matched with ${myName}` });
        toast.success("It's a Match! 🐾", { duration: 3000 });
      } else {
        toast.success("Interest sent 💕");
      }
    },
    onSuccess: () => setMateIdx(i => i + 1),
  });

  // ============= HELPERS =============
  const getInitials = (name?: string | null) => !name ? "?" : name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  const getMediaUrl = (path: string) => path?.startsWith("http") ? path : supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
  const sharePost = async (post: any) => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) { try { await navigator.share({ title: "Petosauras", url }); } catch {} }
    else { await navigator.clipboard.writeText(url); toast.success("Link copied! 📋"); }
  };

  // ============= RENDER HELPERS =============
  const renderPostCard = (post: any, idx: number) => {
    const isLiked = likedPostIds.includes(post.id);
    const isSaved = savedPostIds.includes(post.id);
    const liveLikes = (liveCounts as any)?.likes?.[post.id] ?? post.like_count ?? 0;
    const liveComments = (liveCounts as any)?.comments?.[post.id] ?? post.comment_count ?? 0;
    return (
      <article key={post.id} className="paw-card overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
        <div className="flex items-center gap-3 p-3.5">
          <button onClick={() => navigate(`/profile/${post.user_id}`)} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-sm font-heading font-extrabold text-primary-foreground overflow-hidden">
            {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} alt="" className="w-10 h-10 object-cover" /> : getInitials(post.profiles?.full_name)}
          </button>
          <div className="flex-1 min-w-0">
            <p onClick={() => navigate(`/profile/${post.user_id}`)} className="text-sm font-heading font-bold truncate cursor-pointer">{post.profiles?.full_name || "Unknown"}</p>
            <p className="text-xs text-muted-foreground font-body">{post.pets?.name && `${post.pets.name} • `}{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
          </div>
          {post.user_id === user?.id && (
            <button onClick={() => { if (confirm("Delete this post?")) deletePostMutation.mutate(post.id); }} className="w-8 h-8 rounded-[10px] flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        {post.media_url && (
          post.media_type === "video" ? (
            <video src={getMediaUrl(post.media_url)} controls className="w-full aspect-square object-cover bg-black" />
          ) : (
            <img src={getMediaUrl(post.media_url)} alt="" className="w-full aspect-square object-cover" loading="lazy" />
          )
        )}
        <div className="px-3.5 pt-3 pb-2 flex items-center gap-4">
          <button onClick={() => toggleLikeMutation.mutate(post.id)} className="flex items-center gap-1.5">
            <Heart className={`w-6 h-6 ${isLiked ? "fill-destructive text-destructive" : "text-foreground"}`} strokeWidth={1.6} />
            <span className="text-sm font-body font-bold">{liveLikes}</span>
          </button>
          <button onClick={() => setCommentPostId(post.id)} className="flex items-center gap-1.5">
            <MessageCircle className="w-6 h-6 text-foreground" strokeWidth={1.6} />
            <span className="text-sm font-body font-bold">{liveComments}</span>
          </button>
          <button onClick={() => sharePost(post)}><Send className="w-6 h-6 text-foreground" strokeWidth={1.6} /></button>
          <button onClick={() => toggleSaveMutation.mutate(post.id)} className="ml-auto">
            <Bookmark className={`w-6 h-6 ${isSaved ? "fill-primary text-primary" : "text-foreground"}`} strokeWidth={1.6} />
          </button>
        </div>
        {post.caption && <p className="px-3.5 pb-3 text-sm font-body whitespace-pre-line">{post.caption}</p>}
      </article>
    );
  };

  const renderTopicCard = (topic: any, idx: number) => (
    <article key={topic.id} className="paw-card overflow-hidden animate-fade-up p-4" style={{ animationDelay: `${idx * 40}ms` }}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center font-bold overflow-hidden">
          {topic.profiles?.avatar_url ? <img src={topic.profiles.avatar_url} className="w-full h-full object-cover" alt="" /> : getInitials(topic.profiles?.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-bold truncate">{topic.profiles?.full_name || "User"}</p>
          <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</p>
        </div>
      </div>
      <h3 className="font-heading font-bold text-base">{topic.title}</h3>
      <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-3 whitespace-pre-line">{topic.content}</p>
    </article>
  );

  const renderNewsCard = (n: any, idx: number) => {
    const sourceName = typeof n.source === "string" ? n.source : n.source?.name || "News";
    const imageUrl = n.image || n.urlToImage;
    return (
      <a key={idx} href={n.url} target="_blank" rel="noreferrer" className="paw-card overflow-hidden block animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
        {imageUrl && <img src={imageUrl} alt="" className="w-full aspect-video object-cover" />}
        <div className="p-4">
          <p className="text-[11px] text-primary font-bold uppercase">{sourceName}</p>
          <h3 className="font-heading font-bold text-base mt-1">{n.title}</h3>
          {n.description && <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">{n.description}</p>}
          <p className="text-xs text-primary font-bold mt-2">Read more →</p>
        </div>
      </a>
    );
  };

  const renderFactCard = (f: any, idx: number) => (
    <article key={f.id} className="paw-card overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
      {f.image_url && <img src={f.image_url} alt="" className="w-full aspect-video object-cover" />}
      <div className="p-4">
        <p className="text-[11px] text-accent font-bold uppercase">⭐ Petosauras Facts</p>
        <p className="text-sm font-body mt-1">{f.emoji} {f.fact}</p>
      </div>
    </article>
  );

  const renderCompetitionCard = (c: any, idx: number) => {
    const endDate = c.end_date ? new Date(c.end_date) : null;
    const daysLeft = endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000)) : 0;
    return (
      <article key={c.id} className="paw-card overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
        {c.banner_url && <img src={c.banner_url} alt="" className="w-full aspect-video object-cover" />}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-4 h-4 text-warning" />
            <p className="text-[11px] text-warning font-bold uppercase">Competition</p>
          </div>
          <h3 className="font-heading font-bold text-base">{c.title}</h3>
          {c.description && <p className="text-sm text-muted-foreground font-body mt-1 line-clamp-2">{c.description}</p>}
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground">{daysLeft > 0 ? `${daysLeft} days left` : "Ending today"}</span>
            <Button size="sm" onClick={() => setShowCreate(true)}>Enter</Button>
          </div>
        </div>
      </article>
    );
  };

  const renderEventCard = (e: any, idx: number) => (
    <article key={e.id} className="paw-card overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
      {e.banner_url && <img src={e.banner_url} alt="" className="w-full aspect-video object-cover" />}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <CalIcon className="w-4 h-4 text-primary" />
          <p className="text-[11px] text-primary font-bold uppercase">Pet Club Event</p>
        </div>
        <h3 className="font-heading font-bold text-base">{e.title}</h3>
        <p className="text-xs text-muted-foreground font-body mt-1">📍 {e.location || e.city || "TBA"}</p>
        {e.event_date && <p className="text-xs text-muted-foreground">📅 {e.event_date} {e.event_time || ""}</p>}
        <Button size="sm" className="mt-3 w-full" onClick={async () => {
          if (!user) return;
          const { error } = await supabase.from("event_rsvps").insert({ event_id: e.id, user_id: user.id });
          if (error) toast.error("Could not RSVP"); else toast.success("RSVP confirmed! 🎉");
        }}>RSVP</Button>
      </div>
    </article>
  );

  const renderPlaceCard = (p: any, idx: number) => {
    if (p.isTopic) return renderTopicCard(p, idx);
    return (
      <article key={p.place_id || idx} className="paw-card overflow-hidden animate-fade-up p-4" style={{ animationDelay: `${idx * 40}ms` }}>
        <h3 className="font-heading font-bold text-sm">{p.name}</h3>
        <p className="text-xs text-muted-foreground font-body mt-1">{p.address}</p>
        <div className="flex items-center gap-3 mt-2">
          {p.rating > 0 && <span className="text-xs flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" />{p.rating}</span>}
          {p.distance_km && <span className="text-xs text-muted-foreground">{p.distance_km} km</span>}
        </div>
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}&query_place_id=${p.place_id}`, "_blank")}>
          <MapPin className="w-3 h-3" /> Get Directions
        </Button>
      </article>
    );
  };

  const renderMateCard = () => {
    if (matePets.length === 0) {
      return <div className="text-center py-12 text-muted-foreground font-body">No pets found nearby for mating.</div>;
    }
    if (mateIdx >= matePets.length) {
      return (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground font-body">You've seen everyone nearby!</p>
          <Button size="sm" className="mt-3" onClick={() => setMateIdx(0)}>Start Over</Button>
        </div>
      );
    }
    const pet = matePets[mateIdx];
    return (
      <div className="paw-card overflow-hidden">
        {pet.avatar_url ? (
          <img src={pet.avatar_url} alt="" className="w-full aspect-square object-cover" />
        ) : (
          <div className="w-full aspect-square bg-primary-light flex items-center justify-center text-9xl">{pet.avatar_emoji || "🐾"}</div>
        )}
        <div className="p-4">
          <h3 className="font-heading font-bold text-lg">{pet.name}, {pet.age_years || "?"}y</h3>
          <p className="text-sm text-muted-foreground font-body">{pet.species || pet.pet_type} · {pet.gender}</p>
          <p className="text-xs text-muted-foreground mt-1">@{pet.profiles?.username || "user"} · {pet.profiles?.city || "Nearby"}</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setMateIdx(i => i + 1)}>
              <X className="w-5 h-5" /> Skip
            </Button>
            <Button className="flex-1" onClick={() => mateInterestMutation.mutate(pet)}>
              <Heart className="w-5 h-5" /> Interested
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ============= MAIN RENDER =============
  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Stories */}
        {showReels && (
          <div className="px-5 py-3 flex gap-3 overflow-x-auto no-scrollbar bg-card border-b border-border">
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => setShowStoryCreator(true)}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-primary bg-primary-light">
                <Plus className="w-6 h-6 text-primary" strokeWidth={1.8} />
              </div>
              <span className="text-[10px] font-body font-semibold text-muted-foreground">Your Story</span>
            </div>
            {stories.map((s: any, i: number) => {
              const viewed = viewedStoryIds.includes(s.id);
              return (
                <div key={s.id} className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => { setStoryStartIndex(i); setShowStoryViewer(true); }}>
                  <div className="w-16 h-16 rounded-full p-[2.5px]" style={{ background: viewed ? "#ccc" : "linear-gradient(135deg, #7B5EA7, #FF8C66)" }}>
                    <div className="w-full h-full rounded-full bg-primary-light flex items-center justify-center text-2xl">{s.pets?.avatar_emoji || "🐾"}</div>
                  </div>
                  <span className="text-[10px] font-body font-semibold text-muted-foreground truncate w-16 text-center">{s.pets?.name || s.profiles?.full_name?.split(" ")[0] || "Pet"}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Pills — single-select. Curated only appears if user saved 2+ prefs. */}
        <div
          className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-card border-b border-border"
          style={{ position: "sticky", top: 56, zIndex: 30 }}
        >
          {hasCurated && (() => {
            const active = activePill === "curated";
            return (
              <button
                key="curated"
                onClick={() => togglePill("curated")}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full text-xs font-body font-bold transition-colors border px-3.5 py-1.5"
                style={
                  active
                    ? { background: "#7B5EA7", color: "white", borderColor: "#7B5EA7" }
                    : { background: "white", color: "#6B6880", borderColor: "#E8E5F0" }
                }
              >
                ⭐ Curated ({savedPrefs.length})
              </button>
            );
          })()}
          {FEED_PILLS.map((p) => {
            const active = activePill === p.key;
            return (
              <button
                key={p.key}
                onClick={() => togglePill(p.key)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full text-xs font-body font-bold transition-colors border px-3.5 py-1.5"
                style={
                  active
                    ? { background: "#7B5EA7", color: "white", borderColor: "#7B5EA7" }
                    : { background: "white", color: "#6B6880", borderColor: "#E8E5F0" }
                }
              >
                <span>
                  {p.emoji} {p.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Nearby sub-pills */}
        {showNearby && (
          <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-muted/40 border-b border-border">
            {NEARBY_SUB_PILLS.map(s => (
              <button key={s.key} onClick={() => setNearbySub(s.key)}
                className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-body font-bold transition-colors ${nearbySub === s.key ? "bg-secondary text-secondary-foreground" : "bg-card text-muted-foreground"}`}>
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Combined feed content */}
        <div className="space-y-3 px-4 mt-3">
          {/* Reels posts */}
          {showReels && (postsLoading ? (
            <div className="space-y-3">{[1, 2].map(i => <div key={i} className="paw-card aspect-square animate-pulse" />)}</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-6xl">🦕</span>
              <p className="font-heading font-bold mt-3">No posts yet</p>
              <Button size="sm" className="mt-3" onClick={() => setShowCreate(true)}>Share your pet 🐾</Button>
            </div>
          ) : posts.map(renderPostCard))}

          {/* News */}
          {showNews && (newsLoading ? <p className="text-center text-muted-foreground py-8 font-body">Loading news…</p> :
            newsArticles.length === 0 ? <p className="text-center text-muted-foreground py-8 font-body">No news available right now.</p> :
            newsArticles.map(renderNewsCard))}

          {/* Facts */}
          {showFacts && (factsLoading ? <p className="text-center text-muted-foreground py-8 font-body">Loading facts…</p> :
            petFacts.map(renderFactCard))}

          {/* Adopt */}
          {showAdopt && (adoptTopics.length === 0 ? <p className="text-center text-muted-foreground py-8 font-body">No adoption posts yet. Share one via the + button.</p> :
            adoptTopics.map(renderTopicCard))}

          {/* Walker */}
          {showWalker && (walkerTopics.length === 0 ? <p className="text-center text-muted-foreground py-8 font-body">No walker posts yet.</p> :
            walkerTopics.map(renderTopicCard))}

          {/* Competition */}
          {showCompetition && (competitions.length === 0 ? <p className="text-center text-muted-foreground py-8 font-body">No active competitions right now.</p> :
            competitions.map(renderCompetitionCard))}

          {/* Pet Club */}
          {showPetClub && (
            <>
              <Button size="sm" className="w-full" onClick={() => toast.info("Use the + button to create an event")}>
                <Plus className="w-4 h-4" /> Create Event
              </Button>
              {petClubEvents.length === 0 ? <p className="text-center text-muted-foreground py-8 font-body">No upcoming events. Be the first!</p> :
                petClubEvents.map(renderEventCard)}
            </>
          )}

          {/* Find Mates */}
          {showFindMates && renderMateCard()}

          {/* Nearby */}
          {showNearby && (nearbyLoading ? <p className="text-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading…</p> :
            nearbyPlaces.length === 0 ? <p className="text-center text-muted-foreground py-8 font-body">No results. Try another category.</p> :
            nearbyPlaces.map(renderPlaceCard))}
        </div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
      {commentPostId && <CommentSheet postId={commentPostId} open={!!commentPostId} onClose={() => setCommentPostId(null)} />}
      {showStoryViewer && stories.length > 0 && <StoryViewer stories={stories as any} initialIndex={storyStartIndex} onClose={() => setShowStoryViewer(false)} />}
      {showStoryCreator && <StoryCreator open={showStoryCreator} onClose={() => setShowStoryCreator(false)} />}
    </MobileLayout>
  );
};

export default FeedScreen;
