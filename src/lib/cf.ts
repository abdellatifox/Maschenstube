/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  طبقة الوصول إلى موارد Cloudflare                            ║
 * ║  D1 (DB) · KV (CACHE / SETTINGS) · R2 (MEDIA)                ║
 * ║  كل الدوال آمنة أثناء البناء الثابت (تُعيد قيمًا افتراضية).    ║
 * ╚══════════════════════════════════════════════════════════════╝
 */
import type { APIContext, AstroGlobal } from 'astro';

type Ctx = APIContext | AstroGlobal | { locals: App.Locals };

/** يعيد كائن env أو null إذا كنّا في مرحلة البناء (prerender). */
export function getEnv(ctx: Ctx): Env | null {
  return (ctx as any)?.locals?.runtime?.env ?? null;
}

export const getDB = (ctx: Ctx): D1Database | null => getEnv(ctx)?.DB ?? null;
export const getCache = (ctx: Ctx): KVNamespace | null => getEnv(ctx)?.CACHE ?? null;
export const getSettings = (ctx: Ctx): KVNamespace | null => getEnv(ctx)?.SETTINGS ?? null;
export const getMedia = (ctx: Ctx): R2Bucket | null => getEnv(ctx)?.MEDIA ?? null;

/** تشغيل عمل في الخلفية دون تأخير الاستجابة. */
export function waitUntil(ctx: Ctx, promise: Promise<unknown>) {
  const c = (ctx as any)?.locals?.runtime?.ctx;
  if (c?.waitUntil) c.waitUntil(promise);
  else void promise;
}

/* ─────────────────────────  KV : كاش  ───────────────────────── */

/** كاش JSON عبر KV مع TTL بالثواني. */
export async function cached<T>(
  ctx: Ctx,
  key: string,
  ttl: number,
  producer: () => Promise<T>,
): Promise<T> {
  const kv = getCache(ctx);
  if (!kv) return producer();
  const hit = await kv.get<T>(key, 'json');
  if (hit !== null && hit !== undefined) return hit;
  const value = await producer();
  waitUntil(ctx, kv.put(key, JSON.stringify(value), { expirationTtl: Math.max(60, ttl) }));
  return value;
}

export async function bustCache(ctx: Ctx, key: string) {
  await getCache(ctx)?.delete(key);
}

/** إعدادات الموقع القابلة للتحرير من KV (بانر، إعلان، إلخ). */
export async function getSetting(ctx: Ctx, key: string, fallback = ''): Promise<string> {
  const kv = getSettings(ctx);
  if (!kv) return fallback;
  return (await kv.get(key)) ?? fallback;
}

/** حدّ المعدّل: يسمح بـ `limit` طلبًا لكل `window` ثانية لكل مفتاح. */
export async function rateLimit(ctx: Ctx, key: string, limit = 5, windowSec = 60): Promise<boolean> {
  const kv = getCache(ctx);
  if (!kv) return true;
  const k = `rl:${key}`;
  const current = Number((await kv.get(k)) ?? 0);
  if (current >= limit) return false;
  await kv.put(k, String(current + 1), { expirationTtl: windowSec });
  return true;
}

/* ─────────────────────────  D1 : إحصاءات  ───────────────────────── */

export type Stats = { slug: string; views: number; likes: number; downloads: number };

const EMPTY = (slug: string): Stats => ({ slug, views: 0, likes: 0, downloads: 0 });

export async function getStats(ctx: Ctx, slug: string): Promise<Stats> {
  const db = getDB(ctx);
  if (!db) return EMPTY(slug);
  try {
    const row = await db
      .prepare('SELECT slug, views, likes, downloads FROM pattern_stats WHERE slug = ?')
      .bind(slug)
      .first<Stats>();
    return row ?? EMPTY(slug);
  } catch {
    return EMPTY(slug);
  }
}

/** يزيد عدّادًا واحدًا (views | likes | downloads) ويعيد القيمة الجديدة. */
export async function bump(
  ctx: Ctx,
  slug: string,
  field: 'views' | 'likes' | 'downloads',
  by = 1,
): Promise<number> {
  const db = getDB(ctx);
  if (!db) return 0;
  try {
    const row = await db
      .prepare(
        `INSERT INTO pattern_stats (slug, ${field}) VALUES (?1, ?2)
         ON CONFLICT(slug) DO UPDATE SET ${field} = ${field} + ?2, updated_at = datetime('now')
         RETURNING ${field} AS value`,
      )
      .bind(slug, by)
      .first<{ value: number }>();
    return row?.value ?? 0;
  } catch (err) {
    // الجدول غير مُهيَّأ بعد — لا تُسقط الصفحة بسببه
    console.error(`bump(${field}) failed`, err);
    return 0;
  }
}

/** أكثر الباترونات مشاهدة — مخزّن في KV لمدة 10 دقائق. */
export async function getTrending(ctx: Ctx, limit = 5): Promise<Stats[]> {
  return cached(ctx, `trending:${limit}`, 600, async () => {
    const db = getDB(ctx);
    if (!db) return [];
    try {
      const { results } = await db
        .prepare('SELECT slug, views, likes, downloads FROM pattern_stats ORDER BY views DESC LIMIT ?')
        .bind(limit)
        .all<Stats>();
      return results ?? [];
    } catch {
      return [];
    }
  });
}

/* ─────────────────────────  R2 : الوسائط  ───────────────────────── */

/** رابط عام للملف: نطاق R2 المخصّص إن وُجد، وإلا مسار الوكيل /media/… */
export function mediaUrl(ctx: Ctx, key: string): string {
  const base = getEnv(ctx)?.PUBLIC_R2_URL?.replace(/\/$/, '');
  return base ? `${base}/${key}` : `/media/${key}`;
}

export async function headMedia(ctx: Ctx, key: string) {
  return (await getMedia(ctx)?.head(key)) ?? null;
}

/* ─────────────────────────  أدوات مساعدة  ───────────────────────── */

/** بصمة زائر مجهولة (بدون تخزين IP) لمنع تكرار الإعجاب/التقييم. */
export async function visitorHash(request: Request, salt = 'crochet'): Promise<string> {
  const raw = [
    request.headers.get('cf-connecting-ip') ?? '',
    request.headers.get('user-agent') ?? '',
    salt,
  ].join('|');
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', ...(init.headers ?? {}) },
  });

export const bad = (message: string, status = 400) => json({ ok: false, error: message }, { status });
