-- ╔══════════════════════════════════════════════════════════╗
-- ║  Crochet Pattern Theme — Cloudflare D1 schema            ║
-- ╚══════════════════════════════════════════════════════════╝

-- 1) المشتركون في النشرة البريدية
CREATE TABLE IF NOT EXISTS subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT    NOT NULL UNIQUE,
  name        TEXT,
  source      TEXT    DEFAULT 'site',        -- footer | popup | pattern-page ...
  status      TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active','unsubscribed','bounced')),
  token       TEXT    NOT NULL,              -- توكن إلغاء الاشتراك
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_subscribers_status ON subscribers(status);

-- 2) إحصاءات كل باترون (مشاهدات / إعجابات / تحميلات)
CREATE TABLE IF NOT EXISTS pattern_stats (
  slug        TEXT PRIMARY KEY,
  views       INTEGER NOT NULL DEFAULT 0,
  likes       INTEGER NOT NULL DEFAULT 0,
  downloads   INTEGER NOT NULL DEFAULT 0,
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- 3) تقييمات القرّاء (1..5)
CREATE TABLE IF NOT EXISTS ratings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL,
  stars       INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  visitor     TEXT    NOT NULL,              -- بصمة مجهولة (hash)
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (slug, visitor)
);
CREATE INDEX IF NOT EXISTS idx_ratings_slug ON ratings(slug);

-- 4) تعليقات (بحاجة موافقة قبل النشر)
CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    NOT NULL,
  author      TEXT    NOT NULL,
  email       TEXT,
  body        TEXT    NOT NULL,
  approved    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_slug ON comments(slug, approved);

-- 5) رسائل نموذج التواصل
CREATE TABLE IF NOT EXISTS messages (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  subject     TEXT,
  body        TEXT NOT NULL,
  handled     INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 6) سجل ملفات R2 (PDF / صور) لربطها بالباترونات
CREATE TABLE IF NOT EXISTS media_files (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key      TEXT NOT NULL UNIQUE,          -- patterns/dusty-rose-bell-top.pdf
  slug        TEXT,                          -- الباترون المرتبط
  kind        TEXT NOT NULL DEFAULT 'pdf' CHECK (kind IN ('pdf','image','chart','zip')),
  title       TEXT,
  size_bytes  INTEGER,
  gated       INTEGER NOT NULL DEFAULT 0,    -- 1 = يتطلب بريدًا إلكترونيًا
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_slug ON media_files(slug);

-- 7) قائمة "مفضلاتي" لكل زائر (مرتبطة بكوكي مجهول)
CREATE TABLE IF NOT EXISTS favorites (
  visitor     TEXT NOT NULL,
  slug        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (visitor, slug)
);
