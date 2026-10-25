import HomeView from "@/components/HomeView";
import { getAdmin } from "@/lib/admin/auth";
import { fetchRaw, shape } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Shows drafts: unpublished dishes, inactive offers/slides, scheduled specials. Never cached, admin only. */
export default async function Preview() {
  const a = (await getAdmin())!;
  return <><p className="sticky top-0 z-50 bg-oak p-2 text-center text-sm font-medium">Preview. Includes unpublished and scheduled items. Customers do not see this page.</p><HomeView data={shape(await fetchRaw(a.sb, true), true)} /></>;
}
