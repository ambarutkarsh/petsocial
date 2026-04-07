import { useState } from "react";
import { Search, Clock, ExternalLink } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";

const categories = ["All", "🐕 Canine", "🐈 Feline", "🐠 Aquatic", "🦜 Avian", "🐇 Small Pets", "General"];

const mockArticles = [
  { id: "1", emoji: "🥗", category: "Canine", title: "Complete Nutrition Guide for Indian Breeds", readTime: 5, tags: ["nutrition", "indie"] },
  { id: "2", emoji: "🐱", category: "Feline", title: "Understanding Your Cat's Body Language", readTime: 4, tags: ["behavior", "communication"] },
  { id: "3", emoji: "💉", category: "General", title: "Vaccination Schedule Every Pet Parent Must Know", readTime: 6, tags: ["vaccines", "health"] },
  { id: "4", emoji: "🦜", category: "Avian", title: "Setting Up the Perfect Birdcage Environment", readTime: 3, tags: ["housing", "care"] },
  { id: "5", emoji: "🏥", category: "General", title: "First Aid Basics for Pet Emergencies", readTime: 7, tags: ["emergency", "health"] },
];

const mockNews = [
  { id: "1", tag: "Health Alert", tagColor: "bg-destructive/10 text-destructive", title: "Canine Parvovirus Cases Rising in Mumbai — Vets Urge Vaccination", source: "NDTV", time: "2h ago" },
  { id: "2", tag: "Policy", tagColor: "bg-secondary/10 text-secondary", title: "BBMP Announces Free Rabies Vaccination Drive for Strays", source: "Times of India", time: "5h ago" },
  { id: "3", tag: "Industry", tagColor: "bg-primary/10 text-primary", title: "India's Pet Food Market Expected to Reach $500M by 2025", source: "Economic Times", time: "1d ago" },
];

const LearnScreen = () => {
  const [tab, setTab] = useState<"knowledge" | "news">("knowledge");
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold">
            <span className="text-primary">Paw</span>Learn
          </h1>
          <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid">
            <Search className="w-5 h-5" />
          </button>
        </header>

        {/* Tab toggle */}
        <div className="px-4 mb-4">
          <div className="flex bg-muted rounded-full p-1">
            <button
              onClick={() => setTab("knowledge")}
              className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${
                tab === "knowledge" ? "bg-card shadow-paw text-foreground" : "text-text-muted"
              }`}
            >
              📚 Knowledge Base
            </button>
            <button
              onClick={() => setTab("news")}
              className={`flex-1 py-2 text-sm font-semibold rounded-full transition-colors ${
                tab === "news" ? "bg-card shadow-paw text-foreground" : "text-text-muted"
              }`}
            >
              📰 Pet News
            </button>
          </div>
        </div>

        {tab === "knowledge" && (
          <>
            <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeCategory === c ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="px-4 space-y-3">
              {mockArticles.map((a) => (
                <div key={a.id} className="paw-card p-4 flex gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">
                    {a.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-text-mid">{a.category}</span>
                    <h3 className="text-sm font-semibold mt-1 line-clamp-2">{a.title}</h3>
                    <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {a.readTime} min read
                    </p>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="px-4 space-y-3">
              {mockNews.map((n) => (
                <div key={n.id} className="paw-card p-4">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${n.tagColor}`}>{n.tag}</span>
                  <h3 className="text-sm font-semibold mt-2 line-clamp-2">{n.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-text-muted">{n.source} • {n.time}</p>
                    <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default LearnScreen;
