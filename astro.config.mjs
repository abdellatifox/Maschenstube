// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://crochet-theme.pages.dev', // ⇦ غيّرها إلى نطاقك
  output: 'static', // الصفحات ثابتة + مسارات API ديناميكية (prerender = false)
  adapter: cloudflare({
    platformProxy: { enabled: true }, // يوفّر D1/KV/R2 محليًا أثناء `astro dev`
    imageService: 'compile',
  }),
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  image: {
    remotePatterns: [{ protocol: 'https' }],
  },
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
