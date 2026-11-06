# Astro, explained by someone who just built a site with it

*What Astro is, why it ships no JavaScript unless you ask, how islands and content collections actually work, what changed in Astro 7, and the blog I built to find out.*

Published 6 November 2026. This is also a post on the site this repository builds; every code sample comes from the repository.

Most of the web is documents. Someone lands on a page, reads it, maybe clicks a thing, and leaves. For a good ten years we built those documents with tools made for applications, and the person reading paid for it with a megabyte of JavaScript they never needed. I did this too. Everyone did.

Astro is a framework built on the opposite bet. Its home page calls it "the web framework for content-driven websites", and once you notice that sentence, every design decision in the thing falls out of it. Pages are rendered to HTML on a server or at build time. The browser gets no JavaScript unless a specific component asks for it. When you do want something interactive, you add it in small, fenced-off pieces called islands, and you can write those in React, Vue, Svelte, Solid, Preact or plain web components, on the same page if you're feeling perverse.

I wanted to understand it properly, so I built a blog with it. Not a toy: content collections with a schema, one React island, Tailwind, RSS, a sitemap, five themes, and a section that pulls posts out of a real WordPress site. The whole thing is on GitHub and every code sample below comes from it, so if something here looks too neat, you can go and check.

## The problem it's solving

A single-page app ships a bundle that builds the page in the browser. Next.js and Nuxt improved on that with server rendering, but they still hydrate the whole page: download the framework, download the component code, download the data, then re-run the render to bolt event handlers onto HTML the browser already has. For a dashboard that's a fair deal. For a blog post it's just a tax.

You can see it in Core Web Vitals. Astro's home page shows a chart from the HTTP Archive and the Chrome UX Report: the share of real sites that pass all three vitals. Astro sits at 71 percent. WordPress is at 48, Gatsby 45, Next.js 35, Nuxt 28.

I'd treat those numbers with some care. They're population statistics, not a benchmark, and a good team can make any of those frameworks fast. But most sites aren't built by a good team with time on their hands. Most sites run on defaults. Astro's default is to send HTML and CSS and stop.

## The component format

An Astro component is an HTML file with a fenced block of JavaScript at the top. The fence runs on the server, never in the browser, so you can `await` a database query or a `fetch` right there and nobody downloads it. Under the fence is HTML with JSX-ish expressions. Here's the post card from my site:

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

<article class="rounded-card border p-5">
  <p class="text-xs text-ink-muted">
    <time datetime={post.data.pubDate.toISOString()}>{formatDate(post.data.pubDate)}</time>
    <span>{readingTime(post.body)} min read</span>
  </p>
  <h2><a href={url(`/blog/${post.id}`)}>{post.data.title}</a></h2>
  <p>{post.data.description}</p>
