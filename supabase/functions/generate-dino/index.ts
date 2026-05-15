import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ADMIN_EMAIL = 'ambarutkarsh@gmail.com';
const USER_LIMIT = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt, imageUrl } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'prompt required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = Deno.env.get('REPLICATE_API_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({ error: 'REPLICATE_API_TOKEN not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ---- Auth + usage limit ----
    const authHeader = req.headers.get('Authorization');
    const supaUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    let userId: string | null = null;
    let userEmail: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const userClient = createClient(supaUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const jwt = authHeader.replace('Bearer ', '');
      const { data, error } = await userClient.auth.getClaims(jwt);
      if (!error && data?.claims) {
        userId = data.claims.sub as string;
        userEmail = (data.claims.email as string) || null;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'auth_required', message: 'Login required to generate' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supaUrl, serviceKey);
    const isAdmin = userEmail?.toLowerCase() === ADMIN_EMAIL;

    if (!isAdmin) {
      const { data: usage } = await admin
        .from('dinofy_usage')
        .select('generation_count')
        .eq('user_id', userId)
        .maybeSingle();
      const count = usage?.generation_count ?? 0;
      if (count >= USER_LIMIT) {
        return new Response(
          JSON.stringify({ error: 'limit_reached', count, limit: USER_LIMIT }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
      }
    }

    // ---- Replicate generation ----
    const useKontext = !!imageUrl && typeof imageUrl === 'string';
    const modelUrl = useKontext
      ? 'https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions'
      : 'https://api.replicate.com/v1/models/black-forest-labs/flux-dev/predictions';

    const input: Record<string, unknown> = useKontext
      ? { prompt, input_image: imageUrl, aspect_ratio: '1:1', output_format: 'png', safety_tolerance: 2 }
      : { prompt, go_fast: false, num_outputs: 1, aspect_ratio: '1:1', output_format: 'png', output_quality: 100 };

    const createRes = await fetch(modelUrl, {
      method: 'POST',
      headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json', Prefer: 'wait' },
      body: JSON.stringify({ input }),
    });

    if (!createRes.ok) {
      const txt = await createRes.text();
      return new Response(JSON.stringify({ error: 'replicate create failed', detail: txt }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let pred = await createRes.json();
    const id = pred.id;
    const started = Date.now();
    while (pred.status !== 'succeeded' && pred.status !== 'failed' && pred.status !== 'canceled') {
      if (Date.now() - started > 55000) break;
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: { Authorization: `Token ${token}` },
      });
      pred = await poll.json();
    }

    if (pred.status !== 'succeeded') {
      return new Response(JSON.stringify({ error: 'generation failed', status: pred.status, detail: pred.error }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const out = Array.isArray(pred.output) ? pred.output[0] : pred.output;

    // ---- Increment usage on success ----
    let newCount = 0;
    if (!isAdmin) {
      const { data: existing } = await admin
        .from('dinofy_usage')
        .select('generation_count')
        .eq('user_id', userId)
        .maybeSingle();
      newCount = (existing?.generation_count ?? 0) + 1;
      await admin.from('dinofy_usage').upsert(
        {
          user_id: userId,
          email: userEmail,
          generation_count: newCount,
          last_generated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    }

    return new Response(JSON.stringify({ imageUrl: out, count: newCount, limit: USER_LIMIT, isAdmin }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
