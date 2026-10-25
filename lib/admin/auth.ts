import { serverClient } from "../supabase/clients";
/** Verifies the session AND the admins table (RLS-backed). Returns null for anyone else. */
export async function getAdmin() {
  const sb = await serverClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data } = await sb.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  return data ? { user, role: data.role as string, sb } : null;
}
