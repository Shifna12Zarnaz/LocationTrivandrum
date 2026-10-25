# Location Restaurant QR Menu. Phases 1-4

Public menu + admin dashboard. Supabase (data, auth, RLS) + Cloudflare R2 (images).
Phase 4 adds load test, security check, freshness check, Lighthouse budget, SEO files, deploy docs. **No load test has been run yet. See docs/ACCEPTANCE.md.**

Docs: `docs/DEPLOY.md`, `docs/LOADTEST.md`, `docs/ACCEPTANCE.md`.
Commands: `npm run rls-check`, `npm run loadtest`, `npm run freshness`, `npm run lighthouse`.

## Setup
1. **Supabase**: new project. SQL editor: run `supabase/migrations/001_schema.sql`, then optionally `supabase/seed.sql` (sample data).
   Authentication > Providers > Email: turn **off** "Allow new users to sign up".
2. **First admin**: Authentication > Users > Add user (auto-confirm). Then run `supabase/migrations/002_first_admin.sql.example` with your email.
3. **R2**: create bucket. Connect a **custom domain** (e.g. img.yourdomain.com), keep the r2.dev URL disabled. Create an API token (Object Read & Write, this bucket only).
   CORS (bucket Settings > CORS policy):
   ```json
   [{"AllowedOrigins":["https://YOUR-SITE","http://localhost:3000"],"AllowedMethods":["PUT"],"AllowedHeaders":["content-type"],"MaxAgeSeconds":3600}]
   ```
   Public reads come only from the custom domain. Uploads/deletes only via short-lived presigned URLs minted for signed-in admins.
4. `cp .env.example .env.local`, fill values.
5. `npm install && npm run dev`. Public: `/`. Admin: `/admin`.

Without Supabase variables the public site shows built-in sample data (dev only).

## How it behaves
- **Public reads**: server-cached 60 s (`unstable_cache`, tag `menu`) and ISR page. Every admin save purges the tag and `/`. No realtime, no polling.
- **Offers / specials**: evaluated against the restaurant timezone (Settings). Expired items vanish on their own. Page refreshes at most 60 s late.
- **Security**: RLS on every table, public sees published only. All admin writes run with the admin's own session and are checked twice (server action + RLS). Service role key is used only to add/remove admin accounts, and only for owners.
- **Images**: unique key per upload (no stale cache), auto-resized to WebP in browser, 6 MB cap, JPG/PNG/WebP/AVIF. Replaced or deleted images are removed from R2 only if no record still uses them. "Clean unused uploads" on the dashboard removes abandoned uploads older than 1 day.
- **Flexible admin**: everything is config in `lib/admin/resources.ts`. Add a field there, add the column in SQL, done.
- Menu loads fully on the page (fine up to a few hundred dishes). Add pagination if it grows far past that.

## Admin sections
Dashboard, Menu items (search, category filter, bulk actions, duplicate, archive/restore, drag or arrow reorder), Categories (safe delete: move dishes or archive), Bestsellers (quick toggles), Today's specials (date + optional time window), Offers (start/end), Hero slider, Settings, Administrators, Preview (shows unpublished and scheduled).
