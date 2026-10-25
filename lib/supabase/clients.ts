import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const hasSupabase = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Anonymous read client for public, cached menu data. */
export const publicClient = () => createClient(url(), anon(), {
  auth: { persistSession: false, autoRefreshToken: false },
  global: { fetch: (u, o) => fetch(u, { ...o, signal: AbortSignal.timeout(8000) }) }, // never hang a render on a slow DB
});

/** Per-request client carrying the admin's session. RLS applies. */
export async function serverClient() {
  const c = await cookies();
  return createServerClient(url(), anon(), {
    cookies: {
      getAll: () => c.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => c.set(name, value, options)); } catch { /* server component */ } },
    },
  });
}

/** Server-only. Used solely for creating/removing admin accounts after an owner check. */
export const serviceClient = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SERVICE_KEY_MISSING");
  return createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
};
