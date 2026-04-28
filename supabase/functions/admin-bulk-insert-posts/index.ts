import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

// Comma-separated list of admin emails allowed to use this endpoint
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "petosauras@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

interface PostInput {
  user_id: string;
  media_url: string;
  media_type?: string;
  caption?: string | null;
  hashtags?: string[];
  location?: string | null;
  post_category?: string;
  like_count?: number;
  comment_count?: number;
  created_at?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validate caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization header" }, 401);
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "Invalid auth token" }, 401);
    }
    const email = (userData.user.email ?? "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return json({ error: "Forbidden: not an admin" }, 403);
    }

    // 2. Parse + validate body
    const body = await req.json().catch(() => null);
    const posts: PostInput[] = Array.isArray(body?.posts) ? body.posts : [];
    if (posts.length === 0) {
      return json({ error: "No posts provided" }, 400);
    }
    if (posts.length > 200) {
      return json({ error: "Max 200 posts per request" }, 400);
    }

    for (const p of posts) {
      if (!p.user_id || !p.media_url) {
        return json(
          { error: "Each post requires user_id and media_url" },
          400,
        );
      }
    }

    // 3. Insert with service role (bypasses RLS)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const rows = posts.map((p) => ({
      user_id: p.user_id,
      media_url: p.media_url,
      media_type: p.media_type ?? "image",
      caption: p.caption ?? null,
      hashtags: p.hashtags ?? [],
      location: p.location ?? null,
      post_category: p.post_category ?? "reel",
      is_seed_post: true,
      ai_validated: true,
      like_count: p.like_count ?? Math.floor(Math.random() * 280) + 20,
      comment_count: p.comment_count ?? Math.floor(Math.random() * 35) + 3,
      created_at: p.created_at ?? new Date().toISOString(),
    }));

    const { data, error } = await admin.from("posts").insert(rows).select("id");
    if (error) {
      console.error("Service role insert error:", JSON.stringify(error));
      return json({ error: error.message }, 500);
    }

    return json({ inserted: data?.length ?? 0, ids: data }, 200);
  } catch (e) {
    console.error("Unexpected error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
