---
title: "Can Astro replace WordPress? Depends who's typing."
description: "The question I get asked most. The answer comes down to who writes the content, and there are three sensible ways to go depending on that."
pubDate: 2026-11-04
tags: [astro, wordpress, headless, decision]
cover: ./covers/astro-vs-wordpress.png
coverAlt: "Cover: the post title beside a grid of page blocks with one lit island."
---

WordPress runs something like two in five websites. Astro is a build tool that turns files into HTML. Asking whether one replaces the other is a bit like asking whether a bicycle replaces a city. And yet it's the question I get asked most, because the two overlap exactly where most WordPress sites live: a blog, a marketing site, some docs, a small catalogue.

Here's my short answer. Astro replaces WordPress the *front end* easily, and WordPress the *editing experience* only if your writers are comfortable with Markdown and Git. Everything else is detail. So before anything, find out who types.

## Give WordPress its due

It's easy to list what's wrong with WordPress and forget why it won. It has an editor that anyone can use without a training session. Drafts, previews, scheduling, revisions and user roles, all out of the box. A media library that makes the thumbnails for you. A plugin for every need you've ever had and several you haven't: SEO, forms, comments, shops via WooCommerce, memberships, translations. And a hosting industry that will run it for you and take the 3am calls.

None of that is a rendering technology. It's product. A faster rendering engine does not replace it, and anyone who tells you otherwise is selling a rendering engine.

## What Astro gives you instead

Speed, by construction. Pages are HTML on a CDN with no JavaScript unless you add an island. On the Core Web Vitals numbers Astro publishes, 71 percent of Astro sites pass against 48 percent of WordPress sites, and the gap is mostly because the Astro default is to ship nothing.

Nothing to attack. No PHP, no database, no admin login on the public internet. The two most common WordPress incidents I've seen, a stale plugin and a brute-forced login, simply have no equivalent.

Hosting that costs nothing. GitHub Pages, Netlify, Vercel and Cloudflare all host a site this size for free.

A developer's workflow. Content in Git, review in pull requests, a build that fails loudly when the frontmatter is wrong, and no orange "update now" banner ever again.

And any data source. A loader can read Markdown, a REST API, a headless CMS or a database and hand you the same typed collection either way.

## Three ways this goes

**You replace WordPress outright.** Content becomes Markdown in the repo. This is right when the people writing are the people committing, or are willing to learn a Git-backed editor. Developer blogs, documentation, open-source project sites, personal sites, agency portfolios.

The gaps are real but each has a standard answer. Forms go to Netlify Forms, Formspree, or an Astro Action if you add an adapter. Comments go to Giscus, which rides on GitHub Discussions, or get dropped. Search is Pagefind for a static index, or a small island like the one on this site. Image sizes come from `astro:assets` at build time. Scheduled posts are a date in the frontmatter and a scheduled rebuild. And if you want visual editing without WordPress, Decap, Keystatic and Tina all sit on top of a Git repo and give you a form instead of a text editor.

**You keep WordPress as the editor and let Astro serve the site.** The editors keep their admin. Astro fetches the posts over the REST API or WPGraphQL at build time and writes static pages, which is exactly what the WordPress section on this site does. The public site is static. WordPress goes behind a firewall or onto a cheap host nobody visits.

You keep the editor, previews and media library and gain speed and safety on the public side. What it costs: two systems to run, though WordPress is now much less exposed. Publishing becomes a build, triggered by a webhook, which takes seconds to a couple of minutes. Plugins that injected things into the theme, sliders and form builders and such, stop working and have to be redone in Astro. And editors who expect to preview a draft in the real design need either a preview route rendered on demand or a second deployment built from drafts.

If you've got hundreds of thousands of pages, build time becomes the constraint. Astro 7's route caching and the experimental parallel prerender help, and on-demand rendering with a CDN cache is the escape hatch.

**You stay on WordPress.** Do this if the site depends on WooCommerce, a membership plugin, BuddyPress, or a theme the team customises visually, and nobody on the team writes code. A well-run WordPress site on a managed host with a caching layer is fine. Astro won't fix an organisation with no developers, and it shouldn't try.

## The rule I actually use

If the writers commit to Git, or will learn a Git-backed editor: Astro with Markdown. If the writers need the WordPress editor and developers own the front end: Astro with headless WordPress. If the site is more plugin ecosystem than set of pages: WordPress.

## What the move looks like

For the first path, export from WordPress, convert the XML to Markdown with a tool like `wordpress-export-to-markdown`, keep the slugs so the URLs survive, add redirects for anything that changes, rebuild the theme as Astro layouts, and replace each plugin with its answer from the list above. Point DNS at the new host once the sitemaps match.

For the second path, leave WordPress where it is, install nothing, and start from the ten lines of fetch code in `src/lib/wordpress.ts` in this repository.

Either way the first week is mostly deciding what to leave behind. Every mature WordPress site carries years of plugins nobody uses, and a static rebuild is the cheapest moment you'll ever get to drop them.
