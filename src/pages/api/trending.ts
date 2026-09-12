import type { APIRoute } from 'astro';
import { getTrending, json } from '../../lib/cf';

export const prerender = false;

/** GET /api/trending?limit=5 → استعلام D1 مخزَّن في KV لعشر دقائق */
export const GET: APIRoute = async (ctx) => {
  const limit = Math.min(20, Math.max(1, Number(new URL(ctx.request.url).searchParams.get('limit') ?? 5)));
  const items = await getTrending(ctx, limit);
  return json({ ok: true, items }, { headers: { 'cache-control': 'public, max-age=300' } });
};
