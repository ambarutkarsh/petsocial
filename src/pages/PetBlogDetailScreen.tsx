import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, ExternalLink } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PageWrapper from "@/components/PageWrapper";
import BackButton from "@/components/BackButton";
import PostUploadModal from "@/components/PostUploadModal";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const PetBlogDetailScreen = () => {
  const { id } = useParams<{ id: string }>();
  const [showUpload, setShowUpload] = useState(false);

  const { data: blog, isLoading } = useQuery({
    queryKey: ["pet-blog", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("pet_blog_articles")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const paragraphs = (blog?.body_text || "")
    .split(/\n{2,}/)
    .map((p: string) => p.trim())
    .filter(Boolean);

  return (
    <MobileLayout>
      <PageWrapper>
        <header className="flex items-center gap-3 mb-3">
          <BackButton fallback="/hub" />
          <h1 className="font-heading font-bold text-base truncate">Pet Blog</h1>
        </header>

        {isLoading || !blog ? (
          <div className="space-y-3 animate-pulse">
            <div className="w-full aspect-[16/9] rounded-2xl bg-muted" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-6 bg-muted rounded w-3/4" />
          </div>
        ) : (
          <article className="pb-8">
            {blog.image && (
              <div className="w-full aspect-[16/9] rounded-2xl overflow-hidden bg-muted mb-4">
                <img
                  src={blog.image}
                  alt={blog.image_alt || blog.title}
                  className="w-full h-full object-cover"
                  onError={(e) => ((e.currentTarget as HTMLImageElement).style.display = "none")}
                />
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground font-body mb-2">
              <span className="px-2 py-0.5 rounded-full bg-muted font-bold">{blog.category_label}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {blog.reading_time_min || 1} min</span>
              {blog.date_modified && <span>· {new Date(blog.date_modified).toLocaleDateString()}</span>}
            </div>

            <h1 className="font-heading font-bold text-xl leading-snug mb-4">{blog.title}</h1>

            <div className="space-y-3">
              {paragraphs.map((p: string, i: number) => (
                <p key={i} className="text-sm font-body leading-relaxed text-foreground/90 whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>

            {blog.url && (
              <a
                href={blog.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-heading font-bold text-primary"
              >
                Read original on nurtureyourpet.com <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </article>
        )}
      </PageWrapper>
      <BottomNav onPostClick={() => setShowUpload(true)} />
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </MobileLayout>
  );
};

export default PetBlogDetailScreen;
