import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const BLOG_CATEGORIES = [
  { key: "all", label: "All", emoji: "📚" },
  { key: "gift_ideas", label: "Gift Ideas", emoji: "🎁" },
  { key: "health", label: "Health", emoji: "🩺" },
  { key: "lifestyle", label: "Lifestyle", emoji: "🏡" },
  { key: "pet_parent_spotlight", label: "Pet Parent Spotlight", emoji: "✨" },
  { key: "tips", label: "Tips", emoji: "💡" },
  { key: "training", label: "Training", emoji: "🐕" },
];

function relativeDate(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (!d) return "";
  const diff = Date.now() - d;
  const day = 86400000;
  const days = Math.floor(diff / day);
  if (days < 1) return "today";
  if (days < 2) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const PetBlogsPanel = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const navigate = useNavigate();

  const { data: blogs = [], isLoading } = useQuery({
    queryKey: ["pet-blogs", selectedCategory],
    queryFn: async () => {
      let q = (supabase as any)
        .from("pet_blog_articles")
        .select("id,title,excerpt,image,image_alt,category,category_label,reading_time_min,date_modified,url")
        .eq("is_published", true)
        .order("date_modified", { ascending: false })
        .limit(60);
      if (selectedCategory !== "all") q = q.eq("category", selectedCategory);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <>
      <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-2">
        {BLOG_CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setSelectedCategory(c.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-bold transition-colors ${
              selectedCategory === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <p className="px-4 text-xs text-muted-foreground font-body mb-3">🐾 Curated from nurtureyourpet.com</p>

      {isLoading ? (
        <div className="px-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="paw-card overflow-hidden animate-pulse">
              <div className="w-full aspect-[16/10] bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-muted rounded w-1/4" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">📭</span>
          <p className="text-sm text-muted-foreground font-body">No blogs in this category yet</p>
        </div>
      ) : (
        <div className="px-4 space-y-3">
          {blogs.map((b: any, idx: number) => (
            <button
              key={b.id}
              onClick={() => navigate(`/hub/blogs/${b.id}`)}
              className="paw-card overflow-hidden text-left w-full animate-fade-up"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {b.image && (
                <div className="w-full aspect-[16/10] bg-muted overflow-hidden">
                  <img
                    src={b.image}
                    alt={b.image_alt || b.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                  />
                </div>
              )}
              <div className="p-4">
                <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {b.category_label}
                </span>
                <h3 className="text-sm font-heading font-bold mt-1 line-clamp-2">{b.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-body">
                  <Clock className="w-3 h-3" strokeWidth={1.8} /> {b.reading_time_min || 1} min read
                  {b.date_modified && (
                    <>
                      <span className="mx-1">·</span>
                      <span>{relativeDate(b.date_modified)}</span>
                    </>
                  )}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
};

export default PetBlogsPanel;
