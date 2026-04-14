import { useState } from "react";
import { Search, Plus, MessageSquare, Eye, AlertTriangle, RotateCcw, Loader2, ExternalLink, PenSquare, CheckCircle } from "lucide-react";
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
  Canine: "bg-primary-light text-primary",
  Feline: "bg-secondary-light text-[#CC5500]",
  Avian: "bg-accent-light text-[#2A9D8F]",
  Aquatic: "bg-[#E8F4FF] text-[#1A6FA8]",
  "Small Pet": "bg-[#E8F5EE] text-[#2A7D4F]",
  Reptile: "bg-[#FFF5E0] text-[#996600]",
  Veterinary: "bg-primary-light text-primary",
  General: "bg-muted text-muted-foreground",
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

  const [showNewPost, setShowNewPost] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newType, setNewType] = useState<"mypets" | "urgent" | "">("");
  const [posting, setPosting] = useState(false);

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
    toast.success("Posted to Petosauras! 🦕");
    setShowNewPost(false);
    setNewTitle(""); setNewContent(""); setNewCategory(""); setNewType("");
    queryClient.invalidateQueries({ queryKey: ["forum-topics"] });
  };

  const canSubmitPost = newTitle.trim().length > 0 && newContent.trim().length >= 20 && newCategory && newType;

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-card/80 backdrop-blur-lg z-40 px-5 py-3.5 flex items-center justify-between border-b border-border">
          <h1 className="text-xl font-heading font-extrabold">
            <span className="text-primary">🦕 </span>
            <span className="text-primary">Forum</span>
          </h1>
          <button className="w-10 h-10 rounded-[10px] bg-surface-alt flex items-center justify-center text-muted-foreground hover:bg-primary-light transition-colors"><Search className="w-5 h-5" strokeWidth={1.8} /></button>
        </header>

        <div className="px-4 flex items-center justify-between mb-3 mt-3">
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
                <p className="text-sm text-muted-foreground font-body">Unable to load news. Check your internet connection.</p>
                <button onClick={() => refetchNews()} className="text-primary font-bold text-sm mt-2 flex items-center gap-1 mx-auto"><RotateCcw className="w-3 h-3" strokeWidth={1.8} /> Retry</button>
              </div>
            ) : newsArticles.length === 0 ? (
              <div className="text-center py-10">
                <span className="text-4xl mb-3 block">📰</span>
                <p className="text-sm text-muted-foreground font-body">No pet news found for {profile.state} right now. Check back later.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button onClick={() => refetchNews()} className="text-primary"><RotateCcw className="w-4 h-4" strokeWidth={1.8} /></button>
                </div>
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
                      <p className={`text-[13px] text-muted-foreground leading-relaxed font-body ${isExpanded ? "" : "line-clamp-3"}`}>
                        {article.description || ""}
                      </p>
                      <div className="flex justify-end mt-2">
                        {isExpanded ? (
                          <div className="flex items-center gap-3">
                            <a href={article.url} target="_blank" rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-sm text-primary font-bold flex items-center gap-1 font-body">
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
                <p className="text-sm text-muted-foreground mt-1 font-body">Start a conversation with the Petosauras community</p>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                {topics.map((topic: any, idx: number) => {
                  const cat = topic.pet_category || "General";
                  return (
                    <div key={topic.id} className="paw-card p-4 flex gap-3 animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className="w-10 h-10 rounded-[14px] bg-muted flex items-center justify-center text-xl shrink-0">
                        {categoryEmojis[cat] || "🐾"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-body font-bold px-2 py-0.5 rounded-full ${categoryColors[cat] || categoryColors.General}`}>{cat}</span>
                          {topic.is_urgent && (
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
                <Input placeholder="Topic title" value={newTitle} maxLength={120}
                  onChange={(e) => setNewTitle(e.target.value)} />
                <p className="text-xs text-text-hint text-right mt-1 font-body">{newTitle.length}/120</p>
              </div>
              <Textarea placeholder="Describe your question or topic in detail..." value={newContent}
                onChange={(e) => setNewContent(e.target.value)} className="rounded-[16px] bg-surface-alt border-[1.5px] border-border min-h-[100px] font-body" />
              {newContent.length > 0 && newContent.length < 20 && (
                <p className="text-xs text-destructive font-body">Minimum 20 characters ({20 - newContent.length} more needed)</p>
              )}

              <div>
                <p className="text-xs font-body font-bold text-muted-foreground mb-2 uppercase tracking-wide">Category</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar">
                  {forumCategories.map((c) => (
                    <button key={c.label} onClick={() => setNewCategory(c.label)}
                      className={`shrink-0 px-3 py-2 rounded-full text-sm font-body font-bold flex items-center gap-1 transition-colors ${
                        newCategory === c.label ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
                      }`}>
                      {c.emoji} {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-body font-bold text-muted-foreground mb-2 uppercase tracking-wide">Post type</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setNewType("mypets")}
                    className={`p-4 rounded-[22px] border-2 text-left transition-all ${
                      newType === "mypets" ? "border-primary bg-primary-light" : "border-border"
                    }`}>
                    <span className="text-2xl">🐾</span>
                    <p className="text-sm font-heading font-bold mt-1">My Pets</p>
                    <p className="text-[11px] text-muted-foreground font-body">Share something about your pet</p>
                  </button>
                  <button onClick={() => setNewType("urgent")}
                    className={`p-4 rounded-[22px] border-2 text-left transition-all ${
                      newType === "urgent" ? "border-primary bg-primary-light" : "border-border"
                    }`}>
                    <span className="text-2xl">⚠️</span>
                    <p className="text-sm font-heading font-bold mt-1">Urgent</p>
                    <p className="text-[11px] text-muted-foreground font-body">Need immediate help or advice</p>
                  </button>
                </div>
              </div>

              <Button onClick={handleSubmitPost} className="w-full" size="lg" disabled={!canSubmitPost || posting}>
                {posting ? "Posting…" : "Post to Petosauras 🦕"}
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