</article>
```

A few things I appreciated. `Astro.props` is typed by that `Props` interface, so if a page passes the wrong shape the type checker catches it before I do. The template is HTML, not JSX: it's `class`, not `className`, and you don't need to wrap siblings in a fragment. And the output of this component is a string. There's no runtime for it in the browser because there's nothing left to run.

A `<style>` tag inside a component is scoped to that component with no configuration. I went with Tailwind for this site, but scoped styles are the default and they're good.

## Islands

Etsy's Katie Sylor-Miller coined "component islands" in 2019 and Jason Miller from the Preact team wrote it up in 2020. Astro took the idea and built its whole component model around it. The page is a static sea of HTML. An island is one component that gets hydrated in the browser, on its own, without dragging the rest of the page with it.

You make an island by adding a `client:*` directive to a component. The directive is really a loading strategy. `client:load` hydrates straight away, for things the visitor will use immediately. `client:idle` waits until the browser has nothing better to do. `client:visible` waits until the component scrolls into view, which is what you want for a comments widget at the bottom of a long post. `client:media` takes a media query, for a mobile-only menu. And `client:only` skips server rendering entirely, for a component that can't run on the server because it reaches for `window` during render; use that one sparingly because you lose the HTML.

The blog index on my site has one island, a search box in React:

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

Take the directive off and Astro still renders the component, to HTML, on the server, and ships no React at all. Put it back and the browser downloads React plus this one component and hydrates it in place. The header, the footer, the layout: all still inert HTML. One rule to remember is that props have to be serialisable, because Astro writes them into the page as JSON. That's why the page flattens the collection entries into plain objects first. I tripped over that once and never again.

There's a mirror image called server islands. Mark a component `server:defer` and it's left out of the cached page and fetched separately on request, with fallback content in its slot in the meantime. It's for the "signed in as" widget on a page you'd otherwise like to cache for a week. It needs on-demand rendering, so it needs an adapter; client islands work on a fully static build.

## Content collections, or the part that makes this a CMS

This is the feature that made me take Astro seriously as a WordPress alternative for sites run by developers. A collection is a folder of content plus a schema. Astro validates every file against the schema when it builds and generates TypeScript types from it.

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

The `glob` loader reads files off disk. Since Astro 5 the loader is pluggable, so it can just as easily fetch from a REST API, a headless CMS, a database or a CSV, and what comes back is still a typed collection with the same two-function query API:

```ts
import { getCollection, getEntry, render } from 'astro:content';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const post = await getEntry('blog', 'astro-explained');
const { Content, headings } = await render(post);
```

`post.data.pubDate` is a real `Date`, not a string, because the schema coerced it. Misspell `pubDate` in a Markdown file and the build fails and tells you the file and the field. I've worked with content systems that let that through to production and I'd rather not again.

## Routes, static and otherwise

Routes are files. `src/pages/about.astro` is `/about`. A file with brackets in the name is a dynamic route, and for a static build it exports a function listing the pages that exist:

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

By default every route is prerendered at build time to an HTML file. If a page genuinely needs per-request data, you add an adapter for your host (`npx astro add node`, or `vercel`, `netlify`, `cloudflare`) and set `export const prerender = false` on that one page. The two modes mix in one project without fuss. There's also middleware, API endpoints (any file in `src/pages` that exports `GET` or `POST`), typed form actions and sessions, none of which my blog needed, which is sort of the point.

The RSS feed is an endpoint:

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

## Pulling content from WordPress

Astro doesn't care where content comes from, and I wanted to prove that with the most common CMS there is. The `/wordpress` section of my site fetches posts from a WordPress site's REST API during the build and writes a static page for each. The editors keep WordPress. The visitors get HTML off a CDN.

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

Two things in there are worth stealing. The promise is cached at module level, so the index page and all the post pages share one request instead of hammering the API. And the real version wraps the fetch in a try/catch that returns an empty list on failure, because I'd rather an unreachable CMS produced an empty section than a failed deploy at eleven at night.

The pages that consume it look like any other page:

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

`set:html` injects HTML as-is. WordPress returns HTML for titles and bodies, so it's the right tool, with the usual caveat that you only do this with content you trust.

## Styling, images, the SEO stuff

Scoped styles, global CSS, CSS modules, Sass and Tailwind all work. Since Astro 5.2 you add Tailwind 4 with `npx astro add tailwind`, which installs the official Vite plugin and drops an `@import "tailwindcss"` into a global stylesheet. There's no `tailwind.config.js` anymore; Tailwind 4 configures itself in CSS, which is how I ended up with themes as blocks of CSS variables.

The `<Image />` and `<Picture />` components from `astro:assets` resize and convert images at build time and write out `width` and `height` so nothing jumps around while loading. Astro 5.7 brought in a fonts API, experimental at first, for self-hosting web fonts the same way.

For SEO I installed nothing. The layout sets a canonical URL from `Astro.site` and `Astro.url`, adds Open Graph and Twitter tags, and links the feed and the sitemap. The sitemap integration writes `sitemap-index.xml` from the list of pages it just built.

## What changed in Astro 7

Astro 7.0 came out on 22 June 2026 and 7.4, the current release, on 15 October. The whole line is about build speed and a tighter toolchain, and I noticed it: my 45-page site builds in about four seconds.

Vite 8 with Rolldown replaced esbuild and Rollup, and the Astro team quotes production builds 15 to 61 percent faster; their own site went from 62.7 seconds to 24.2. The `.astro` compiler was rewritten in Rust on top of oxc and Lightning CSS. It's quicker and it's stricter: the old compiler would quietly fix malformed HTML, the new one reports an unclosed tag as an error, which bit me once and was right to. Markdown now goes through Sätteri, a Rust pipeline, with the old remark stack still available if you depend on remark plugins. Queued rendering became the default engine. Route caching graduated from experimental, with `Astro.cache`, a memory provider and route rules. And there's tooling clearly aimed at CI and agents: `astro dev --background`, JSON logs, and in 7.4 an `astro build --timings` flag that shows where the time goes. You need Node 22.22 or newer.

If you're on an older major, `npx @astrojs/upgrade` walks you through it.

## When I wouldn't use it

Astro's own docs are upfront that it's for content, and I'd agree with where they draw the line.

If your thing is an application, where every control reacts to every other control, you'd end up with one giant island and none of the benefit. Use Next, Nuxt, SvelteKit or a plain SPA and don't feel bad about it.

If the people writing content need a visual editor, previews and a plugin store, Astro has no admin UI. Pair it with a headless CMS, keep WordPress as the editor, or just stay on WordPress.

And if you've got an enormous site with personalisation on every page, you can do it with on-demand rendering and server islands, but at that point you're running a server and you should compare Astro against the application frameworks on their own ground.

## So, can it replace WordPress?

For a developer-run blog, docs site or marketing site: yes, and the result is faster, close to free to host, and much harder to break into, because there's no server-side runtime on the public internet. For a team that lives in the WordPress editor, I'd keep WordPress as a headless source and let Astro render the front, which is what the demo section on my site does. For sites that are really a plugin ecosystem, WooCommerce and memberships and all that, WordPress still earns its keep. There's a longer post on the site that goes through each case, and another one that's a step-by-step guide to using this project for exactly that.

## Try it

```bash
git clone https://github.com/fareezahmed/astro-blog
cd astro-blog
npm install
npm run dev
```

Open `localhost:4321`, edit a file in `src/content/blog`, watch it update. Then run `npm run build` and poke around in `dist/`. Every post is an HTML file. The blog index has one small script for the search box. Nothing else runs in the browser. That folder is the entire site, and anything that can serve files can serve it.
