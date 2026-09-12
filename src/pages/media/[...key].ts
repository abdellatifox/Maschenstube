import type { APIRoute } from 'astro';
import { getMedia, bad } from '../../lib/cf';

export const prerender = false;

/**
 * GET /media/<key>
 * وكيل قراءة عام لحاوية R2 (صور الباترونات)، مع كاش حافة طويل و ETag.
 * إن ربطت نطاقًا مخصّصًا بالحاوية ضع رابطه في PUBLIC_R2_URL واستغنِ عن هذا المسار.
 */
export const GET: APIRoute = async (ctx) => {
  const key = (ctx.params.key ?? '').replace(/^\/+/, '');
  if (!key || key.includes('..')) return bad('Invalid key.', 400);

  const bucket = getMedia(ctx);
  if (!bucket) return bad('Storage unavailable.', 503);

  // 304 مبكّر عبر ETag دون تحميل الجسم
  const ifNoneMatch = ctx.request.headers.get('if-none-match');
  if (ifNoneMatch) {
    const head = await bucket.head(key);
    if (head && head.httpEtag === ifNoneMatch) {
      return new Response(null, {
        status: 304,
        headers: { etag: head.httpEtag, 'cache-control': 'public, max-age=31536000, immutable' },
      });
    }
  }

  const object = await bucket.get(key);
  if (!object) return bad('Not found.', 404);

  const headers = new Headers();
  headers.set('content-type', object.httpMetadata?.contentType ?? 'application/octet-stream');
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  // في وضع التطوير لا يمرّر الوكيل المحلي التدفّقات، فنقرأ الملف كاملًا
  const payload = import.meta.env.DEV ? await object.arrayBuffer() : object.body;
  return new Response(payload, { headers });
};
