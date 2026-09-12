import type { APIRoute } from 'astro';
import { bump, getStats, rateLimit, visitorHash, json, bad } from '../../lib/cf';

export const prerender = false;

/** POST /api/like  { slug }  → يزيد الإعجابات في D1 */
export const POST: APIRoute = async (ctx) => {
  let slug = '';
  try {
    slug = String((await ctx.request.json<any>()).slug ?? '');
  } catch {
    return bad('Invalid body.');
  }
  if (!/^[a-z0-9-]{2,120}$/.test(slug)) return bad('Invalid slug.');

  const who = await visitorHash(ctx.request, 'like');
  if (!(await rateLimit(ctx, `like:${who}:${slug}`, 1, 86400))) {
    const current = await getStats(ctx, slug);
    return json({ ok: true, likes: current.likes, already: true });
  }

  const likes = await bump(ctx, slug, 'likes');
  return json({ ok: true, likes });
};
