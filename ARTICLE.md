# Astro explained: the web framework for content-driven websites

*What Astro is, how islands and content collections work, what changed in Astro 7, and a walkthrough of a real blog built with it.*

Published 6 November 2026. This article is also the featured post of the accompanying site; the source for every snippet is in this repository.

Most websites are documents. Blogs, marketing pages, documentation, portfolios, news, e-commerce catalogues: the visitor arrives, reads, maybe clicks a button, and leaves. For a decade the industry built those documents with tools designed for applications, and visitors paid for it in megabytes of JavaScript they never needed.

Astro is a web framework built on the opposite assumption. Its home page calls it "the web framework for content-driven websites", and the whole design follows from that sentence. Pages render to HTML on the server or at build time. The browser receives no JavaScript unless a component explicitly asks for it. When you do need interactivity, you add it in small, isolated pieces called islands, written in React, Vue, Svelte, Solid, Preact or plain web components, side by side on the same page.

This article explains how Astro works, what it is good and bad at, what the Astro 7 release line changed, and how the blog you are reading is put together. The source for this site is on GitHub, and every snippet below is lifted from it.

## The problem Astro solves

A single-page application (SPA) ships a JavaScript bundle that builds the page in the browser. Frameworks like Next.js and Nuxt improved on that with server-side rendering, but they still hydrate the entire page: the browser downloads the framework, the component code and the data, then re-runs the render to attach event handlers to markup it already has. For a product dashboard that is a fair trade. For a blog post it is pure overhead.

The cost shows up in Core Web Vitals. The chart on astro.build, sourced from the HTTP Archive and the Chrome UX Report, gives the share of real-world sites that pass all three Core Web Vitals:

| Framework | Sites passing CWV |
| --------- | ----------------- |
| Astro     | 71%               |
| WordPress | 48%               |
| Gatsby    | 45%               |
| Next.js   | 35%               |
| Nuxt      | 28%               |

Those are population statistics, not a benchmark, and a careful team can make any framework fast. But the defaults matter, because most sites run on defaults. Astro's default is to ship HTML and CSS and nothing else.

## Five design principles

The "Why Astro" page in the docs lists five principles. Paraphrased:

1. **Content-driven.** Astro is designed to present content, and it scales up toward applications rather than down from them.
2. **Server-first.** Rendering happens on the server, at build time or on request. Client-side rendering is opt-in, per component.
3. **Fast by default.** The stated goal is that it should be nearly impossible to build a slow site with Astro.
4. **Easy to use.** The `.astro` component language is a superset of HTML, and you can bring any UI framework's components without rewriting them.
5. **Developer-focused.** A CLI, an official editor extension, TypeScript support, and documentation in a dozen-plus languages.

## The .astro component

An Astro component is an HTML file with a fenced block of JavaScript at the top. The fence runs on the server, never in the browser, so you can `await` a database query or a `fetch` right there. Below the fence is an HTML template with JSX-style expressions.

```astro
---
// src/components/PostCard.astro
import type { Post } from '../lib/posts';
import { formatDate, readingTime } from '../lib/posts';
import { url } from '../lib/url';

interface Props {
  post: Post;
}
const { post } = Astro.props;
---

<article class="rounded-xl border p-5">
  <p class="text-xs text-slate-500">
    <time datetime={post.data.pubDate.toISOString()}>{formatDate(post.data.pubDate)}</time>
    <span>{readingTime(post.body)} min read</span>
  </p>
  <h2><a href={url(`/blog/${post.id}`)}>{post.data.title}</a></h2>
  <p>{post.data.description}</p>
</article>
```

Three things to notice. `Astro.props` is typed by the `Props` interface, so a page that passes the wrong shape fails type-checking. The template is real HTML, not JSX: `class`, not `className`, and no wrapping fragment required. And the component's output is a string of HTML. There is no runtime for it in the browser, because there is nothing left to run.

A `<style>` tag inside a component is scoped to that component automatically. This site uses Tailwind instead, but scoped styles are the zero-configuration default.

## Islands: interactivity where you need it

The term "islands architecture" was coined by Etsy's Katie Sylor-Miller in 2019 and written up by Preact's Jason Miller in 2020. Astro built its component model around it. A page is a static ocean of HTML; an island is one component that gets hydrated in the browser, independently of everything around it.

You mark an island with a `client:*` directive. Each directive is a loading strategy:

