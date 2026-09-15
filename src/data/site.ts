export const site = {
  name: 'Maschenstube',
  tagline: 'Häkeln für moderne Macherinnen',
  description:
    'Ein liebevoll kuratiertes Zuhause für alle, die klare Linien und schöne Texturen lieben — Taschen, Decken, Babykleidung und mehr. Alles kostenlos, alles mit Sorgfalt geschrieben.',
  author: 'Mia',
  email: 'hallo@maschenstube.de',
  url: 'https://maschenstube.de',
  locale: 'de',
  social: [
    { label: 'Pinterest', href: 'https://pinterest.com/', icon: 'pinterest' },
    { label: 'Instagram', href: 'https://instagram.com/', icon: 'instagram' },
    { label: 'Ravelry', href: 'https://ravelry.com/', icon: 'ravelry' },
    { label: 'YouTube', href: 'https://youtube.com/', icon: 'youtube' },
  ],
} as const;

export const nav = [
  { label: 'Start', href: '/' },
  { label: 'Anleitungen', href: '/patterns' },
  { label: 'Kategorien', href: '/#the-index' },
  { label: 'Saisonal', href: '/category/seasonal' },
  { label: 'Über mich', href: '/about' },
  { label: 'Kontakt', href: '/contact' },
] as const;

export type CategoryKey =
  | 'accessories' | 'baby-kids' | 'clothing'
  | 'blankets' | 'footwear' | 'home-decor' | 'seasonal';

export const categories: {
  key: CategoryKey; no: string; title: string; blurb: string; kicker: string;
}[] = [
  { key: 'accessories', no: '01', title: 'Accessoires',          kicker: 'zum Mitnehmen',   blurb: 'Taschen, Beutel, Schals und alles, wonach du auf dem Weg nach draußen greifst.' },
  { key: 'baby-kids',   no: '02', title: 'Baby & Kind',          kicker: 'kleine Werke',    blurb: 'Weich, sicher und süß — in Größen für die allerkleinsten Menschen.' },
  { key: 'clothing',    no: '03', title: 'Kleidung & Tragbares', kicker: 'zum Reinleben',   blurb: 'Cardigans, Pullover und Überwürfe mit modernen, dezenten Silhouetten.' },
  { key: 'blankets',    no: '04', title: 'Decken & Plaids',      kicker: 'zum Behalten',    blurb: 'Squares, Wellen und Überwürfe für jede Ecke des Hauses.' },
  { key: 'footwear',    no: '05', title: 'Schuhe',               kicker: 'leise treten',    blurb: 'Hausschuhe, Babyschühchen und Socken in Runden gehäkelt.' },
  { key: 'home-decor',  no: '06', title: 'Deko',                 kicker: 'fürs Zuhause',    blurb: 'Körbe, Untersetzer, Blumenampeln und Wandobjekte.' },
  { key: 'seasonal',    no: '07', title: 'Saisonal & Feste',     kicker: 'pünktlich da',    blurb: 'Herbst, Winter und alles, wofür sich Dekorieren lohnt.' },
];

export const categoryMap = Object.fromEntries(categories.map((c) => [c.key, c]));

export const difficulties = ['beginner', 'easy', 'intermediate', 'advanced'] as const;

/** Deutsche Anzeigenamen für die (intern englischen) Schwierigkeitsstufen. */
export const difficultyLabels: Record<string, string> = {
  beginner: 'Anfänger',
  easy: 'Leicht',
  intermediate: 'Mittel',
  advanced: 'Fortgeschritten',
};
