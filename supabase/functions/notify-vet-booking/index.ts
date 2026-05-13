// Send WhatsApp (Interakt) + email (Resend) notifications to vet on new booking
// and log every delivery attempt to public.vet_notifications for audit + retry.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Channel = "whatsapp" | "email";

function backoffSeconds(attempts: number) {
  // 1m, 5m, 15m, 1h, 6h
  const ladder = [60, 300, 900, 3600, 21600];
  return ladder[Math.min(attempts, ladder.length - 1)];
}

async function sendWhatsapp(
  apiKey: string,
  toNumber: string,
  text: string,
): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch("https://api.interakt.ai/v1/public/message/", {
    method: "POST",
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/json",
    },
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

async function sendEmail(
  apiKey: string,
  to: string,
  subject: string,
  html: string,
): Promise<{ ok: boolean; status: number; body: any }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Petosauras <noreply@petosauras.com>",
      to,
      subject,
      html,
    }),
  });
  let body: any = null;
  try { body = await res.json(); } catch { body = await res.text().catch(() => null); }
  return { ok: res.ok, status: res.status, body };
}

/**
 * Attempt a single delivery and write/update a row in vet_notifications.
 * If `existingId` is provided, the existing row is updated (used by retry).
 */
async function attemptDelivery(
  admin: any,
  opts: {
    existingId?: string;
    vetId: string;
    bookingId: string | null;
    channel: Channel;
    recipient: string;
    subject?: string;
    message: string;
    html?: string;
  },
) {
  const apiKey =
    opts.channel === "whatsapp"
      ? Deno.env.get("INTERAKT_API_KEY")
      : Deno.env.get("RESEND_API_KEY");

  // Read existing attempts if we are retrying
  let prevAttempts = 0;
  let maxAttempts = 5;
  if (opts.existingId) {
    const { data } = await admin
      .from("vet_notifications")
      .select("attempts, max_attempts")
      .eq("id", opts.existingId)
      .maybeSingle();
    prevAttempts = data?.attempts ?? 0;
    maxAttempts = data?.max_attempts ?? 5;
  }

  const nowIso = new Date().toISOString();

  if (!apiKey) {
    const row = {
      vet_id: opts.vetId,
      booking_id: opts.bookingId,
      channel: opts.channel,
      recipient: opts.recipient,
      subject: opts.subject ?? null,
      message: opts.message,
      payload: { html: opts.html ?? null },
      status: "failed",
      last_error: `Missing ${opts.channel === "whatsapp" ? "INTERAKT_API_KEY" : "RESEND_API_KEY"}`,
      attempts: prevAttempts + 1,
      max_attempts: maxAttempts,
      last_attempt_at: nowIso,
      next_retry_at: new Date(
        Date.now() + backoffSeconds(prevAttempts) * 1000,
      ).toISOString(),
    };
    if (opts.existingId) {
      await admin.from("vet_notifications").update(row).eq("id", opts.existingId);
    } else {
      await admin.from("vet_notifications").insert(row);
    }
    return { ok: false, error: row.last_error };
  }

  let result: { ok: boolean; status: number; body: any };
  try {
    result =
      opts.channel === "whatsapp"
        ? await sendWhatsapp(apiKey, opts.recipient, opts.message)
        : await sendEmail(
            apiKey,
            opts.recipient,
            opts.subject ?? "Petosauras notification",
            opts.html ?? opts.message,
          );
  } catch (e: any) {
    result = { ok: false, status: 0, body: { error: e?.message ?? String(e) } };
  }

  const newAttempts = prevAttempts + 1;
  const isDead = !result.ok && newAttempts >= maxAttempts;

  const row: Record<string, unknown> = {
    vet_id: opts.vetId,
    booking_id: opts.bookingId,
    channel: opts.channel,
    recipient: opts.recipient,
    subject: opts.subject ?? null,
    message: opts.message,
    payload: { html: opts.html ?? null },
    provider_response: { status: result.status, body: result.body },
    status: result.ok ? "sent" : isDead ? "dead" : "failed",
    attempts: newAttempts,
    max_attempts: maxAttempts,
    last_attempt_at: nowIso,
    last_error: result.ok ? null : `HTTP ${result.status}`,
    delivered_at: result.ok ? nowIso : null,
    next_retry_at:
      result.ok || isDead
        ? null
        : new Date(Date.now() + backoffSeconds(newAttempts - 1) * 1000).toISOString(),
  };

  if (opts.existingId) {
    await admin.from("vet_notifications").update(row).eq("id", opts.existingId);
  } else {
    await admin.from("vet_notifications").insert(row);
  }

  return { ok: result.ok, error: result.ok ? null : `HTTP ${result.status}` };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { booking_id } = await req.json();
    if (!booking_id) {
      return new Response(JSON.stringify({ error: "booking_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking, error: bErr } = await supabase
      .from("vet_bookings")
      .select(
        "id, booking_reference, reason_for_visit, symptoms, is_emergency, vet_id, user_id, pet_id, slot_id",
      )
      .eq("id", booking_id)
      .single();
    if (bErr || !booking) throw new Error(bErr?.message ?? "booking missing");

    const [{ data: vet }, { data: pet }, { data: owner }, { data: slot }] =
      await Promise.all([
        supabase
          .from("vets")
          .select("id, full_name, email, whatsapp_number, clinic_name, clinic_address")
          .eq("id", booking.vet_id)
          .single(),
        booking.pet_id
          ? supabase.from("pets").select("name, species, pet_type").eq("id", booking.pet_id).single()
          : Promise.resolve({ data: null }),
        supabase.from("profiles").select("full_name").eq("id", booking.user_id).single(),
        supabase.from("vet_slots").select("slot_date, start_time").eq("id", booking.slot_id).single(),
      ]);

    if (!vet) throw new Error("vet missing");

    const symptomsLine =
      booking.symptoms && booking.symptoms.length
        ? `Symptoms: ${booking.symptoms.join(", ")}\n`
        : "";
    const emergencyLine = booking.is_emergency ? "⚡ EMERGENCY — Priority appointment\n" : "";

    const text = `🐾 *New Petosauras Booking*

Reference: ${booking.booking_reference}
Pet: ${pet?.name ?? "—"} (${pet?.species ?? pet?.pet_type ?? "—"})
Owner: ${owner?.full_name ?? "Pet parent"}
Date: ${slot?.slot_date} at ${slot?.start_time}
Reason: ${booking.reason_for_visit ?? "—"}
${symptomsLine}${emergencyLine}
Reply *1* to CONFIRM
Reply *2* to RESCHEDULE
Reply *3* to CANCEL

Manage via your dashboard:
https://petosauras.com/vet-dashboard`;

    const html = text.replace(/\*([^*]+)\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");
    const subject = `🐾 New booking · ${booking.booking_reference}`;

    let waResult: any = { ok: false, error: "no_recipient" };
    let emailResult: any = { ok: false, error: "no_recipient" };

    if (vet.whatsapp_number) {
      waResult = await attemptDelivery(supabase, {
        vetId: vet.id,
        bookingId: booking.id,
        channel: "whatsapp",
        recipient: vet.whatsapp_number,
        message: text,
      });
    }
    if (vet.email) {
      emailResult = await attemptDelivery(supabase, {
        vetId: vet.id,
        bookingId: booking.id,
        channel: "email",
        recipient: vet.email,
        subject,
        message: text,
        html,
      });
    }

    // User confirmation notification (best-effort, in-app)
    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      type: "booking",
      title: "Booking request sent to vet",
      body: `Dr. ${vet.full_name} will confirm your appointment within 2 hours.`,
      is_read: false,
    });

    return new Response(
      JSON.stringify({ ok: true, whatsapp: waResult, email: emailResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Re-export the helper so the retry function can import the same logic
export { attemptDelivery };
