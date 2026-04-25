// Send invitation email to a newly-created vet
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
    const { email, full_name } = await req.json();
    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: "email & full_name required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_KEY) {
      return new Response(
        JSON.stringify({ ok: false, message: "RESEND_API_KEY not set; skipped" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const html = `<p>Dr. ${full_name},</p>
<p>You have been invited to join <strong>Petosauras</strong>' verified vet network in Chennai.</p>
<p>Click below to set up your dashboard and start accepting appointments:</p>
<p><a href="https://petosauras.com/vet-dashboard" style="background:#7B5EA7;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Set Up My Dashboard</a></p>
<p>Sign up using this email address (${email}) and your dashboard will be linked automatically.</p>
<p>— The Petosauras team</p>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Petosauras <noreply@petosauras.com>",
        to: email,
        subject: "You're invited to join Petosauras as a verified vet",
        html,
      }),
    });

    return new Response(JSON.stringify({ ok: res.ok, status: res.status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
