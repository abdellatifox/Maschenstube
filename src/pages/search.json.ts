import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categoryMap, difficultyLabels } from '../data/site';

/** فهرس بحث ثابت يُبنى وقت البناء ويُستهلك من مربّع البحث في المتصفّح. */
export const GET: APIRoute = async () => {
  const patterns = await getCollection('patterns', ({ data }) => !data.draft);

  const index = patterns
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf())
    .map((p) => ({
      slug: p.id,
      title: p.data.title,
      excerpt: p.data.excerpt,
      category: categoryMap[p.data.category]?.title ?? p.data.category,
      difficulty: difficultyLabels[p.data.difficulty] ?? p.data.difficulty,
      hook: p.data.hook,
      yarn: p.data.yarnWeight,
      tags: [...p.data.tags, ...p.data.stitches],
      cover: p.data.cover,
    }));

  return new Response(JSON.stringify(index), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
};
