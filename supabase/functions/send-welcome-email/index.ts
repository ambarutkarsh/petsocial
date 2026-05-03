// Send a one-time welcome email to a newly registered Petosauras user.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Petosauras <onboarding@resend.dev>";

const buildHtml = (firstName: string) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Welcome to Petosauras</title></head>
<body style="margin:0;padding:0;background:#FBF8F4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1E1B2E;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF8F4;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(123,94,167,0.08);">
<tr><td style="padding:28px 28px 8px;text-align:center;">
<img src="https://petosauras.com/petosauras-logo.png" alt="Petosauras 🦕" style="height:54px;object-fit:contain;" />
</td></tr>
<tr><td style="padding:8px 32px 0;">
<h1 style="margin:16px 0 8px;font-size:24px;color:#7B5EA7;">Hi ${firstName}, welcome to Petosauras 🦕🐾</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1E1B2E;">Your all-in-one pet hub built for every pet parent. Whether you have a dog, cat, fish, bird, rabbit, reptile, or any other companion — Petosauras helps you share moments, discover pet-friendly places, manage health records, and connect with other pet lovers.</p>
</td></tr>
<tr><td style="padding:8px 32px;">
${[
  ["📸","Share your pet's world","Post photos, videos and stories on a feed made just for pets."],
  ["📍","Discover NearBy pet places","Pet restaurants, spa & grooming, pet parks, boarding, pet shows, help stray and lost & found."],
  ["📋","Manage your pet's DigiLocker","Vaccination cards, hospital bills, prescriptions and important records in one place."],
  ["🏥","Track pet health","Log weight, food, vet visits and vaccines."],
  ["💬","Ask & help the community","Get support from other pet parents — walkers, groomers, vets and more."],
  ["🐾","Add your own listings","Help fellow pet parents by adding parks, boarding, grooming or stray help posts."],
].map(([e,h,d])=>`<table width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0;background:#FBF8F4;border-radius:12px;"><tr><td style="padding:12px 14px;font-size:22px;width:36px;vertical-align:top;">${e}</td><td style="padding:12px 14px 12px 0;"><div style="font-weight:700;font-size:15px;color:#1E1B2E;">${h}</div><div style="font-size:13px;color:#6B6880;line-height:1.5;">${d}</div></td></tr></table>`).join("")}
</td></tr>
<tr><td align="center" style="padding:20px 32px 8px;">
<a href="https://petosauras.com/profile" style="display:inline-block;background:#7B5EA7;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:700;font-size:15px;">Complete your pet profile</a>
</td></tr>
<tr><td align="center" style="padding:6px 32px 24px;">
<a href="https://petosauras.com/nearby" style="display:inline-block;background:#FF8C66;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;font-size:14px;">Explore NearBy</a>
</td></tr>
<tr><td style="padding:16px 32px 28px;border-top:1px solid #F0EAF7;text-align:center;font-size:12px;color:#6B6880;">
You are receiving this because you signed up on Petosauras.<br/>
Petosauras — Your All-in-One Pet Hub<br/>
<a href="https://petosauras.com" style="color:#7B5EA7;text-decoration:none;">petosauras.com</a>
</td></tr>
</table></td></tr></table></body></html>`;

const buildText = (firstName: string) => `Hi ${firstName},

Welcome to Petosauras — your all-in-one pet hub.

Here's what you can do:
- Share photos, videos and stories of your pet
- Discover pet restaurants, spa & grooming, pet parks, boarding, pet shows, help stray and lost & found
- Store pet records in DigiLocker
- Track weight, food, vaccines and vet visits
- Ask the community for help
- Add useful pet places and updates for other pet parents

Complete your pet profile: https://petosauras.com/profile
Explore NearBy: https://petosauras.com/nearby

Petosauras — Your All-in-One Pet Hub`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { user_id, preview, test, override_email } = await req.json().catch(() => ({}));
    if (!user_id || typeof user_id !== "string") {
      return new Response(JSON.stringify({ error: "user_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("id, full_name, email, welcome_email_sent")
      .eq("id", user_id)
      .maybeSingle();

    if (profErr) throw profErr;
    if (!profile) {
      return new Response(JSON.stringify({ error: "profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.welcome_email_sent && !test && !preview) {
      return new Response(JSON.stringify({ ok: true, skipped: "already_sent" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let email = (override_email as string | undefined) || (profile.email as string | null);
    if (!email) {
      const { data: u } = await admin.auth.admin.getUserById(user_id);
      email = u?.user?.email ?? null;
    }
    if (!email && !preview) {
      return new Response(JSON.stringify({ error: "no email on file" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = (profile.full_name || "there").split(" ")[0];
    const html = buildHtml(firstName);
    const text = buildText(firstName);
    const subject = "Welcome to Petosauras — your all-in-one pet hub 🦕🐾";

    if (preview) {
      return new Response(JSON.stringify({ ok: true, preview: true, to: email, subject, html, text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_KEY) {
      console.warn("[welcome] RESEND_API_KEY missing; skipping send");
      return new Response(JSON.stringify({ ok: false, error: "email_provider_not_configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM_EMAIL, to: email, subject, html, text }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[welcome] resend failed", res.status, body);
      return new Response(JSON.stringify({ ok: false, status: res.status, error: body }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!test) {
      await admin
        .from("profiles")
        .update({ welcome_email_sent: true, welcome_email_sent_at: new Date().toISOString() })
        .eq("id", user_id);
    }

    return new Response(JSON.stringify({ ok: true, sent: true, test: !!test, to: email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("[welcome] error", e);
    return new Response(JSON.stringify({ error: e.message ?? "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
