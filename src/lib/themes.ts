// The theme catalogue. Visual values live in src/styles/themes.css under the
// matching data-theme selector; this file only describes them.

export interface Theme {
  id: string;
  name: string;
  tagline: string;
  /** Kinds of sites the theme is designed for. */
  domains: string[];
  description: string;
}

export const themes: Theme[] = [
  {
    id: 'nova',
    name: 'Nova',
    tagline: 'Sharp and technical',
    domains: ['Developer blogs', 'SaaS and startups', 'Documentation', 'Product sites'],
    description:
      'Violet accent on neutral greys, tight headings, modest radii. Reads as a tool built by engineers. This is the default.',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    tagline: 'Composed and trustworthy',
    domains: ['Corporate sites', 'Finance and insurance', 'Legal and consulting', 'B2B services'],
    description:
      'Navy accent, square corners, conservative type. Nothing distracts from the content, which is the point for a firm that sells confidence.',
  },
  {
    id: 'paper',
    name: 'Paper',
    tagline: 'Editorial and long-form',
    domains: ['News and magazines', 'Publishing', 'Essays and newsletters', 'Research'],
    description:
      'Warm off-white page, serif body and display type, an oxblood accent. Built for reading at length, where most of the value is the text itself.',
  },
  {
    id: 'pop',
    name: 'Pop',
    tagline: 'Bold and friendly',
    domains: ['Creative agencies', 'Portfolios', 'Events and communities', 'Consumer brands'],
    description:
      'Coral accent, rounded corners everywhere, pill buttons and a rounded humanist typeface. Loud enough for a studio that wants personality.',
  },
  {
    id: 'fern',
    name: 'Fern',
    tagline: 'Calm and natural',
    domains: ['Health and wellness', 'Food and hospitality', 'Sustainability', 'Education and non-profits'],
    description:
      'Green accent on a faintly tinted page, soft radii, gentle contrast. Approachable without being soft on legibility.',
  },
];

const requested = (import.meta.env.SITE_THEME as string | undefined)?.trim();

/** Theme baked into the HTML at build time. Set SITE_THEME to change it per deployment. */
export const defaultTheme: string = themes.some((t) => t.id === requested) ? requested! : 'nova';

if (requested && requested !== defaultTheme) {
  console.warn(`[themes] Unknown SITE_THEME "${requested}", falling back to "${defaultTheme}".`);
}
