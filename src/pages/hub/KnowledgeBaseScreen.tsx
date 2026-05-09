import HubSubLayout from "@/components/HubSubLayout";
import SEO from "@/components/SEO";
import BlogCard from "@/components/BlogCard";
import { categories, getBlogsByCategory, getFeaturedBlogs } from "@/lib/knowledgeBase";
import { useMemo, useState } from "react";

const PAGE_SIZE = 12;

const KnowledgeBaseScreen = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const blogs = useMemo(() => getBlogsByCategory(activeCategory), [activeCategory]);
  const featured = useMemo(() => getFeaturedBlogs(), []);
  const shown = blogs.slice(0, visible);

  return (
    <HubSubLayout title="Knowledge Base" emoji="📚" subtitle="Vet-aligned guides for every pet parent">
      <SEO
        title="Pet Knowledge Base — Petosauras"
        description="Practical, vet-aligned guides for dogs, cats, fish, birds and small pets."
        canonical="/hub/learn/knowledge-base"
      />

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 -mx-1 px-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveCategory(c.id);
              setVisible(PAGE_SIZE);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-body font-bold transition-colors ${
              activeCategory === c.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {activeCategory === "all" && featured.length > 0 && (
        <section className="mb-6">
          <h2 className="font-heading font-bold text-base mb-3">Featured</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((b, i) => (
              <BlogCard key={b.id} blog={b} index={i} />
            ))}
          </div>
        </section>
      )}

      <h2 className="font-heading font-bold text-base mb-3">
        {activeCategory === "all" ? "All articles" : categories.find((c) => c.id === activeCategory)?.name}
      </h2>

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-5xl mb-4">📚</span>
          <p className="text-sm text-muted-foreground font-body">No articles in this category yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((b, i) => (
              <BlogCard key={b.id} blog={b} index={i} />
            ))}
          </div>
          {visible < blogs.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + PAGE_SIZE)}
                className="px-5 py-2 rounded-full bg-muted text-foreground text-sm font-heading font-bold hover:bg-primary-light transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </HubSubLayout>
  );
};

export default KnowledgeBaseScreen;
