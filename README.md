# Crochet Atelier — Astro theme for crochet patterns

قالب موقع باترونات كروشيه بتصميم تحريري (Editorial) وهوية وردية، مبني على **Astro 5** ومنشور على **Cloudflare Workers** مع **D1 + KV + R2**.

---

## ما الذي يحتويه القالب

| الجزء | الوصف |
| --- | --- |
| الصفحة الرئيسية | Hero تحريري + فهرس التصنيفات + أقسام "Issue no. 0X" + أحدث الإضافات + تعريف بالكاتبة |
| مكتبة الباترونات | `/patterns` مع فلترة بالتصنيف والمستوى وترتيب، ومزامنة الفلاتر مع الرابط |
| صفحة الباترون | مواصفات جانبية، فهرس محتوى، أزرار (تحميل PDF، إعجاب، طباعة، عدّاد مشاهدات)، مقترحات، JSON-LD من نوع `HowTo` |
| صفحات التصنيف | `/category/<key>` لكل مجموعة من ثمانٍ |
| صفحات ثابتة | About · Contact · Privacy · Terms · Disclaimer · 404 |
| البحث | نافذة بحث فورية (⌘K / Ctrl+K) على فهرس `/search.json` يُبنى وقت البناء |
| SEO | sitemap · RSS · robots · Open Graph · JSON-LD |

### أين تُستخدم موارد Cloudflare

| المورد | الربط (binding) | الاستخدام |
| --- | --- | --- |
| **D1** | `DB` | المشتركون، الرسائل، إحصاءات كل باترون (مشاهدات/إعجابات/تحميلات)، التقييمات، سجل ملفات R2 |
| **KV** | `CACHE` | كاش استعلامات D1 (الأكثر رواجًا) + تحديد المعدّل (rate limiting) لمنع السبام |
| **KV** | `SETTINGS` | إعدادات قابلة للتغيير فورًا دون إعادة بناء (شريط الإعلان مثلًا) |
| **KV** | `SESSION` | جلسات Astro (يطلبها محوّل Cloudflare) |
| **R2** | `MEDIA` | ملفات PDF للباترونات وصور عالية الدقة، مع وكيل `/media/<key>` وكاش دائم |

المسارات التي تلمس هذه الموارد:

```
POST /api/newsletter           → D1 (subscribers) + KV (rate limit)
GET  /api/newsletter?token=…   → D1 (إلغاء الاشتراك)
POST /api/contact              → D1 (messages) + KV (rate limit)
POST /api/like                 → D1 (likes)    + KV (إعجاب واحد لكل زائر يوميًا)
GET|POST /api/stats/<slug>     → D1 (views)    + KV (مشاهدة واحدة كل 6 ساعات)
GET  /api/trending             → D1 + KV (كاش 10 دقائق)
GET  /api/settings             → KV (SETTINGS)
GET  /api/download/<r2-key>    → R2 (تنزيل) + D1 (عدّاد التحميل + التحقّق من الحماية)
GET  /media/<r2-key>           → R2 (عرض عام + ETag + كاش سنة)
```

---

## التشغيل محليًا

```bash
npm install
npm run dev
```

الموقع على <http://localhost:4321>. المحوّل يوفّر D1/KV/R2 محليًا عبر Miniflare (تُخزَّن البيانات في `.wrangler/`).

### تهيئة قاعدة البيانات المحلية

```bash
npx wrangler d1 execute crochet-db --local --file=./db/schema.sql
npx wrangler d1 execute crochet-db --local --file=./db/seed.sql
```

### رفع ملف PDF إلى R2 محليًا

```bash
npx wrangler r2 object put crochet-media/patterns/my-pattern.pdf --file=./my-pattern.pdf --local --content-type=application/pdf
```

### تغيير شريط الإعلان (KV)

```bash
npx wrangler kv key put announcement "New autumn collection is live" --binding=SETTINGS --local
```

---

## النشر: GitHub ← Cloudflare

### 1) إنشاء موارد Cloudflare

```bash
npx wrangler login

npx wrangler d1 create crochet-db
npx wrangler kv namespace create CACHE
npx wrangler kv namespace create SETTINGS
npx wrangler kv namespace create SESSION
npx wrangler r2 bucket create crochet-media
```

كل أمر يطبع معرّفًا. انسخ كل معرّف إلى مكانه في `wrangler.jsonc` بدل `REPLACE_WITH_YOUR_…`.

### 2) تهيئة قاعدة البيانات على السحابة

```bash
npx wrangler d1 execute crochet-db --remote --file=./db/schema.sql
npx wrangler d1 execute crochet-db --remote --file=./db/seed.sql   # اختياري
```

### 3) رفع ملفات الباترونات إلى R2

```bash
npx wrangler r2 object put crochet-media/patterns/dusty-rose-bell-top.pdf \
  --file=./sample/dusty-rose-bell-top.pdf --content-type=application/pdf --remote
```

