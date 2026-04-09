import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const body = await req.json();
    const { type } = body; // "species" or "photo"

    let messages: any[];

    if (type === "species") {
      const { species } = body;
      if (!species || typeof species !== "string" || species.length > 200) {
        return new Response(JSON.stringify({ error: "Invalid species input" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      messages = [
        {
          role: "user",
          content: `Is '${species}' a real animal species or breed that can be kept as a pet? Reply with only YES or NO, nothing else.`,
        },
      ];
    } else if (type === "photo") {
      const { imageBase64, mimeType } = body;
      if (!imageBase64 || !mimeType) {
        return new Response(JSON.stringify({ error: "Missing image data" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      messages = [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            {
              type: "text",
              text: "Does this image contain a pet animal (dog, cat, bird, fish, reptile, or any other animal kept as a pet)? Reply with only YES or NO.",
            },
          ],
        },
      ];
    } else {
      return new Response(JSON.stringify({ error: "Invalid type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: type === "photo" ? "google/gemini-2.5-flash" : "google/gemini-3-flash-preview",
        messages,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI gateway error:", status, await response.text());
      return new Response(JSON.stringify({ result: "YES" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const answer = (data.choices?.[0]?.message?.content || "").trim().toUpperCase();
    const result = answer.startsWith("YES") ? "YES" : "NO";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("validate-pet error:", e);
    // Fail open
    return new Response(JSON.stringify({ result: "YES" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
