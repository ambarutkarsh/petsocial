import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "petosauras@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { error: json({ error: "Missing Authorization header" }, 401) };
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  const email = data.user?.email?.toLowerCase() ?? "";
  if (error || !data.user) return { error: json({ error: "Invalid auth token" }, 401) };
  if (!ADMIN_EMAILS.includes(email)) return { error: json({ error: "Forbidden: not an admin" }, 403) };
  return { user: data.user };
}

async function exactCount(client: ReturnType<typeof createClient>, table: string, apply?: (q: any) => any) {
  let query = client.from(table).select("id", { count: "exact", head: true });
  if (apply) query = apply(query);
  const { count, error } = await query;
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const body = await req.json().catch(() => ({}));
    const action = body?.action ?? "stats";
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (action === "seed-users") {
      const { data, error } = await admin
        .from("profiles")
        .select("id, username")
        .eq("is_seed_user", true)
        .order("username", { ascending: true });
      if (error) return json({ error: error.message }, 500);
      return json({ seedUsers: data ?? [] });
    }

    if (action === "seed-status") {
      const [seedUsers, seedPosts] = await Promise.all([
        exactCount(admin, "profiles", (q) => q.eq("is_seed_user", true)),
        exactCount(admin, "posts", (q) => q.eq("is_seed_post", true)),
      ]);
      return json({ seedUsers, seedPosts });
    }

    if (action === "recent") {
      const { data: profiles, error } = await admin
        .from("profiles")
        .select("id, full_name, city, created_at, is_seed_user")
        .or("is_seed_user.is.null,is_seed_user.eq.false")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) return json({ error: error.message }, 500);
      const ids = (profiles ?? []).map((p: any) => p.id);
      const { data: pets } = ids.length
        ? await admin.from("pets").select("owner_id, name").in("owner_id", ids)
        : { data: [] as any[] };
      const petByOwner = new Map<string, string>();
      (pets ?? []).forEach((p: any) => { if (!petByOwner.has(p.owner_id)) petByOwner.set(p.owner_id, p.name); });
      return json({ recent: (profiles ?? []).map((p: any) => ({ ...p, pet: petByOwner.get(p.id) ?? "—" })) });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [users, posts, seedUsers, seedPosts, vets, verifiedVets, bookings, competitions] = await Promise.all([
      exactCount(admin, "profiles"),
      exactCount(admin, "posts"),
      exactCount(admin, "profiles", (q) => q.eq("is_seed_user", true)),
      exactCount(admin, "posts", (q) => q.eq("is_seed_post", true)),
      exactCount(admin, "vets", (q) => q.eq("is_active", true)),
      exactCount(admin, "vets", (q) => q.eq("is_verified", true)),
      exactCount(admin, "vet_bookings", (q) => q.gte("created_at", sevenDaysAgo)),
      exactCount(admin, "competitions"),
    ]);

    return json({
      users,
      posts,
      seedUsers,
      seedPosts,
      realUsers: Math.max(0, users - seedUsers),
      realPosts: Math.max(0, posts - seedPosts),
      vets,
      verifiedVets,
      bookings,
      competitions,
      source: "service-role-edge-function",
    });
  } catch (e) {
    console.error("admin-dashboard-stats error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
