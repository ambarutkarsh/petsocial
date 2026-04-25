import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { breed, pet_type, city, state, budget_tier } = await req.json();
    if (!breed || !pet_type || !budget_tier) throw new Error("Missing required fields");

    const prompt = `Give me a monthly pet care budget breakdown in Indian Rupees for a ${breed} ${pet_type} in ${city || "India"}, ${state || "India"}, India on a ${budget_tier} budget. Reply ONLY with valid JSON in this exact format, no other text:
{
  "food": { "monthly_cost": 3500, "details": "Royal Canin Adult 3kg bag", "frequency": "Monthly purchase" },
  "health": { "monthly_cost": 1200, "details": "Routine vet checkup + flea prevention", "frequency": "Quarterly vet, monthly meds" },
  "ownership": { "monthly_cost": 800, "details": "Toys, collar, leash, treats", "frequency": "As needed" },
  "grooming": { "monthly_cost": 600, "details": "Professional grooming session", "frequency": "Monthly" },
  "total_monthly": 6100,
  "total_annual": 73200,
  "notes": "Costs may vary by specific brand preferences and vet consultation fees in your area."
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content?.trim() || "";

    // Strip markdown code fences if present
    text = text.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();

    const parsed = JSON.parse(text);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Budget calc error:", e);
    return new Response(JSON.stringify({ error: e.message || "Failed to calculate budget" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
