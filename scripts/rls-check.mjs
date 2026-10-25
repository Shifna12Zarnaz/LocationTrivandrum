// Proves the PUBLIC (anon) key cannot write or read private data.
//   NEXT_PUBLIC_SUPABASE_URL=... NEXT_PUBLIC_SUPABASE_ANON_KEY=... node scripts/rls-check.mjs
// Safe: every write below must be rejected. Nothing is created.
import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) { console.error("Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"); process.exit(2); }
const sb = createClient(url, key, { auth: { persistSession: false } });
const ZERO = "00000000-0000-0000-0000-000000000000";
const tables = ["restaurant_settings", "categories", "menu_items", "daily_specials", "offers", "hero_slides", "images", "admins"];
let fails = 0; const ok = (n, pass, extra = "") => { console.log(`${pass ? "PASS" : "FAIL"}  ${n}${extra ? "  " + extra : ""}`); if (!pass) fails++; };

for (const t of tables) {
  const ins = await sb.from(t).insert({}).select();
  ok(`anon cannot INSERT ${t}`, !!ins.error || !(ins.data && ins.data.length));
  const upd = await sb.from(t).update({ updated_at: new Date().toISOString() }).eq(t === "restaurant_settings" ? "id" : t === "admins" ? "user_id" : "id", t === "restaurant_settings" ? 1 : ZERO).select();
  ok(`anon cannot UPDATE ${t}`, !!upd.error || !(upd.data && upd.data.length));
  const del = await sb.from(t).delete().eq(t === "admins" ? "user_id" : "id", ZERO).select();
  ok(`anon cannot DELETE ${t}`, !!del.error || !(del.data && del.data.length));
}
for (const t of ["images", "admins"]) { const r = await sb.from(t).select("*").limit(1); ok(`anon cannot READ ${t}`, !!r.error || r.data.length === 0); }
const items = await sb.from("menu_items").select("is_published,archived_at"); ok("anon sees only published, unarchived dishes", !items.error && items.data.every((x) => x.is_published && !x.archived_at), `(${items.data?.length ?? 0} rows)`);
const cats = await sb.from("categories").select("is_active,archived_at"); ok("anon sees only active categories", !cats.error && cats.data.every((x) => x.is_active && !x.archived_at));
const off = await sb.from("offers").select("is_active"); ok("anon sees only active offers", !off.error && off.data.every((x) => x.is_active));
console.log(fails ? `\n${fails} FAILED. Do not go live.` : "\nAll checks passed."); process.exit(fails ? 1 : 0);
