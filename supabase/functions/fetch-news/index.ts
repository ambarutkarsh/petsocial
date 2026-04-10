import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const NEWS_API_KEY = Deno.env.get("NEWS_API_KEY");
    if (!NEWS_API_KEY) {
      return new Response(JSON.stringify({ error: "NEWS_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { state } = await req.json();
    const query = `(pets OR dogs OR cats OR animals OR veterinary) AND (${state || "India"})`;
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      console.error("NewsAPI error:", res.status, text);
      return new Response(JSON.stringify({ error: "Failed to fetch news", articles: [] }), {
        status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify({ articles: data.articles || [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-news error:", e);
    return new Response(JSON.stringify({ error: "Internal error", articles: [] }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
