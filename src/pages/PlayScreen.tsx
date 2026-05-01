import { FEED_PILLS, GPLACES_DAILY_CAP, NEARBY_SUB_PILLS, incrementGooglePlacesUsage, isGooglePlacesCapped, type FeedPillKey } from "@/lib/feedPills";
import { createNotification, getActorName, getPostOwnerId } from "@/lib/notifications";
import { maskName } from "@/lib/maskName";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { Loader2, Trash2 } from "lucide-react";
import { BookVetIcon, CloseIcon, CommentIcon, HeartIcon, LocationPinIcon, LockIcon, PlusIcon, SaveIcon, ShareIcon, StarIcon } from "@/components/icons/PetosauraIcons";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import CommentSheet from "@/components/CommentSheet";
import ShareSheet from "@/components/ShareSheet";
import StoryViewer from "@/components/StoryViewer";
import StoryCreator from "@/components/StoryCreator";

// Helper: attach public_profiles to a list of rows by user_id field.
async function attachProfiles<T extends Record<string, any>>(
  rows: T[],
  fkField: keyof T = "user_id" as keyof T,
  fields = "id, full_name, username, avatar_url, city",
): Promise<(T & { profiles: any })[]> {
  if (!rows || rows.length === 0) return [];
  const ids = Array.from(new Set(rows.map((r) => r[fkField]).filter(Boolean) as string[]));
  if (ids.length === 0) return rows.map((r) => ({ ...r, profiles: null }));
  const { data: profs } = await supabase.from("public_profiles").select(fields).in("id", ids);
  const map = new Map((profs || []).map((p: any) => [p.id, p]));
  return rows.map((r) => ({ ...r, profiles: map.get(r[fkField] as string) || null }));
}

// Pills enabled for guest browsing
const GUEST_ENABLED_PILLS: FeedPillKey[] = ["reels", "news", "facts"];

