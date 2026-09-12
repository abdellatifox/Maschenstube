import type { APIRoute } from 'astro';
import { bump, getStats, rateLimit, visitorHash, json, bad } from '../../../lib/cf';

export const prerender = false;

/** GET /api/stats/:slug → إحصاءات الباترون من D1 */
export const GET: APIRoute = async (ctx) => {
  const slug = ctx.params.slug ?? '';
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) return bad('Invalid slug.');
  return json({ ok: true, ...(await getStats(ctx, slug)) });
};

/** POST /api/stats/:slug → يسجّل مشاهدة (مرة واحدة كل 6 ساعات لكل زائر) ثم يعيد الإحصاءات */
export const POST: APIRoute = async (ctx) => {
  const slug = ctx.params.slug ?? '';
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) return bad('Invalid slug.');

  const who = await visitorHash(ctx.request, 'view');
  if (await rateLimit(ctx, `view:${who}:${slug}`, 1, 21600)) {
    await bump(ctx, slug, 'views');
  }
  return json({ ok: true, ...(await getStats(ctx, slug)) });
};
