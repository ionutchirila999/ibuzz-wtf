import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { cooldownDecision, hashVisitor } from './form-guard';

const SERVICES = ['phones', 'cameras', 'screens', 'computers', 'electronics', 'scooters'] as const;
const input = z.object({ problem: z.string().trim().min(5).max(1000), lang: z.enum(['th', 'en', 'ro']) });
const output = z.object({ service: z.enum(SERVICES), reason: z.string(), details: z.array(z.string()).max(6) });
export type RepairSuggestion = z.infer<typeof output>;

const LANG = { th: 'Thai', en: 'English', ro: 'Romanian' } as const;

export const suggestRepair = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }): Promise<{ ok: true; suggestion: RepairSuggestion } | { ok: false; error: string }> => {
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { ok: false, error: 'config' };
    // Per-visitor rate limit: same shared table as the enquiry forms, so the
    // AI endpoint cannot be hammered to burn credits.
    const { getRequest } = await import('@tanstack/react-start/server');
    const req = getRequest();
    const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const visitor = await hashVisitor(process.env['SUPABASE_SERVICE_ROLE_KEY']!, `ai:${ip}`);
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const since = new Date(Date.now() - 3600_000).toISOString();
    const { data: recent } = await supabaseAdmin.from('enquiry_rate_limits').select('created_at').eq('visitor_hash', visitor).gte('created_at', since);
    if (cooldownDecision((recent ?? []).map((r) => new Date(r.created_at).getTime())) === 'cooldown') return { ok: false, error: 'busy' };
    await supabaseAdmin.from('enquiry_rate_limits').insert({ visitor_hash: visitor });
    const res = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'fetch', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        stream: true,
        store: false,
        reasoning: { effort: 'low' },
        instructions: `You help customers of iBuzz.wtf, an electronics repair shop. Pick the single best repair service: phones (smartphones), cameras (digital cameras/lenses), screens (TVs and monitors), computers (computers, laptops, tablets), electronics (other electronic devices and components), scooters (electric scooters and their electrical systems). Give a one-sentence reason and up to 5 short, specific details the customer should include in their enquiry (e.g. model, when it started, water damage, photos). Never quote prices, repair times or guarantee a fix. Reply in ${LANG[data.lang]}.`,
        input: [{ role: 'user', content: data.problem }],
        text: { format: { type: 'json_schema', name: 'repair_suggestion', strict: true, schema: {
          type: 'object', additionalProperties: false, required: ['service', 'reason', 'details'],
          properties: { service: { type: 'string', enum: [...SERVICES] }, reason: { type: 'string' }, details: { type: 'array', items: { type: 'string' } } },
        } } },
      }),
    });
    if (!res.ok || !res.body) {
      console.error('AI gateway', res.status, await res.text().catch(() => ''));
      return { ok: false, error: res.status === 429 ? 'busy' : res.status === 402 ? 'credits' : 'failed' };
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buf = '', text = '', refused = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += value;
      const lines = buf.split('\n'); buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === 'response.output_text.delta') text += ev.delta;
          if (ev.type === 'response.refusal.delta' || ev.type === 'response.failed') refused = true;
        } catch { /* partial */ }
      }
    }
    if (refused || !text) return { ok: false, error: 'failed' };
    const parsed = output.safeParse(JSON.parse(text));
    if (!parsed.success) return { ok: false, error: 'failed' };
    return { ok: true, suggestion: { ...parsed.data, details: parsed.data.details.slice(0, 5) } };
  });
