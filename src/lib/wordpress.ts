// Headless WordPress: WordPress keeps the editor and the database, Astro
// fetches the posts over the REST API at build time and renders static HTML.
// Any WordPress site exposes this API at /wp-json/wp/v2/ unless it is disabled.
// Point WP_API_URL at your own site; the default is the official WordPress.com
// blog, which is public and needs no credentials. A self-hosted site looks like
// https://your-site.com/wp-json/wp/v2 and a WordPress.com site like
// https://public-api.wordpress.com/wp/v2/sites/your-site.wordpress.com

const API_URL = (
  import.meta.env.WP_API_URL ?? 'https://public-api.wordpress.com/wp/v2/sites/en.blog.wordpress.com'
).replace(/\/$/, '');

/** Human-facing URL of the source site, for the credit line on the demo page. */
export const WP_SOURCE = API_URL.includes('public-api.wordpress.com/wp/v2/sites/')
  ? `https://${API_URL.split('/sites/')[1]}`
  : API_URL.replace(/\/wp-json\/wp\/v2$/, '');

export interface WpPost {
  id: number;
  slug: string;
  link: string;
  date: Date;
  title: string;
  excerpt: string;
  content: string;
  author?: string;
  featuredImage?: { src: string; alt: string; width?: number; height?: number };
}

// `_fields` trims the payload; `_embed` inlines the author and featured image
// so we need one request instead of three per post.
const FIELDS = 'id,slug,link,date,title,excerpt,content,_links,_embedded';

type Raw = {
  id: number;
  slug: string;
  link: string;
  date: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    author?: { name?: string }[];
    'wp:featuredmedia'?: {
      source_url?: string;
      alt_text?: string;
      media_details?: { width?: number; height?: number; sizes?: Record<string, { source_url: string; width: number; height: number }> };
    }[];
  };
};

function normalize(raw: Raw): WpPost {
  const media = raw._embedded?.['wp:featuredmedia']?.[0];
  const size = media?.media_details?.sizes?.medium_large ?? media?.media_details?.sizes?.large;
  return {
    id: raw.id,
    slug: raw.slug,
    link: raw.link,
    date: new Date(raw.date),
    title: raw.title.rendered,
    excerpt: raw.excerpt.rendered,
    content: raw.content.rendered,
    author: raw._embedded?.author?.[0]?.name,
    featuredImage: media?.source_url
      ? {
          src: size?.source_url ?? media.source_url,
          alt: media.alt_text ?? '',
          width: size?.width ?? media.media_details?.width,
          height: size?.height ?? media.media_details?.height,
        }
      : undefined,
  };
}

let cache: Promise<WpPost[]> | undefined;

/**
 * Fetch the latest posts once per build. Every page that needs WordPress data
 * shares the same promise, so the API is hit a single time no matter how many
 * pages render from it. A network failure logs a warning and yields an empty
 * list so an unreachable CMS never breaks the build.
 */
export function getWpPosts(perPage = 12): Promise<WpPost[]> {
  cache ??= (async () => {
    const endpoint = `${API_URL}/posts?per_page=${perPage}&_embed=1&_fields=${FIELDS}`;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = (await res.json()) as Raw[];
      return data.map(normalize);
    } catch (error) {
      console.warn(`[wordpress] Could not fetch ${endpoint}:`, error);
      return [];
    }
  })();
  return cache;
}
