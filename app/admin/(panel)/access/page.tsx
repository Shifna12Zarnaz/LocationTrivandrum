import AdminAccess from "@/components/admin/AdminAccess";
import { getAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export default async function Access() {
  const a = (await getAdmin())!;
  const { data } = await a.sb.from("admins").select("user_id,email,role").order("created_at");
  return <AdminAccess admins={data ?? []} isOwner={a.role === "owner"} me={a.user.id} />;
}
