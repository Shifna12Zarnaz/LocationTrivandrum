import Link from "next/link";
import { getAdmin } from "@/lib/admin/auth";
import { fetchRaw, shape } from "@/lib/data";
import { r2Configured } from "@/lib/r2";
import CleanupButton from "@/components/admin/CleanupButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const a = (await getAdmin())!;
  const d = shape(await fetchRaw(a.sb, true), false); // live view: same rules customers get
  const card = (n: string | number, l: string, h: string) => <Link href={h} className="block border border-brass/40 bg-white p-5 hover:bg-sand"><p className="font-serif text-4xl">{n}</p><p className="text-sm text-charcoal/70">{l}</p></Link>;

  // Show hidden inventory and inactive categories in the dashboard.
  const { data: allItems } = await a.sb.from("menu_items").select("id,name,is_available,archived_at").is("archived_at", null);
  const { data: allCats } = await a.sb.from("categories").select("id,name,is_active,archived_at").is("archived_at", null);
  const unavailable = allItems?.filter((i: any) => !i.is_available).length || 0;
  const inactiveCats = allCats?.filter((c: any) => !c.is_active).length || 0;

  return (
    <div>
      <h1 className="font-serif text-3xl">Dashboard</h1>
      {!r2Configured() && <p role="alert" className="mt-3 border border-red-800/40 bg-red-50 p-3 text-sm text-red-900">Photo uploads are off. Add the Cloudflare R2 settings to enable them.</p>}
      {unavailable > 0 && <p className="mt-2 border border-blue-700/40 bg-blue-50 p-3 text-sm text-blue-900">{unavailable} dish{unavailable === 1 ? "" : "es"} marked as unavailable. They won't show as available today.</p>}
      {inactiveCats > 0 && <p className="mt-2 border border-purple-700/40 bg-purple-50 p-3 text-sm text-purple-900">{inactiveCats} categor{inactiveCats === 1 ? "y" : "ies"} not visible. Dishes in inactive categories won't appear on the public site.</p>}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {card(d.dishes.length, "Dishes on the menu", "/admin/menu-items")}{card(d.categories.length, "Categories shown", "/admin/categories")}
        {card(d.offers.length, "Offers live now", "/admin/offers")}{card(d.specials.length ? d.specials.map((s) => s.dish.name).join(", ") : "None", "Today's special", "/admin/specials")}
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/menu-items" className="flex h-11 items-center bg-oak px-5 text-sm font-medium">Add a dish</Link>
        <Link href="/admin/categories" className="flex h-11 items-center border border-brass px-5 text-sm">Add a category</Link>
        <Link href="/admin/hero-slides" className="flex h-11 items-center border border-brass px-5 text-sm">Hero slides</Link>
        <Link href="/admin/offers" className="flex h-11 items-center border border-brass px-5 text-sm">Offers</Link>
        <CleanupButton />
      </div>
    </div>
  );
}
