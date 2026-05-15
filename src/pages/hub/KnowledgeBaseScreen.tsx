import { useEffect, useMemo, useState } from "react";
import HubSubLayout from "@/components/HubSubLayout";
import SEO from "@/components/SEO";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock } from "lucide-react";

interface KArticle {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  emoji: string | null;
  read_time_minutes: number | null;
  tags: string[] | null;
  thumbnail_url: string | null;
  author_name: string | null;
}

// DB category value -> display label
const CATEGORIES: { label: string; value: string | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Canine", value: "Canine" },
  { label: "Feline", value: "Feline" },
  { label: "Aquatic", value: "Aquatic" },
  { label: "Avian", value: "Avian" },
  { label: "Small Pets", value: "Small Pet" },
  { label: "Generic", value: "General" },
];

const PAGE_SIZE = 18;

const KnowledgeBaseScreen = () => {
  const [articles, setArticles] = useState<KArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<KArticle | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("knowledge_articles")
        .select("id,title,content,summary,category,emoji,read_time_minutes,tags,thumbnail_url,author_name")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (!mounted) return;
      if (!error && data) setArticles(data as KArticle[]);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (activeCategory !== "all" && a.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [
        a.title,
        a.summary || "",
        a.content,
        ...(a.tags || []),
      ]
        .join(" \n ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [articles, activeCategory, query]);

  const shown = filtered.slice(0, visible);

  return (
    <HubSubLayout title="Knowledge Base" emoji="📚" subtitle="Vet-aligned guides for every pet parent">
      <SEO
        title="Pet Knowledge Base — Petosauras"
        description="Practical, vet-aligned guides for dogs, cats, fish, birds and small pets."
        canonical="/hub/learn/knowledge-base"
      />

      {/* Search */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(PAGE_SIZE);
          }}
          placeholder="Search by title, tag, or keyword…"
          className="w-full pl-9 pr-3 py-2 rounded-full bg-muted text-foreground text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              setActiveCategory(c.value);
              setVisible(PAGE_SIZE);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-bold transition-colors ${
              activeCategory === c.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-primary-light hover:text-primary-dark"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[18px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📚</span>
          <p className="text-sm text-muted-foreground font-body">
            {query ? "No articles match your search." : "No articles in this category yet."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((a, i) => (
              <button
                key={a.id}
                onClick={() => setSelected(a)}
                className="text-left paw-card p-4 hover:shadow-petosauras-md transition-shadow animate-fade-up"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl shrink-0" aria-hidden>
                    {a.emoji || "🐾"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary-dark">
                        {a.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-body">
                        <Clock className="w-3 h-3" strokeWidth={1.8} /> {a.read_time_minutes || 5} min
                      </span>
                    </div>
                    <h3 className="text-[15px] font-heading font-bold leading-snug line-clamp-2">{a.title}</h3>
                    {a.summary && (
                      <p className="text-xs text-muted-foreground mt-1 font-body line-clamp-3">{a.summary}</p>
                    )}
                    {a.tags && a.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-body px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {visible < filtered.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-5 py-2 rounded-full bg-muted text-foreground text-sm font-heading font-bold hover:bg-primary-light transition-colors"
              >
                Load more ({filtered.length - visible} more)
              </button>
            </div>
          )}
        </>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-[92vw] sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-2xl" aria-hidden>{selected.emoji || "🐾"}</span>
                  <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary-dark">
                    {selected.category}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-body">
                    <Clock className="w-3 h-3" strokeWidth={1.8} /> {selected.read_time_minutes || 5} min read
                  </span>
                </div>
                <DialogTitle className="font-heading text-xl leading-tight text-left">
                  {selected.title}
                </DialogTitle>
                {selected.summary && (
                  <DialogDescription className="text-left text-sm font-body">
                    {selected.summary}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="font-body text-foreground text-[15px] leading-relaxed whitespace-pre-line mt-2">
                {selected.content}
              </div>

              {selected.tags && selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-4 pt-3 border-t">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-body px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
              {selected.author_name && (
                <p className="text-xs text-muted-foreground font-body mt-3">By {selected.author_name}</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </HubSubLayout>
  );
};

export default KnowledgeBaseScreen;
