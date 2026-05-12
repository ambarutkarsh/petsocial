// Atomic vet booking creation with race-condition protection.
// Validates auth, slot availability, and ownership before inserting a booking.
// On success returns booking_id + booking_reference and triggers vet notification.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SLOT_TAKEN_MESSAGE =
  "This slot has just been booked. Please choose another slot.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } =
      await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const {
      slot_id,
      vet_id,
      pet_id,
      reason_for_visit,
      symptoms,
      share_health_records,
      user_notes,
    } = body ?? {};

    if (!slot_id || !vet_id) {
      return json({ error: "slot_id and vet_id are required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Fetch slot
    const { data: slot, error: slotErr } = await admin
      .from("vet_slots")
      .select("id, vet_id, status, locked_by, locked_at, is_emergency, consultation_type")
      .eq("id", slot_id)
      .maybeSingle();
    if (slotErr) throw slotErr;
    if (!slot) return json({ error: "Slot not found" }, 404);
    if (slot.vet_id !== vet_id) return json({ error: "Slot/vet mismatch" }, 400);

    const lockedRecently =
      slot.locked_at &&
      Date.now() - new Date(slot.locked_at).getTime() < 5 * 60 * 1000;

    // Slot must be available, OR locked-by-this-user-and-still-fresh
    const ok =
      slot.status === "available" ||
      (slot.status === "locked" &&
        slot.locked_by === userId &&
        lockedRecently);

    if (!ok) {
      return json({ error: SLOT_TAKEN_MESSAGE }, 409);
    }

    // 2. Atomic claim: flip slot to pending_vet_confirmation only if currently
    // available OR locked by this user. The WHERE clause guards against races.
    const { data: claimedRows, error: claimErr } = await admin
      .from("vet_slots")
      .update({
        status: "pending_vet_confirmation",
        locked_by: userId,
        locked_at: new Date().toISOString(),
      })
      .eq("id", slot_id)
      .in("status", ["available", "locked"])
      .or(`locked_by.is.null,locked_by.eq.${userId}`)
      .select("id");
    if (claimErr) throw claimErr;
    if (!claimedRows || claimedRows.length === 0) {
      return json({ error: SLOT_TAKEN_MESSAGE }, 409);
    }

    // 3. Insert booking. Unique partial index protects from races at the DB level.
    const { data: booking, error: bookErr } = await admin
      .from("vet_bookings")
      .insert({
        slot_id,
        vet_id,
        user_id: userId,
        pet_id: pet_id ?? null,
        consultation_type: slot.consultation_type ?? "in_clinic",
        is_emergency: !!slot.is_emergency,
        status: "pending_vet_confirmation",
        reason_for_visit: reason_for_visit ?? null,
        symptoms: Array.isArray(symptoms) ? symptoms : [],
        share_health_records: !!share_health_records,
        user_notes: user_notes ?? null,
      })
      .select("id, booking_reference")
      .single();

    if (bookErr) {
      // Roll slot back to available so it can be reused
      await admin
        .from("vet_slots")
        .update({ status: "available", locked_by: null, locked_at: null })
        .eq("id", slot_id);

      // Treat unique-violation as the slot-taken case
      if (bookErr.code === "23505") {
        return json({ error: SLOT_TAKEN_MESSAGE }, 409);
      }
      throw bookErr;
    }

    // 4. Fire notification (don't fail the booking if it errors)
    try {
      await admin.functions.invoke("notify-vet-booking", {
        body: { booking_id: booking.id },
      });
    } catch (_) {
      // logged on the function side
    }

    return json({
      ok: true,
      booking_id: booking.id,
      booking_reference: booking.booking_reference,
    });
  } catch (e: any) {
    return json({ error: e.message ?? "Booking failed" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