| Directive        | When it hydrates                                 | Use for                                   |
| ---------------- | ------------------------------------------------ | ----------------------------------------- |
| `client:load`    | Immediately on page load                         | Things visible and interactive at once    |
| `client:idle`    | When the browser is idle (`requestIdleCallback`) | Lower-priority widgets                    |
| `client:visible` | When it scrolls into the viewport                | Anything below the fold                   |
| `client:media`   | When a media query matches                       | Mobile-only menus, desktop-only sidebars  |
| `client:only`    | Skips server rendering, renders in browser only  | Components that cannot run on the server  |

The blog index on this site has exactly one island, a React search box:

```astro
---
// src/pages/blog/index.astro
import PostSearch from '../../components/PostSearch';
import { getPublishedPosts } from '../../lib/posts';

const posts = await getPublishedPosts();
const searchable = posts.map((post) => ({
  id: post.id,
  url: url(`/blog/${post.id}`),
  title: post.data.title,
  description: post.data.description,
  tags: post.data.tags,
}));
---
<PostSearch client:load posts={searchable} />
```

Without the directive, Astro would render the React component to HTML on the server and ship no React at all. With `client:load`, the browser downloads React and this one component and hydrates it in place. The header, the footer and the layout around it stay inert HTML. Props must be serialisable, which is why the page maps collection entries to plain objects first.

Astro 4.12 added the mirror image: **server islands**. A component marked `server:defer` is left out of the cached static page and rendered separately on request, with fallback content shown meanwhile. That lets a fully cached marketing page carry a personalised "signed in as" widget without giving up the cache.

## Content collections: typed Markdown

Content collections are the feature that makes Astro a credible CMS replacement for developer-run sites. A collection is a folder of content plus a schema. Astro validates every file against the schema at build time and generates TypeScript types from it.

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().max(220),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

The `glob` loader reads local files. Astro 5 introduced the Content Layer, which made loaders pluggable: a loader can fetch from a REST API, a headless CMS, a database or a CSV file, and the result is still a typed collection with the same query API. The query API is two functions:

```ts
import { getCollection, getEntry, render } from 'astro:content';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const post = await getEntry('blog', 'astro-explained');
const { Content, headings } = await render(post);
```

Everything is typed. `post.data.pubDate` is a `Date`, not a string, because the schema coerced it. Misspell `pubDate` as `pubdate` in a Markdown file and the build fails with the file name and the field, which is what you want from a CMS.

## Routing and rendering

Routes are files. `src/pages/about.astro` becomes `/about`. `src/pages/blog/[id].astro` is a dynamic route, and for a static build it exports `getStaticPaths` to say which pages exist:

```astro
---
// src/pages/blog/[id].astro
export async function getStaticPaths() {
  const posts = await getPublishedPosts();
  return posts.map((post, index) => ({
    params: { id: post.id },
    props: { post, newer: posts[index - 1], older: posts[index + 1] },
  }));
}
const { post, newer, older } = Astro.props;
const { Content } = await render(post);
---
```

By default every route is prerendered at build time to a plain HTML file. If a page needs per-request data, add an adapter for your host (`npx astro add node`, `vercel`, `netlify` or `cloudflare`) and set `export const prerender = false` on that page. The two modes mix freely in one project. Astro also has middleware, API endpoints (any file in `src/pages` that exports `GET` or `POST`), form actions with type-safe server functions, and sessions.

The RSS feed on this site is an endpoint:

```ts
// src/pages/rss.xml.ts
import rss from '@astrojs/rss';

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Astro Field Notes',
    description: 'A developer blog about Astro.',
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}/`,
    })),
  });
}
```

## Data from anywhere: the headless WordPress demo

Astro does not care where content comes from. The `/wordpress` section of this site fetches posts from a WordPress REST API during the build and writes static pages for them. Editors keep the WordPress admin; visitors get HTML from a CDN.

```ts
// src/lib/wordpress.ts (abridged)
const API_URL = import.meta.env.WP_API_URL ?? 'https://public-api.wordpress.com/wp/v2/sites/en.blog.wordpress.com';
const FIELDS = 'id,slug,link,date,title,excerpt,content,_links,_embedded';

let cache: Promise<WpPost[]> | undefined;

