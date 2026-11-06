// Astro does not rewrite `href`s for you when `base` is set (GitHub Pages
// serves project sites from /<repo>/). Route every internal link through this
// helper so one code base works at the domain root and under a sub-path.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export function url(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
