# Load test plan (200 concurrent visitors)

**Status: script written, NOT yet run.** Do not call the app load-tested until you have run this on staging and filled the results table.

## Setup
- Staging deployment with production settings (real Supabase project, real R2 + custom image domain, `next build` + `next start` or the host's production build). Never test `npm run dev`.
- Real-looking data: 80+ dishes, 8 categories, photos on most dishes, 3 slides, 2 offers.
- Install k6 (https://k6.io). Run from a machine NOT on the same network as the server if possible.

## Run
    BASE_URL=https://staging.example.com npm run loadtest

Scenarios (about 8.5 min): ramp to 200 and hold 5 min, then a QR-scan spike (0 to 200 in 10 s, hold 1 min).
Traffic = page loads and photo fetches. Category tabs, search and filters run in the browser and add no server load.

## Acceptance targets
| Metric | Target |
|---|---|
| Page p95 | < 2 s |
| Image p95 | < 1 s |
| Failed requests | < 1 % |
| Checks passed | > 99 % |
| Supabase | no connection errors, no 429s (check dashboard during run) |

## Admin update during load (manual)
1. Start the k6 run.
2. After minute 2, in admin change a dish price and publish an offer.
3. Run `npm run freshness -- https://staging.example.com "<new text>"` (press Enter, then Save). Target: visible in under 10 s.
4. Confirm no error spike in k6 output during the change.

## Recovery from failure (manual)
1. During a run, pause the Supabase project (or set a wrong anon key on staging and redeploy).
2. Expected: public page keeps serving the last good copy. Unpause. Expected: back to normal within about 60 s.
3. Record what you actually saw.

## Results (fill in)
| Date | Environment / plan | Duration | Peak VUs | Req/s | Page p95 | Image p95 | Error % | Pass? | Notes |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

If a target fails: find the bottleneck first (cache hit rate in `cache_hit`, Supabase dashboard, image cache status). Do not just buy a bigger plan.
