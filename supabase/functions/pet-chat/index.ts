// Petosauras pet-chat edge function.
// Stage 1: uses Lovable AI Gateway (LOVABLE_API_KEY).
// Stage 2 (future): if OLLAMA_API_URL is configured, prefer that endpoint instead.
// Returns a graceful fallback string if upstream fails.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FALLBACK = "Oops, I do not know the answer to that. I am still learning.";

const SYSTEM_PROMPT = `You are Petosauras Assistant, a cautious pet-care and Petosauras product assistant.
Help users with general pet-care guidance and explain how to use Petosauras features.

Petosauras features you can guide users on:
- Creating an account, completing profile
- Adding a pet (MyPet → + Add Pet)
- Uploading pet records (MyPet → Documents / Health Log / Vaccines)
- Pet DigiLocker (under MyPet)
- Booking a vet (MyPet → Book Vet, route /mypet/book-a-vet)
- Pet Recommender (MyPet → Pet Recommender, route /mypet/pet-recommender)
- Budget Calculator (Hub → Budget Calc, route /hub/budget)
- NearBy section: Vets, Pet Restaurants, Walker, Spa & Grooming, Pet Parks, Pet Shows, Boarding, Help Stray, Lost & Found
- Feeds: Reels, News, Facts, Competition, Pet Club, Find Mates
- Creating posts/reels (use the + button in bottom nav)
- Saving posts (bookmark icon on each post)
- SOS (profile photo dropdown → SOS)

Pet-care topics you can discuss:
- General care, food & feeding, grooming, vaccination awareness, behaviour, training basics, hygiene
- Aquarium care, bird care, reptile care, new pet parent basics
- When to consult a vet

STRICT RULES:
- Do NOT provide definitive medical diagnosis, prescription advice, or medicine dosage.
- For urgent symptoms or emergencies, ALWAYS recommend consulting a licensed veterinarian immediately.
- If you do not know the answer or the question is outside scope, reply EXACTLY: "${FALLBACK}"
- Keep answers short, practical, pet-parent friendly. Use plain language. No medical jargon.`;

interface ChatRequestBody {
  message?: string;
  topic?: string | null;
  userId?: string | null;
  petContext?: any;
  featureContext?: string | null;
  history?: { role: "user" | "assistant"; content: string }[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: ChatRequestBody = await req.json().catch(() => ({}));
    const message = (body.message || "").toString().trim();

    if (!message) {
      return new Response(
        JSON.stringify({ answer: FALLBACK, confidence: "low" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contextLines: string[] = [];
    if (body.topic) contextLines.push(`Selected topic: ${body.topic}`);
    if (body.featureContext) contextLines.push(`User is currently on: ${body.featureContext}`);
    if (body.petContext) {
      try {
        contextLines.push(`User's pet: ${JSON.stringify(body.petContext).slice(0, 400)}`);
      } catch {}
    }
    const contextBlock = contextLines.length
      ? `\n\nContext:\n${contextLines.join("\n")}`
      : "";

    const messages = [
      { role: "system", content: SYSTEM_PROMPT + contextBlock },
      ...(Array.isArray(body.history)
        ? body.history.slice(-8).map((m) => ({ role: m.role, content: String(m.content || "") }))
        : []),
      { role: "user", content: message },
    ];

    // Stage 2: prefer Ollama if configured.
    const OLLAMA_API_URL = Deno.env.get("OLLAMA_API_URL");
    if (OLLAMA_API_URL) {
      try {
        const r = await fetch(OLLAMA_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, stream: false }),
        });
        if (r.ok) {
          const j = await r.json();
          const answer =
            j?.message?.content ||
            j?.choices?.[0]?.message?.content ||
            j?.answer ||
            "";
          if (answer && typeof answer === "string") {
            return new Response(
              JSON.stringify({ answer, confidence: "medium" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      } catch (e) {
        console.error("[pet-chat] Ollama upstream failed:", e);
      }
    }

    // Stage 1: Lovable AI Gateway.
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.warn("[pet-chat] LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ answer: FALLBACK, confidence: "low" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    });

    if (aiRes.status === 429) {
      return new Response(
        JSON.stringify({ answer: "I'm a bit busy right now — please try again in a moment.", confidence: "low" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (aiRes.status === 402) {
      return new Response(
        JSON.stringify({ answer: FALLBACK, confidence: "low" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!aiRes.ok) {
      const t = await aiRes.text().catch(() => "");
      console.error("[pet-chat] AI gateway error", aiRes.status, t);
      return new Response(
        JSON.stringify({ answer: FALLBACK, confidence: "low" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await aiRes.json();
    const answer: string = data?.choices?.[0]?.message?.content?.toString().trim() || "";

    if (!answer) {
      return new Response(
        JSON.stringify({ answer: FALLBACK, confidence: "low" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ answer, confidence: "high" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[pet-chat] unexpected error:", e);
    return new Response(
      JSON.stringify({ answer: FALLBACK, confidence: "low" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
