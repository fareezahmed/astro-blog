import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A content collection is a typed folder of content. The `glob` loader reads
// every Markdown/MDX file under src/content/blog and validates its frontmatter
// against the Zod schema below. Invalid frontmatter fails the build with a
// readable error instead of shipping a broken page.
const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  // `image()` validates that the file exists and turns it into an optimizable
  // asset. Covers live next to the posts, e.g. ./covers/my-post.png, and are
  // generated with `node scripts/make-cover.mjs`.
  schema: ({ image }) => z.object({
    title: z.string().max(120),
    description: z.string().max(220),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    featured: z.boolean().default(false),
    cover: image().optional(),
    coverAlt: z.string().max(200).optional(),
  }),
});

export const collections = { blog };
