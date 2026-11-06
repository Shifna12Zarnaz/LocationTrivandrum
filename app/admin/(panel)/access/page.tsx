import AdminAccess from "@/components/admin/AdminAccess";
import { getAdmin } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export default async function Access() {
  const a = (await getAdmin())!;
  const { data } = await a.sb.from("admins").select("id,email,role").order("created_at");
  const admins = (data ?? []).map((row: { id?: string; email: string | null; role: string }) => ({ user_id: row.id ?? "", email: row.email, role: row.role }));
  return <AdminAccess admins={admins} isOwner={a.role === "owner"} me={a.user.id} />;
}
