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
    return bad('Ungültige Anfrage.');
  }

  // فخ البوتات: الحقل المخفي يجب أن يبقى فارغًا
  if (body.website) return json({ ok: true, message: 'Danke!' });

  const email = String(body.email ?? '').trim().toLowerCase();
  const source = String(body.source ?? 'site').slice(0, 60);
  const name = body.name ? String(body.name).slice(0, 80) : null;

  if (!EMAIL.test(email) || email.length > 160) return bad('Bitte gib eine gültige E-Mail-Adresse ein.');

  // KV — حدّ 5 محاولات لكل 10 دقائق لكل زائر
  const who = await visitorHash(ctx.request, 'newsletter');
  if (!(await rateLimit(ctx, `nl:${who}`, 5, 600))) {
    return bad('Zu viele Versuche. Bitte versuch es später noch einmal.', 429);
  }

  const db = getDB(ctx);
  if (!db) return bad('Datenbank nicht verfügbar.', 503);

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
      message: 'Du bist dabei! Halte Ausschau nach der nächsten Sonntagsmasche.',
    });
  } catch (err) {
    console.error('newsletter insert failed', err);
    return bad('Dein Abo konnte gerade nicht gespeichert werden.', 500);
  }
};

/** GET /api/newsletter?token=… — إلغاء الاشتراك بنقرة واحدة */
export const GET: APIRoute = async (ctx) => {
  const token = new URL(ctx.request.url).searchParams.get('token');
  if (!token) return bad('Token fehlt.');

  const db = getDB(ctx);
  if (!db) return bad('Datenbank nicht verfügbar.', 503);

  await db.prepare("UPDATE subscribers SET status = 'unsubscribed' WHERE token = ?").bind(token).run();
  return new Response('Du wurdest abgemeldet. Schade, dass du gehst!', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
};
