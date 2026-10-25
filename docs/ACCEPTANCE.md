# Acceptance status (honest)

Legend: **Verified** = checked in the build sandbox. **You run** = needs your Supabase/R2/staging, not yet done.

| Area | Item | Status |
|---|---|---|
| Build | TypeScript strict passes, production build passes | Verified |
| Logic | Offer expiry, special date/time window in restaurant timezone, hidden empty categories and orphan dishes | Verified (unit script) |
| Design | Slider autoplay/pause/reduced-motion, responsive layout, filters | Written. Not visually tested in a browser. You run |
| Security | RLS policies and grants | Written. `npm run rls-check` You run |
| Security | Admin authorization (server action + RLS) | Written. You run: try a non-admin login |
| Storage | R2 presigned upload, replace, delete-if-unused | Written. You run with real bucket |
| Storage | CORS, public custom domain, cache rule | You run (docs/DEPLOY.md) |
| Cache | Admin save refreshes public page | You run: `npm run freshness` |
| Perf | 200 concurrent visitors | **Not run.** docs/LOADTEST.md |
| Perf | Mobile Lighthouse | You run: `npm run lighthouse` |
| SEO | robots, sitemap, canonical, OG, structured data | Written. Check after deploy |
| Resilience | Stale page kept when DB down | Designed (ISR). You run: LOADTEST recovery step |

Not built: shopping cart/ordering (out of scope by spec), Arabic/RTL, table QR generator, homepage bestseller strip, spice filter, real-time updates, drag-drop touch gestures (arrow buttons used on mobile).
