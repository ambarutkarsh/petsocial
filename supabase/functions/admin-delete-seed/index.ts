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

const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "petosauras@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Invalid auth token" }, 401);
    const email = (userData.user.email ?? "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) return json({ error: "Forbidden: not an admin" }, 403);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Find all seed user ids
    const { data: seedProfiles, error: selErr } = await admin
      .from("profiles")
      .select("id")
      .eq("is_seed_user", true);
    if (selErr) return json({ error: selErr.message }, 500);

    const ids = (seedProfiles ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return json({ deleted: 0, message: "No seed users to delete" }, 200);

    const results: Record<string, number | string> = {};
    const tables: Array<[string, string]> = [
      ["post_comments", "user_id"],
      ["post_likes", "user_id"],
      ["follows", "follower_id"],
      ["follows", "following_id"],
      ["stories", "user_id"],
      ["posts", "user_id"],
      ["pets", "owner_id"],
      ["profiles", "id"],
    ];

    for (const [table, col] of tables) {
      const { error, count } = await admin
        .from(table)
        .delete({ count: "exact" })
        .in(col, ids);
      results[`${table}.${col}`] = error ? `ERROR: ${error.message}` : (count ?? 0);
    }

    return json({ deleted_users: ids.length, details: results }, 200);
  } catch (e) {
    console.error("admin-delete-seed error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
