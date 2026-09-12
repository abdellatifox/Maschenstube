export function formatDate(date: Date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
}

export function shortDate(date: Date, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
}

export function compact(n: number) {
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function readingTime(text: string) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** يقسم العنوان: آخر كلمة تُعرض بخط مائل تحريري. */
export function splitAccent(title: string) {
  const parts = title.trim().split(' ');
  if (parts.length < 2) return { head: title, accent: '' };
  return { head: parts.slice(0, -1).join(' '), accent: parts.at(-1)! };
}

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

export const difficultyDots = (level: string) =>
  ({ beginner: 1, easy: 2, intermediate: 3, advanced: 4 })[level] ?? 2;
