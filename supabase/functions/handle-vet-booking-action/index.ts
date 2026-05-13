// Public endpoint hit by the Confirm/Reject buttons in the vet booking email.
// Security is via the per-booking action_token + expiry. No JWT required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { booking_id, token, action } = body ?? {};

    if (!booking_id || !token || !["confirm", "reject"].includes(action)) {
      return json({ error: "invalid_input" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: booking, error: bErr } = await admin
      .from("vet_bookings")
      .select(
        "id, booking_reference, action_token, action_token_expires_at, status, slot_id, user_id, vet_id",
      )
      .eq("id", booking_id)
      .maybeSingle();

    if (bErr || !booking) return json({ error: "not_found" }, 404);
    if (booking.action_token !== token) return json({ error: "invalid_token" }, 403);
    if (
      booking.action_token_expires_at &&
      new Date(booking.action_token_expires_at).getTime() < Date.now()
    ) {
      return json({ error: "expired_token" }, 410);
    }
    if (booking.status !== "pending_vet_confirmation") {
      return json({
        error: "already_handled",
        status: booking.status,
        booking_reference: booking.booking_reference,
      }, 409);
    }

    const nowIso = new Date().toISOString();

    if (action === "confirm") {
      await admin
        .from("vet_bookings")
        .update({
          status: "confirmed",
          confirmed_at: nowIso,
          vet_action_at: nowIso,
          vet_action_source: "email_link",
        })
        .eq("id", booking.id);
      await admin
        .from("vet_slots")
        .update({ status: "booked" })
        .eq("id", booking.slot_id);
      await admin.from("notifications").insert({
        user_id: booking.user_id,
        type: "booking_confirmed",
        title: "Your vet appointment is confirmed",
        body: `Your booking ${booking.booking_reference} has been confirmed by the vet.`,
        is_read: false,
      });
    } else {
      await admin
        .from("vet_bookings")
        .update({
          status: "rejected",
          cancelled_at: nowIso,
          cancelled_by: "vet",
          cancellation_reason: "Rejected by vet from email link",
          vet_action_at: nowIso,
          vet_action_source: "email_link",
        })
        .eq("id", booking.id);
      await admin
        .from("vet_slots")
        .update({ status: "available", locked_by: null, locked_at: null })
        .eq("id", booking.slot_id);
      await admin.from("notifications").insert({
        user_id: booking.user_id,
        type: "booking_rejected",
        title: "Your vet appointment was rejected",
        body: `Your booking ${booking.booking_reference} was rejected. Please select another slot.`,
        is_read: false,
      });
    }

    // Best-effort sheet status update
    const sheetUrl = Deno.env.get("GOOGLE_SHEET_LEDGER_WEBHOOK_URL");
    if (sheetUrl) {
      try {
        await fetch(sheetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            booking_reference: booking.booking_reference,
            status_update: action === "confirm" ? "confirmed" : "rejected",
            source: "email_link",
            updated_at: nowIso,
          }),
        });
      } catch (_) {
        // ignore — logged below
      }
    }
    await admin.from("vet_ledger_sync_logs").insert({
      booking_id: booking.id,
      status: sheetUrl ? "success" : "error",
      error: sheetUrl ? null : "missing_GOOGLE_SHEET_LEDGER_WEBHOOK_URL",
      payload: { type: "status_update", action, booking_reference: booking.booking_reference },
    });

    return json({
      ok: true,
      action,
      booking_reference: booking.booking_reference,
    });
  } catch (e: any) {
    return json({ error: e?.message ?? "failed" }, 500);
  }
});
