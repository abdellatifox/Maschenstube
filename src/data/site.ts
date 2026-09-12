export const site = {
  name: 'Crochet Atelier',
  tagline: 'Crochet for modern makers',
  description:
    'A curated home for crocheters who love clean lines and gorgeous textures — bags, amigurumi, baby clothes and more. All free, all written with care.',
  author: 'Mia',
  email: 'hello@crochetatelier.com',
  url: 'https://crochet-theme.pages.dev',
  locale: 'en',
  social: [
    { label: 'Pinterest', href: 'https://pinterest.com/', icon: 'pinterest' },
    { label: 'Instagram', href: 'https://instagram.com/', icon: 'instagram' },
    { label: 'Ravelry', href: 'https://ravelry.com/', icon: 'ravelry' },
    { label: 'YouTube', href: 'https://youtube.com/', icon: 'youtube' },
  ],
} as const;

export const nav = [
  { label: 'Home', href: '/' },
  { label: 'Patterns', href: '/patterns' },
  { label: 'Categories', href: '/#the-index' },
  { label: 'Seasonal', href: '/category/seasonal' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export type CategoryKey =
  | 'accessories' | 'amigurumi' | 'baby-kids' | 'clothing'
  | 'blankets' | 'footwear' | 'home-decor' | 'seasonal';

export const categories: {
  key: CategoryKey; no: string; title: string; blurb: string; kicker: string;
}[] = [
  { key: 'accessories', no: '01', title: 'Accessories',        kicker: 'worth carrying',  blurb: 'Bags, totes, scarves and everything you reach for on the way out.' },
  { key: 'amigurumi',   no: '02', title: 'Amigurumi & Toys',   kicker: 'creatures',       blurb: 'Small stuffed friends with big personalities.' },
  { key: 'baby-kids',   no: '03', title: 'Baby & Kids',        kicker: 'little makes',    blurb: 'Soft, safe and sweet — sized for the tiniest people.' },
  { key: 'clothing',    no: '04', title: 'Clothing & Wearables',kicker: 'you will live in',blurb: 'Tops, cardigans and cover-ups with modern silhouettes.' },
  { key: 'blankets',    no: '05', title: 'Blankets & Afghans', kicker: 'made to keep',    blurb: 'Squares, ripples and throws for every corner of the house.' },
  { key: 'footwear',    no: '06', title: 'Footwear',           kicker: 'step softly',     blurb: 'Slippers, booties and socks worked in the round.' },
  { key: 'home-decor',  no: '07', title: 'Home Decor',         kicker: 'for the house',   blurb: 'Baskets, coasters, plant hangers and wall pieces.' },
  { key: 'seasonal',    no: '08', title: 'Seasonal & Holidays',kicker: 'right on time',   blurb: 'Autumn, winter and everything worth decorating for.' },
];

export const categoryMap = Object.fromEntries(categories.map((c) => [c.key, c]));

export const difficulties = ['beginner', 'easy', 'intermediate', 'advanced'] as const;
