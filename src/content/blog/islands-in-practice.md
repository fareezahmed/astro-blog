---
title: "Islands architecture in practice"
description: "How one React component on an otherwise static page gets hydrated, what the client directives mean, and how to keep islands small."
pubDate: 2026-10-28
tags: [astro, islands, react, performance]
---

The blog index on this site has a search box. It filters posts as you type, so it needs JavaScript. Nothing else on the page does. Islands architecture is the pattern that lets the search box have its JavaScript without the header, footer and post cards paying for it.

## What happens at build time

The component is ordinary React:

```tsx
// src/components/PostSearch.tsx
export default function PostSearch({ posts }: Props) {
  const [query, setQuery] = useState('');
  const results = posts.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()));
  return (
    <div>
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>{results.map((p) => <li key={p.id}><a href={p.url}>{p.title}</a></li>)}</ul>
    </div>
  );
}
```

The page includes it with a directive:

```astro
<PostSearch client:load posts={searchable} />
```

During `astro build`, Astro renders the component to HTML on the server, so the initial page already contains the input and the full list of posts. It then emits a small script for this component and a serialised copy of its props, wrapped in an `<astro-island>` custom element. In the browser, that element loads React and the component, and hydrates the markup in place. Search works a moment later; everything else on the page never changes.

Remove `client:load` and the same component still renders, but as inert HTML, with no script and no React in the bundle. That is the default for every framework component in Astro.

## Choosing a directive

The directive is a loading strategy, and the choice is about priority:

- `client:load` for anything the visitor will use immediately. The search box qualifies because it is at the top of the page.
- `client:idle` for things that can wait a beat, such as a newsletter signup or analytics-driven widgets.
- `client:visible` for anything below the fold. A comment widget at the bottom of a post should not load until someone scrolls there. It takes an optional `rootMargin` to start loading early.
- `client:media="(max-width: 50em)"` for components that exist only at some screen sizes, such as a mobile menu.
- `client:only="react"` when the component cannot render on the server at all, for example because it reads `window` during render. You lose the server-rendered HTML, so use it sparingly.

## Rules that keep islands cheap

**Props must be serialisable.** Astro writes props into the HTML as JSON so the browser can re-create them. Pass strings, numbers, arrays and plain objects. The blog page maps collection entries, which carry functions and non-serialisable internals, down to plain objects first.

**Islands do not share state through props.** Two islands on one page are two independent apps. If they need to talk, use a nano store, the URL, or a custom event. Astro's docs recommend `nanostores` for this.

**Keep the island's boundary tight.** Wrap only the part that needs state. If a card has a static title and a "like" button, make the button the island, not the card.

**Prefer HTML and CSS first.** A details/summary element, a CSS-only tab bar, or a native `<dialog>` often does the job with no script at all. Islands are for state the browser cannot manage on its own.

## Server islands

The mirror image exists too. A component marked `server:defer` is skipped when the page is rendered and cached, and fetched separately after the page loads, with fallback content in the slot meanwhile. It is for dynamic, personalised content inside an otherwise cacheable page: a shopping-cart count, a "welcome back" line, a recommendation block. It needs on-demand rendering, so it requires an adapter, unlike client islands which work on a fully static build.

## Measuring it

Build the site and look at `dist/`. Every post page is HTML with a stylesheet. The blog index has one extra script tag for the search island, and the network panel shows React loading only on that page. That is the whole promise of the pattern: the cost of interactivity is paid only by the pages that use it, and only for the component that needs it.
