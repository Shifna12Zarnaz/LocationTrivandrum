import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/admin/auth";
import { hasSupabase } from "@/lib/supabase/clients";
import { signOut } from "@/lib/admin/actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const nav = [["Dashboard", "/admin"], ["Menu items", "/admin/menu-items"], ["Categories", "/admin/categories"], ["Bestsellers", "/admin/bestsellers"], ["Today's specials", "/admin/specials"], ["Offers", "/admin/offers"], ["Hero slider", "/admin/hero-slides"], ["Settings", "/admin/settings"], ["Administrators", "/admin/access"]];

export default async function Panel({ children }: { children: React.ReactNode }) {
  if (!hasSupabase()) return <main className="p-8"><h1 className="font-serif text-3xl">Setup needed</h1><p className="mt-2">Add the Supabase variables from .env.example, then reload.</p></main>;
  const a = await getAdmin();
  if (!a) return <main className="p-8"><h1 className="font-serif text-3xl">No access</h1><p className="mt-2">This account is not an administrator.</p><form action={signOut} className="mt-4"><button className="h-11 border border-brass px-5">Sign out</button></form></main>;
  return (
    <div className="min-h-svh bg-ivory">
      <header className="bg-charcoal text-ivory">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-2">
          <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto">{nav.map(([l, h]) => <Link key={h} href={h} className="flex h-11 shrink-0 items-center px-3 text-sm hover:text-oak">{l}</Link>)}</nav>
          <div className="flex shrink-0 gap-2"><Link href="/admin/preview" className="flex h-11 items-center border border-brass px-3 text-sm text-oak">Preview</Link>
            <form action={signOut}><button className="h-11 px-3 text-sm">Sign out</button></form></div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-5 pb-24">{children}</main>
    </div>
  );
}
