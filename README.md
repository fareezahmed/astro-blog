# Astro Field Notes

A developer blog built with [Astro 7](https://astro.build) that doubles as a reference implementation
for the article **[Astro explained: the web framework for content-driven websites](ARTICLE.md)**.

It shows, with running code:

- **Content Collections**: Markdown posts in `src/content/blog`, validated by a Zod schema, queried with a typed API.
- **Islands architecture**: every page is static HTML; the post search on `/blog` is the single React component that ships JavaScript.
- **Tailwind CSS 4** through the official Vite plugin, with the Typography plugin for Markdown bodies.
- **Headless WordPress**: `/wordpress` pulls posts from a WordPress REST API at build time and renders them as static pages.
- **SEO basics**: canonical URLs, Open Graph tags, an RSS feed and a sitemap.
- **Deploy configuration** for GitHub Pages (GitHub Actions), Netlify, Vercel and Cloudflare Workers.

## Run it

Requires Node.js 22.23 or newer.

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
npm run check      # type-check .astro, .ts and .tsx files
```

## Project layout

```
src/
  content.config.ts        # blog collection + schema
  content/blog/*.md        # the posts
  layouts/Layout.astro     # <head>, header, footer
  components/
    Header.astro, Footer.astro, PostCard.astro
    PostSearch.tsx         # the React island
  lib/
    posts.ts               # collection queries, tags, reading time
    wordpress.ts           # WordPress REST API client (build-time)
    url.ts                 # base-path aware link helper
  pages/
    index.astro            # home
    blog/index.astro       # list + search island
    blog/[id].astro        # one page per post
    tags/index.astro, tags/[tag].astro
    wordpress/index.astro, wordpress/[slug].astro
    about.astro, 404.astro
    rss.xml.ts, robots.txt.ts  # endpoints
public/                    # static files copied as-is
.github/workflows/         # deploy.yml (GitHub Pages), ci.yml (PR checks)
netlify.toml, vercel.json, wrangler.jsonc
```

## Writing a post

Add a Markdown file to `src/content/blog/`:

```md
---
title: My post
description: One or two sentences shown in lists and meta tags.
pubDate: 2026-11-06
tags: [astro, notes]
draft: false
---

Body in Markdown.
```

The file name becomes the URL (`my-post.md` → `/blog/my-post`). A missing or mistyped field fails the build with
a message pointing at the file.

## Configuration

Three optional environment variables, see `.env.example`:

| Variable     | Purpose                                                        | Default                                  |
| ------------ | -------------------------------------------------------------- | ---------------------------------------- |
| `SITE_URL`   | Public origin, used for canonical URLs, sitemap and RSS         | host-provided URL, else `https://example.com` |
| `BASE_PATH`  | Sub-path when served from a folder (GitHub Pages project sites) | `/`                                      |
| `WP_API_URL` | WordPress REST API base for the headless demo                   | the WordPress.com blog                   |

## Deploying

The site is static. Any host that serves a folder of files works.

- **GitHub Pages**: push to `main`. `.github/workflows/deploy.yml` builds and deploys. Enable it once under
  *Settings → Pages → Source → GitHub Actions*. The workflow sets `SITE_URL` and `BASE_PATH` from the repository name.
- **Netlify**: import the repo; `netlify.toml` sets the build command and publish directory.
- **Vercel**: import the repo; `vercel.json` declares the Astro preset.
- **Cloudflare Workers**: `npm install -D wrangler`, then `npx astro build && npx wrangler deploy` using `wrangler.jsonc`.

To render pages on demand instead of at build time, add an adapter (`npx astro add vercel|netlify|cloudflare|node`).

## Swapping in your own WordPress site

Set `WP_API_URL=https://your-site.com/wp-json/wp/v2`. The client in `src/lib/wordpress.ts` uses `_fields` to trim
the payload and `_embed` to pull the author and featured image in the same request. Custom post types must be
exposed to the REST API (`show_in_rest => true`) before they appear.

## License

MIT
