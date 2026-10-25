"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdmin, removeAdmin } from "@/lib/admin/actions";
import { inputCls } from "./inputs";

type A = { user_id: string; email: string | null; role: string };
export default function AdminAccess({ admins, isOwner, me }: { admins: A[]; isOwner: boolean; me: string }) {
  const r = useRouter(); const [m, setM] = useState<{ ok: boolean; t: string } | null>(null);
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [role, setRole] = useState<"admin" | "owner">("admin");
  return (
    <div>
      <h1 className="font-serif text-3xl">Administrators</h1>
      {m && <p role={m.ok ? "status" : "alert"} className={`mt-3 border p-3 text-sm ${m.ok ? "border-green-700/40 bg-green-50" : "border-red-800/40 bg-red-50 text-red-900"}`}>{m.t}</p>}
      <ul className="mt-4 space-y-2">{admins.map((a) => (
        <li key={a.user_id} className="flex items-center justify-between gap-3 border border-brass/30 bg-white p-3"><span>{a.email} <span className="text-sm text-charcoal/60">({a.role})</span></span>
          {isOwner && a.user_id !== me && <button onClick={async () => { if (!confirm(`Remove ${a.email}?`)) return; const x = await removeAdmin(a.user_id); setM({ ok: x.ok, t: x.ok ? x.message || "Done." : x.error || "Failed." }); r.refresh(); }} className="h-10 border border-red-800/40 px-3 text-sm text-red-800">Remove</button>}</li>))}</ul>
      {isOwner ? (
        <form className="mt-6 grid gap-3 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); const x = await createAdmin(email, pw, role); setM({ ok: x.ok, t: x.ok ? x.message || "Done." : x.error || "Failed." }); if (x.ok) { setEmail(""); setPw(""); r.refresh(); } }}>
          <h2 className="font-serif text-2xl sm:col-span-2">Add an administrator</h2>
          <label className="text-sm font-medium">Email<input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-sm font-medium">Temporary password (10+ characters)<input type="text" required minLength={10} value={pw} onChange={(e) => setPw(e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="text-sm font-medium">Role<select value={role} onChange={(e) => setRole(e.target.value as "admin" | "owner")} className={`${inputCls} mt-1`}><option value="admin">Admin: manage the menu</option><option value="owner">Owner: also manage administrators</option></select></label>
          <div className="self-end"><button className="h-11 bg-oak px-6 text-sm font-medium">Add administrator</button></div>
        </form>
      ) : <p className="mt-4 text-sm text-charcoal/70">Only the owner can add or remove administrators.</p>}
    </div>
  );
}
