import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET: APIRoute = async ({ site: astroSite }) => {
  const base = (astroSite ?? new URL(site.url)).href.replace(/\/$/, '');
  const patterns = (await getCollection('patterns', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf(),
  );

  const items = patterns
    .map(
      (p) => `    <item>
      <title>${escape(p.data.title)}</title>
      <link>${base}/patterns/${p.id}</link>
      <guid isPermaLink="true">${base}/patterns/${p.id}</guid>
      <description>${escape(p.data.excerpt)}</description>
      <category>${escape(p.data.category)}</category>
      <pubDate>${p.data.publishDate.toUTCString()}</pubDate>
    </item>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(site.name)}</title>
    <link>${base}</link>
    <description>${escape(site.description)}</description>
    <language>de</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
