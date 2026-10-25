"use client";
import { useState } from "react";
import type { Variant } from "@/lib/types";

export const inputCls = "h-11 w-full border border-brass/50 bg-white px-3 text-sm";

export function TagsInput({ value, onChange, suggestions = [], id }: { value: string[]; onChange: (v: string[]) => void; suggestions?: string[]; id: string }) {
  const [t, setT] = useState("");
  const add = (x: string) => { const v = x.trim(); if (v && !value.includes(v)) onChange([...value, v]); setT(""); };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((x) => <button type="button" key={x} onClick={() => onChange(value.filter((y) => y !== x))} aria-label={`Remove ${x}`} className="h-9 border border-brass bg-sand px-3 text-sm">{x} ✕</button>)}
      </div>
      <input id={id} list={`${id}-l`} value={t} onChange={(e) => setT(e.target.value)} placeholder="Type and press Enter"
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(t); } }} onBlur={() => add(t)} className={`${inputCls} mt-2`} />
      <datalist id={`${id}-l`}>{suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}</datalist>
    </div>
  );
}

export function VariantsInput({ value, onChange }: { value: Variant[]; onChange: (v: Variant[]) => void }) {
  const set = (i: number, p: Partial<Variant>) => onChange(value.map((v, k) => (k === i ? { ...v, ...p } : v)));
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex flex-wrap gap-2">
          <input aria-label="Name" placeholder="Large" value={v.name} onChange={(e) => set(i, { name: e.target.value })} className={`${inputCls} basis-40 flex-1`} />
          <input aria-label="Price" type="number" inputMode="decimal" min={0} step="0.01" value={v.price} onChange={(e) => set(i, { price: Number(e.target.value) })} className={`${inputCls} w-24`} />
          <select aria-label="Type" value={v.kind} onChange={(e) => set(i, { kind: e.target.value as Variant["kind"] })} className={`${inputCls} w-40`}>
            <option value="size">Size (full price)</option><option value="addon">Add-on (extra cost)</option>
          </select>
          <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((_, k) => k !== i))} className="h-11 w-11 border border-brass/50">✕</button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, { name: "", price: 0, kind: "size" }])} className="h-11 border border-brass px-4 text-sm">Add size or add-on</button>
    </div>
  );
}
