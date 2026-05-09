import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import { useState, useMemo } from "react";
import BlogCard from "@/components/BlogCard";
import { categories, getBlogsByCategory } from "@/lib/knowledgeBase";
import SEO from "@/components/SEO";

const PAGE_SIZE = 12;

const LearnScreen = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showUpload, setShowUpload] = useState(false);

  const blogs = useMemo(() => getBlogsByCategory(activeCategory), [activeCategory]);
  const shown = blogs.slice(0, visible);

  const inner = (
    <div className={embedded ? "" : "pb-20"}>
      {!embedded && (
        <SEO
          title="Pet Knowledge Base — Petosauras"
          description="Vet-aligned guides on dog, cat, fish, bird and small-pet care, training, food and health."
          canonical="/learn"
        />
      )}
      <div className="px-4 pt-4 mb-3">
        <h1 className="font-heading font-bold text-xl">Knowledge Base</h1>
        <p className="text-xs text-muted-foreground font-body mt-1">
          Practical, vet-aligned guides for every kind of pet parent.
        </p>
      </div>

      <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
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

      {blogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">📚</span>
          <h3 className="font-heading font-bold text-lg">No articles yet</h3>
          <p className="text-sm text-muted-foreground mt-1 font-body">Check back soon for new guides.</p>
        </div>
      ) : (
        <>
          <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shown.map((b, i) => (
              <BlogCard key={b.id} blog={b} index={i} />
            ))}
          </div>
          {visible < blogs.length && (
            <div className="px-4 mt-6 flex justify-center">
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
