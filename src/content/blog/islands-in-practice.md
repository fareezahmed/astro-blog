---
title: "One island, and what it taught me about the rest of the page"
description: "The blog index on this site has a React search box and nothing else that runs in the browser. Here's how that works and what to watch for."
pubDate: 2026-10-28
tags: [astro, islands, react, performance]
---

The blog index on this site has a search box. It filters posts as you type, so it needs JavaScript. Nothing else on that page does. Islands architecture is the pattern that lets the search box have its JavaScript without the header, the footer and the post cards paying for it, and until I built one I didn't fully believe it was that simple.

## What happens when you build

The component is ordinary React. I didn't change anything about how I'd write it elsewhere:

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

The page drops it in with one directive:

```astro
<PostSearch client:load posts={searchable} />
```

When `astro build` runs, Astro renders the component to HTML on the server, so the page already contains the input and the full list of posts before any script loads. Then it emits a small script for this one component, serialises its props, and wraps the HTML in an `<astro-island>` element. In the browser that element loads React and the component and hydrates the markup in place. Search starts working a beat after the page appears. Nothing around it changes.

Delete `client:load` and the component still renders, as HTML, with no script and no React anywhere in the bundle. That's the default for every framework component in Astro, and it took me a while to stop expecting the framework to show up uninvited.

## Picking the directive

The directive is a loading priority, and I've settled on a habit. `client:load` for anything the visitor will touch immediately; the search box is at the top of the page so it gets this. `client:idle` for things that can wait a moment, like the theme picker in the header on this site, which nobody needs in the first hundred milliseconds. `client:visible` for anything below the fold. A comments widget at the bottom of a post has no business loading before someone scrolls there, and it takes a `rootMargin` if you want it to start a bit early. `client:media` with a query for components that only exist at some screen sizes, a mobile menu say. And `client:only="react"` when the component can't render on the server at all, usually because it touches `window` during render. You lose the server-rendered HTML with that one, so I treat it as a last resort.

## The rules I keep bumping into

Props have to be serialisable. Astro writes them into the page as JSON so the browser can rebuild them. Strings, numbers, arrays, plain objects. Collection entries carry functions and internals, which is why my blog page flattens them to plain objects first. I learned this from a build error, which is the right way to learn it.

Islands don't share state through props. Two islands on a page are two separate apps. If they need to talk, use the URL, a custom event, or a tiny store; the Astro docs suggest nanostores and I'd go along with that. On this site the theme gallery page talks to the header picker with a custom event, which is about as low-tech as it gets and works fine.

Keep the island boundary tight. If a card has a static title and a like button, the button is the island, not the card.

And honestly, reach for HTML first. A `<details>` element, a CSS-only tab bar, a native `<dialog>`. A surprising amount of "interactivity" doesn't need a script, and every island you don't ship is one that can't break.

## The other kind of island

There's a mirror image. A component marked `server:defer` is skipped when the page is rendered and cached, and fetched on its own after the page loads, with fallback content in the slot meanwhile. It's for dynamic bits inside an otherwise cacheable page: a cart count, a "welcome back", a recommendations block. It needs on-demand rendering, so it needs an adapter, which is the one way it differs from client islands, which are happy on a fully static build.

## See it for yourself

Build the site and look in `dist/`. Every post page is HTML and a stylesheet. The blog index has one extra script tag for the search, and the network panel shows React loading only there. That's the whole promise: interactivity is paid for only by the pages that use it, and only for the component that needs it.
