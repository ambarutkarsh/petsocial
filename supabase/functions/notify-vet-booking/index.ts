// Send WhatsApp (Interakt) + email (Resend direct fetch) notifications to vet on new booking
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Fetch booking + relations
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
          .select(
            "id, full_name, email, whatsapp_number, clinic_name, clinic_address",
          )
          .eq("id", booking.vet_id)
          .single(),
        booking.pet_id
          ? supabase
              .from("pets")
              .select("name, species, pet_type")
              .eq("id", booking.pet_id)
              .single()
          : Promise.resolve({ data: null }),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", booking.user_id)
          .single(),
        supabase
          .from("vet_slots")
          .select("slot_date, start_time")
          .eq("id", booking.slot_id)
          .single(),
      ]);

    if (!vet) throw new Error("vet missing");

    const symptomsLine =
      booking.symptoms && booking.symptoms.length
        ? `Symptoms: ${booking.symptoms.join(", ")}\n`
        : "";
    const emergencyLine = booking.is_emergency
      ? "⚡ EMERGENCY — Priority appointment\n"
      : "";

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

    const html = text
      .replace(/\*([^*]+)\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");

    let whatsappStatus = "skipped";
    let emailStatus = "skipped";

    // ─── WhatsApp via Interakt (scaffold) ───────────────────
    const INTERAKT_KEY = Deno.env.get("INTERAKT_API_KEY");
    if (INTERAKT_KEY && vet.whatsapp_number) {
      try {
        const res = await fetch(
          "https://api.interakt.ai/v1/public/message/",
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${INTERAKT_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              countryCode: "+91",
              phoneNumber: vet.whatsapp_number.replace(/^\+?91/, ""),
              type: "Text",
              data: { message: text },
            }),
          },
        );
        whatsappStatus = res.ok ? "sent" : `error_${res.status}`;
      } catch (e: any) {
        whatsappStatus = `error_${e.message}`;
      }
    }

    // ─── Email via Resend (direct fetch, no connector) ──────
    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (RESEND_KEY && vet.email) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Petosauras <noreply@petosauras.com>",
            to: vet.email,
            subject: `🐾 New booking · ${booking.booking_reference}`,
            html,
          }),
        });
        emailStatus = res.ok ? "sent" : `error_${res.status}`;
      } catch (e: any) {
        emailStatus = `error_${e.message}`;
      }
    }

    // Log to vet_notifications
    await supabase.from("vet_notifications").insert({
      vet_id: vet.id,
      booking_id: booking.id,
      channel:
        whatsappStatus === "sent"
          ? "whatsapp"
          : emailStatus === "sent"
            ? "email"
            : "none",
      message: text,
      status: `wa:${whatsappStatus}/email:${emailStatus}`,
    });

    // User confirmation notification
    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      type: "booking",
      title: "Booking request sent to vet",
      body: `Dr. ${vet.full_name} will confirm your appointment within 2 hours.`,
      is_read: false,
    });

    return new Response(
      JSON.stringify({ ok: true, whatsappStatus, emailStatus }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
