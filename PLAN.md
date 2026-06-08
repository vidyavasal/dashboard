# IODE Business Tracker — Implementation Plan

The tracker (`iode-tracker`) is the **single admin panel for the whole business**.
Hired admin staff will manage *everything* here:

- **Content** for the public site — universities, courses, fees, blog.
- **Business** — admissions, staff, salaries, expenses, investments, commissions.
- **Invoicing** — generate receipts/bills for students and salary slips for staff.
- **Reports** — finance dashboard.

After the tracker covers content, the **main site (iode / Vidyavasal) becomes a
read-only public renderer**: it keeps its public pages and reads the shared
database, but its `/admin`, admin API, and invoice page are removed.

Both apps share **one Neon database** (two environments: staging + prod).

> Run every task **from `/Users/mymac/projects/web/iode-tracker`** unless stated otherwise.

---

## 🔑 Two environments — read this first

Two databases: **staging** and **production**, sharing the SAME schema.

| Env | Variable | Used by |
|-----|----------|---------|
| Staging (local dev default) | `DATABASE_URL` | `npm run dev`, `npm run db:migrate` |
| Production | `DATABASE_URL_PRODUCTION` | `npm run db:migrate:prod`, prod deploy |

**Golden rules**
1. **Always migrate STAGING first, verify, then PRODUCTION.**
2. Local `.env.local` `DATABASE_URL` → **staging** (dev never touches prod).
3. On Vercel set `DATABASE_URL` per environment (Production→prod, Preview→staging).
   `DATABASE_URL_PRODUCTION` is only for the local `db:migrate:prod` script.
4. `ADMIN_JWT_SECRET` + `IMAGEKIT_*` must be set in **both** Vercel environments.

Migration journals are per-database (`__drizzle_migrations_tracker`); applying a
migration to staging and prod separately is correct.

---

## 🧭 Schema ownership rule (critical — prevents the two apps clashing)

| Tables | Owner of the DDL / migrations | Tracker access |
|--------|-------------------------------|----------------|
| **Pre-existing content + auth:** `universities`, `courses`, `course_categories`, `course_fee_structures`, `course_fee_breakdowns`, `admin_users` | **Main site** (leave its migrations as-is) | CRUD at **runtime** via a read/write *mirror* — NOT migrated by the tracker |
| **All new tables:** `tracker_*` (students, staff, salaries, expenses, investments, university_commissions), `blog_posts`, `tracker_invoices`, `tracker_invoice_items` | **Tracker** | owns + migrates |

How to keep them separate in code:
- `src/lib/db/schema.ts` → **only tracker-owned tables**. `drizzle.config.ts`
  points here, so `db:generate`/`db:migrate` only ever touch tracker-owned tables.
- `src/lib/db/external.ts` → **mirror definitions** of the main site's tables
  (`universities`, `courses`, etc.), copied from the main site's schema. This file
  is **NOT** in the drizzle.config `schema` path, so drizzle-kit never tries to
  create/alter those tables. The runtime `drizzle(sql, { schema: { ...tracker, ...external } })`
  includes both, giving fully-typed CRUD on the content tables without owning them.
- If the main site changes a content table, update `external.ts` by hand to match.

This means the tracker can **manage university/course/fee/blog content** while the
main site stays the schema owner for the tables it also renders.

---

## Phase 0 — Finish the app scaffold  ✅ partially done

- [x] **0.1** Config: `package.json` (incl. imagekit + markdown libs), `tsconfig.json`,
  `drizzle.config.ts`, `.env.example`, `.gitignore`.
- [x] **0.2** DB layer: `src/lib/db/schema.ts` (tracker tables), `src/lib/db/index.ts`.
- [x] **0.3** Initial migration `drizzle/0000_tracker_init.sql` (with cross-app FKs).
- [ ] **0.4** Next.js runtime files so the app boots:
  - `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`
  - `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx` (→ `/admin`)
  - **Verify:** `npm run dev` boots clean at `http://localhost:3000`.
- [ ] **0.5** `cp .env.example .env.local`; set `DATABASE_URL` (staging),
  `DATABASE_URL_PRODUCTION` (prod), `ADMIN_JWT_SECRET`, `IMAGEKIT_*`.
