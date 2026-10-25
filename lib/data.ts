import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hasSupabase, publicClient } from "./supabase/clients";
import { imgUrl } from "./img-url";
import { hhmmInTz, todayInTz } from "./time";
import { sampleHome } from "./sample-data";
import type { Category, Dish, HomeData, Offer, Settings, Slide, Special } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Raw = { settings: any; categories: any[]; items: any[]; offers: any[]; slides: any[]; specials: any[] };

/** 6 parallel queries, no N+1. drafts=true (admin preview) skips active/published filters; RLS still decides what is visible. */
export async function fetchRaw(sb: SupabaseClient, drafts: boolean): Promise<Raw> {
  const since = new Date(Date.now() - 2 * 864e5).toISOString().slice(0, 10);
  let cat = sb.from("categories").select("id,name,slug,description,sort_order").is("archived_at", null).order("sort_order");
  let it = sb.from("menu_items").select("*").is("archived_at", null).order("sort_order");
  let of = sb.from("offers").select("*").order("sort_order");
  let sl = sb.from("hero_slides").select("*").order("sort_order");
  let sp = sb.from("daily_specials").select("*").gte("special_date", since).order("sort_order");
  if (!drafts) { cat = cat.eq("is_active", true); of = of.eq("is_active", true); sl = sl.eq("is_active", true); sp = sp.eq("is_active", true); }
  const [s, c, i, o, h, p] = await Promise.all([sb.from("restaurant_settings").select("*").eq("id", 1).maybeSingle(), cat, it, of, sl, sp]);
  for (const r of [s, c, i, o, h, p]) if (r.error) throw new Error(`DB: ${r.error.message}`);
  return { settings: s.data, categories: c.data!, items: i.data!, offers: o.data!, slides: h.data!, specials: p.data! };
}

const tone = (id: string) => { let h = 0; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 10 + (h % 35); };

export function resolveHref(r: any, cats: { id: string; slug: string }[]) {
  if (r.link_url) return r.link_url as string;
  if (r.item_id) return `#menu?dish=${r.item_id}`;
  const c = r.category_id && cats.find((x) => x.id === r.category_id);
  if (c) return `#menu?cat=${c.slug}`;
  return `#${r.link_section || "menu"}`;
}

export function shape(raw: Raw, preview = false, now = new Date()): HomeData {
  const st = raw.settings || {};
  const settings: Settings = {
    name: st.name || "Location Restaurant", tagline: st.tagline || "", logo: imgUrl(st.logo_key, 400), favicon: imgUrl(st.favicon_key, 64),
    story: st.story || "", phone: st.phone || "", whatsapp: st.whatsapp || "", address: st.address || "", hours: st.hours || "",
    instagram: st.instagram || "", mapsUrl: st.maps_url || "", seoDescription: st.seo_description || "", timezone: st.timezone || "Asia/Dubai",
    currency: (st.currency === "AED" ? "" : (st.currency || "")), multiSpecials: !!st.allow_multiple_specials,
    navOffers: st.show_offers_nav !== false, navStory: st.show_story_nav !== false, navContact: st.show_contact_nav !== false,
  };
  const catIds = new Set(raw.categories.map((c) => c.id));
  const dishAll: Dish[] = raw.items.filter((i) => catIds.has(i.category_id)).map((i) => ({
    id: i.id, categoryId: i.category_id, name: i.name, description: i.description || "", price: Number(i.price), currency: i.currency || settings.currency,
    veg: i.is_veg, bestseller: i.is_bestseller, isNew: i.is_new, spice: i.spice_level, allergens: i.allergens || [], dietary: i.dietary || [],
    variants: (i.variants || []) as any, available: i.is_available, image: imgUrl(i.image_key, 800), tone: tone(i.id),
  }));
  const byId = new Map(dishAll.map((d) => [d.id, d]));

  // Specials: restaurant-timezone date + optional time window.
  const today = todayInTz(settings.timezone, now), hm = hhmmInTz(settings.timezone, now);
  let specials: Special[] = raw.specials
    .filter((s) => preview || (s.special_date === today && (!s.start_time || s.start_time.slice(0, 5) <= hm) && (!s.end_time || hm < s.end_time.slice(0, 5))))
    .map((s) => ({ dish: byId.get(s.item_id)!, promo: s.promo_text || undefined })).filter((s) => s.dish);
  // Show every active special configured for today.
  const specialIds = new Set(specials.map((s) => s.dish.id));
  const dishes = dishAll.map((d) => ({ ...d, special: specialIds.has(d.id) }));
  specials = specials.map((s) => ({ ...s, dish: dishes.find((d) => d.id === s.dish.id)! }));

  const used = new Set(dishes.map((d) => d.categoryId));
  const categories: Category[] = raw.categories.filter((c) => preview || used.has(c.id)).map((c) => ({ id: c.id, slug: c.slug, name: c.name, description: c.description || undefined }));
  // Active offers remain discoverable on the public page. The admin Active toggle
  // controls visibility; date fields are retained for scheduling and display.
  const offers: Offer[] = raw.offers
    .filter((o) => preview || o.is_active !== false)
    .map((o) => ({ id: o.id, title: o.title, text: o.description || "", label: o.discount_label || undefined, terms: o.terms || undefined, href: resolveHref(o, raw.categories), image: imgUrl(o.image_key, 1000), tone: tone(o.id) }));
  const slides: Slide[] = raw.slides.map((s) => ({ id: s.id, heading: s.heading, subtitle: s.subtitle || "", cta: s.cta_text || "", href: resolveHref(s, raw.categories), image: imgUrl(s.image_key, 1600), tone: tone(s.id) }));
  return { settings, slides, offers, categories, dishes, specials };
}

async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try { return await fn(); }
    catch (e) { if (i >= tries) throw e; await new Promise((r) => setTimeout(r, 300 * i)); }
  }
}
// If this still throws during background revalidation, Next keeps serving the last good page.
const cachedRaw = unstable_cache(() => withRetry(() => fetchRaw(publicClient(), false)), ["public-raw"], { tags: ["menu"], revalidate: 60 });

/** Public read path: cached 60s, invalidated by tag "menu" on any admin change. */
export async function getPublicHome(): Promise<HomeData> {
  if (!hasSupabase()) return sampleHome();
  return shape(await cachedRaw());
}