const FeedScreen = () => {
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const navigate = useNavigate();
  const isGuest = !user;
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  const [sharePostData, setSharePostData] = useState<{ url: string; text: string } | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [activePill, setActivePill] = useState<FeedPillKey>("reels");
  const [savedPrefs, setSavedPrefs] = useState<FeedPillKey[]>([]);
  const [nearbySub, setNearbySub] = useState<string>("restaurants");
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  const [nearbyError, setNearbyError] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState(false);
  const [restaurantCity, setRestaurantCity] = useState<string | null>(null); // null = auto from GPS/profile, "ALL" = all
  const [restaurantCityLabel, setRestaurantCityLabel] = useState<string>("");
  // GPS detection state for restaurants
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [gpsDetectedCity, setGpsDetectedCity] = useState<string | null>(null); // matched DB city from GPS
  const [gpsRawCity, setGpsRawCity] = useState<string | null>(null); // raw reverse-geocoded city name
  const [cityNotInDb, setCityNotInDb] = useState<string | null>(null); // raw city when no match

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
    if (isGuest) { setActivePill("reels"); return; }
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
    if (isGuest && !GUEST_ENABLED_PILLS.includes(key)) {
      triggerGuestPopup();
      return;
    }
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
      const { data: rawPosts } = await supabase
        .from("posts")
        .select("*, pets!posts_pet_id_fkey(name, pet_type)")
        .order("created_at", { ascending: false })
        .limit(30);
      if (!rawPosts || rawPosts.length === 0) return [];
      const userIds = Array.from(new Set(rawPosts.map((p: any) => p.user_id).filter(Boolean)));
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id, full_name, username, avatar_url, city")
        .in("id", userIds);
      const profMap = new Map((profs || []).map((p: any) => [p.id, p]));
      return rawPosts.map((p: any) => ({ ...p, profiles: profMap.get(p.user_id) || null }));
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
      const { data } = await supabase.from("forum_topics").select("*").eq("pet_category", "adoption").order("created_at", { ascending: false }).limit(20);
      return await attachProfiles(data || []);
      return data || [];
    },
  });

  const showWalker = isPillActive("walker");
  const { data: walkerTopics = [] } = useQuery({
    queryKey: ["walker-topics"],
    enabled: showWalker,
    queryFn: async () => {
      const { data } = await supabase.from("forum_topics").select("*").eq("pet_category", "walker").order("created_at", { ascending: false }).limit(20);
      return await attachProfiles(data || []);
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
      const { data } = await supabase.from("pet_club_events").select("*").order("event_date", { ascending: true }).limit(20);
      return await attachProfiles(data || []);
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
      let q = supabase.from("pets").select("*").neq("owner_id", user!.id).limit(30);
      if (species) q = q.or(`species.eq.${species},pet_type.eq.${species}`);
      const { data } = await q;
      const withProfiles = await attachProfiles(data || [], "owner_id" as any);
      return withProfiles.filter((p: any) => !profile?.city || p.profiles?.city === profile.city);
    },
  });
  const [mateIdx, setMateIdx] = useState(0);

  // ============= NEARBY =============
  const showNearby = activePill === "nearby"; // never auto-included by Curated

  const RESTAURANT_CITIES = ["Chennai", "Delhi NCR", "Mumbai", "Pune", "Bangalore", "Hyderabad", "Goa"];
  const CITY_MAP: Record<string, string> = {
    "chennai": "Chennai",
    "madras": "Chennai",
    "delhi": "Delhi NCR",
    "new delhi": "Delhi NCR",
    "gurgaon": "Delhi NCR",
    "gurugram": "Delhi NCR",
    "noida": "Delhi NCR",
    "ghaziabad": "Delhi NCR",
    "faridabad": "Delhi NCR",
    "mumbai": "Mumbai",
    "bombay": "Mumbai",
    "navi mumbai": "Mumbai",
    "thane": "Mumbai",
    "pune": "Pune",
    "pimpri": "Pune",
    "chinchwad": "Pune",
    "bangalore": "Bangalore",
    "bengaluru": "Bangalore",
    "blr": "Bangalore",
    "hyderabad": "Hyderabad",
    "secunderabad": "Hyderabad",
    "cyberabad": "Hyderabad",
    "goa": "Goa",
    "panaji": "Goa",
    "margao": "Goa",
    "anjuna": "Goa",
    "calangute": "Goa",
  };

  const resolveDbCity = (rawCity?: string | null): string | null => {
    if (!rawCity) return null;
    const lc = rawCity.toLowerCase().trim();
    const key = Object.keys(CITY_MAP).find((k) => lc.includes(k));
    return key ? CITY_MAP[key] : null;
  };

  const fetchRestaurants = async (overrideCity?: string | null, rawCityHint?: string | null) => {
    setRestaurantsLoading(true);
    setRestaurantsError(false);
    setCityNotInDb(null);
    try {
      // Determine city: explicit override > selector > GPS hint > profile city
      let dbCity: string | null = null;
      let label = "";
      let rawInput: string | null = null;
      if (overrideCity === "ALL") {
        dbCity = null;
        label = "across India";
      } else if (overrideCity && overrideCity !== "AUTO") {
        dbCity = overrideCity;
        label = overrideCity;
      } else {
        // AUTO: prefer the freshly-detected GPS hint, then any stored gps city, then profile city.
        rawInput = rawCityHint ?? gpsRawCity ?? profile?.city ?? null;
        dbCity = resolveDbCity(rawInput);
        label = dbCity || "across India";
      }

      let query = supabase
        .from("pet_friendly_places")
        .select("*")
        .eq("place_type", "restaurant")
        .eq("is_active", true)
        .order("pet_comfort_index", { ascending: false })
        .order("rating", { ascending: false });

      if (dbCity) {
        query = query.eq("city", dbCity);
      } else {
        query = query.limit(20);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRestaurants(data || []);
      setRestaurantCityLabel(label);

      // If we had a raw city but it didn't match any of our 7 supported cities,
      // surface a friendly "no listings for {city}" note above the all-cities fallback.
      if (overrideCity !== "ALL" && rawInput && !dbCity) {
        setCityNotInDb(rawInput);
      }
    } catch (e) {
      setRestaurantsError(true);
      setRestaurants([]);
    } finally {
      setRestaurantsLoading(false);
    }
  };

  // Run GPS → reverse geocode → set state, then fetch.
  // Falls through to profile city / all-cities per the priority chain.
  const detectAndFetchRestaurants = async () => {
    // Skip GPS if user already picked an explicit city.
    if (restaurantCity && restaurantCity !== "AUTO") {
      await fetchRestaurants(restaurantCity);
      return;
    }
    let detectedRaw: string | null = null;
    if (navigator.geolocation) {
      setDetectingLocation(true);
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            maximumAge: 300000,
          });
        });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address || {};
          detectedRaw =
            a.city || a.town || a.state_district || a.county || a.suburb || null;
          if (detectedRaw) {
            setGpsRawCity(detectedRaw);
            setGpsDetectedCity(resolveDbCity(detectedRaw));
          }
        } catch {
          /* reverse geocode failed — fall through */
        }
      } catch {
        /* GPS denied or timeout — fall through to profile city */
      } finally {
        setDetectingLocation(false);
      }
    }
    await fetchRestaurants("AUTO", detectedRaw);
  };

  const fetchNearby = async (subKey: string) => {
    if (subKey === "restaurants") {
      // Restaurants come from Supabase, not Google Places.
      await fetchRestaurants(restaurantCity || "AUTO");
      return;
    }
    if (subKey === "lost_found") {
      const { data: rawTopics } = await supabase.from("forum_topics").select("*").eq("pet_category", "lost_found").order("created_at", { ascending: false }).limit(20);
      const data = await attachProfiles(rawTopics || []);
      setNearbyPlaces((data || []).map((t: any) => ({ isTopic: true, ...t })));
      return;
    }
    if (isGooglePlacesCapped()) {
      toast.error(`Daily limit reached (${GPLACES_DAILY_CAP} searches). Try again tomorrow.`);
      return;
    }
    setNearbyLoading(true);
    setNearbyError(false);
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
      setNearbyError(true);
    } finally {
      setNearbyLoading(false);
    }
  };

  useEffect(() => {
    if (showNearby) fetchNearby(nearbySub);
    // eslint-disable-next-line
  }, [showNearby, nearbySub]);

  // Re-fetch restaurants when user picks a different city from the dropdown.
  useEffect(() => {
    if (showNearby && nearbySub === "restaurants") {
      fetchRestaurants(restaurantCity || "AUTO");
    }
    // eslint-disable-next-line
  }, [restaurantCity]);

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
  const sharePost = (post: any) => {
    const url = `${window.location.origin}/post/${post.id}`;
    const caption = (post.caption || "").toString().slice(0, 80);
    const text = caption ? `${caption} — on Petosauras 🐾` : "Check this out on Petosauras 🐾";
    setSharePostData({ url, text });
    trackEvent("post_share_opened", { post_id: post.id });
  };

  // ============= RENDER HELPERS =============
  const renderPostCard = (post: any, idx: number) => {
    const isLiked = likedPostIds.includes(post.id);
    const isSaved = savedPostIds.includes(post.id);
    const liveLikes = (liveCounts as any)?.likes?.[post.id] ?? post.like_count ?? 0;
    const liveComments = (liveCounts as any)?.comments?.[post.id] ?? post.comment_count ?? 0;
    const displayName = isGuest ? maskName(post.profiles?.full_name) : (post.profiles?.full_name || "Unknown");
    const profileClick = () => {
      if (isGuest) { triggerGuestPopup(); return; }
      navigate(`/profile/${post.user_id}`);
    };
    const guardedAction = (fn: () => void) => () => {
      if (isGuest) { triggerGuestPopup(); return; }
      fn();
    };
    return (
      <article key={post.id} className="paw-card overflow-hidden animate-fade-up" style={{ animationDelay: `${idx * 40}ms` }}>
        <div className="flex items-center gap-3 p-3.5">
          <button onClick={profileClick} className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-light to-primary flex items-center justify-center text-sm font-heading font-extrabold text-primary-foreground overflow-hidden">
            {!isGuest && post.profiles?.avatar_url ? (
              <img src={post.profiles.avatar_url} alt="" className="w-10 h-10 object-cover" />
            ) : isGuest ? (
              <span className="text-base">🐾</span>
            ) : (
              getInitials(post.profiles?.full_name)
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p onClick={profileClick} className="text-sm font-heading font-bold truncate cursor-pointer">{displayName}</p>
            <p className="text-xs text-muted-foreground font-body">{post.pets?.name && `${post.pets.name} • `}{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
          </div>
          {!isGuest && post.user_id === user?.id && (
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
          <button onClick={guardedAction(() => toggleLikeMutation.mutate(post.id))} className="flex items-center gap-1.5">
            <HeartIcon className={`w-6 h-6 ${isLiked ? "fill-destructive text-destructive" : "text-foreground"}`} strokeWidth={1.6} />
            <span className="text-sm font-body font-bold">{liveLikes}</span>
          </button>
          <button onClick={guardedAction(() => setCommentPostId(post.id))} className="flex items-center gap-1.5">
            <CommentIcon className="w-6 h-6 text-foreground" strokeWidth={1.6} />
            <span className="text-sm font-body font-bold">{liveComments}</span>
          </button>
          <button onClick={guardedAction(() => sharePost(post))}><ShareIcon className="w-6 h-6 text-foreground" strokeWidth={1.6} /></button>
          <button onClick={guardedAction(() => toggleSaveMutation.mutate(post.id))} className="ml-auto">
            <SaveIcon className={`w-6 h-6 ${isSaved ? "fill-primary text-primary" : "text-foreground"}`} strokeWidth={1.6} />
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
            <StarIcon className="w-4 h-4 text-warning" />
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
          <BookVetIcon className="w-4 h-4 text-primary" />
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

  const getRestaurantImage = (index: number) => {
    const queries = [
      "pet+friendly+cafe+india",
      "dog+cafe+outdoor",
      "pet+cafe+restaurant",
      "outdoor+dining+pets",
      "cafe+dog+friendly",
      "restaurant+outdoor+seating",
      "coffee+shop+pet",
      "bistro+outdoor+dog",
    ];
    const q = queries[index % queries.length];
    return `https://source.unsplash.com/800x400/?${q}&sig=${index}`;
  };

  const renderRestaurantCard = (r: any, idx: number) => {
    const dots = Array(5).fill(0).map((_, i) => i < (r.pet_comfort_index || 0) ? "●" : "○").join("");
    const mapsUrl = (r.lat && r.lng)
      ? `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} ${r.location || ""} ${r.city}`)}`;
    const handleShare = async () => {
      const shareData = {
        title: r.name,
        text: `Check out this pet-friendly place: ${r.name} in ${r.location || ""}, ${r.city}`,
        url: mapsUrl,
      };
      try {
        if (navigator.share) await navigator.share(shareData);
        else {
          await navigator.clipboard.writeText(mapsUrl);
          toast.success("Link copied!");
        }
      } catch {}
    };
    return (
      <article
        key={r.id || idx}
        className="bg-card overflow-hidden animate-fade-up mb-3"
        style={{
          borderRadius: 22,
          border: "1px solid rgba(123,94,167,0.10)",
          boxShadow: "0 2px 12px rgba(123,94,167,0.08)",
          animationDelay: `${idx * 40}ms`,
        }}
      >
        <div className="relative">
          <img
            src={r.image_url || getRestaurantImage(idx)}
            alt={r.name}
            loading="lazy"
            style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: "22px 22px 0 0" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = getRestaurantImage(idx + 7); }}
          />
          <div className="absolute" style={{ bottom: 10, left: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
            {r.pet_menu && (
              <span style={{ background: "rgba(123,94,167,0.85)", color: "white", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                🍖 Pet Menu
              </span>
            )}
            {r.play_area && (
              <span style={{ background: "rgba(255,140,102,0.85)", color: "white", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                🎮 Play Area
              </span>
            )}
            {r.off_leash && (
              <span style={{ background: "rgba(78,205,196,0.85)", color: "white", padding: "3px 10px", borderRadius: 50, fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)" }}>
                🐕 Off Leash
              </span>
            )}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-bold text-base flex-1">🍽️ {r.name}</h3>
            {r.rating != null && (
              <span style={{ color: "#FF8C66", fontWeight: 700, fontSize: 14 }}>⭐ {Number(r.rating).toFixed(1)}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-body mt-1">
            📍 {[r.location, r.city].filter(Boolean).join(", ")}
          </p>
          <p className="text-xs font-body mt-2" style={{ color: "#7B5EA7" }}>
            <span className="text-muted-foreground mr-1">Pet Comfort:</span>
            <span style={{ letterSpacing: 2 }}>{dots}</span>
            <span className="text-muted-foreground ml-1">({r.pet_comfort_index || 0}/5)</span>
          </p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1" onClick={() => window.open(mapsUrl, "_blank")}>
              Get Directions
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={handleShare}>
              Share
            </Button>
          </div>
        </div>
      </article>
    );
  };

  const renderPlaceCard = (p: any, idx: number) => {
    if (p.isTopic) return renderTopicCard(p, idx);
    return (
      <article key={p.place_id || idx} className="paw-card overflow-hidden animate-fade-up p-4" style={{ animationDelay: `${idx * 40}ms` }}>
        <h3 className="font-heading font-bold text-sm">{p.name}</h3>
        <p className="text-xs text-muted-foreground font-body mt-1">{p.address}</p>
        <div className="flex items-center gap-3 mt-2">
          {p.rating > 0 && <span className="text-xs flex items-center gap-1"><StarIcon className="w-3 h-3 fill-warning text-warning" />{p.rating}</span>}
          {p.distance_km && <span className="text-xs text-muted-foreground">{p.distance_km} km</span>}
        </div>
        <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}&query_place_id=${p.place_id}`, "_blank")}>
          <LocationPinIcon className="w-3 h-3" /> Get Directions
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
              <CloseIcon className="w-5 h-5" /> Skip
            </Button>
            <Button className="flex-1" onClick={() => mateInterestMutation.mutate(pet)}>
              <HeartIcon className="w-5 h-5" /> Interested
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
        {/* Stories — hidden for guests */}
        {showReels && !isGuest && (
          <div className="px-5 py-3 flex gap-3 overflow-x-auto no-scrollbar bg-card border-b border-border">
            <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer" onClick={() => setShowStoryCreator(true)}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-primary bg-primary-light">
                <PlusIcon className="w-6 h-6 text-primary" strokeWidth={1.8} />
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
            const disabled = isGuest && !GUEST_ENABLED_PILLS.includes("curated");
            return (
              <button
                key="curated"
                onClick={() => togglePill("curated")}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full text-xs font-body font-bold transition-colors border px-3.5 py-1.5"
                style={
                  disabled
                    ? { background: "#F5F1EC", color: "#ABA8B8", borderColor: "#F5F1EC", opacity: 0.4, cursor: "not-allowed" }
                    : active
                    ? { background: "#7B5EA7", color: "white", borderColor: "#7B5EA7" }
                    : { background: "white", color: "#9B96B0", borderColor: "#F5F1EC" }
                }
              >
                ⭐ Curated ({savedPrefs.length})
              </button>
            );
          })()}
          {FEED_PILLS.map((p) => {
            const active = activePill === p.key;
            const disabled = isGuest && !GUEST_ENABLED_PILLS.includes(p.key);
            return (
              <button
                key={p.key}
                onClick={() => togglePill(p.key)}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full text-xs font-body font-bold transition-colors border px-3.5 py-1.5"
                style={
                  disabled
                    ? { background: "#F5F1EC", color: "#ABA8B8", borderColor: "#F5F1EC", opacity: 0.4, cursor: "not-allowed" }
                    : active
                    ? { background: "#7B5EA7", color: "white", borderColor: "#7B5EA7" }
                    : { background: "white", color: "#9B96B0", borderColor: "#F5F1EC" }
                }
              >
                <span>
                  {disabled && <LockIcon className="w-3 h-3 inline mr-1" />}
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
                <PlusIcon className="w-4 h-4" /> Create Event
              </Button>
              {petClubEvents.length === 0 ? <p className="text-center text-muted-foreground py-8 font-body">No upcoming events. Be the first!</p> :
                petClubEvents.map(renderEventCard)}
            </>
          )}

          {/* Find Mates */}
          {showFindMates && renderMateCard()}

          {/* Nearby */}
          {showNearby && nearbySub === "restaurants" && (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-base">🍽️ Pet-Friendly Restaurants</h3>
                  <p className="text-xs text-muted-foreground font-body mt-0.5">
                    {restaurantsLoading
                      ? "Loading…"
                      : `${restaurants.length} place${restaurants.length === 1 ? "" : "s"} ${
                          restaurantCityLabel === "across India" ? "across India" : `in ${restaurantCityLabel}`
                        }`}
                  </p>
                </div>
                <select
                  value={restaurantCity || "AUTO"}
                  onChange={(e) => setRestaurantCity(e.target.value === "AUTO" ? null : e.target.value)}
                  className="text-xs font-body font-bold bg-card border border-border rounded-full px-3 py-1.5 text-foreground"
                >
                  <option value="AUTO">Auto</option>
                  <option value="ALL">All Cities</option>
                  {RESTAURANT_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {restaurantsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-card overflow-hidden animate-pulse" style={{ borderRadius: 22, border: "1px solid rgba(123,94,167,0.10)" }}>
                      <div className="bg-muted" style={{ height: 200 }} />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-muted rounded w-2/3" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : restaurantsError ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground font-body">Unable to load restaurants right now.</p>
                  <Button size="sm" className="mt-3" onClick={() => fetchRestaurants(restaurantCity || "AUTO")}>Retry</Button>
                </div>
              ) : restaurants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-2 opacity-60">🍽️</div>
                  <p className="text-sm font-heading font-bold">
                    No pet-friendly restaurants found in {restaurantCityLabel || "your area"} yet.
                  </p>
                  <p className="text-xs text-muted-foreground font-body mt-1">We're adding more cities soon!</p>
                  <Button size="sm" className="mt-3" onClick={() => setRestaurantCity("ALL")}>
                    Browse All Cities →
                  </Button>
                </div>
              ) : (
                restaurants.map(renderRestaurantCard)
              )}
            </>
          )}
          {showNearby && nearbySub !== "restaurants" && (nearbyLoading ? <p className="text-center py-8 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading…</p> :
            nearbyPlaces.length === 0 ? <p className="text-center text-muted-foreground py-8 font-body">No results. Try another category.</p> :
            nearbyPlaces.map(renderPlaceCard))}
        </div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
      {commentPostId && <CommentSheet postId={commentPostId} open={!!commentPostId} onClose={() => setCommentPostId(null)} />}
      {sharePostData && <ShareSheet open={!!sharePostData} url={sharePostData.url} text={sharePostData.text} onClose={() => setSharePostData(null)} />}
      {showStoryViewer && stories.length > 0 && <StoryViewer stories={stories as any} initialIndex={storyStartIndex} onClose={() => setShowStoryViewer(false)} />}
      {showStoryCreator && <StoryCreator open={showStoryCreator} onClose={() => setShowStoryCreator(false)} />}
    </MobileLayout>
  );
};

export default FeedScreen;
