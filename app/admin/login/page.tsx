"use client";
import { useActionState } from "react";
import { signIn } from "@/lib/admin/actions";

export default function Login() {
  const [s, act, pending] = useActionState(signIn, null as null | { error: string });
  return (
    <main className="grid min-h-svh place-items-center bg-charcoal p-5">
      <form action={act} className="w-full max-w-sm space-y-4 bg-ivory p-6">
        <h1 className="font-serif text-3xl">Staff sign in</h1>
        <label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="username" className="mt-1 h-11 w-full border border-brass/50 bg-white px-3" /></label>
        <label className="block text-sm font-medium">Password<input name="password" type="password" required autoComplete="current-password" className="mt-1 h-11 w-full border border-brass/50 bg-white px-3" /></label>
        {s?.error && <p role="alert" className="text-sm text-red-800">{s.error}</p>}
        <button disabled={pending} className="h-11 w-full bg-oak font-medium disabled:opacity-50">{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
