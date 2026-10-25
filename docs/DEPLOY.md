# Deployment

Recommended host: **Vercel** (Node runtime, ISR and tag revalidation work natively). Other Node hosts work if they support Next 15 ISR. Cloudflare Workers hosting is **not** verified for this project.

## Environments
| | Development | Staging | Production |
|---|---|---|---|
| Supabase project | own | own | own |
| R2 bucket + domain | dev bucket | staging bucket | production bucket |
| `NEXT_PUBLIC_SITE_URL` | http://localhost:3000 | staging URL | real domain |
| Data | seed.sql | realistic copy | real |
Use three separate Supabase projects and buckets. Never share keys between environments. Set variables in the host dashboard, never in git.

## Steps (each environment)
1. Supabase: run `001_schema.sql` (and `seed.sql` for dev/staging only). Auth: disable public sign-up. Add first admin (`002_first_admin.sql.example`).
2. Choose the Supabase region closest to your visitors.
3. R2: bucket, API token limited to that bucket, **custom domain** attached, r2.dev URL disabled. CORS: allow `PUT` from the site origin only.
4. Cloudflare cache rule for the image domain: hostname equals your image domain, then "Eligible for cache", Edge TTL 1 year, Browser TTL 1 year. Safe because every upload gets a new unique file name.
5. Host: import repo, set all variables from `.env.example`, deploy.
6. Run `npm run rls-check` with that environment's keys. All lines must PASS.
7. Run Lighthouse: `npm run build && npm run lighthouse` (mobile, throttled by default).
8. Staging only: run `docs/LOADTEST.md`.

## Connection note
The app talks to Supabase over HTTPS (PostgREST) with short timeouts and 3 retries, so it does not open direct Postgres connections. Public pages are cached, so most visitors never reach the database. Check your Supabase plan limits for request volume.

## QR code
Point the QR code at the production root URL. Print a test code and scan it on iPhone and Android before printing in bulk.

## Go-live checklist
- [ ] Sign-up disabled in Supabase
- [ ] `rls-check` all PASS on production keys
- [ ] r2.dev URL disabled, custom domain live, cache rule set
- [ ] Settings filled: name, timezone, currency, phone, address, hours
- [ ] Sample data deleted, real dishes and photos added
- [ ] Owner password changed from the temporary one
- [ ] Load test run on staging and results recorded
- [ ] Lighthouse mobile run recorded
- [ ] QR code scanned on real phones
