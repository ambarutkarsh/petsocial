import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    // Generate facts via AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: `Generate 8 interesting and surprising facts about pets (mix of dogs, cats, fish, birds, reptiles, and exotic pets). Each fact must be maximum 3 sentences. Format as JSON array: [{"fact":"...","pet_type":"dog|cat|bird|fish|reptile|rabbit|general","emoji":"🐕"}]. Make facts genuinely surprising and educational. Vary the pet types. No repeated facts. Return ONLY the JSON array.`
        }],
        temperature: 1.0,
      }),
    });

    if (!aiRes.ok) throw new Error(`AI error: ${aiRes.status}`);
    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const facts = JSON.parse(content);

    // Fetch images from Pexels for each fact
    const enrichedFacts = await Promise.all(
      facts.map(async (f: any) => {
        let image_url = "";
        let photographer = "";
        let pexels_url = "";
        if (PEXELS_API_KEY) {
          try {
            const page = Math.floor(Math.random() * 20) + 1;
            const searchQuery = f.pet_type === "general" ? "cute pets" : f.pet_type;
            const pRes = await fetch(
              `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=1&page=${page}`,
              { headers: { Authorization: PEXELS_API_KEY } }
            );
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.photos?.[0]) {
                image_url = pData.photos[0].src.medium;
                photographer = pData.photos[0].photographer;
                pexels_url = pData.photos[0].url;
              }
            }
          } catch { /* ignore pexels errors */ }
        }
        return { ...f, image_url, photographer, pexels_url };
      })
    );

    // Store in DB
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Delete expired facts
    await fetch(`${SUPABASE_URL}/rest/v1/pet_facts?expires_at=lt.${new Date().toISOString()}`, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // Insert new facts
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
    const rows = enrichedFacts.map((f: any) => ({
      fact: f.fact,
      pet_type: f.pet_type,
      emoji: f.emoji,
      image_url: f.image_url,
      photographer: f.photographer,
      pexels_url: f.pexels_url,
      expires_at: expiresAt,
    }));

    await fetch(`${SUPABASE_URL}/rest/v1/pet_facts`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(rows),
    });

    return new Response(JSON.stringify({ facts: enrichedFacts, expires_at: expiresAt }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
