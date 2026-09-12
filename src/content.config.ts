import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categoryEnum = z.enum([
  'accessories', 'baby-kids', 'clothing',
  'blankets', 'footwear', 'home-decor', 'seasonal',
]);

const patterns = defineCollection({
  loader: glob({ base: './src/content/patterns', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
      title: z.string(),
      excerpt: z.string(),
      category: categoryEnum,
      /** صورة الغلاف: مسار داخل public/ أو رابط R2 كامل */
      cover: z.string(),
      gallery: z.array(z.string()).default([]),
      publishDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),

      /* ── تفاصيل الباترون ── */
      difficulty: z.enum(['beginner', 'easy', 'intermediate', 'advanced']).default('easy'),
      hook: z.string(),                 // 5.0 mm (H)
      yarnWeight: z.string(),           // Worsted (4)
      yardage: z.string().optional(),   // 620 yd / 567 m
      gauge: z.string().optional(),
      sizes: z.array(z.string()).default([]),
      time: z.string().optional(),      // 6–8 hours
      stitches: z.array(z.string()).default([]),
      materials: z.array(z.string()).default([]),
      colors: z.array(z.string()).default([]),   // أسماء ألوان الخيط

      /* ── R2 ── */
      pdfKey: z.string().optional(),    // patterns/xxx.pdf داخل حاوية R2
      pdfGated: z.boolean().default(false),

      /* ── SEO ── */
      tags: z.array(z.string()).default([]),
      seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

export const collections = { patterns };
