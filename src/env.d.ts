/// <reference types="astro/client" />

interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SETTINGS: KVNamespace;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  SITE_NAME: string;
  PUBLIC_R2_URL: string;
  ADMIN_TOKEN?: string;
}

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
