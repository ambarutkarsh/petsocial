// Generate vet_slots for next 30 days based on vet_availability
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}:00`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { vet_id, days = 30 } = await req.json();
    if (!vet_id) {
      return new Response(JSON.stringify({ error: "vet_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch availability rows
    const { data: availability } = await supabase
      .from("vet_availability")
      .select("*")
      .eq("vet_id", vet_id)
      .eq("is_active", true);

    if (!availability || availability.length === 0) {
      return new Response(
        JSON.stringify({ generated: 0, message: "no availability set" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Delete existing future AVAILABLE slots only (keep booked/locked)
    const today = new Date().toISOString().slice(0, 10);
    await supabase
      .from("vet_slots")
      .delete()
      .eq("vet_id", vet_id)
      .gte("slot_date", today)
      .eq("status", "available");

    // Build slots for next N days
    const rows: any[] = [];
    for (let d = 0; d < days; d++) {
      const date = new Date();
      date.setDate(date.getDate() + d);
      const dow = date.getDay(); // 0=Sun
      const dateStr = date.toISOString().slice(0, 10);

      const dayAvail = availability.filter((a) => a.day_of_week === dow);
      for (const a of dayAvail) {
        let cur = a.start_time;
        while (cur < a.end_time) {
          const next = addMinutes(cur, a.slot_duration_minutes);
          if (next > a.end_time) break;
          rows.push({
            vet_id,
            slot_date: dateStr,
            start_time: cur,
            end_time: next,
            consultation_type: a.consultation_type ?? "in_clinic",
            status: "available",
            is_emergency: false,
          });
          cur = next;
        }
      }
    }

    if (rows.length > 0) {
      // Insert in chunks of 500
      for (let i = 0; i < rows.length; i += 500) {
        const chunk = rows.slice(i, i + 500);
        await supabase.from("vet_slots").insert(chunk);
      }
    }

    return new Response(JSON.stringify({ generated: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