export function getWpPosts(perPage = 12): Promise<WpPost[]> {
  cache ??= (async () => {
    const res = await fetch(`${API_URL}/posts?per_page=${perPage}&_embed=1&_fields=${FIELDS}`);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return ((await res.json()) as Raw[]).map(normalize);
  })();
  return cache;
}
```

Two details worth copying. The promise is cached at module level, so the index page and every post page share one request. And the real function wraps the fetch in a `try`/`catch` that returns an empty list on failure: an unreachable CMS should produce an empty section, not a failed deploy.

Pages consume it like any other data:

```astro
---
// src/pages/wordpress/[slug].astro
export async function getStaticPaths() {
  const posts = await getWpPosts();
  return posts.map((post) => ({ params: { slug: post.slug }, props: { post } }));
}
const { post } = Astro.props;
---
<h1 set:html={post.title} />
<div class="prose" set:html={post.content} />
```

`set:html` injects rendered HTML. WordPress returns HTML for titles and bodies, so this is the right tool, with the usual caveat that you should only do it with content you trust.

## Styling, images, SEO

Astro supports scoped `<style>` blocks, global CSS, CSS modules, Sass, and Tailwind. Since Astro 5.2 the way to add Tailwind 4 is `npx astro add tailwind`, which installs the official `@tailwindcss/vite` plugin and creates a global stylesheet containing `@import "tailwindcss"`. No `tailwind.config.js` is needed; Tailwind 4 configures itself in CSS.

The `<Image />` and `<Picture />` components from `astro:assets` resize and convert images at build time and emit `width` and `height` to prevent layout shift. Astro 5.7 introduced a fonts API, experimental at first, for self-hosting web fonts with the same approach.

For SEO there is nothing to install. The layout on this site sets a canonical URL from `Astro.site` and `Astro.url`, Open Graph and Twitter tags, and links to the RSS feed and sitemap. The `@astrojs/sitemap` integration writes `sitemap-index.xml` from the list of built pages.

## What changed in Astro 7

Astro 7.0 shipped on 22 June 2026 and the current release, 7.4, followed on 15 October 2026. The release line is about build speed and a tighter toolchain:

- **Vite 8 with Rolldown.** Rolldown replaces esbuild and Rollup. Astro reports production builds 15 to 61 percent faster, and the astro.build site itself went from 62.7 to 24.2 seconds.
- **A Rust compiler.** The `.astro` compiler was rewritten on top of oxc and Lightning CSS. It is faster and stricter: the old compiler silently fixed malformed HTML, the new one reports an unclosed tag as an error.
- **Sätteri for Markdown.** A Rust Markdown pipeline is the default. The unified/remark stack is still available through `@astrojs/markdown-remark` if you depend on remark plugins.
- **Queued rendering** became the default rendering engine, with the team quoting around 2.4 times faster output on expression-heavy pages.
- **Route caching** graduated from experimental: `Astro.cache`, a memory cache provider, route rules and cache invalidation, with experimental CDN providers for Netlify, Vercel and Cloudflare.
- **Tooling for agents and CI.** `astro dev --background` runs the dev server detached, logs can be emitted as JSON, and 7.4 added `astro build --timings` to show where build time goes.
- **Node.js 22.22 or newer** is required as of 7.4.

If you are on Astro 4 or 5, `npx @astrojs/upgrade` walks through the version bumps and the upgrade guides list the breaking changes.

## When Astro is the wrong tool

Astro's own docs are candid that it is built for content. Three cases where I would pick something else:

- **An application that is mostly interactive state.** A dashboard where every element responds to every other element is one big island. Astro can host it, but you lose the advantage and gain a layer of indirection. Next.js, Nuxt, SvelteKit or a plain SPA fit better.
- **A site run by non-technical editors who need a visual editor, previews and plugins.** Astro has no admin UI. Pair it with a headless CMS, or stay on WordPress.
- **Very large sites with per-request personalisation everywhere.** Possible with on-demand rendering and server islands, but at that point you are operating a server and evaluating Astro against application frameworks on their own terms.

## Can Astro replace WordPress?

For a developer-run blog, documentation site or marketing site, yes, and the result will be faster, cheaper to host and harder to hack, because there is no server-side runtime to attack. For an editorial team that lives in the WordPress editor, the better move is usually to keep WordPress as a headless content source and let Astro render the front end, exactly as the demo section on this site does. For sites that depend on the plugin ecosystem, WooCommerce, memberships or comments, WordPress still earns its place. There is a longer post on this site that works through each case.

## Running this project

```bash
git clone https://github.com/fareezahmed/astro-blog
cd astro-blog
npm install
npm run dev
```

Open `http://localhost:4321`. Edit a file in `src/content/blog` and the page updates. Run `npm run build` and look in `dist/`: every post is an HTML file, the blog index carries one small script for the search island, and nothing else runs in the browser. That folder is the whole site, and any static host can serve it.
