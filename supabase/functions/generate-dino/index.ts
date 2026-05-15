import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
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

    const createRes = await fetch(
      'https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'wait',
        },
        body: JSON.stringify({
          input: {
            prompt,
            go_fast: true,
            num_outputs: 1,
            aspect_ratio: '1:1',
            output_format: 'jpg',
            output_quality: 90,
          },
        }),
      }
    );

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

    const imageUrl = Array.isArray(pred.output) ? pred.output[0] : pred.output;
    return new Response(JSON.stringify({ imageUrl }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
