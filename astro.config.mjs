// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// `site` and `base` come from the environment so the same code base deploys to
// GitHub Pages (which serves from a sub-path), Vercel, Netlify and Cloudflare.
// See .env.example and .github/workflows/deploy.yml. Each host also exposes its
// own URL variable, used here as a fallback.
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const site =
  env.SITE_URL ||
  env.URL || // Netlify
  (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
  env.CF_PAGES_URL || // Cloudflare Pages
  'https://example.com';
const base = env.BASE_PATH || '/';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  prefetch: true,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react(), sitemap()],
});
