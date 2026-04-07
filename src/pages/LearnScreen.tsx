import { useState } from "react";
import { Search, Clock, ExternalLink } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const categories = ["All", "🐕 Canine", "🐈 Feline", "🐠 Aquatic", "🦜 Avian", "🐇 Small Pets", "General"];

const LearnScreen = () => {
  const [tab, setTab] = useState<"knowledge" | "news">("knowledge");
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["knowledge-articles", activeCategory],
    queryFn: async () => {
      let query = supabase.from("knowledge_articles").select("*").eq("is_published", true).order("created_at", { ascending: false });
      if (activeCategory !== "All") {
        const cat = activeCategory.replace(/^[^\s]+\s/, ""); // Remove emoji prefix
        query = query.eq("category", cat);
      }
      const { data } = await query;
      return data || [];
    },
  });

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold"><span className="text-primary">Paw</span>Learn</h1>
          <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid"><Search className="w-5 h-5" /></button>
        </header>

        <div className="px-4 mb-4">
          <div className="flex bg-muted rounded-full p-1">
            <button onClick={() => setTab("knowledge")} className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${tab === "knowledge" ? "bg-card shadow-paw text-foreground" : "text-text-muted"}`}>
              📚 Knowledge Base
            </button>
            <button onClick={() => setTab("news")} className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${tab === "news" ? "bg-card shadow-paw text-foreground" : "text-text-muted"}`}>
              📰 Pet News
            </button>
          </div>
        </div>

        {tab === "knowledge" && (
          <>
            <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {categories.map((c) => (
                <button key={c} onClick={() => setActiveCategory(c)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${activeCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`}>
                  {c}
                </button>
              ))}
            </div>
            {isLoading ? (
              <div className="px-4 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="paw-card p-4 animate-pulse"><div className="h-4 bg-muted rounded w-3/4" /></div>)}</div>
            ) : articles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">📚</span>
                <h3 className="font-heading font-bold text-lg">No articles yet</h3>
                <p className="text-sm text-text-muted mt-1">Knowledge base articles will appear here</p>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                {articles.map((a: any) => (
                  <div key={a.id} className="paw-card p-4 flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">{a.emoji || "🐾"}</div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-text-mid">{a.category}</span>
                      <h3 className="text-sm font-semibold mt-1 line-clamp-2">{a.title}</h3>
                      <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {a.read_time_minutes || 5} min read
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "news" && (
          <>
            <div className="px-4 mb-4">
              <div className="paw-card p-3 flex items-center gap-2 bg-secondary/5">
                <span className="text-lg">🤖</span>
                <p className="text-xs text-text-mid">AI-curated from Times of India, NDTV, The Hindu + local sources</p>
              </div>
            </div>
            <div className="px-4 text-center py-16">
              <span className="text-4xl">📰</span>
              <p className="text-sm text-text-muted mt-2">Pet news feed coming soon — add a News API key to enable</p>
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default LearnScreen;
