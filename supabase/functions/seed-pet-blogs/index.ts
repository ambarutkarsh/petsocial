import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    // Accept either { categories: [...] } or { articles: [...] }
    let articles: any[] = [];
    if (Array.isArray(body?.articles)) {
      articles = body.articles;
    } else if (Array.isArray(body?.categories)) {
      articles = body.categories.flatMap((c: any) => c.articles || []);
    } else if (body?.articles_by_id) {
      articles = Object.values(body.articles_by_id);
    }

    if (!articles.length) {
      return new Response(JSON.stringify({ error: "No articles in payload" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const rows = articles.map((a: any) => ({
      id: a.id,
      url: a.url,
      title: a.title,
      excerpt: a.excerpt ?? null,
      image: a.image ?? null,
      image_alt: a.image_alt ?? null,
      date_published: a.date_published || null,
      date_modified: a.date_modified || null,
      author: a.author ?? null,
      source: "nurtureyourpet.com",
      category: a.category,
      category_label: a.category_label,
      tags: Array.isArray(a.tags) ? a.tags : [],
      word_count: a.word_count ?? 0,
      reading_time_min: a.reading_time_min ?? 1,
      body_text: a.body_text ?? null,
      is_published: true,
    }));

    // Upsert in chunks to avoid payload limits
    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const { error } = await supabase.from("pet_blog_articles").upsert(chunk, { onConflict: "id" });
      if (error) throw error;
      inserted += chunk.length;
    }

    return new Response(JSON.stringify({ ok: true, inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
