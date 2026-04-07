import { useState } from "react";
import { Search, Plus, MessageCircle, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";

const filters = ["Trending", "Urgent 🚨", "My Pets", "Nearby", "Solved"];

const categoryColors: Record<string, string> = {
  Canine: "bg-primary/10 text-primary",
  Feline: "bg-accent/10 text-accent",
  Avian: "bg-secondary/10 text-secondary",
  General: "bg-muted text-text-mid",
};

const mockTopics = [
  { id: "1", emoji: "🐕", category: "Canine", title: "Best diet plan for a 2-year-old Labrador?", replies: 24, views: 156, time: "3h ago", urgent: false },
  { id: "2", emoji: "🐈", category: "Feline", title: "My cat suddenly stopped eating — need urgent help!", replies: 42, views: 310, time: "1h ago", urgent: true },
  { id: "3", emoji: "🦜", category: "Avian", title: "How to train a cockatiel to talk?", replies: 18, views: 89, time: "5h ago", urgent: false },
  { id: "4", emoji: "🐕", category: "Canine", title: "Indie dogs vaccination schedule in India", replies: 31, views: 205, time: "8h ago", urgent: false },
  { id: "5", emoji: "🐈", category: "Feline", title: "Persian cat grooming tips for summer", replies: 15, views: 120, time: "1d ago", urgent: false },
];

const ForumScreen = () => {
  const [activeFilter, setActiveFilter] = useState("Trending");

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold">
            <span className="text-primary">Paw</span>Forum
          </h1>
          <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid">
            <Search className="w-5 h-5" />
          </button>
        </header>

        <div className="px-4 flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-semibold">Discussions</h2>
          <Button size="sm">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        </div>

        {/* Filter pills */}
        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-text-mid"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Topics */}
        <div className="px-4 space-y-3">
          {mockTopics.map((topic) => (
            <div key={topic.id} className="paw-card p-4 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                {topic.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColors[topic.category] || categoryColors.General}`}>
                    {topic.category}
                  </span>
                  {topic.urgent && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> Urgent
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold leading-snug line-clamp-2">{topic.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{topic.replies}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{topic.views}</span>
                  <span>{topic.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default ForumScreen;
