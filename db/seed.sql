INSERT OR IGNORE INTO pattern_stats (slug, views, likes, downloads) VALUES
  ('peony-granny-square-cardigan', 1502, 301, 188),
  ('blush-puff-envelope-bag',       940, 168,  74),
  ('rose-quartz-baby-dress',        812, 145,  63),
  ('strawberry-cream-blanket',     1104, 233, 118),
  ('rosewater-crossbody-pouch',     676, 121,  52),
  ('mauve-boho-market-tote',        655,  98,  41);

INSERT OR IGNORE INTO media_files (r2_key, slug, kind, title, gated) VALUES
  ('patterns/blush-puff-envelope-bag.pdf', 'blush-puff-envelope-bag', 'pdf', 'Blush Puff Envelope Bag — PDF', 0),
  ('patterns/peony-granny-square-cardigan.pdf', 'peony-granny-square-cardigan', 'pdf', 'Peony Cardigan — PDF', 1);
