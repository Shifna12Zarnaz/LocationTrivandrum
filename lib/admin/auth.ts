import { cookies } from "next/headers";
import { firebaseAdminAuth } from "../firebase/admin";
import { firebaseDb } from "../firebase/firestore";
/** Verifies the session AND the admins table (RLS-backed). Returns null for anyone else. */
export async function getAdmin() {
  const token = (await cookies()).get("firebase_token")?.value;
  if (!token) return null;
  try {
    const user = await firebaseAdminAuth().verifyIdToken(token);
    const { data } = await firebaseDb.from("admins").select("role").eq("id", user.uid).maybeSingle();
    return data ? { user: { id: user.uid, email: user.email ?? "" }, role: data.role as string, sb: firebaseDb } : null;
  } catch { return null; }
}
