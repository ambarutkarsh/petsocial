import { useState } from "react";
import { Search, Plus, MessageCircle, Eye, AlertTriangle, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const filters = ["Pet News", "Trending", "Urgent 🚨", "My Pets", "Solved"];

const categoryColors: Record<string, string> = {
  Canine: "bg-primary/10 text-primary",
  Feline: "bg-accent/10 text-accent",
  Avian: "bg-secondary/10 text-secondary",
  Aquatic: "bg-blue-100 text-blue-700",
  "Small Pet": "bg-pink-100 text-pink-700",
  Reptile: "bg-green-100 text-green-700",
  Veterinary: "bg-purple-100 text-purple-700",
  General: "bg-muted text-text-mid",
};

const categoryEmojis: Record<string, string> = {
  Canine: "🐕", Feline: "🐈", Avian: "🦜", Aquatic: "🐠", "Small Pet": "🐇", Reptile: "🦎", Veterinary: "🏥", General: "💬",
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
];

const ForumScreen = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("Pet News");
  const [expandedNewsId, setExpandedNewsId] = useState<number | null>(null);

  // New Post modal
  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState<"mypets" | "urgent" | "">("");
  const [posting, setPosting] = useState(false);

  // News location
  const [detectingLocation, setDetectingLocation] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile-state", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("state, city").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["forum-topics", activeFilter],
    enabled: activeFilter !== "Pet News",
    queryFn: async () => {
      let query = supabase.from("forum_topics").select("*").order("created_at", { ascending: false });

      if (activeFilter === "Trending") {
        query = supabase.from("forum_topics").select("*").order("reply_count", { ascending: false }).limit(20);
      } else if (activeFilter === "Urgent 🚨") {
        query = query.eq("is_urgent", true);
      } else if (activeFilter === "Solved") {
        query = query.eq("is_solved", true);
      }

      const { data } = await query.limit(20);
      return data || [];
    },
  });

  // News fetch
  const { data: newsArticles = [], isLoading: newsLoading, error: newsError, refetch: refetchNews } = useQuery({
    queryKey: ["pet-news", profile?.state],
    enabled: activeFilter === "Pet News" && !!profile?.state,
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-news`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ state: profile?.state }),
        }
      );
      if (!res.ok) throw new Error("Failed to fetch news");
      const data = await res.json();
      return data.articles || [];
    },
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

  const handleSubmitPost = async () => {
    if (!user || !newTitle || !newContent || !newCategory || !newType) return;
    setPosting(true);
    const { error } = await supabase.from("forum_topics").insert({
      user_id: user.id,
      title: newTitle,
      content: newContent,
      pet_category: newCategory,
      is_urgent: newType === "urgent",
      tags: newType === "mypets" ? ["mypets"] : ["urgent"],
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Posted successfully! 🐾");
    setShowNewPost(false);
    setNewTitle(""); setNewContent(""); setNewCategory(""); setNewType("");
    queryClient.invalidateQueries({ queryKey: ["forum-topics"] });
  };

  const canSubmitPost = newTitle.trim().length > 0 && newContent.trim().length >= 20 && newCategory && newType;

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold"><span className="text-primary">Paw</span>Forum</h1>
          <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid"><Search className="w-5 h-5" /></button>
        </header>

        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-semibold">Discussions</h2>
          <Button size="sm" onClick={() => setShowNewPost(true)}><Plus className="w-4 h-4" /> New Post</Button>
        </div>

        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* PET NEWS TAB */}
        {activeFilter === "Pet News" && (
          <div className="px-4">
            {!profile?.state ? (
              <div className="paw-card p-6 text-center">
                <span className="text-4xl mb-3 block">📍</span>
                <h3 className="font-heading font-bold text-lg mb-1">Enable location for local pet news</h3>
                <p className="text-sm text-text-muted mb-4">We'll find pet news relevant to your area</p>
                <Button onClick={handleDetectLocation} disabled={detectingLocation} className="rounded-full">
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
                <p className="text-sm text-text-muted">Unable to load news. Check your internet connection.</p>
                <button onClick={() => refetchNews()} className="text-primary font-medium text-sm mt-2">Retry</button>
              </div>
            ) : newsArticles.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl mb-3 block">📰</span>
                <p className="text-sm text-text-muted">No pet news found for {profile.state} right now. Check back later.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button onClick={() => refetchNews()} className="text-primary"><RefreshCw className="w-4 h-4" /></button>
                </div>
                {newsArticles.map((article: any, idx: number) => {
                  const isExpanded = expandedNewsId === idx;
                  return (
                    <div key={idx} onClick={() => setExpandedNewsId(isExpanded ? null : idx)}
                      className="paw-card p-4 cursor-pointer transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{article.source?.name || "News"}</span>
                        <span className="text-[10px] text-text-muted">{article.publishedAt ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }) : ""}</span>
                      </div>
                      <h3 className="text-sm font-bold leading-snug line-clamp-2 text-foreground mb-1">{article.title}</h3>
                      <p className={`text-[13px] text-text-mid leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}>
                        {article.description || ""}
                      </p>
                      <div className="flex justify-end mt-2">
                        {isExpanded ? (
                          <div className="flex items-center gap-3">
                            <a href={article.url} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-primary font-medium flex items-center gap-1">
                              Read full article <ExternalLink className="w-3 h-3" />
                            </a>
                            <span className="text-sm text-primary font-medium">Show less</span>
                          </div>
                        ) : (
                          <span className="text-sm text-primary font-medium">Read more</span>
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
        {activeFilter !== "Pet News" && (
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
                <p className="text-sm text-text-muted mt-1">Start a topic to get the conversation going!</p>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                {topics.map((topic: any) => {
                  const cat = topic.pet_category || "General";
                  return (
                    <div key={topic.id} className="paw-card p-4 flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                        {categoryEmojis[cat] || "🐾"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[cat] || categoryColors.General}`}>{cat}</span>
                          {topic.is_urgent && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Urgent
                            </span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold leading-snug line-clamp-2">{topic.title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{topic.reply_count || 0}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.view_count || 0}</span>
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
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowNewPost(false)} />
          <div className="relative w-full max-w-[430px] mx-auto bg-card rounded-t-[28px] px-6 pt-4 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold">Start a Discussion</h2>
              <button onClick={() => setShowNewPost(false)} className="text-text-muted text-xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <Input placeholder="Topic title" value={newTitle} maxLength={120}
                  onChange={(e) => setNewTitle(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
                <p className="text-xs text-text-muted text-right mt-1">{newTitle.length}/120</p>
              </div>
              <Textarea placeholder="Describe your question or topic in detail..." value={newContent}
                onChange={(e) => setNewContent(e.target.value)} className="rounded-xl bg-muted/50 border-0 min-h-[100px]" />
              {newContent.length > 0 && newContent.length < 20 && (
                <p className="text-xs text-destructive">Minimum 20 characters ({20 - newContent.length} more needed)</p>
              )}

              <div>
                <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">Category</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {forumCategories.map((c) => (
                    <button key={c.label} onClick={() => setNewCategory(c.label)}
                      className={`shrink-0 px-3 py-2 rounded-full text-sm font-medium flex items-center gap-1 transition-colors ${
                        newCategory === c.label ? "bg-primary text-primary-foreground" : "bg-card border border-muted text-text-mid"
                      }`}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">Post type</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setNewType("mypets")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      newType === "mypets" ? "border-primary bg-primary/5" : "border-muted"
                    }`}>
                    <span className="text-2xl">🐾</span>
                    <p className="text-sm font-semibold mt-1">My Pets</p>
                    <p className="text-[11px] text-text-muted">Share something about your pet</p>
                  </button>
                  <button onClick={() => setNewType("urgent")}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      newType === "urgent" ? "border-primary bg-primary/5" : "border-muted"
                    }`}>
                    <span className="text-2xl">⚠️</span>
                    <p className="text-sm font-semibold mt-1">Urgent</p>
                    <p className="text-[11px] text-text-muted">Need immediate help or advice</p>
                  </button>
                </div>
              </div>

              <Button onClick={handleSubmitPost} className="w-full rounded-full" size="lg" disabled={!canSubmitPost || posting}>
                {posting ? "Posting…" : "Post to Forum 🐾"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </MobileLayout>
  );
};

export default ForumScreen;
