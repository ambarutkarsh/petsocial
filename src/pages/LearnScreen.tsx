import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import PetBlogsPanel from "@/components/PetBlogsPanel";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { BookOpen, Clock, Newspaper } from "lucide-react";
import { DocumentIcon } from "@/components/icons/PetosauraIcons";

const categories = ["All", "🐕 Canine", "🐈 Feline", "🐠 Aquatic", "🦜 Avian", "🐇 Small Pets", "General"];

const categoryBgColors: Record<string, string> = {
  Canine: "bg-primary-light",
  Feline: "bg-secondary-light",
  Aquatic: "bg-[#E8F4FF]",
  Avian: "bg-accent-light",
  General: "bg-muted",
};

const LearnScreen = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const [tab, setTab] = useState<"knowledge" | "news" | "blogs">("knowledge");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showUpload, setShowUpload] = useState(false);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ["knowledge-articles", activeCategory],
    queryFn: async () => {
      let query = supabase.from("knowledge_articles").select("*").eq("is_published", true).order("created_at", { ascending: false });
      if (activeCategory !== "All") {
        const cat = activeCategory.replace(/^[^\s]+\s/, "");
        query = query.eq("category", cat);
      }
      const { data } = await query;
      return data || [];
    },
  });

  const inner = (
    <div className={embedded ? "" : "pb-20"}>
        <div className="px-4 mb-4 pt-4">
          <div className="flex bg-muted rounded-full p-1 gap-1">
            <button onClick={() => setTab("knowledge")} className={`flex-1 py-2 text-xs font-heading font-bold rounded-full transition-colors flex items-center justify-center gap-1 ${tab === "knowledge" ? "bg-primary text-primary-foreground shadow-petosauras" : "text-muted-foreground"}`}>
              <DocumentIcon className="w-4 h-4" strokeWidth={1.8} /> Knowledge
            </button>
            <button onClick={() => setTab("blogs")} className={`flex-1 py-2 text-xs font-heading font-bold rounded-full transition-colors flex items-center justify-center gap-1 ${tab === "blogs" ? "bg-primary text-primary-foreground shadow-petosauras" : "text-muted-foreground"}`}>
              <BookOpen className="w-4 h-4" strokeWidth={1.8} /> Pet Blogs
            </button>
            <button onClick={() => setTab("news")} className={`flex-1 py-2 text-xs font-heading font-bold rounded-full transition-colors flex items-center justify-center gap-1 ${tab === "news" ? "bg-primary text-primary-foreground shadow-petosauras" : "text-muted-foreground"}`}>
              <Newspaper className="w-4 h-4" strokeWidth={1.8} /> News
            </button>
          </div>
        </div>

        {tab === "blogs" && <PetBlogsPanel />}

        {tab === "knowledge" && (
          <>
            <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {categories.map((c) => (
                <button key={c} onClick={() => setActiveCategory(c)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-bold transition-colors ${activeCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
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
                <p className="text-sm text-muted-foreground mt-1 font-body">Knowledge base articles will appear here</p>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                {articles.map((a: any, idx: number) => {
                  const catKey = a.category || "General";
                  return (
                    <div key={a.id} className="paw-card p-4 flex gap-3 animate-fade-up" style={{ animationDelay: `${idx * 60}ms` }}>
                      <div className={`w-12 h-12 rounded-[14px] ${categoryBgColors[catKey] || "bg-muted"} flex items-center justify-center text-2xl shrink-0 p-3`}>{a.emoji || "🐾"}</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a.category}</span>
                        <h3 className="text-sm font-heading font-bold mt-1 line-clamp-2">{a.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-body">
                          <Clock className="w-3 h-3" strokeWidth={1.8} /> {a.read_time_minutes || 5} min read
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "news" && (
          <>
            <div className="px-4 mb-4">
              <div className="paw-card p-3 flex items-center gap-2 bg-primary-light">
                <span className="text-lg">🤖</span>
                <p className="text-xs text-muted-foreground font-body">AI-curated from Times of India, NDTV, The Hindu + local sources</p>
              </div>
            </div>
            <div className="px-4 text-center py-16">
              <span className="text-4xl">📰</span>
              <p className="text-sm text-muted-foreground mt-2 font-body">Pet news feed coming soon — add a News API key to enable</p>
            </div>
          </>
        )}
    </div>
  );

  if (embedded) return inner;

  return (
    <MobileLayout>
      {inner}
      <BottomNav onPostClick={() => setShowUpload(true)} />
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </MobileLayout>
  );
};

export default LearnScreen;
