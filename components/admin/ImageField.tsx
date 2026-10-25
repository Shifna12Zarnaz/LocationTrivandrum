"use client";
import { useRef, useState } from "react";

const OK = ["image/jpeg", "image/png", "image/webp", "image/avif"];

async function shrink(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, 1800 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/webp", 0.85));
    if (blob && blob.size < file.size) return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
  } catch { /* upload original */ }
  return file;
}

export default function ImageField({ value, onChange, folder, imgBase }: { value: string | null; onChange: (k: string | null) => void; folder: string; imgBase: string }) {
  const [busy, setBusy] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [local, setLocal] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function pick(f?: File) {
    if (!f) return;
    setErr("");
    if (!OK.includes(f.type)) return setErr("Use a JPG, PNG, WebP or AVIF image.");
    if (f.size > 25 * 1024 * 1024) return setErr("That file is too large. Choose one under 25 MB.");
    setBusy(0);
    try {
      const file = await shrink(f);
      if (file.size > 6 * 1024 * 1024) throw new Error("Image is still over 6 MB. Use a smaller photo.");
      const body = new FormData(); body.append("file", file); body.append("folder", folder);
      const r = await fetch("/api/admin/upload", { method: "POST", body });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "Upload could not start.");
      setBusy(100);
      setLocal(URL.createObjectURL(file)); onChange(j.key);
    } catch (e) { setErr((e as Error).message); }
    setBusy(null); if (input.current) input.current.value = "";
  }

  const src = local || (value && imgBase ? `${imgBase}/${value}` : null);
  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="grid h-24 w-32 shrink-0 place-items-center overflow-hidden border border-brass/50 bg-sand text-xs text-charcoal/60">
          {src ? <img src={src} alt="Preview" className="h-full w-full object-cover" /> : value ? "Saved" : "No photo"}
        </div>
        <div className="space-y-2">
          <input ref={input} type="file" accept={OK.join(",")} className="sr-only" id={`up-${folder}`} onChange={(e) => pick(e.target.files?.[0])} />
          <label htmlFor={`up-${folder}`} className="flex h-11 cursor-pointer items-center border border-brass px-4 text-sm hover:bg-sand">{value ? "Replace photo" : "Choose photo"}</label>
          {value && busy === null && <button type="button" onClick={() => { onChange(null); setLocal(null); }} className="h-9 text-sm text-red-800 underline">Remove photo</button>}
        </div>
      </div>
      {busy !== null && <div role="progressbar" aria-valuenow={busy} className="mt-2 h-2 bg-sand"><div className="h-2 bg-oak transition-all" style={{ width: `${busy}%` }} /></div>}
      {err && <p role="alert" className="mt-2 text-sm text-red-800">{err}</p>}
      <p className="mt-1 text-xs text-charcoal/60">Photos are resized automatically. Replacing keeps the old photo until you save.</p>
    </div>
  );
}
