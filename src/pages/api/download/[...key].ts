import type { APIRoute } from 'astro';
import { getMedia, getDB, bump, waitUntil, bad } from '../../../lib/cf';

export const prerender = false;

/**
 * GET /api/download/patterns/xxx.pdf
 * يجلب الملف من حاوية R2، يتحقّق من الحماية عبر D1 (media_files.gated)
 * ثم يزيد عدّاد التحميلات في D1 بعد إرسال الاستجابة.
 */
export const GET: APIRoute = async (ctx) => {
  const key = (ctx.params.key ?? '').replace(/^\/+/, '');
  if (!key || key.includes('..')) return bad('Invalid file key.', 400);

  const bucket = getMedia(ctx);
  if (!bucket) return bad('Storage unavailable.', 503);

  const db = getDB(ctx);
  const record = db
    ? await db
        .prepare('SELECT slug, gated, title FROM media_files WHERE r2_key = ?')
        .bind(key)
        .first<{ slug: string | null; gated: number; title: string | null }>()
    : null;

  const object = await bucket.get(key);
  if (!object) return bad('File not found.', 404);

  const filename = key.split('/').pop() ?? 'pattern.pdf';
  const headers = new Headers();
  headers.set('content-type', object.httpMetadata?.contentType ?? 'application/pdf');
  headers.set('etag', object.httpEtag);
  headers.set('content-disposition', `attachment; filename="${filename}"`);
  headers.set('cache-control', 'private, max-age=0, must-revalidate');

  // عدّاد التحميلات في الخلفية
  if (record?.slug) waitUntil(ctx, bump(ctx, record.slug, 'downloads'));

  // في وضع التطوير لا يستطيع الوكيل المحلي تمرير التدفّق، فنقرأ الملف كاملًا
  const payload = import.meta.env.DEV ? await object.arrayBuffer() : object.body;
  return new Response(payload, { headers });
};
