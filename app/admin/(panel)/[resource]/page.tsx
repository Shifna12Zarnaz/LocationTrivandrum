/* eslint-disable @typescript-eslint/no-explicit-any */
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { RESOURCES } from "@/lib/admin/resources";
import ResourceManager from "@/components/admin/ResourceManager";
import { imgBase } from "@/lib/img-url";
import { todayInTz, utcToLocalInput } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const quick = resource === "bestsellers";
  const R = RESOURCES[quick ? "menu-items" : resource];
  if (!R) notFound();
  const a = (await getAdmin())!; const sb = a.sb;

  // Only fetch settings and timezone first
  const { data: st } = await sb.from("restaurant_settings").select("timezone").eq("id", 1).maybeSingle();
  const tz = st?.timezone || "Asia/Dubai";

  // Fetch categories and items only if needed by the current resource
  const needsCategories = R.fields.some((f) => f.options === "categories");
  const needsItems = R.fields.some((f) => f.options === "items");

  const [{ data: cats }, { data: items }] = await Promise.all([
    needsCategories ? sb.from("categories").select("id,name,archived_at").is("archived_at", null).order("sort_order") : Promise.resolve({ data: null }),
    needsItems ? sb.from("menu_items").select("id,name").is("archived_at", null).order("name") : Promise.resolve({ data: null }),
  ]);

  let rows: any[] = R.singleton ? [((await sb.from(R.table).select("*").eq("id", 1).maybeSingle()).data ?? {})] : ((await sb.from(R.table).select("*").order(R.sortable ? "sort_order" : "created_at")).data ?? []);
  rows = rows.map((r) => { const o = { ...r }; for (const f of R.fields) if (f.type === "datetime") o[f.name + "__local"] = utcToLocalInput(r[f.name], tz); return o; });
  if (quick) rows = rows.filter((r) => !r.archived_at);
  const options = { categories: (cats ?? []).map((c: any) => ({ value: c.id, label: c.name })), items: (items ?? []).map((i: any) => ({ value: i.id, label: i.name })) };
  return <ResourceManager resource={R} rows={rows} options={options} imgBase={imgBase()} today={todayInTz(tz)} mode={quick ? "quick" : undefined} quickField={quick ? "is_bestseller" : undefined} />;
}
