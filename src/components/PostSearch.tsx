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
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-slate-800"
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

      <p className="mt-4 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
        {results.length} of {posts.length} posts
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-2">
        {results.map((post) => (
          <li key={post.id} className="rounded-xl border border-slate-200 p-5 dark:border-slate-800">
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">{post.date}</p>
            <h2 className="text-lg font-semibold leading-snug">
              <a href={post.url} className="hover:text-brand-600 dark:hover:text-brand-400">
                {post.title}
              </a>
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{post.description}</p>
          </li>
        ))}
      </ul>

      {results.length === 0 && (
        <p className="mt-6 rounded-lg bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-900">
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
      ? 'bg-brand-600 text-white'
      : 'bg-slate-100 text-slate-700 hover:bg-brand-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  ].join(' ');
}
