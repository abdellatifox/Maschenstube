import type { APIRoute } from 'astro';
import { getDB, rateLimit, json, bad, visitorHash } from '../../lib/cf';

export const prerender = false;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/**
 * POST /api/newsletter
 * يكتب المشترك في D1 مع حماية بـ KV rate-limit وفخ للبوتات.
 */
export const POST: APIRoute = async (ctx) => {
  let body: any;
  try {
    body = await ctx.request.json();
  } catch {
    return bad('Invalid request body.');
  }

  // فخ البوتات: الحقل المخفي يجب أن يبقى فارغًا
  if (body.website) return json({ ok: true, message: 'Thanks!' });

  const email = String(body.email ?? '').trim().toLowerCase();
  const source = String(body.source ?? 'site').slice(0, 60);
  const name = body.name ? String(body.name).slice(0, 80) : null;

  if (!EMAIL.test(email) || email.length > 160) return bad('Please enter a valid email address.');

  // KV — حدّ 5 محاولات لكل 10 دقائق لكل زائر
  const who = await visitorHash(ctx.request, 'newsletter');
  if (!(await rateLimit(ctx, `nl:${who}`, 5, 600))) {
    return bad('Too many attempts. Please try again later.', 429);
  }

  const db = getDB(ctx);
  if (!db) return bad('Database unavailable.', 503);

  const token = crypto.randomUUID();

  try {
    const res = await db
      .prepare(
        `INSERT INTO subscribers (email, name, source, token)
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(email) DO UPDATE SET status = 'active'
         RETURNING id`,
      )
      .bind(email, name, source, token)
      .first<{ id: number }>();

    return json({
      ok: true,
      id: res?.id ?? null,
      message: 'You are in! Look out for the next Sunday Stitch.',
    });
  } catch (err) {
    console.error('newsletter insert failed', err);
    return bad('Could not save your subscription right now.', 500);
  }
};

/** GET /api/newsletter?token=… — إلغاء الاشتراك بنقرة واحدة */
export const GET: APIRoute = async (ctx) => {
  const token = new URL(ctx.request.url).searchParams.get('token');
  if (!token) return bad('Missing token.');

  const db = getDB(ctx);
  if (!db) return bad('Database unavailable.', 503);

  await db.prepare("UPDATE subscribers SET status = 'unsubscribed' WHERE token = ?").bind(token).run();
  return new Response('You have been unsubscribed. Sorry to see you go!', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
