// k6 load test: ~200 concurrent public visitors.
// Run against STAGING with production-like config (never against a dev server):
//   BASE_URL=https://staging.example.com k6 run --summary-export=loadtest/results.json loadtest/public.js
// Category tabs, search and filters run in the browser, so server traffic is page + images.
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const BASE = (__ENV.BASE_URL || "").replace(/\/$/, "");
if (!BASE) throw new Error("Set BASE_URL, e.g. BASE_URL=https://staging.example.com");
const cacheHit = new Rate("cache_hit"); // informational, no threshold

export const options = {
  scenarios: {
    // Normal busy service: ramp to 200 and hold.
    steady: { executor: "ramping-vus", exec: "visitor", startVUs: 0, stages: [{ duration: "1m", target: 200 }, { duration: "5m", target: 200 }, { duration: "30s", target: 0 }] },
    // A big group scans the QR code at once: 0 to 200 in 10 s.
    spike: { executor: "ramping-vus", exec: "visitor", startTime: "7m", startVUs: 0, stages: [{ duration: "10s", target: 200 }, { duration: "1m", target: 200 }, { duration: "10s", target: 0 }] },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "http_req_duration{kind:page}": ["p(95)<2000"],
    "http_req_duration{kind:image}": ["p(95)<1000"],
    checks: ["rate>0.99"],
  },
};

export function visitor() {
  const page = http.get(`${BASE}/`, { tags: { kind: "page" } });
  check(page, { "page 200": (r) => r.status === 200, "page has menu": (r) => typeof r.body === "string" && r.body.includes('id="menu"') });
  const h = page.headers;
  cacheHit.add(/HIT/i.test(h["X-Nextjs-Cache"] || h["X-Vercel-Cache"] || h["Cf-Cache-Status"] || ""));

  // Browser fetches the first few photos.
  const imgs = Array.from(new Set((String(page.body).match(/https?:\/\/[^"'\s)\\]+\.(?:webp|jpg|jpeg|png|avif)/g) || []))).slice(0, 6);
  if (imgs.length) {
    http.batch(imgs.map((u) => ["GET", u, null, { tags: { kind: "image" } }])).forEach((r) => check(r, { "image 200": (x) => x.status === 200 }));
  }
  sleep(3 + Math.random() * 5);
  // Some visitors reopen the menu later in the same visit.
  if (Math.random() < 0.4) check(http.get(`${BASE}/`, { tags: { kind: "page" } }), { "revisit 200": (r) => r.status === 200 });
  sleep(2 + Math.random() * 4);
}
