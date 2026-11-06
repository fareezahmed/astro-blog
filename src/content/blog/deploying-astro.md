---
title: "Deploying an Astro site to GitHub Pages, Netlify, Vercel and Cloudflare"
description: "One static build, four hosts. What each one needs, how to handle a sub-path on GitHub Pages, and when you need an adapter."
pubDate: 2026-10-14
tags: [astro, deployment, github-actions, hosting]
---

`astro build` writes a folder named `dist/`. For a static site that folder is the deliverable, and every host in this post serves it the same way. The differences are in how the build runs and what URL the site ends up at.

## GitHub Pages

GitHub Pages serves project sites from `https://<user>.github.io/<repo>/`. The sub-path is the one thing that trips people up: links written as `/blog/...` would point at the wrong place. Two settings in `astro.config.mjs` handle it:

```js
export default defineConfig({
  site: 'https://fareezahmed.github.io',
  base: '/astro-blog',
});
```

`base` makes Astro emit pages under the sub-path and exposes it as `import.meta.env.BASE_URL`. Astro does not rewrite your `href`s, so this site routes every internal link through a helper:

```ts
// src/lib/url.ts
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path: string) => `${base}${path.startsWith('/') ? path : `/${path}`}`;
```

This repository reads `site` and `base` from `SITE_URL` and `BASE_PATH` environment variables, and the workflow fills them in from the repository name, so the same code deploys to the domain root on other hosts.

The workflow is the one from the Astro docs:

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: withastro/action@v6
        env:
          SITE_URL: https://${{ github.repository_owner }}.github.io
          BASE_PATH: /${{ github.event.repository.name }}
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

One-time setup: in the repository settings, under Pages, set the source to GitHub Actions. Commit a lockfile, because the Astro action detects your package manager from it.

## Netlify

Import the repository and Netlify detects Astro. `netlify.toml` pins the build command and publish directory so nobody has to click through settings:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Netlify exposes the site's address as `URL` during builds, and this project's config falls back to it, so canonical URLs and the sitemap are correct without further setup.

## Vercel

Same story: import the repository, Vercel detects the framework. `vercel.json` declares it explicitly. Vercel exposes `VERCEL_PROJECT_PRODUCTION_URL`, which the config also uses as a fallback for `site`.

## Cloudflare

Cloudflare recommends Workers with static assets for new projects. A `wrangler.jsonc` points at `dist/`:

```jsonc
{
  "name": "astro-blog",
  "compatibility_date": "2026-11-06",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
}
```

Then `npx astro build && npx wrangler deploy`. Connecting the repository in the Cloudflare dashboard automates the same thing on push.

## When you need an adapter

None of the above installs an adapter, because a static site does not need one. You need an adapter when a page is rendered on request: a search endpoint, a form action, a page marked `export const prerender = false`, or a server island. Run `npx astro add vercel`, `netlify`, `cloudflare` or `node`, and Astro switches the build output to that host's serverless or edge format while leaving prerendered pages as static files.

## Checklist before the first deploy

- `site` is set, or the sitemap and RSS links will be wrong.
- `base` is set if the site lives under a sub-path, and every internal link uses it.
- `robots.txt` in `public/` points at `sitemap-index.xml`.
- Environment variables the build needs, such as a CMS URL, are set in the host's settings.
- A `404.astro` page exists; every host here serves it for unknown paths.
