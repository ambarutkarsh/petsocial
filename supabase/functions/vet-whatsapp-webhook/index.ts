// Inbound WhatsApp webhook (Interakt-shaped).
// Parses replies "1" / "2" / "3" from a vet's WhatsApp number and updates the
// most recent pending booking accordingly.
//
// SECURITY: requires INTERAKT_WEBHOOK_SECRET header to match. If the secret is
// not configured the webhook responds 503 and stays inactive.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const expected = Deno.env.get("INTERAKT_WEBHOOK_SECRET");
  if (!expected) {
    return json({ ok: false, status: "inactive — INTERAKT_WEBHOOK_SECRET not set" }, 503);
  }
  const provided = req.headers.get("x-webhook-secret");
  if (provided !== expected) return json({ error: "forbidden" }, 403);

  try {
    const payload = await req.json().catch(() => ({}));
    // Interakt sample: { phoneNumber, countryCode, data: { message } }
    const phone =
      (payload.phoneNumber || payload.from || "").toString().replace(/\D/g, "");
    const text = (payload?.data?.message ?? payload?.message ?? "")
      .toString()
      .trim();

    if (!phone || !text) {
      return json({ error: "missing phone or message" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Find vet by whatsapp_number (last 10 digits match)
    const last10 = phone.slice(-10);
    const { data: vets } = await admin
      .from("vets")
      .select("id, full_name, whatsapp_number")
      .ilike("whatsapp_number", `%${last10}`);
    const vet = vets?.[0];
    if (!vet) return json({ error: "vet not found for number" }, 404);

    // Find most recent pending booking for this vet
    const { data: booking } = await admin
      .from("vet_bookings")
      .select("id, user_id, slot_id, booking_reference, status")
      .eq("vet_id", vet.id)
      .in("status", ["pending_vet_confirmation"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!booking) return json({ ok: true, note: "no pending booking" });

    const cmd = text.charAt(0);
    let userTitle = "";
    let userBody = "";

    if (cmd === "1") {
      await admin
        .from("vet_bookings")
        .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
        .eq("id", booking.id);
      await admin
        .from("vet_slots")
        .update({ status: "booked" })
        .eq("id", booking.slot_id);
      userTitle = "Your vet appointment is confirmed";
      userBody = `Dr. ${vet.full_name} confirmed booking ${booking.booking_reference}.`;
    } else if (cmd === "2") {
      await admin
        .from("vet_bookings")
        .update({ status: "reschedule_requested" })
        .eq("id", booking.id);
      userTitle = "Your vet asked to reschedule";
      userBody = `Dr. ${vet.full_name} requested rescheduling for booking ${booking.booking_reference}.`;
    } else if (cmd === "3") {
      await admin
        .from("vet_bookings")
        .update({
          status: "rejected",
          cancelled_at: new Date().toISOString(),
          cancelled_by: "vet",
          cancellation_reason: "Vet declined via WhatsApp",
        })
        .eq("id", booking.id);
      await admin
        .from("vet_slots")
        .update({ status: "available", locked_by: null, locked_at: null })
        .eq("id", booking.slot_id);
      userTitle = "Your vet appointment was declined";
      userBody = `Dr. ${vet.full_name} declined booking ${booking.booking_reference}. Please pick another slot.`;
    } else {
      return json({ ok: true, note: "unknown command" });
    }

    await admin.from("notifications").insert({
      user_id: booking.user_id,
      type: "booking",
      title: userTitle,
      body: userBody,
    });

    return json({ ok: true, action: cmd, booking_id: booking.id });
  } catch (e: any) {
    return json({ error: e.message ?? "webhook failed" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
