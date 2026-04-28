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

interface ReqBody {
  action: "create" | "update" | "delete" | "list";
  id?: string;
  values?: Record<string, unknown>;
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
    const callerId = userData.user.id;
    const email = (userData.user.email ?? "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) return json({ error: "Forbidden: not an admin" }, 403);

    const body = (await req.json().catch(() => null)) as ReqBody | null;
    if (!body?.action) return json({ error: "Missing action" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    if (body.action === "list") {
      const { data, error } = await admin
        .from("competitions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return json({ error: error.message }, 500);
      return json({ data }, 200);
    }

    if (body.action === "create") {
      const v = body.values ?? {};
      const { data, error } = await admin
        .from("competitions")
        .insert({ ...v, created_by: callerId })
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ data }, 200);
    }

    if (body.action === "update") {
      if (!body.id) return json({ error: "Missing id" }, 400);
      const { data, error } = await admin
        .from("competitions")
        .update(body.values ?? {})
        .eq("id", body.id)
        .select()
        .single();
      if (error) return json({ error: error.message }, 500);
      return json({ data }, 200);
    }

    if (body.action === "delete") {
      if (!body.id) return json({ error: "Missing id" }, 400);
      const { error, count } = await admin
        .from("competitions")
        .delete({ count: "exact" })
        .eq("id", body.id);
      if (error) return json({ error: error.message }, 500);
      return json({ deleted: count ?? 0 }, 200);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("admin-competitions error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
