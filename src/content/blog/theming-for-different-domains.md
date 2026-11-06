---
title: "Five themes from one code base, and how I wired them"
description: "This site can look like a dev blog, a law firm, a magazine, a design studio or a wellness brand. CSS variables, Tailwind 4 tokens, and one build-time setting."
pubDate: 2026-11-05
tags: [astro, tailwind, design, theming]
cover: ./covers/theming-for-different-domains.png
coverAlt: "Cover: the post title beside a grid of page blocks with one lit island."
---

A WordPress site gets its look from a theme, and the theme directory has thousands of them because a law firm, a food blog and a developer newsletter shouldn't look the same. I wanted the same flexibility here without the same mess, so this site has five themes, each aimed at a kind of business, and the whole mechanism is small enough to explain in a few minutes.

## Picking one

Set `SITE_THEME` when you build:

```bash
SITE_THEME=atlas npm run build
```

The layout writes it onto the root element as `data-theme="atlas"` and every colour, font and corner radius follows. Deploy the same repository three times with three values and you've got three differently branded sites with identical content and code. Visitors can also try any theme from the picker in the header, and the Themes page shows them side by side.

Nova is the default and it's what you'd expect from a developer blog. Atlas is navy and square for corporate, finance, legal and consulting sites. Paper is serif on cream for news, magazines and essays. Pop is coral and rounded for agencies, portfolios and events. Fern is green and soft for health, food, sustainability and non-profits. I'm not a designer and I'd welcome better ones, but each is consistent and readable in light and dark, which is more than I can say for some paid WordPress themes.

## Stop naming colours

The old components said things like `bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200`. That's four decisions baked into every element, and a theme would have to rewrite all of them. The refactor replaced colours with roles: `surface` and `surface-muted` for backgrounds, `ink`, `ink-soft` and `ink-muted` for text, `line` and `line-strong` for borders, `brand` with `strong`, `soft` and `contrast` variants for the accent, and `card` and `btn` for radii.

A card is now `rounded-card border border-line bg-surface text-ink`. It has no idea which theme it's in, and it doesn't mention dark mode at all.

## Wiring it into Tailwind 4

Tailwind 4 reads its design tokens from CSS. The `inline` keyword makes utilities reference the variable at runtime instead of copying the value in, which is what lets the theme change without a rebuild:

```css
@theme inline {
  --color-brand: var(--brand);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --radius-card: var(--radius-card);
  --font-sans: var(--font-body);
}
```

Each theme is then a block of variables, light and dark side by side:

```css
[data-theme='paper'] {
  --font-body: Georgia, 'Times New Roman', serif;
  --radius-card: 0.25rem;
  --l-brand: oklch(0.5 0.19 27);   /* light */
  --d-brand: oklch(0.76 0.15 30);  /* dark */
  /* ... */
}
```

One rule at the bottom of the file picks the light or dark set based on `prefers-color-scheme`, or an explicit `data-mode` attribute if the visitor has overridden it. Themes never repeat the dark-mode logic. The Typography plugin that renders Markdown has its own variables, so I mapped the same tokens onto `--tw-prose-body`, `--tw-prose-links` and friends and the posts follow along.

## The trick I'm most pleased with

The live variables are resolved on any element with a `data-theme` attribute, not just the root. So the gallery page renders each card with its own attribute, and that card shows the theme's real colours and fonts while the rest of the page stays in whatever you're using. No screenshots, no duplicated CSS, and when I tweak a theme the preview is right by definition.

## And the thing I got wrong

My first version of that stylesheet had a comment containing `--l-*/--d-*`, and the `*/` in the middle closed the comment early. Everything after it was silently dropped and the site rendered in black and white. The build printed a warning that I didn't read until the second time. Read your build warnings.

## The flash

A visitor who picked Paper last week shouldn't see Nova for a frame on their next visit. A four-line inline script in the head reads `localStorage` and sets the attributes before the stylesheet paints. It's the only JavaScript on the site that runs on every page, and it's small enough that I don't feel bad about it.

## Adding one

Add a block to `src/styles/themes.css` with the same variable names and an entry to `src/lib/themes.ts` saying who it's for. Nothing else changes. If a client wants their exact brand colour, changing one `--l-brand` value is the entire job, which is the kind of job I like.
