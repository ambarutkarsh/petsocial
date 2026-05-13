// Re-attempt failed vet notification deliveries.
// Picks up rows in vet_notifications where status='failed' AND next_retry_at <= now()
// AND attempts < max_attempts. Designed to be called by a cron job, an admin
// "Retry now" button, or invoked with { id } / { booking_id } to target specific rows.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BACKOFF = [60, 300, 900, 3600, 21600];
const backoffSeconds = (a: number) => BACKOFF[Math.min(a, BACKOFF.length - 1)];

async function sendWhatsapp(apiKey: string, toNumber: string, text: string) {
  const res = await fetch("https://api.interakt.ai/v1/public/message/", {
    method: "POST",
    headers: { Authorization: `Basic ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      countryCode: "+91",
      phoneNumber: toNumber.replace(/^\+?91/, ""),
      type: "Text",
      data: { message: text },
    }),
  });
  let body: any = null;
  try { body = await res.json(); } catch { body = await res.text().catch(() => null); }
  return { ok: res.ok, status: res.status, body };
}
async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Petosauras <noreply@petosauras.com>",
      to, subject, html,
    }),
  });
  let body: any = null;
  try { body = await res.json(); } catch { body = await res.text().catch(() => null); }
  return { ok: res.ok, status: res.status, body };
}

async function retryRow(admin: any, row: any) {
  const apiKey =
    row.channel === "whatsapp"
      ? Deno.env.get("INTERAKT_API_KEY")
      : Deno.env.get("RESEND_API_KEY");

  const nowIso = new Date().toISOString();
  const newAttempts = (row.attempts ?? 0) + 1;
  const isDead = newAttempts >= (row.max_attempts ?? 5);

  if (!apiKey) {
    await admin.from("vet_notifications").update({
      status: isDead ? "dead" : "failed",
      attempts: newAttempts,
      last_attempt_at: nowIso,
      last_error: `Missing API key for ${row.channel}`,
      next_retry_at: isDead
        ? null
        : new Date(Date.now() + backoffSeconds(newAttempts - 1) * 1000).toISOString(),
    }).eq("id", row.id);
    return { id: row.id, ok: false, error: "missing_key" };
  }

  let result: { ok: boolean; status: number; body: any };
  try {
    if (row.channel === "whatsapp") {
      result = await sendWhatsapp(apiKey, row.recipient, row.message);
    } else {
      const html =
        (row.payload?.html as string | undefined) ??
        row.message.replace(/\n/g, "<br/>");
      result = await sendEmail(
        apiKey,
        row.recipient,
        row.subject ?? "Petosauras notification",
        html,
      );
    }
  } catch (e: any) {
    result = { ok: false, status: 0, body: { error: e?.message ?? String(e) } };
  }

  const dead = !result.ok && newAttempts >= (row.max_attempts ?? 5);

  await admin.from("vet_notifications").update({
    status: result.ok ? "sent" : dead ? "dead" : "failed",
    attempts: newAttempts,
    last_attempt_at: nowIso,
    last_error: result.ok ? null : `HTTP ${result.status}`,
    delivered_at: result.ok ? nowIso : null,
    provider_response: { status: result.status, body: result.body },
    next_retry_at:
      result.ok || dead
        ? null
        : new Date(Date.now() + backoffSeconds(newAttempts - 1) * 1000).toISOString(),
  }).eq("id", row.id);

  return { id: row.id, ok: result.ok, status: result.status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const { id, booking_id, limit = 25 } = body ?? {};

    let q = admin
      .from("vet_notifications")
      .select("id, vet_id, booking_id, channel, recipient, subject, message, payload, attempts, max_attempts, status")
      .eq("status", "failed")
      .lt("attempts", 5)
      .order("next_retry_at", { ascending: true, nullsFirst: true })
      .limit(Math.min(Number(limit) || 25, 100));

    if (id) q = admin
      .from("vet_notifications")
      .select("id, vet_id, booking_id, channel, recipient, subject, message, payload, attempts, max_attempts, status")
      .eq("id", id);
    else if (booking_id) q = q.eq("booking_id", booking_id);
    else q = q.lte("next_retry_at", new Date().toISOString());

    const { data: rows, error } = await q;
    if (error) throw error;

    const results = [];
    for (const row of rows ?? []) {
      results.push(await retryRow(admin, row));
    }

    return new Response(
      JSON.stringify({ ok: true, processed: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
