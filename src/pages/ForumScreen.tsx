import { useState, useEffect } from "react";
import { Search, Plus, MessageSquare, Eye, AlertTriangle, RotateCcw, Loader2, ExternalLink, PenSquare, CheckCircle, MapPin, Clock, DollarSign, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { Skeleton } from "@/components/ui/skeleton";

const filters = ["⭐ Facts", "Pet News", "All", "🚶 Walker", "✂️ Groomer", "🩺 Vet", "Urgent 🚨", "My Posts", "Solved"];

const categoryColors: Record<string, string> = {
  Canine: "bg-primary-light text-primary",
  Feline: "bg-secondary-light text-[#A08860]",
  Avian: "bg-accent-light text-[#2A9D8F]",
  Aquatic: "bg-[#E8F4FF] text-[#1A6FA8]",
  "Small Pet": "bg-[#E8F5EE] text-[#2A7D4F]",
  Reptile: "bg-[#FFF5E0] text-[#996600]",
  Veterinary: "bg-primary-light text-primary",
  General: "bg-muted text-muted-foreground",
  Walker: "bg-[#E8F4FF] text-[#1A6FA8]",
  Groomer: "bg-[#FFE8F0] text-[#CC3366]",
  Vet: "bg-[#FFE8E8] text-[#CC3333]",
};

const categoryEmojis: Record<string, string> = {
  Canine: "🐕", Feline: "🐈", Avian: "🦜", Aquatic: "🐠", "Small Pet": "🐇", Reptile: "🦎", Veterinary: "🏥", General: "💬",
  Walker: "🚶", Groomer: "✂️", Vet: "🩺",
};

const forumCategories = [
  { emoji: "🐕", label: "Canine" },
  { emoji: "🐈", label: "Feline" },
  { emoji: "🐠", label: "Aquatic" },
  { emoji: "🦜", label: "Avian" },
  { emoji: "🐇", label: "Small Pet" },
  { emoji: "🦎", label: "Reptile" },
  { emoji: "🏥", label: "Veterinary" },
  { emoji: "💬", label: "General" },
  { emoji: "🚶", label: "Walker" },
  { emoji: "✂️", label: "Groomer" },
  { emoji: "🩺", label: "Vet" },
];

const serviceBadges: Record<string, { label: string; color: string }> = {
  Walker: { label: "🚶 Walker Needed", color: "bg-[#E8F4FF] text-[#1A6FA8]" },
  Groomer: { label: "✂️ Groomer Needed", color: "bg-[#FFE8F0] text-[#CC3366]" },
  Vet: { label: "🩺 Vet Needed", color: "bg-[#FFE8E8] text-[#CC3333]" },
};

const postTypeOptions = [
  { value: "general", label: "💬 General", desc: "General discussion" },
  { value: "urgent", label: "🚨 Urgent", desc: "Needs immediate help or advice" },
  { value: "walker", label: "🚶 Walker", desc: "Looking for a pet walker" },
  { value: "groomer", label: "✂️ Groomer", desc: "Looking for a groomer" },
  { value: "vet", label: "🩺 Vet", desc: "Looking for a vet" },
  { value: "myposts", label: "🐾 My Posts", desc: "Share something about your pet" },
];

const defaultTabMap: Record<string, string> = {
  interesting_facts: "⭐ Facts",
  trending: "All",
  urgent: "Urgent 🚨",
  my_posts: "My Posts",
  walker: "🚶 Walker",
  groomer: "✂️ Groomer",
  vet: "🩺 Vet",
  pet_news: "Pet News",
};

const tabToDbMap: Record<string, string> = {
  "⭐ Facts": "interesting_facts",
  "All": "trending",
  "Urgent 🚨": "urgent",
  "My Posts": "my_posts",
  "🚶 Walker": "walker",
  "✂️ Groomer": "groomer",
  "🩺 Vet": "vet",
  "Pet News": "pet_news",
};

const defaultTabOptions = [
  { value: "interesting_facts", label: "⭐ Interesting Facts", recommended: true },
  { value: "trending", label: "🔥 Trending" },
  { value: "urgent", label: "🚨 Urgent" },
  { value: "my_posts", label: "💬 My Posts" },
  { value: "walker", label: "🚶 Walker" },
  { value: "groomer", label: "✂️ Groomer" },
  { value: "vet", label: "🩺 Vet" },
];

const ForumScreen = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("⭐ Facts");
  const [expandedNewsId, setExpandedNewsId] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [defaultTabLoaded, setDefaultTabLoaded] = useState(false);

  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPostType, setNewPostType] = useState("");
  const [posting, setPosting] = useState(false);

  // Service-specific fields
  const [svcLocation, setSvcLocation] = useState("");
  const [svcPetType, setSvcPetType] = useState("");
  const [svcPetSize, setSvcPetSize] = useState("");
  const [svcDuration, setSvcDuration] = useState("");
  const [svcFrequency, setSvcFrequency] = useState("");
  const [svcBudget, setSvcBudget] = useState("");
  const [svcTime, setSvcTime] = useState<string[]>([]);
  const [svcNotes, setSvcNotes] = useState("");
  const [svcGroomType, setSvcGroomType] = useState<string[]>([]);
  const [svcAtHome, setSvcAtHome] = useState("");
  const [svcConsultType, setSvcConsultType] = useState("");
  const [svcUrgency, setSvcUrgency] = useState("");
  const [svcSymptoms, setSvcSymptoms] = useState("");

  const [detectingLocation, setDetectingLocation] = useState(false);
  const [showDefaultTabSheet, setShowDefaultTabSheet] = useState(false);
  const [selectedDefaultTab, setSelectedDefaultTab] = useState("interesting_facts");

  const isServicePostType = ["walker", "groomer", "vet"].includes(newPostType);
  const serviceCategory = isServicePostType ? newPostType.charAt(0).toUpperCase() + newPostType.slice(1) : "";

  const { data: profile } = useQuery({
    queryKey: ["profile-state", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("state, city, community_default_tab").eq("id", user!.id).single();
      return data;
    },
  });

  // Set default tab from profile
  useEffect(() => {
    if (defaultTabLoaded || !profile) return;
    const tabSet = localStorage.getItem("communityDefaultTabSet");
    const dbTab = profile.community_default_tab;
    
    if (tabSet || dbTab) {
      const tab = dbTab || localStorage.getItem("communityDefaultTab") || "interesting_facts";
      setActiveFilter(defaultTabMap[tab] || "⭐ Facts");
      setDefaultTabLoaded(true);
    } else {
      // First time — show preference sheet
      setDefaultTabLoaded(true);
      setShowDefaultTabSheet(true);
    }
  }, [profile, defaultTabLoaded]);

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["forum-topics", activeFilter, user?.id],
    enabled: !["Pet News", "⭐ Facts"].includes(activeFilter),
    queryFn: async () => {
      let query = supabase.from("forum_topics").select("*").order("created_at", { ascending: false });
      if (activeFilter === "All") {
        // no extra filter
      } else if (activeFilter === "🚶 Walker") {
        query = query.eq("pet_category", "Walker");
      } else if (activeFilter === "✂️ Groomer") {
        query = query.eq("pet_category", "Groomer");
      } else if (activeFilter === "🩺 Vet") {
        query = query.eq("pet_category", "Vet");
      } else if (activeFilter === "Urgent 🚨") {
        query = query.eq("is_urgent", true);
      } else if (activeFilter === "Solved") {
        query = query.eq("is_solved", true);
      } else if (activeFilter === "My Posts" && user) {
        query = query.eq("user_id", user.id);
      }
      const { data } = await query.limit(20);
      return data || [];
    },
  });

  const { data: newsArticles = [], isLoading: newsLoading, error: newsError, refetch: refetchNews } = useQuery({
    queryKey: ["pet-news", profile?.state],
    enabled: activeFilter === "Pet News" && !!profile?.state,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-news", {
        body: { state: profile?.state },
      });
      if (error) throw new Error("Failed to fetch news");
      return data?.articles || [];
    },
  });

  // Interesting Facts
  const { data: petFacts = [], isLoading: factsLoading, refetch: refetchFacts } = useQuery({
    queryKey: ["pet-facts"],
    enabled: activeFilter === "⭐ Facts",
    queryFn: async () => {
      const { data } = await supabase
        .from("pet_facts")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("generated_at", { ascending: false })
        .limit(8);
      
      if (!data || data.length === 0) {
        // Generate new facts
        const { data: newData, error } = await supabase.functions.invoke("generate-pet-facts");
        if (error) return [];
        return newData?.facts || [];
      }
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const handleDetectLocation = async () => {
    setDetectingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
      );
      const data = await res.json();
      const detectedState = data?.address?.state;
      if (detectedState && user) {
        await supabase.from("profiles").update({ state: detectedState }).eq("id", user.id);
        queryClient.invalidateQueries({ queryKey: ["profile-state"] });
        queryClient.invalidateQueries({ queryKey: ["pet-news"] });
        toast.success(`Location set to ${detectedState}`);
      }
    } catch {
      toast.error("Could not detect your location");
    } finally {
      setDetectingLocation(false);
    }
  };

  const validateServiceFields = (): string | null => {
    if (serviceCategory === "Walker") {
      if (!svcLocation) return "Please enter your area";
      if (!svcPetType) return "Please select pet type";
      if (!svcPetSize) return "Please select pet size";
      if (!svcDuration) return "Please select walk duration";
      if (!svcFrequency) return "Please select frequency";
    } else if (serviceCategory === "Groomer") {
      if (!svcLocation) return "Please enter your area";
      if (!svcPetType) return "Please select pet type";
      if (svcGroomType.length === 0) return "Please select at least one grooming service";
    } else if (serviceCategory === "Vet") {
      if (!svcLocation) return "Please enter your area";
      if (!svcPetType) return "Please select pet type";
      if (!svcConsultType) return "Please select consultation type";
      if (!svcSymptoms || svcSymptoms.length < 20) return `Please describe symptoms in at least 20 characters (currently ${svcSymptoms.length})`;
      if (!svcUrgency) return "Please select urgency";
    }
    return null;
  };

  const handleSubmitPost = async () => {
    if (!user || !newTitle || !newContent || !newCategory) return;
    if (!newPostType) { toast.error("Please select a post type"); return; }
    if (newTitle.trim().length < 5) { toast.error("Title must be at least 5 characters"); return; }
    if (newContent.trim().length < 20) { toast.error("Description must be at least 20 characters"); return; }

    if (isServicePostType) {
      const svcError = validateServiceFields();
      if (svcError) { toast.error(svcError); return; }
    }

    setPosting(true);

    const tags: string[] = [];
    if (newPostType === "myposts") tags.push("mypets");
    if (isServicePostType) {
      tags.push(serviceCategory.toLowerCase());
      if (svcLocation) tags.push(svcLocation);
    }

    const { error } = await supabase.from("forum_topics").insert({
      user_id: user.id,
      title: newTitle,
      content: newContent + (isServicePostType ? `\n\n---\n📍 ${svcLocation}${svcBudget ? ` · 💰 ₹${svcBudget}` : ""}${svcDuration ? ` · ⏱ ${svcDuration}` : ""}` : ""),
      pet_category: isServicePostType ? serviceCategory : newCategory,
      is_urgent: newPostType === "urgent" || svcUrgency === "Urgent",
      tags,
    });

    setPosting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Posted to Community! 🦕");
    trackEvent("community_post_created", { category: newCategory, is_urgent: newPostType === "urgent" });
    setShowNewPost(false);
    resetForm();
    queryClient.invalidateQueries({ queryKey: ["forum-topics"] });
  };

  const resetForm = () => {
    setNewTitle(""); setNewContent(""); setNewCategory(""); setNewPostType("");
    setSvcLocation(""); setSvcPetType(""); setSvcPetSize(""); setSvcDuration("");
    setSvcFrequency(""); setSvcBudget(""); setSvcTime([]); setSvcNotes("");
    setSvcGroomType([]); setSvcAtHome(""); setSvcConsultType(""); setSvcUrgency(""); setSvcSymptoms("");
  };

  const canSubmitPost = newTitle.trim().length >= 5 && newContent.trim().length >= 20 && newCategory && newPostType;

  const getServiceChips = (topic: any) => {
    const cat = topic.pet_category;
    const content = topic.content || "";
    const locMatch = content.match(/📍\s*([^·\n]+)/);
    const budgetMatch = content.match(/💰\s*([^·\n]+)/);
    const durationMatch = content.match(/⏱\s*([^·\n]+)/);
    const chips: string[] = [];
    if (locMatch) chips.push(`📍 ${locMatch[1].trim()}`);
    if (durationMatch) chips.push(`⏱ ${durationMatch[1].trim()}`);
    if (budgetMatch) chips.push(`💰 ${budgetMatch[1].trim()}`);
    if (cat === "Vet" && topic.is_urgent) chips.push("🚨 Urgent");
    return chips;
  };

  const saveDefaultTab = async (tab: string) => {
    localStorage.setItem("communityDefaultTab", tab);
    localStorage.setItem("communityDefaultTabSet", "true");
    if (user) {
      await supabase.from("profiles").update({ community_default_tab: tab }).eq("id", user.id);
    }
    setActiveFilter(defaultTabMap[tab] || "⭐ Facts");
    setShowDefaultTabSheet(false);
    toast.success("Preference saved!");
  };

  const factsLastUpdated = petFacts.length > 0 && petFacts[0]?.generated_at
    ? formatDistanceToNow(new Date(petFacts[0].generated_at), { addSuffix: true })
    : null;

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="px-4 pt-4 flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-bold">Discussions</h2>
          <Button size="sm" onClick={() => setShowNewPost(true)}><PenSquare className="w-4 h-4" strokeWidth={1.8} /> New Post</Button>
        </div>

        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-body font-bold transition-colors ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* INTERESTING FACTS TAB */}
        {activeFilter === "⭐ Facts" && (
          <div className="px-4 space-y-3">
            {factsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-[22px] overflow-hidden shadow-md bg-card">
                  <Skeleton className="w-full h-[200px]" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))
            ) : petFacts.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-5xl block mb-3">⭐</span>
                <p className="text-sm text-muted-foreground font-body">No facts available right now</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchFacts()}>
                  <RotateCcw className="w-3 h-3 mr-1" /> Generate Facts
                </Button>
              </div>
            ) : (
              <>
                {petFacts.map((fact: any, idx: number) => (
                  <div key={fact.id || idx} className="rounded-[22px] overflow-hidden shadow-md bg-card animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                    {fact.image_url && (
                      <div className="relative h-[200px]">
                        <img src={fact.image_url} alt={fact.pet_type || "pet"} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-card/70 backdrop-blur-sm text-xs font-body font-bold">
                          {fact.emoji || "🐾"} {fact.pet_type || "Pet"}
                        </div>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{fact.emoji || "🐾"}</span>
                        <span className="text-xs font-body font-semibold text-primary uppercase tracking-wide">Did you know?</span>
                      </div>
                      <p className="text-[15px] font-body font-semibold leading-relaxed">{fact.fact}</p>
                      {fact.photographer && (
                        <p className="text-[11px] text-muted-foreground mt-3 font-body">
                          📷 Photo by{" "}
                          {fact.pexels_url ? (
                            <a href={fact.pexels_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">{fact.photographer}</a>
                          ) : fact.photographer}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                <div className="text-center py-4 space-y-2">
                  <p className="text-xs text-muted-foreground font-body">Facts refresh every 4 hours ✨</p>
                  {factsLastUpdated && <p className="text-[11px] text-muted-foreground font-body">Updated {factsLastUpdated}</p>}
                  <Button variant="outline" size="sm" onClick={() => refetchFacts()}>
                    <RotateCcw className="w-3 h-3 mr-1" /> Refresh Facts
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* PET NEWS TAB */}
        {activeFilter === "Pet News" && (
          <div className="px-4">
            {!profile?.state ? (
              <div className="paw-card p-6 text-center">
                <span className="text-4xl mb-3 block">📍</span>
                <h3 className="font-heading font-bold text-lg mb-1">Enable location for local pet news</h3>
                <p className="text-sm text-muted-foreground mb-4 font-body">We'll find pet news relevant to your area</p>
                <Button onClick={handleDetectLocation} disabled={detectingLocation}>
                  {detectingLocation ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Detecting...</> : "Use my location"}
                </Button>
              </div>
            ) : newsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="paw-card p-4 animate-pulse"><div className="h-4 bg-muted rounded w-3/4 mb-2" /><div className="h-3 bg-muted rounded w-1/2" /></div>
                ))}
              </div>
            ) : newsError ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground font-body">Unable to load news.</p>
                <button onClick={() => refetchNews()} className="text-primary font-bold text-sm mt-2 flex items-center gap-1 mx-auto"><RotateCcw className="w-3 h-3" strokeWidth={1.8} /> Retry</button>
              </div>
            ) : newsArticles.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl mb-3 block">📰</span>
                <p className="text-sm text-muted-foreground font-body">No pet news found for {profile.state} right now.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end"><button onClick={() => refetchNews()} className="text-primary"><RotateCcw className="w-4 h-4" strokeWidth={1.8} /></button></div>
                {newsArticles.map((article: any, idx: number) => {
                  const isExpanded = expandedNewsId === idx;
                  return (
                    <div key={idx} onClick={() => setExpandedNewsId(isExpanded ? null : idx)}
                      className="paw-card p-4 cursor-pointer transition-all duration-300 animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary">{article.source?.name || "News"}</span>
                        <span className="text-[10px] text-text-hint font-body">{article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : ""}</span>
                      </div>
                      <h3 className="text-sm font-heading font-bold leading-snug line-clamp-2 mb-1">{article.title}</h3>
                      <p className={`text-[13px] text-muted-foreground leading-relaxed font-body ${isExpanded ? "" : "line-clamp-3"}`}>{article.description || ""}</p>
                      <div className="flex justify-end mt-2">
                        {isExpanded ? (
                          <div className="flex items-center gap-3">
                            <a href={article.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-sm text-primary font-bold flex items-center gap-1 font-body">
                              Read full article <ExternalLink className="w-3 h-3" strokeWidth={1.8} />
                            </a>
                            <span className="text-sm text-primary font-bold font-body">Show less</span>
                          </div>
                        ) : (
                          <span className="text-sm text-primary font-bold font-body">Read more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* FORUM TOPICS */}
        {!["Pet News", "⭐ Facts"].includes(activeFilter) && (
          <>
            {isLoading ? (
              <div className="px-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="paw-card p-4 animate-pulse"><div className="h-4 bg-muted rounded w-3/4 mb-2" /><div className="h-3 bg-muted rounded w-1/2" /></div>
                ))}
              </div>
            ) : topics.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">💬</span>
                <h3 className="font-heading font-bold text-lg">No discussions yet</h3>
                <p className="text-sm text-muted-foreground mt-1 font-body">Start a conversation with the Petosauras community</p>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                {topics.map((topic: any, idx: number) => {
                  const cat = topic.pet_category || "General";
                  const svcBadge = serviceBadges[cat];
                  const chips = svcBadge ? getServiceChips(topic) : [];
                  return (
                    <div key={topic.id} className="paw-card p-4 flex gap-3 animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="w-10 h-10 rounded-[14px] bg-muted flex items-center justify-center text-xl shrink-0">
                        {categoryEmojis[cat] || "🐾"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-body font-bold px-2 py-0.5 rounded-full ${categoryColors[cat] || categoryColors.General}`}>{cat}</span>
                          {svcBadge && (
                            <span className={`text-[10px] font-body font-bold px-2 py-0.5 rounded-full ${svcBadge.color}`}>{svcBadge.label}</span>
                          )}
                          {topic.is_urgent && !svcBadge && (
                            <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-[#FFE8E8] text-[#CC3333] flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" strokeWidth={1.8} /> Urgent
                            </span>
                          )}
                          {topic.is_solved && (
                            <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-[#E8F5EE] text-[#2A7D4F] flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" strokeWidth={1.8} /> Solved
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-heading font-bold leading-snug line-clamp-2">{topic.title}</h3>
                        {chips.length > 0 && (
                          <div className="flex gap-2 mt-1.5 flex-wrap">
                            {chips.map((c, i) => (
                              <span key={i} className="text-[11px] font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{c}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground font-body">
                          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" strokeWidth={1.8} />{topic.reply_count || 0}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" strokeWidth={1.8} />{topic.view_count || 0}</span>
                          <span>{formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* NEW POST MODAL */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowNewPost(false)} />
          <div className="relative w-full max-w-[430px] mx-auto bg-card rounded-t-[28px] px-6 pt-4 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold">Start a Discussion</h2>
              <button onClick={() => setShowNewPost(false)} className="text-text-hint text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <Input placeholder="Topic title (min 5 chars)" value={newTitle} maxLength={120}
                  onChange={(e) => setNewTitle(e.target.value)} />
                <p className="text-xs text-text-hint text-right mt-1 font-body">{newTitle.length}/120</p>
              </div>
              <Textarea placeholder="Describe your question or topic in detail (min 20 chars)..." value={newContent}
                onChange={(e) => setNewContent(e.target.value)} className="rounded-[16px] bg-surface-alt border-[1.5px] border-border min-h-[100px] font-body" />
              {newContent.length > 0 && newContent.length < 20 && (
                <p className="text-xs text-destructive font-body">Minimum 20 characters ({20 - newContent.length} more needed)</p>
              )}

              <div>
                <p className="text-xs font-body font-bold text-muted-foreground mb-2 uppercase tracking-wide">Category</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {forumCategories.map((c) => (
                    <button key={c.label} onClick={() => { setNewCategory(c.label); if (["Walker", "Groomer", "Vet"].includes(c.label)) { setSvcLocation(profile?.city || ""); setNewPostType(c.label.toLowerCase()); } }}
                      className={`shrink-0 px-3 py-2 rounded-full text-sm font-body font-bold flex items-center gap-1 transition-colors ${
                        newCategory === c.label ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                      }`}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Post Type Dropdown */}
              {!["Walker", "Groomer", "Vet"].includes(newCategory) && (
                <div>
                  <p className="text-xs font-body font-bold text-muted-foreground mb-2 uppercase tracking-wide">Post Type</p>
                  <Select value={newPostType} onValueChange={setNewPostType}>
                    <SelectTrigger className="rounded-[16px] bg-surface-alt border-[1.5px] border-border h-12 font-body text-[15px]">
                      <SelectValue placeholder="Select post type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {postTypeOptions.filter(o => !["walker", "groomer", "vet"].includes(o.value)).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="font-body">{opt.label} — <span className="text-muted-foreground text-xs">{opt.desc}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Service-specific fields */}
              {serviceCategory === "Walker" && (
                <div className="space-y-3 p-3 bg-surface-alt rounded-[16px]">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Walker Details</p>
                  <Input placeholder="Your area / locality *" value={svcLocation} onChange={(e) => setSvcLocation(e.target.value)} />
                  <select value={svcPetType} onChange={(e) => setSvcPetType(e.target.value)} className="w-full h-12 rounded-[16px] bg-card border-[1.5px] border-border px-4 font-body text-sm">
                    <option value="">Pet type *</option>
                    {["Canine", "Feline", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex gap-2">
                    {["Small (< 10kg)", "Medium", "Large"].map((s) => (
                      <button key={s} onClick={() => setSvcPetSize(s)} className={`flex-1 py-2 rounded-full text-xs font-bold ${svcPetSize === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {["30 min", "1 hour", "2 hours"].map((d) => (
                      <button key={d} onClick={() => setSvcDuration(d)} className={`flex-1 py-2 rounded-full text-xs font-bold ${svcDuration === d ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{d}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {["One-time", "Daily", "Weekly"].map((f) => (
                      <button key={f} onClick={() => setSvcFrequency(f)} className={`flex-1 py-2 rounded-full text-xs font-bold ${svcFrequency === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{f}</button>
                    ))}
                  </div>
                  <Input placeholder="₹ Budget per walk" value={svcBudget} onChange={(e) => setSvcBudget(e.target.value)} />
                  <div className="flex gap-2">
                    {["Morning", "Afternoon", "Evening"].map((t) => (
                      <button key={t} onClick={() => setSvcTime(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])}
                        className={`flex-1 py-2 rounded-full text-xs font-bold ${svcTime.includes(t) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{t}</button>
                    ))}
                  </div>
                  <Textarea placeholder="Special requirements (optional)" value={svcNotes} onChange={(e) => setSvcNotes(e.target.value)} className="rounded-[16px] bg-card border-[1.5px] border-border min-h-[60px] font-body text-sm" />
                </div>
              )}

              {serviceCategory === "Groomer" && (
                <div className="space-y-3 p-3 bg-surface-alt rounded-[16px]">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Groomer Details</p>
                  <Input placeholder="Your area / locality *" value={svcLocation} onChange={(e) => setSvcLocation(e.target.value)} />
                  <select value={svcPetType} onChange={(e) => setSvcPetType(e.target.value)} className="w-full h-12 rounded-[16px] bg-card border-[1.5px] border-border px-4 font-body text-sm">
                    <option value="">Pet type *</option>
                    {["Canine", "Feline", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex gap-2 flex-wrap">
                    {["Full groom", "Bath only", "Nail trim", "Hair cut", "All"].map((g) => (
                      <button key={g} onClick={() => setSvcGroomType(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])}
                        className={`px-3 py-2 rounded-full text-xs font-bold ${svcGroomType.includes(g) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{g}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {["Yes", "No", "Either"].map((v) => (
                      <button key={v} onClick={() => setSvcAtHome(v)} className={`flex-1 py-2 rounded-full text-xs font-bold ${svcAtHome === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>At-home: {v}</button>
                    ))}
                  </div>
                  <Input placeholder="₹ Budget" value={svcBudget} onChange={(e) => setSvcBudget(e.target.value)} />
                  <Textarea placeholder="Special notes (optional)" value={svcNotes} onChange={(e) => setSvcNotes(e.target.value)} className="rounded-[16px] bg-card border-[1.5px] border-border min-h-[60px] font-body text-sm" />
                </div>
              )}

              {serviceCategory === "Vet" && (
                <div className="space-y-3 p-3 bg-surface-alt rounded-[16px]">
                  <p className="text-xs font-bold text-muted-foreground uppercase">Vet Details</p>
                  <Input placeholder="Your area / locality *" value={svcLocation} onChange={(e) => setSvcLocation(e.target.value)} />
                  <select value={svcPetType} onChange={(e) => setSvcPetType(e.target.value)} className="w-full h-12 rounded-[16px] bg-card border-[1.5px] border-border px-4 font-body text-sm">
                    <option value="">Pet type *</option>
                    {["Canine", "Feline", "Avian", "Aquatic", "Reptile", "Other"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <div className="flex gap-2">
                    {["In-clinic", "Home visit", "Online"].map((c) => (
                      <button key={c} onClick={() => setSvcConsultType(c)} className={`flex-1 py-2 rounded-full text-xs font-bold ${svcConsultType === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{c}</button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {["Routine", "Within 3 days", "Urgent"].map((u) => (
                      <button key={u} onClick={() => setSvcUrgency(u)} className={`flex-1 py-2 rounded-full text-xs font-bold ${svcUrgency === u ? (u === "Urgent" ? "bg-destructive text-primary-foreground" : "bg-primary text-primary-foreground") : "bg-muted text-muted-foreground"}`}>{u}{u === "Urgent" ? " ⚠️" : ""}</button>
                    ))}
                  </div>
                  <div>
                    <Textarea placeholder="Describe symptoms or reason for consultation (min 20 chars) *" value={svcSymptoms}
                      onChange={(e) => setSvcSymptoms(e.target.value)} className="rounded-[16px] bg-card border-[1.5px] border-border min-h-[80px] font-body text-sm" />
                    {svcSymptoms.length > 0 && svcSymptoms.length < 20 && (
                      <p className="text-xs text-destructive mt-1">{20 - svcSymptoms.length} more characters needed</p>
                    )}
                  </div>
                </div>
              )}

              <Button onClick={handleSubmitPost} className="w-full" size="lg" disabled={!canSubmitPost || posting}>
                {posting ? "Posting…" : "Post to Community 🦕"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* DEFAULT TAB PREFERENCE SHEET */}
      {showDefaultTabSheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => { setShowDefaultTabSheet(false); saveDefaultTab("interesting_facts"); }} />
          <div className="relative w-full max-w-[430px] mx-auto bg-card rounded-t-[28px] px-6 pt-4 pb-8 animate-slide-up">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
            <h2 className="text-lg font-heading font-bold mb-1">Customise your Community feed</h2>
            <p className="text-sm text-muted-foreground font-body mb-4">Choose which tab you'd like to see first when you open Community</p>
            
            <div className="space-y-2">
              {defaultTabOptions.map((opt) => (
                <button key={opt.value} onClick={() => setSelectedDefaultTab(opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-[16px] border-2 transition-all ${
                    selectedDefaultTab === opt.value ? "border-primary bg-primary-light" : "border-border"
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedDefaultTab === opt.value ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {selectedDefaultTab === opt.value && <div className="w-3 h-3 rounded-full bg-primary" />}
                  </div>
                  <span className="text-sm font-body font-semibold">{opt.label}</span>
                  {opt.recommended && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold ml-auto">Recommended</span>}
                </button>
              ))}
            </div>

            <Button className="w-full mt-4" onClick={() => saveDefaultTab(selectedDefaultTab)}>Save Preference</Button>
            <button className="w-full text-center text-sm text-muted-foreground font-body mt-2 py-2" onClick={() => saveDefaultTab("interesting_facts")}>
              Skip for now
            </button>
          </div>
        </div>
      )}

      <BottomNav onPostClick={() => setShowUpload(true)} />
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </MobileLayout>
  );
};

export default ForumScreen;
