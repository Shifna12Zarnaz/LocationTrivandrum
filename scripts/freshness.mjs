// Measures how long a published change takes to show on the public page.
//   node scripts/freshness.mjs https://staging.example.com "85"        (text must APPEAR)
//   node scripts/freshness.mjs https://staging.example.com "78" --gone  (text must DISAPPEAR)
// Run it, press Enter, then immediately click Save in admin. Target: under 10 s.
import readline from "node:readline";
const [url, text, flag] = process.argv.slice(2);
if (!url || !text) { console.error('Usage: node scripts/freshness.mjs <url> "<text>" [--gone]'); process.exit(2); }
const gone = flag === "--gone", limit = 120_000;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question(`Press Enter, then click Save in admin. Waiting for "${text}" to ${gone ? "disappear" : "appear"}… `, async () => {
  rl.close(); const t0 = Date.now();
  while (Date.now() - t0 < limit) {
    try { const r = await fetch(url, { headers: { "cache-control": "no-cache" } }); const html = await r.text(); if (html.includes(text) !== gone) { const s = ((Date.now() - t0) / 1000).toFixed(1); console.log(`${Number(s) <= 10 ? "PASS" : "SLOW"}: visible after ${s}s`); process.exit(Number(s) <= 10 ? 0 : 1); } } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log("FAIL: not visible after 120s"); process.exit(1);
});
