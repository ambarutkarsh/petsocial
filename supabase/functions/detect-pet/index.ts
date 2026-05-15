import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { imageUrl } = await req.json();
    if (!imageUrl || typeof imageUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'imageUrl required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a pet identification expert. Identify the pet species and most likely breed from the image. Respond ONLY with strict JSON: {"species":"Dog|Cat|Bird|Rabbit|Hamster|Guinea Pig|Fish|Reptile|Tortoise|Ferret|Chinchilla|Hedgehog|Sugar Glider|Small Mammal|Unknown","breed":"<specific breed name or Generic Pet>","confidence":0.0-1.0}. No prose, no code fences.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Identify this pet.' },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      return new Response(JSON.stringify({ error: 'detection failed', detail }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    let text: string = data?.choices?.[0]?.message?.content || '';
    text = text.replace(/```json|```/g, '').trim();
    const m = text.match(/\{[\s\S]*\}/);
    let parsed: any = null;
    if (m) { try { parsed = JSON.parse(m[0]); } catch { /* noop */ } }
    if (!parsed) parsed = { species: 'Unknown', breed: 'Generic Pet', confidence: 0 };

    return new Response(JSON.stringify({
      species: String(parsed.species || 'Unknown'),
      breed: String(parsed.breed || 'Generic Pet'),
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0)),
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
