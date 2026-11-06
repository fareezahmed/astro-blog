---
title: "Deploying the same Astro site to four hosts"
description: "One static build, GitHub Pages, Netlify, Vercel and Cloudflare. The sub-path trap on Pages, what each host wants, and when you'd need an adapter."
pubDate: 2026-10-14
tags: [astro, deployment, github-actions, hosting]
---

`astro build` writes a folder called `dist/`. For a static site that folder is the deliverable, full stop, and every host in this post serves it the same way. The differences are in how the build gets run and what URL the site ends up at. I set this project up for all four so I'd stop re-learning the differences.

## GitHub Pages, and the sub-path thing

GitHub Pages serves project sites from `https://<user>.github.io/<repo>/`. That sub-path is the one thing that catches people, me included. Links written as `/blog/...` point at the wrong place. Two settings fix it:

```js
export default defineConfig({
  site: 'https://fareezahmed.github.io',
  base: '/astro-blog',
});
```

`base` makes Astro emit pages under the sub-path and exposes it as `import.meta.env.BASE_URL`. What it does not do is rewrite your `href`s. So every internal link on this site goes through a tiny helper:

```ts
// src/lib/url.ts
const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path: string) => `${base}${path.startsWith('/') ? path : `/${path}`}`;
```

Rather than hardcode those two values I read them from `SITE_URL` and `BASE_PATH` environment variables, and the workflow fills them in from the repository name. The same code then deploys to the domain root on the other hosts with no changes.

The workflow is the one from the Astro docs with the env block added:

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

One-time setup, and I mean it, because I forgot: in the repository settings under Pages, set the source to GitHub Actions. Until you do, the build job passes and the deploy job fails with a 404 that doesn't say why. Also commit a lockfile, since the Astro action works out your package manager from it.

## Netlify

Import the repo and Netlify figures out it's Astro. I keep a `netlify.toml` anyway so nobody has to click through settings:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

Netlify exposes the site's address as `URL` during builds, and my config falls back to it, so the canonical tags and the sitemap come out right without setting anything.

## Vercel

Same story. Import, it detects the framework, `vercel.json` says so explicitly for the avoidance of doubt. Vercel exposes `VERCEL_PROJECT_PRODUCTION_URL` and the config uses that as a fallback for `site` too.

## Cloudflare

Cloudflare now points new projects at Workers with static assets rather than Pages. A `wrangler.jsonc` points at the build output:

```jsonc
{
  "name": "astro-blog",
  "compatibility_date": "2026-11-06",
  "assets": { "directory": "./dist", "not_found_handling": "404-page" }
}
```

Then `npx astro build && npx wrangler deploy`. Connect the repo in the dashboard and it does the same on push.

## When you actually need an adapter

Nothing above installs one, because a static site doesn't need one. You need an adapter the moment a page renders on request: a search endpoint, a form action, a page marked `export const prerender = false`, a server island. `npx astro add vercel` (or `netlify`, `cloudflare`, `node`) switches the build to that host's serverless or edge format and leaves the prerendered pages as plain files. I haven't needed one for this site and I'd rather keep it that way.

## Before the first deploy

The things I check, having got each of them wrong at least once. `site` is set, or the sitemap and feed links are wrong. `base` is set if you're under a sub-path and every internal link uses the helper. The robots file points at `sitemap-index.xml` (mine is generated, so it follows `site` automatically). Any environment variable the build needs, like the CMS URL, is set in the host's settings and not just in your local `.env`. And there's a `404.astro`, because all four hosts will serve it for unknown paths and a blank page is worse than a cheerful one.
