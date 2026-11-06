---
title: "So you want to leave WordPress. Here's what this project is for."
description: "A plain-spoken guide to Astro Field Notes: what's in it, who should bother, and three ways to use it instead of (or alongside) WordPress."
pubDate: 2026-11-06
tags: [astro, wordpress, guide, migration, headless]
cover: ./covers/using-astro-field-notes.png
coverAlt: "Cover: the post title beside a grid of page blocks with one lit island."
featured: true
---

I didn't set out to build a WordPress replacement. I set out to write an article about Astro and needed a real project to point at, because articles about frameworks that don't come with code are mostly vibes. Somewhere between adding a content schema and wiring up the WordPress API demo, I realised the thing I'd built was the site most small businesses actually have: a handful of pages, a blog, tags, a feed, decent SEO, and a look that can change per client. That's a WordPress site. Minus WordPress.

So this post is the one I wish existed when I was last asked "can we just get off WordPress?" by someone who was paying for managed hosting, three plugin licences and the occasional panicked clean-up after a plugin went bad. If that's you, or you're the developer that person is asking, read on. If you're happy on WordPress, you can stop here; I'm not here to convert anyone.

The code is at [github.com/fareezahmed/astro-blog](https://github.com/fareezahmed/astro-blog). It's a template repository, so the green "Use this template" button gives you your own copy.

## What's actually in the box

Let me go through it the way a WordPress person would ask about it.

Posts? Markdown files in a folder. Each one has a short header with a title, a description, a date and some tags. Astro checks that header against a schema when it builds, which sounds dull until the day a post goes live with "Invalid Date" in the byline on a site you don't own. That doesn't happen here. The build stops and names the file.

Categories and tags? Tags, with a page per tag and an index. I didn't add categories because I've never seen a small site use both well. Adding them is a one-line schema change if you disagree.

Themes? Five. I'll come back to this, because it's the part that makes the project useful for more than one site.

Search? Yes, a small one that runs in the browser over titles, descriptions and tags. It's the only React on the site, and I left it in partly to prove a point about Astro's islands: you can have one interactive widget without dragging a framework into every page.

SEO? Canonical URLs, Open Graph tags, an RSS feed, a sitemap and a robots.txt, all generated. No plugin, no settings page, nothing to renew.

Dark mode? Follows the visitor's system, with a toggle if they want to override it.

Hosting? It's a folder of HTML. GitHub Pages, Netlify, Vercel and Cloudflare all serve it for free at this size, and there's a config file for each in the repo. The demo site runs on GitHub Pages and I have not thought about it since the day I enabled it.

The editor? Here's the honest bit. There is no editor. You write Markdown in whatever you like and commit it. For me and for most developers that's a feature. For a marketing team it's a dealbreaker, and I'll show you what to do about that further down.

## Who should bother

I think this fits four kinds of people.

Developers who want a blog they understand all the way down, and who are fine writing in Markdown. That's the obvious one.

Freelancers and small shops who build sites for clients. This is the group I had in mind when I added themes. One repo, and the accountancy gets Atlas, the yoga studio gets Fern, the design agency gets Pop. When you fix a bug, every client gets the fix. WordPress child themes always promised this and I've never once seen it hold up past the second client.

Small businesses with a developer within reach, who are paying real money every month for what is, if we're honest, a dozen pages and some news posts.

And teams who already run WordPress, like their editor, and want the public site to be fast and hard to break. That one's a hybrid and it's path three below.

Who shouldn't: anyone with no developer at all. Someone has to be comfortable with a terminal and Git. If that's nobody, stay on managed WordPress. It's fine. Really.

## Path one: a new site from scratch

This takes about ten minutes, most of it waiting for `npm install`.

```bash
git clone https://github.com/fareezahmed/astro-blog my-site
cd my-site
npm install
npm run dev
```

Open `localhost:4321` and you're looking at the demo. Now gut it. Delete everything in `src/content/blog` and write your first post:

```md
---
title: We're closed over the holidays
description: Last orders on the 23rd. Back on the 2nd.
pubDate: 2026-12-15
tags: [news]
---

Short version: go and enjoy yourselves, we are.
```

Save it and the page is there. The filename is the URL.

Then open `/themes` and pick one. Put its name in a `.env` file as `SITE_THEME=fern` or whichever. Change the site name (it's in the layout and the header, I didn't bother with a config file for two strings), swap the favicon, rewrite the home page copy in `src/pages/index.astro`, and push to GitHub. Turn on Pages in the repo settings with "GitHub Actions" as the source. The workflow that's already in the repo does the rest.

After that, publishing a post is a commit. That's the whole workflow and I've come to prefer it.

## Path two: moving an existing WordPress blog

If you've got years of posts in WordPress and want them out, the process is less scary than it looks, but it's fiddly in the way all migrations are.

Export everything from Tools, Export. You get a big XML file. Feed it to a converter like `wordpress-export-to-markdown`, which spits out one Markdown file per post and pulls the images down too. Point the output at `src/content/blog` and `public/images`.

The converter's frontmatter won't quite match this project's schema. Mine wants `title`, `description`, `pubDate` and `tags`. You can rename the keys in the files, or loosen the schema in `src/content.config.ts`. Either way, run the build and it'll list every file that doesn't fit. Fix them in a batch.

The part people forget is URLs. WordPress loves `/2024/03/my-post/`. You can keep those exactly by setting a `slug` in each post's header, or add redirects at your host from the old pattern to the new. Don't skip this. Ten years of inbound links are worth more than the redesign.

Then go through your plugins and ask, for each one, whether you still need it. Forms become Netlify Forms or Formspree. Comments become Giscus, which rides on GitHub Discussions, or get dropped, which is what most blogs quietly want anyway. In my experience about half the plugins on a mature WordPress site do nothing anyone would miss.

Before switching DNS, build the new site and check every URL from the old sitemap resolves. Then switch. Leave the old WordPress running, read-only, for a month, in case something turns up. After that, turn it off and stop paying for it.

## Path three: keep WordPress, but only as the editor

This is the one I'd recommend to most teams with actual writers on staff, and it's why the demo has a WordPress section at all.

WordPress stays. Nobody has to learn Markdown. But the public site becomes this project, which asks WordPress for the posts once, at build time, over the REST API that every WordPress install already has. The visitors get static HTML from a CDN. WordPress itself can go behind a login or onto a cheap private host, because nothing public reads from it anymore except your build.

Setting it up is one line:

```bash
WP_API_URL=https://your-site.com/wp-json/wp/v2
```

Build, and `/wordpress` shows your posts with titles, dates, authors and featured images. The fetch code is in `src/lib/wordpress.ts` and it's short enough to read over coffee. It asks for only the fields it needs and caches the result so the index page and every post page share a single request. If the API is down at build time it logs a warning and the section comes out empty rather than the deploy failing, which I think is the right call for a CMS that lives on someone else's server.

To make it the main blog rather than a demo section, point the navigation and home page at `/wordpress` instead of `/blog`. Two files.

For publishing, add a webhook in WordPress that hits your host's build hook when a post is published. Netlify, Vercel and Cloudflare all give you one. A post is live a minute or so after the editor clicks the button. The thing you lose is preview inside WordPress; editors see the draft in the old theme. If that matters, you set up a second deployment that builds from drafts. It's an afternoon, not a project.

## About those themes

The theme is a single setting, `SITE_THEME`, read at build time. Nova is the default, meant for developer and product sites. Atlas is navy and square-cornered for firms that sell trust. Paper is serif on cream for anyone whose product is words. Pop is coral and round for studios. Fern is green and soft for the wellness, food and non-profit end of things.

You can preview them live on the `/themes` page, and the picker in the header lets visitors try them, which I mostly left in for demonstrations. The real use is one repository, several deployments, each with its own theme and, if you like, its own WordPress source. Adding a sixth theme is one block of CSS variables and one entry in a list. I wrote more about how that's wired in a separate post, but you don't need to understand it to use it.

## What it saves, and what it costs you

The hosting bill goes to zero or close to it. The plugin licences go away. The "something's wrong with the site" phone calls mostly stop, because there's no PHP and no database on the public internet to go wrong. For a small business WordPress site that's a few hundred to a few thousand a year in cash, and more than that in attention.

What it costs you is the admin panel, instant publishing, and plugins as a way of adding features without code. Publishing takes a build, usually under a minute. Scheduling a post means scheduling a build. Forms and comments are outside services. Very large sites, hundreds of thousands of pages, push the build time up, and at that point you'd move some of it to on-demand rendering, which Astro does but which brings a server back.

I don't think any of that is a surprise to a developer, and none of it has stopped me. But I'd rather you knew now than on launch day.

## Before you go live

Set `SITE_URL` to your real domain or the canonical tags and the sitemap will be wrong. Pick the theme. Replace the name and favicon. If you migrated, test the redirects. Wire up whatever you're using for forms. Publish one real post all the way through, from commit or editor to live page, and look at it on your phone. Add analytics if you want it; it's one script tag in the layout.

## If you change it

Please do. The project is small enough to read in an afternoon. The schema is in `src/content.config.ts`, pages are files under `src/pages`, themes are in `src/styles/themes.css`, and the WordPress client is in `src/lib/wordpress.ts`. If you build something on it, I'd like to hear about it. The whole point of calling these field notes is that they're supposed to get better with use.
