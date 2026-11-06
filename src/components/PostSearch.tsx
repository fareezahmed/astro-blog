import { useMemo, useState } from 'react';

// This is an Astro "island": a React component that is server-rendered to HTML
// at build time and then hydrated in the browser. The rest of the page ships
// no JavaScript at all. See src/pages/blog/index.astro for the client:load
// directive that opts this component into hydration.

export interface SearchablePost {
  id: string;
  url: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

interface Props {
  posts: SearchablePost[];
}

export default function PostSearch({ posts }: Props) {
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const tags = useMemo(() => [...new Set(posts.flatMap((p) => p.tags))].sort(), [posts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesTag = !activeTag || post.tags.includes(activeTag);
      const matchesQuery =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.tags.some((t) => t.includes(q));
      return matchesTag && matchesQuery;
    });
  }, [posts, query, activeTag]);

  return (
    <div>
      <label className="block">
        <span className="sr-only">Search posts</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts by title, description or tag…"
          className="w-full rounded-btn border border-line-strong bg-surface px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTag(null)}
          className={chip(activeTag === null)}
        >
          All
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveTag(tag === activeTag ? null : tag)}
            className={chip(tag === activeTag)}
          >
            #{tag}
          </button>
        ))}
      </div>

      <p className="mt-4 text-xs text-ink-muted" aria-live="polite">
        {results.length} of {posts.length} posts
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {results.map((post) => (
          <li key={post.id} className="rounded-card border border-line p-5">
            <p className="mb-2 text-xs text-ink-muted">{post.date}</p>
            <h2 className="text-lg font-semibold leading-snug">
              <a href={post.url} className="hover:text-brand">
                {post.title}
              </a>
            </h2>
            <p className="mt-2 text-sm text-ink-soft">{post.description}</p>
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <p className="mt-6 rounded-btn bg-surface-muted p-6 text-center text-sm text-ink-muted">
          Nothing matches “{query}”. Try another word or clear the tag filter.
        </p>
      )}
    </div>
  );
}

function chip(active: boolean) {
  return [
    'rounded-full px-3 py-1 text-xs transition',
    active
      ? 'bg-brand text-brand-contrast'
      : 'bg-surface-muted text-ink hover:bg-brand-soft',
  ].join(' ');
}
