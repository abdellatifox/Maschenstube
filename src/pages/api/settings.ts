import type { APIRoute } from 'astro';
import { getSetting, json } from '../../lib/cf';

export const prerender = false;

/**
 * GET /api/settings
 * إعدادات قابلة للتحرير مباشرة من Cloudflare KV دون إعادة بناء الموقع:
 *   wrangler kv key put --binding=SETTINGS announcement "New autumn collection is live"
 */
export const GET: APIRoute = async (ctx) => {
  const [announcement, featuredSlug, banner] = await Promise.all([
    getSetting(ctx, 'announcement'),
    getSetting(ctx, 'featured-slug'),
    getSetting(ctx, 'banner-cta'),
  ]);

  return json(
    { ok: true, announcement, featuredSlug, banner },
    { headers: { 'cache-control': 'public, max-age=60' } },
  );
};
