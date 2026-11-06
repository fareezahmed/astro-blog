import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPublishedPosts } from '../lib/posts';
import { url } from '../lib/url';

// A file in src/pages that exports GET is an endpoint. This one is prerendered
// to dist/rss.xml at build time.
export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();
  return rss({
    title: 'Astro Field Notes',
    description: 'A developer blog about Astro, content collections, islands and headless WordPress.',
    // Channel link includes `base` so it is right on GitHub Pages too.
    site: new URL(import.meta.env.BASE_URL, context.site).href,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: url(`/blog/${post.id}/`),
      categories: post.data.tags,
    })),
    customData: '<language>en-us</language>',
  });
}
