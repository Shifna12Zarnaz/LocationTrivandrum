"use client";
import { useState } from "react";
import { cleanupImages } from "@/lib/admin/actions";
export default function CleanupButton() {
  const [m, setM] = useState("");
  return <><button onClick={async () => { const r = await cleanupImages(); setM(r.ok ? r.message || "Done." : r.error || "Failed."); }} className="h-11 border border-brass/50 px-5 text-sm">Clean unused uploads</button>{m && <span role="status" className="self-center text-sm">{m}</span>}</>;
}
