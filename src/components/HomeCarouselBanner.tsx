import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface BannerItem {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  heading?: string;
  content?: string;
  location?: string;
  hashtags?: string[];
  cta_url?: string;
}

const buildReelText = (p: any): { content: string; location?: string; tags?: string[] } => ({
  content: p.caption || "Reel of the day",
  location: p.location || undefined,
  tags: Array.isArray(p.hashtags) ? p.hashtags : [],
});

const HomeCarouselBanner = () => {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);

  // Fetch admin config (latest active)
  const { data: config } = useQuery({
    queryKey: ["home-carousel-config"],
    queryFn: async () => {
      const { data } = await supabase
        .from("home_carousel_config" as any)
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as any) || null;
    },
  });

  const sourceType: string = config?.source_type || "reels";
  const selectedIds: string[] = config?.selected_item_ids || [];
  const customBanners: any[] = config?.custom_banners || [];

  const { data: banners = [] } = useQuery<BannerItem[]>({
    queryKey: ["home-carousel-banners", sourceType, JSON.stringify(selectedIds), JSON.stringify(customBanners)],
    queryFn: async () => {
      // Custom banners
      if (sourceType === "custom") {
        return (customBanners || [])
          .filter((b: any) => b.is_active !== false)
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
          .slice(0, 3)
          .map((b: any) => ({
            id: b.id,
            media_url: b.media_url,
            media_type: b.media_type || "image",
            heading: b.heading,
            content: b.content,
            location: b.location,
            hashtags: b.hashtags || [],
            cta_url: b.cta_url,
          }));
      }

      if (sourceType === "reels") {
        const baseSel = "id, media_url, media_type, thumbnail_url, caption, location, hashtags, like_count, created_at";
        const { data } = selectedIds.length
          ? await supabase.from("posts").select(baseSel).in("id", selectedIds).limit(3)
          : await supabase.from("posts").select(baseSel).eq("media_type", "video").order("like_count", { ascending: false }).limit(3);
        let rows = data || [];
        if (rows.length < 3 && !selectedIds.length) {
          const { data: backfill } = await supabase
            .from("posts")
            .select("id, media_url, media_type, thumbnail_url, caption, location, hashtags, like_count, created_at")
            .order("created_at", { ascending: false })
            .limit(3);
          rows = backfill || [];
        }
        return rows.slice(0, 3).map((p: any) => {
          const txt = buildReelText(p);
          return {
            id: p.id,
            media_url: p.thumbnail_url || p.media_url,
            media_type: "image" as const,
            content: txt.content,
            location: txt.location,
            hashtags: txt.tags,
            cta_url: `/post/${p.id}`,
          };
        });
      }

      if (sourceType === "blogs") {
        const sel = "id, title, summary, thumbnail_url, category";
        const { data } = selectedIds.length
          ? await supabase.from("knowledge_articles").select(sel).in("id", selectedIds).limit(3)
          : await supabase.from("knowledge_articles").select(sel).eq("is_published", true).order("view_count", { ascending: false }).limit(3);
        return (data || []).slice(0, 3).map((b: any) => ({
          id: b.id,
          media_url: b.thumbnail_url || "",
          media_type: "image" as const,
          heading: b.title,
          content: b.summary || b.title,
          hashtags: [b.category].filter(Boolean),
          cta_url: `/learn`,
        }));
      }

      if (sourceType === "facts") {
        const { data } = await supabase
          .from("pet_facts")
          .select("id, fact, image_url, pet_type")
          .order("generated_at", { ascending: false })
          .limit(3);
        return (data || []).map((f: any) => ({
          id: f.id,
          media_url: f.image_url || "",
          media_type: "image" as const,
          content: f.fact,
          hashtags: [f.pet_type].filter(Boolean),
          cta_url: `/learn`,
        }));
      }

      if (sourceType === "nearby") {
        const sel = "id, title, description, image_url, city, category, rating";
        const { data } = selectedIds.length
          ? await supabase.from("nearby_listings").select(sel).in("id", selectedIds).limit(3)
          : await supabase.from("nearby_listings").select(sel).eq("status", "active").order("rating", { ascending: false }).limit(3);
        return (data || []).map((n: any) => ({
          id: n.id,
          media_url: n.image_url || "",
          media_type: "image" as const,
          heading: n.title,
          content: n.description || n.title,
          location: n.city,
          hashtags: [n.category].filter(Boolean),
          cta_url: `/nearby`,
        }));
      }

      // news fallback (no table — empty)
      return [];
    },
  });

  // Final default fallback: top 3 reels of the day if nothing returned
  const { data: fallbackReels = [] } = useQuery<BannerItem[]>({
    queryKey: ["home-carousel-fallback"],
    enabled: banners.length === 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, media_url, media_type, thumbnail_url, caption, location, hashtags, like_count, created_at")
        .eq("media_type", "video")
        .order("like_count", { ascending: false })
        .limit(3);
      return (data || []).map((p: any) => ({
        id: p.id,
        media_url: p.thumbnail_url || p.media_url,
        media_type: "image" as const,
        content: p.caption || "Reel of the day",
        location: p.location,
        hashtags: p.hashtags || [],
        cta_url: `/post/${p.id}`,
      }));
    },
  });

  const items = banners.length ? banners : fallbackReels;

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [items.length]);

  const current = items[idx];

  const tagLine = useMemo(() => {
    if (!current) return "";
    const parts = [
      current.content,
      current.location,
      (current.hashtags || []).map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" "),
    ].filter(Boolean);
    return parts.join(" · ");
  }, [current]);

  if (!current) return null;

  const handleClick = () => {
    if (current.cta_url) {
      if (current.cta_url.startsWith("http")) window.open(current.cta_url, "_blank");
      else navigate(current.cta_url);
    }
  };

  return (
    <section aria-label="Home banner" className="-mx-5">
      <div className="relative w-full aspect-square max-h-[160px] overflow-hidden rounded-lg bg-primary-light">
        <button onClick={handleClick} className="absolute inset-0 w-full h-full block">
          {current.media_type === "video" ? (
            <video
              src={current.media_url}
              muted
              autoPlay
              loop
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={current.media_url}
              alt={current.heading || current.content || "Banner"}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=400&fit=crop";
              }}
            />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3">
            <p className="text-white text-[12px] font-body truncate text-left">{tagLine}</p>
          </div>
        </button>
        {items.length > 1 && (
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeCarouselBanner;