ثم سجّل الملف في D1 حتى يعمل عدّاد التحميل والحماية:

```sql
INSERT INTO media_files (r2_key, slug, kind, title, gated)
VALUES ('patterns/dusty-rose-bell-top.pdf', 'dusty-rose-bell-top', 'pdf', 'Dusty Rose Bell Top', 0);
```

> إن ربطت نطاقًا مخصّصًا بحاوية R2 (مثل `media.example.com`) ضعه في `vars.PUBLIC_R2_URL` داخل `wrangler.jsonc`،
> فتُخدم الصور من الحاوية مباشرة بدل المرور بـ `/media/`.

### 4) الربط مع GitHub

```bash
git init
git add .
git commit -m "Initial commit: Crochet Atelier theme"
git branch -M main
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

### 5) الربط مع Cloudflare

من لوحة Cloudflare: **Workers & Pages → Create → Workers → Import a repository** واختر المستودع، ثم:

| الحقل | القيمة |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Version command | `npx wrangler versions upload` |

الروابط (`d1_databases`, `kv_namespaces`, `r2_buckets`) تُقرأ تلقائيًا من `wrangler.jsonc`، فلا حاجة لإضافتها يدويًا في اللوحة.

بعدها كل `git push` إلى `main` يُطلق نشرًا جديدًا.

### 6) النطاق المخصّص

**Workers & Pages → مشروعك → Settings → Domains & Routes → Add custom domain**.
ثم غيّر `site` في `astro.config.mjs` إلى نطاقك النهائي وادفع التغيير (يؤثّر على sitemap و RSS و canonical).

---

## إضافة باترون جديد

أنشئ ملفًا في `src/content/patterns/my-pattern.md`:

```yaml
---
title: "Blush Puff Stitch Beanie"
excerpt: "سطر واحد يصف القطعة."
category: "accessories"        # accessories | amigurumi | baby-kids | clothing | blankets | footwear | home-decor | seasonal
cover: "/images/patterns/my-pattern.svg"
publishDate: 2026-09-20
featured: false
difficulty: "easy"             # beginner | easy | intermediate | advanced
hook: "5.0 mm (H)"
yarnWeight: "Worsted (4)"
yardage: "220 yd / 201 m"
gauge: "14 sts × 10 rows = 4 in"
time: "3-4 hours"
sizes: ["Adult S/M", "Adult L"]
stitches: ["ch", "sc", "puff"]
materials:
  - "Worsted cotton in Blush - 2 skeins"
colors: ["Blush"]
pdfKey: "patterns/my-pattern.pdf"   # اختياري — مفتاح الملف داخل R2
pdfGated: false                     # true = يتطلّب بريدًا إلكترونيًا
tags: ["beanie", "puff stitch"]
---

## Materials
...
```

المخطط الكامل في `src/content.config.ts`. الصور توضع في `public/images/patterns/`.

---

## تخصيص الهوية

كل الألوان والخطوط في كتلة `@theme` أعلى `src/styles/global.css`:

```css
--color-blush-500: #db6394;   /* الوردي الأساسي */
--color-blush-600: #c4416f;   /* أزرار الحثّ */
--color-plum-800:  #3d2438;   /* لون النصّ */
--color-cream:     #faf6f4;   /* الخلفية */
--font-display:    "Quicksand", …;
--font-serif:      "Playfair Display", …;   /* الكلمة المائلة المميّزة */
```

اسم الموقع والقوائم والتصنيفات في `src/data/site.ts`.

---

## بنية المشروع

```
src/
├─ components/     Header · Footer · Hero · PatternCard · IssueSection · SearchDialog · …
├─ content/        باترونات Markdown
├─ data/site.ts    اسم الموقع، القوائم، التصنيفات
├─ layouts/        BaseLayout (SEO + الخطوط + الهيكل)
├─ lib/cf.ts       طبقة D1 / KV / R2
├─ pages/
│  ├─ api/         مسارات ديناميكية (prerender = false)
│  ├─ media/       وكيل R2
│  ├─ patterns/    الفهرس + الصفحة المفردة
│  └─ category/    صفحة لكل تصنيف
└─ styles/         نظام التصميم (Tailwind v4)
db/                مخطط D1 + بيانات أولية + migrations
```

## الأوامر

| الأمر | الوظيفة |
| --- | --- |
| `npm run dev` | خادم التطوير مع موارد Cloudflare محليًا |
| `npm run build` | بناء الموقع إلى `dist/` |
| `npm run preview` | تشغيل النسخة المبنيّة عبر `wrangler dev` |
| `npm run deploy` | بناء + نشر إلى Cloudflare |
| `npm run db:remote` | تطبيق المخطط على D1 السحابية |
| `npm run cf-typegen` | توليد أنواع TypeScript للـ bindings |