- [ ] **0.6** `src/lib/db/external.ts` — copy the content-table definitions from the
  main site's `src/lib/db/schema.ts` (universities, courses, course_categories,
  course_fee_structures, course_fee_breakdowns, admin_users). Wire both schemas
  into `db` in `index.ts`.

## Phase 1 — Apply the database migration

- [ ] **1.1** Staging: `npm run db:migrate`.
- [ ] **1.2** Verify on staging: 6 `tracker_*` tables + cross-app FKs exist.
- [ ] **1.3** Production: `npm run db:migrate:prod` (only after staging is good).
- [ ] **1.4** Re-verify on production.

## Phase 2 — Auth + role gating (build before any page)

- [ ] **2.1** Port `src/lib/auth.ts` from the main site (JWT via `jose`, bcrypt).
- [ ] **2.2** Roles on `admin_users.role`:
  - `owner` → everything (incl. finance + invoicing + content).
  - `admin` (hired staff) → content + admissions + invoicing; **no** finance
    (salaries/expenses/investments/profit) unless you decide otherwise.
  - `sales` → admissions only, own records.
- [ ] **2.3** `src/lib/session.ts` — `getSession()`, `requireRole(...)` helpers.
- [ ] **2.4** `middleware.ts` — redirect unauthenticated → `/admin/login`;
  gate `/admin/finance/*` to `owner`.
