import { useState } from "react";
import { Search, Plus, MessageCircle, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const filters = ["Trending", "Urgent 🚨", "My Pets", "Solved"];

const categoryColors: Record<string, string> = {
  Canine: "bg-primary/10 text-primary",
  Feline: "bg-accent/10 text-accent",
  Avian: "bg-secondary/10 text-secondary",
  Aquatic: "bg-blue-100 text-blue-700",
  "Small Pet": "bg-pink-100 text-pink-700",
  Reptile: "bg-green-100 text-green-700",
  General: "bg-muted text-text-mid",
};

const categoryEmojis: Record<string, string> = {
  Canine: "🐕", Feline: "🐈", Avian: "🦜", Aquatic: "🐠", "Small Pet": "🐇", Reptile: "🦎", General: "🐾",
};

const ForumScreen = () => {
  const [activeFilter, setActiveFilter] = useState("Trending");

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["forum-topics", activeFilter],
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

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold"><span className="text-primary">Paw</span>Forum</h1>
          <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid"><Search className="w-5 h-5" /></button>
        </header>

        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-semibold">Discussions</h2>
          <Button size="sm"><Plus className="w-4 h-4" /> New Post</Button>
        </div>

        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {filters.map((f) => (
            <button key={f} onClick={() => setActiveFilter(f)} className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"}`}>
              {f}
            </button>
          ))}
        </div>

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
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default ForumScreen;
