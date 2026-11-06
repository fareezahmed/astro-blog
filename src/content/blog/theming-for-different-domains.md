---
title: "One code base, five themes: theming an Astro site for different domains"
description: "How this site switches between looks for tech, corporate, editorial, creative and wellness sites with CSS variables, Tailwind 4 tokens and a build-time setting."
pubDate: 2026-11-05
tags: [astro, tailwind, design, theming]
---

A WordPress site gets its look from a theme, and the theme directory has thousands of them because a law firm, a food blog and a developer newsletter should not look the same. This site now has five themes of its own, each aimed at a kind of business, and the mechanism is small enough to explain in one post.

## Pick a theme per deployment

Set `SITE_THEME` when you build:

```bash
SITE_THEME=atlas npm run build
```

The layout writes it onto the root element as `data-theme="atlas"`, and every colour, font and corner radius on the site follows. Deploy the same repository three times with three values and you have three differently branded sites with identical content and code. Visitors can also try any theme live from the picker in the header, and the gallery on the Themes page shows them side by side.

| Theme   | Designed for                                                          |
| ------- | --------------------------------------------------------------------- |
| Nova    | Developer blogs, SaaS, documentation, product sites (default)         |
| Atlas   | Corporate, finance, legal, consulting, B2B                            |
| Paper   | News, magazines, publishing, essays                                   |
| Pop     | Creative agencies, portfolios, events, consumer brands                |
| Fern    | Health and wellness, food, sustainability, education, non-profits     |

## Semantic tokens instead of colours

The old components said things like `bg-white text-slate-800 dark:bg-slate-950 dark:text-slate-200`. That is four decisions baked into every element, and a theme would have to rewrite all of them. The refactor replaced them with names that describe a role, not a colour:

- `surface` and `surface-muted` for backgrounds
- `ink`, `ink-soft` and `ink-muted` for text
- `line` and `line-strong` for borders
- `brand`, `brand-strong`, `brand-soft` and `brand-contrast` for the accent
- `card` and `btn` radii

So a card is now `rounded-card border border-line bg-surface text-ink`, and it has no idea which theme it is in.

## Wiring tokens into Tailwind 4

Tailwind 4 reads design tokens from CSS. The `inline` keyword makes utilities reference the variable at runtime instead of copying its value, which is what allows swapping themes without rebuilding:

```css
@theme inline {
  --color-brand: var(--brand);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --radius-card: var(--radius-card);
  --font-sans: var(--font-body);
}
```

Each theme is then a block of variables:

```css
[data-theme='paper'] {
  --font-body: Georgia, 'Times New Roman', serif;
  --radius-card: 0.25rem;
  --l-brand: oklch(0.5 0.19 27);   /* light mode */
  --d-brand: oklch(0.76 0.15 30);  /* dark mode */
  /* ... */
}
```

Light and dark values are written side by side, and one rule at the bottom of the file picks the right set based on `prefers-color-scheme` or an explicit `data-mode` attribute. Themes never repeat the dark-mode logic, and the components never mention dark mode at all. The Typography plugin that renders Markdown exposes its own variables, so the same tokens are mapped onto `--tw-prose-body`, `--tw-prose-links` and friends and the article pages follow along.

## Previewing a theme inside another

Because the live variables are resolved on any element that carries `data-theme`, not only on the root, the gallery renders each card with its own attribute and the card shows that theme's real colours and fonts while the rest of the page stays in the current one. No screenshots, no duplicated CSS.

## Avoiding the flash

A visitor who picked Paper last week should not see Nova for a frame on their next visit. A four-line inline script in the head reads `localStorage` and sets the attributes before the stylesheet renders. It is the one piece of JavaScript on the site that runs on every page, and it is small enough to be invisible.

## Adding a sixth theme

Add a block to `src/styles/themes.css` with the same variable names, and an entry to the catalogue in `src/lib/themes.ts` describing who it is for. Nothing else changes. If a client wants their exact brand colour, swapping one `--l-brand` value is the whole job.
