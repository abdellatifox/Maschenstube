import type { APIRoute } from 'astro';
import { getDB, rateLimit, visitorHash, json, bad } from '../../lib/cf';

export const prerender = false;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/;

/** POST /api/contact → يحفظ الرسالة في جدول messages داخل D1 */
export const POST: APIRoute = async (ctx) => {
  let body: any;
  try {
    body = await ctx.request.json();
  } catch {
    return bad('Invalid request body.');
  }

  if (body.website) return json({ ok: true }); // فخ البوتات

  const name = String(body.name ?? '').trim().slice(0, 80);
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 160);
  const subject = String(body.subject ?? 'Message').slice(0, 120);
  const text = String(body.body ?? '').trim().slice(0, 4000);

  if (!name || !text) return bad('Please fill in your name and message.');
  if (!EMAIL.test(email)) return bad('Please enter a valid email address.');

  const who = await visitorHash(ctx.request, 'contact');
  if (!(await rateLimit(ctx, `contact:${who}`, 3, 900))) {
    return bad('Too many messages. Please try again in a little while.', 429);
  }

  const db = getDB(ctx);
  if (!db) return bad('Database unavailable.', 503);

  try {
    await db
      .prepare('INSERT INTO messages (name, email, subject, body) VALUES (?1, ?2, ?3, ?4)')
      .bind(name, email, subject, text)
      .run();
    return json({ ok: true });
  } catch (err) {
    console.error('contact insert failed', err);
    return bad('Could not send your message right now.', 500);
  }
};
