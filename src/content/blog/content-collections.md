---
title: "Content collections: a typed CMS made of files"
description: "Defining a schema, loading Markdown with the glob loader, querying with getCollection, and rendering with render()."
pubDate: 2026-10-21
tags: [astro, content, typescript, tutorial]
---

A folder of Markdown files is the simplest CMS there is. Its weakness has always been that nothing checks the files. A post with a missing date renders fine locally and crashes the build on Friday evening, or worse, ships with "Invalid Date" in the byline. Content collections fix that by putting a schema in front of the folder.

## Define

One file registers every collection:

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

The loader decides where entries come from. `glob` reads files; `file` reads one JSON, YAML or CSV file with many entries; and a custom loader can call any API. The schema is Zod, re-exported from `astro/zod`, and it does more than validate: `z.coerce.date()` turns the frontmatter string into a real `Date`, `.default([])` means pages never have to check for a missing tag list, and `.max(220)` keeps descriptions short enough for a meta tag.

Each entry gets an `id` derived from its file name. `astro-explained.md` has the id `astro-explained`, which this site uses as the URL. You can override it with a `slug` field in frontmatter.

## Query

```ts
import { getCollection, getEntry } from 'astro:content';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const one = await getEntry('blog', 'astro-explained');
```

The return type is `CollectionEntry<'blog'>[]`, with `data` typed from the schema. Astro does not sort for you, so this site wraps the call:

```ts
// src/lib/posts.ts
export async function getPublishedPosts() {
  const posts = await getCollection('blog', ({ data }) => import.meta.env.DEV || !data.draft);
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
```

Drafts show in the dev server and disappear from builds, which is the behaviour editors expect from a draft.

## Render

```astro
---
import { render } from 'astro:content';
const { post } = Astro.props;
const { Content, headings } = await render(post);
---
<h1>{post.data.title}</h1>
<Content />
```

`render` compiles the Markdown and returns a component plus the list of headings, which is how the table of contents on long posts here is built. Code blocks are syntax-highlighted at build time, so no highlighter ships to the browser.

## Reference other collections

Schemas can point at other collections. An `authors` collection and a `reference('authors')` field on posts gives you typed, validated joins: a post that names an author who does not exist fails the build.

```ts
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    author: reference('authors'),
  }),
});
```

## Why this matters

Everything a traditional CMS does with a database and an admin form, a collection does with a file and a schema. Review happens in a pull request. Validation happens at build time. Types flow into every page that uses the content. And because the loader is pluggable, the same code that queries Markdown today can query a headless CMS tomorrow without touching the pages.
