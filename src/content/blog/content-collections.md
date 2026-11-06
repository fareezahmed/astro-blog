---
title: "A folder of Markdown with a schema in front of it"
description: "Content collections are the reason I trust a pile of files as a CMS. Defining one, querying it, rendering it, and why the schema is the point."
pubDate: 2026-10-21
tags: [astro, content, typescript, tutorial]
cover: ./covers/content-collections.png
coverAlt: "Cover: the post title beside a grid of page blocks with one lit island."
---

A folder of Markdown files is the simplest CMS there is, and its weakness has always been that nothing checks the files. A post with a missing date renders fine on your laptop and breaks the build on a Friday evening, or worse, ships with "Invalid Date" in the byline. Content collections put a schema in front of the folder, and that one change is what makes me comfortable running a site this way.

## Defining one

One file registers every collection on the site:

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
  }),
});

export const collections = { blog };
```

The loader decides where entries come from. `glob` reads files; `file` reads a single JSON, YAML or CSV with many entries; a custom loader can call anything. The schema is Zod, re-exported from `astro/zod`, and it does more than say no. `z.coerce.date()` turns the string in the frontmatter into an actual `Date`. `.default([])` means I never check whether a post has a tags array. `.max(220)` on the description keeps it short enough to be a meta tag without me thinking about it.

Each entry gets an `id` from its filename. `astro-explained.md` becomes `astro-explained`, which is what I use for the URL. You can override it with a `slug` field in the frontmatter, which matters if you're migrating a site and want to keep old paths.

## Querying it

```ts
import { getCollection, getEntry } from 'astro:content';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const one = await getEntry('blog', 'astro-explained');
```

What comes back is typed from the schema. Astro doesn't sort for you, which surprised me the first time, so I wrapped the call once and use that everywhere:

```ts
// src/lib/posts.ts
export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
```

Drafts show up in the dev server and vanish from the build, which is what I'd expect a draft to do.

## Rendering it

```astro
---
import { render } from 'astro:content';
const { post } = Astro.props;
const { Content, headings } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
```

`render` compiles the Markdown and hands back a component plus the list of headings, which is how the table of contents on the longer posts here is built. Code blocks get highlighted at build time, so there's no highlighter running in the browser.

## Pointing at other collections

Schemas can reference each other. If I had an `authors` collection, a `reference('authors')` field on posts would give me a typed, validated join, and a post naming an author that doesn't exist would fail the build rather than render a blank:

```ts
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    author: reference('authors'),
  }),
});
```

I haven't needed it on this site yet, which tells you something about how far a single collection gets you.

## Why I keep going on about the schema

Everything a database-backed CMS does with an admin form, a collection does with a file and a schema. Review happens in a pull request. Validation happens at build time, where it can't hurt anyone. Types flow into every page that uses the content, so renaming a field is a compiler error, not a hunt. And because the loader is swappable, the same code that reads Markdown today can read a headless CMS tomorrow without touching the pages. That last bit is the one I'd underline.
