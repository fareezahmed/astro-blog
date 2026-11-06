# Astro Field Notes

A developer blog built with [Astro 7](https://astro.build) that doubles as a reference implementation
for the article **[Astro explained: the web framework for content-driven websites](ARTICLE.md)**.

**New here?** Read [Using Astro Field Notes as your WordPress replacement](src/content/blog/using-astro-field-notes.md)
for what the project gives you and three ways to put it to work. Click **Use this template** on GitHub to get your own copy.

It shows, with running code:

- **Content Collections**: Markdown posts in `src/content/blog`, validated by a Zod schema, queried with a typed API.
- **Islands architecture**: every page is static HTML; the post search on `/blog` is the single React component that ships JavaScript.
- **Tailwind CSS 4** through the official Vite plugin, with the Typography plugin for Markdown bodies.
- **Headless WordPress**: `/wordpress` pulls posts from a WordPress REST API at build time and renders them as static pages.
- **Five themes for different domains**: Nova (tech), Atlas (corporate), Paper (editorial), Pop (creative), Fern (wellness). Pick one per deployment with `SITE_THEME`, or try them live at `/themes`.
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
    PostSearch.tsx         # React island: post search (client:load)
    ThemePicker.tsx        # React island: theme and color mode (client:idle)
  lib/
    posts.ts               # collection queries, tags, reading time
    wordpress.ts           # WordPress REST API client (build-time)
    url.ts                 # base-path aware link helper
    themes.ts              # theme catalogue + SITE_THEME default
  pages/
    index.astro            # home
    blog/index.astro       # list + search island
    blog/[id].astro        # one page per post
    tags/index.astro, tags/[tag].astro
    wordpress/index.astro, wordpress/[slug].astro
    themes.astro           # theme gallery with live previews
    about.astro, 404.astro
    rss.xml.ts, robots.txt.ts  # endpoints
  styles/
    global.css             # Tailwind + semantic tokens (@theme inline)
    themes.css             # the five themes as CSS variables
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

Four optional environment variables, see `.env.example`:

| Variable     | Purpose                                                        | Default                                  |
| ------------ | -------------------------------------------------------------- | ---------------------------------------- |
| `SITE_URL`   | Public origin, used for canonical URLs, sitemap and RSS         | host-provided URL, else `https://example.com` |
| `BASE_PATH`  | Sub-path when served from a folder (GitHub Pages project sites) | `/`                                      |
| `SITE_THEME` | Theme baked into the build: `nova`, `atlas`, `paper`, `pop`, `fern` | `nova`                                   |
| `WP_API_URL` | WordPress REST API base for the headless demo                   | the WordPress.com blog                   |

## Deploying

The site is static. Any host that serves a folder of files works.

- **GitHub Pages**: push to `main`. `.github/workflows/deploy.yml` builds and deploys. Enable it once under
  *Settings → Pages → Source → GitHub Actions*. The workflow sets `SITE_URL` and `BASE_PATH` from the repository name.
- **Netlify**: import the repo; `netlify.toml` sets the build command and publish directory.
- **Vercel**: import the repo; `vercel.json` declares the Astro preset.
- **Cloudflare Workers**: `npm install -D wrangler`, then `npx astro build && npx wrangler deploy` using `wrangler.jsonc`.

To render pages on demand instead of at build time, add an adapter (`npx astro add vercel|netlify|cloudflare|node`).

## Themes

Components use semantic tokens (`bg-surface`, `text-ink`, `border-line`, `bg-brand`, `rounded-card`) that Tailwind 4
maps to CSS variables with `@theme inline`. Each theme in `src/styles/themes.css` sets those variables for light and
dark mode; `src/lib/themes.ts` names it and lists the kinds of sites it suits.

| Theme   | Suited for                                                        |
| ------- | ----------------------------------------------------------------- |
| `nova`  | Developer blogs, SaaS, documentation, product sites (default)     |
| `atlas` | Corporate, finance, legal, consulting, B2B                        |
| `paper` | News, magazines, publishing, essays                               |
| `pop`   | Creative agencies, portfolios, events, consumer brands            |
| `fern`  | Health and wellness, food, sustainability, education, non-profits |

- Per deployment: set `SITE_THEME` (the GitHub Pages workflow takes it as a manual-run input).
- Per visitor: the picker in the header and the buttons on `/themes` switch the theme and the light/dark mode in the
  browser and remember the choice in `localStorage`.
- New theme: add a `[data-theme='name']` block to `themes.css` with the same variables and an entry to `themes.ts`.

## Swapping in your own WordPress site

Set `WP_API_URL=https://your-site.com/wp-json/wp/v2`. The client in `src/lib/wordpress.ts` uses `_fields` to trim
the payload and `_embed` to pull the author and featured image in the same request. Custom post types must be
exposed to the REST API (`show_in_rest => true`) before they appear.

## License

MIT
