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
    return bad('Ungültige Anfrage.');
  }

  if (body.website) return json({ ok: true }); // فخ البوتات

  const name = String(body.name ?? '').trim().slice(0, 80);
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 160);
  const subject = String(body.subject ?? 'Message').slice(0, 120);
  const text = String(body.body ?? '').trim().slice(0, 4000);

  if (!name || !text) return bad('Bitte fülle Name und Nachricht aus.');
  if (!EMAIL.test(email)) return bad('Bitte gib eine gültige E-Mail-Adresse ein.');

  const who = await visitorHash(ctx.request, 'contact');
  if (!(await rateLimit(ctx, `contact:${who}`, 3, 900))) {
    return bad('Zu viele Nachrichten. Bitte versuch es in Kürze noch einmal.', 429);
  }

  const db = getDB(ctx);
  if (!db) return bad('Datenbank nicht verfügbar.', 503);

  try {
    await db
      .prepare('INSERT INTO messages (name, email, subject, body) VALUES (?1, ?2, ?3, ?4)')
      .bind(name, email, subject, text)
      .run();
    return json({ ok: true });
  } catch (err) {
    console.error('contact insert failed', err);
    return bad('Deine Nachricht konnte gerade nicht gesendet werden.', 500);
  }
};