- [ ] **2.5** Login/logout (port from main site's `/admin/login` + login API),
  reading the shared `admin_users` table.
  - **Verify:** each role sees the correct menu.

## Phase 3 — Admin shell + shared UI (port from main site)

- [ ] **3.1** Port components → `src/components/admin/`: `AdminShell`, `AdminSidebar`
  (make nav role-aware + add the new sections), `ImageUploader`, `GalleryUploader`,
  `HighlightsEditor`, `MarkdownEditor`, `TabNav`.
- [ ] **3.2** Port the ImageKit upload route → `src/app/api/upload/image/route.ts`
  (uses `IMAGEKIT_*`). **Verify** an upload returns a URL.
- [ ] **3.3** Money/format helpers: `Intl.NumberFormat('en-IN')`; `numeric` stored as strings.

## Phase 4 — Content management (port from main site, write to shared tables)

CRUD via the `external.ts` mirror — same DB the public site renders from.

- [ ] **4.1 Universities** (`/admin/content/universities`) — port `universities`
  list + `UniversityEditForm` (logo/banner/gallery uploads, highlights, markdown).
- [ ] **4.2 Courses** (`/admin/content/courses`) — port `courses` list +
  `CourseEditForm`, incl. categories + fee structures/breakdowns.
- [ ] **4.3 Blog** — NEW. Add `blog_posts` table (**tracker-owned**: title, slug,
  cover, body markdown, status, publishedAt). Build `/admin/content/blog` CRUD.
  - **Verify:** create a post; it appears via a query the public site can read.

## Phase 5 — Business CRUD modules

Build in dependency order (later ones need earlier lookups):

- [ ] **5.1 Staff** (`/admin/staff`) — name, role, base salary, join date, status,
  optional `admin_user_id` link. *(owner)*
- [ ] **5.2 University commissions** (`/admin/commissions`) — pick a university
  (mirror dropdown), set commission % + incentive; upsert by `university_id`. *(owner)*
- [ ] **5.3 Students / Admissions** (`/admin/students`) — university + course
  dropdowns; auto-fill commission % from `tracker_university_commissions`;
  auto-compute commission/profit/incentive (overridable); `sales` sees own rows. *(all)*
- [ ] **5.4 Salaries** (`/admin/finance/salaries`) — per staff/month; auto-incentive
  from that month's admissions; bonus; `total_payable`; mark paid. *(owner)*
- [ ] **5.5 Expenses** (`/admin/finance/expenses`). *(owner)*
- [ ] **5.6 Investments** (`/admin/finance/investments`). *(owner)*

## Phase 6 — Invoicing / billing  ⭐ new requirement

- [ ] **6.1** Tables (**tracker-owned**, add via `db:generate` → staging → prod):
  - `tracker_invoices` — number (auto/sequence), type (`student_fee` | `staff_salary`
    | `other`), partyType + partyId (student/staff) or free-text name, date, due
    date, subtotal, tax, total, amount paid, status (`draft|issued|paid|cancelled`),
    notes.
  - `tracker_invoice_items` — invoiceId, description, qty, unit price, amount.
- [ ] **6.2** Generators:
  - From an **admission** → student fee receipt (prefill from `tracker_students`).
  - From a **salary row** → staff salary slip (prefill from `tracker_salaries`).
  - Standalone/manual invoice.
- [ ] **6.3** `/admin/invoices` — list, create/edit, status; sequential invoice
  numbers per env (don't reuse the printed Sl. No. field as identity).
- [ ] **6.4** Printable view — port + data-bind the existing receipt template
  (main site's `src/app/invoice/page.tsx`) to `/admin/invoices/[id]/print`
  (`window.print()` → PDF). Update branding (iode → Vidyavasal) + real address.
  - **Verify:** generate a student receipt and a salary slip; print to PDF.

## Phase 7 — Dashboard & Reports (computed in SQL)

- [ ] **7.1** `src/lib/db/reports.ts` — monthly/weekly/yearly: admissions, collected,
  gross profit (Σ iode_profit), expenses, salaries, **net = gross − expenses − salaries**;
  per sales-exec; per-university.
- [ ] **7.2** `/admin/dashboard` — KPI cards + monthly trend. *(owner)*
- [ ] **7.3** `/admin/reports` — filterable tables + CSV export. *(owner)*

## Phase 8 — One-time data import from Google Sheets

- [ ] **8.1** Export sheets to CSV (Students, Universities, Staff, Salary, Expenses,
  Investments).
- [ ] **8.2** `scripts/import.ts` — match sheet "University"/"Course" text →
  `universities`/`courses` ids; sales-exec names → `tracker_staff`. Report unmatched
  rows; never guess.
- [ ] **8.3** Run on **STAGING**, reconcile totals vs the Reports sheet, then **PROD**.

## Phase 9 — Decommission the main site's admin

Only after Phases 4–6 are verified in production.

- [ ] **9.1** Point the public **blog** page at `blog_posts` (replace the hardcoded
  `posts` array in the main site's `src/app/blog/page.tsx`) — add a read mirror in
  the main site for the tracker-owned `blog_posts` table.
- [ ] **9.2** Confirm the public site still renders universities/courses (unchanged —
  it reads the same tables the tracker now writes).
- [ ] **9.3** Remove from the **main site**: `src/app/admin/**`,
  `src/app/api/admin/**`, `src/app/api/upload/**`, `src/app/invoice/**`,
  `src/components/admin/**`. Keep `src/lib/db` (still needed for public reads).
- [ ] **9.4** Remove now-unused main-site deps if any (md editor/imagekit) and any
  admin links from the public nav. Redeploy the main site.
- [ ] **9.5** Communicate the new admin URL (tracker subdomain) to staff.

## Phase 10 — Deployment (two environments)

- [ ] **10.1** New Vercel project for `iode-tracker`, own subdomain
  (e.g. `admin.vidyavasal.com`).
- [ ] **10.2** Env vars per Vercel environment:
  - Production → `DATABASE_URL`=prod, `ADMIN_JWT_SECRET`, `IMAGEKIT_*`.
  - Preview/Dev → `DATABASE_URL`=staging, same secrets (or staging media).
- [ ] **10.3** Ensure prod migrations (1.3, 6.1) ran before first prod deploy.
- [ ] **10.4** Smoke test on a preview (staging DB): login per role, edit a
  university, add an admission, generate an invoice, check dashboard math → promote.
- [ ] **10.5** Lock down: internal tool — add Vercel access protection / IP allowlist
  on top of app auth.

---

## Build order summary
`0.4–0.6 → 1.* → 2.* → 3.* → 4.* → 5.* → 6.* → 7.* → 8.* → (verify in prod) → 9.* → 10.*`

- Auth (Phase 2) gates everything — do it first.
- Content (4) and admissions (5.3) are usable by hired `admin`/`sales` staff;
  finance (5.4–5.6, 7) and most invoicing controls are `owner`-only (your call).
- **Do not** remove the main site's admin (Phase 9) until the tracker is verified
  in production, or you'll lose the ability to edit public content.
