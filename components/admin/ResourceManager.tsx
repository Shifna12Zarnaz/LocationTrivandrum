"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Field, Resource } from "@/lib/admin/resources";
import * as A from "@/lib/admin/actions";
import ImageField from "./ImageField";
import { TagsInput, VariantsInput, inputCls } from "./inputs";

type Row = Record<string, any>;
type Opts = Record<string, { value: string; label: string }[]>;
type Props = { resource: Resource; rows: Row[]; options: Opts; imgBase: string; today: string; mode?: "quick"; quickField?: string };

export default function ResourceManager({ resource: R, rows, options, imgBase, today, mode, quickField }: Props) {
  const router = useRouter();
  const [, start] = useTransition();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [q, setQ] = useState(""); const [flt, setFlt] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<Row | "new" | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [drag, setDrag] = useState<string | null>(null);

  const lbl = (f: string, v: any) => { const fld = R.fields.find((x) => x.name === f); const o = fld?.options && options[fld.options]?.find((x) => x.value === v); return o ? o.label : v ?? ""; };
  const title = (r: Row) => lbl(R.titleField, r[R.titleField]);
  const sub = (r: Row) => R.subtitleFields.map((f) => { const v = f.endsWith("_at") ? r[f + "__local"]?.replace("T", " ") : lbl(f, r[f]); return v === "" || v == null ? null : String(v).replace(/(\d\d:\d\d):00$/, "$1"); }).filter(Boolean).join(" · ");

  const run = (p: Promise<A.R>, after?: () => void) => start(async () => {
    const r = await p;
    setMsg(r.ok ? { ok: true, t: r.message || "Done." } : { ok: false, t: r.error || "Not done." });
    window.setTimeout(() => setMsg(null), 4500);
    if (r.ok) { after?.(); router.refresh(); }
  });

  const visible = useMemo(() => rows.filter((r) => (!R.archivable || (tab === "archived") === !!r.archived_at) && (!R.filterBy || !flt || r[R.filterBy] === flt) && (!q || String(title(r)).toLowerCase().includes(q.toLowerCase()))), [rows, tab, q, flt]); // eslint-disable-line react-hooks/exhaustive-deps
  const canDrag = R.sortable && !q && !flt && tab === "active" && !mode;
  const move = (id: string, to: number) => {
    const ids = visible.map((r) => r.id); const from = ids.indexOf(id); if (from < 0 || to < 0 || to >= ids.length) return;
    ids.splice(to, 0, ids.splice(from, 1)[0]); run(A.reorder(R.slug, ids));
  };

  if (R.singleton) return <div className="mx-auto max-w-2xl"><Banner m={msg} /><Form key="s" R={R} row={rows[0] || {}} options={options} imgBase={imgBase} today={today} inline onDone={(t) => { setMsg({ ok: true, t }); router.refresh(); }} /></div>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-3xl">{mode === "quick" ? "Bestsellers" : R.title}</h1>
        {!mode && <button onClick={() => setEdit("new")} className="h-11 bg-oak px-5 text-sm font-medium">Add {R.singular}</button>}
      </div>
      <Banner m={msg} />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input aria-label="Search" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className={`${inputCls} basis-44 flex-1`} />
        {R.filterBy && <select aria-label="Filter" value={flt} onChange={(e) => setFlt(e.target.value)} className={`${inputCls} w-auto`}><option value="">All categories</option>{options.categories?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>}
        {R.archivable && !mode && (["active", "archived"] as const).map((t) => <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`h-11 border px-4 text-sm ${tab === t ? "border-charcoal bg-charcoal text-ivory" : "border-brass/50"}`}>{t === "active" ? "Active" : "Archived"}</button>)}
      </div>

      {R.bulk && sel.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 bg-sand p-3 text-sm">
          <b>{sel.size} selected</b>
          {R.toggles.map((t) => <span key={t.field} className="contents">
            <button onClick={() => run(A.bulkSet(R.slug, [...sel], { field: t.field, value: true }), () => setSel(new Set()))} className="h-10 border border-brass px-3">{t.label}: on</button>
            <button onClick={() => run(A.bulkSet(R.slug, [...sel], { field: t.field, value: false }), () => setSel(new Set()))} className="h-10 border border-brass px-3">{t.label}: off</button></span>)}
          <select aria-label="Move to category" defaultValue="" onChange={(e) => e.target.value && run(A.bulkSet(R.slug, [...sel], { field: "category_id", value: e.target.value }), () => setSel(new Set()))} className="h-10 border border-brass bg-white px-2">
            <option value="">Move to category…</option>{options.categories?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <button onClick={() => run(A.bulkSet(R.slug, [...sel], { field: "archived", value: tab === "active" }), () => setSel(new Set()))} className="h-10 border border-brass px-3">{tab === "active" ? "Archive" : "Restore"}</button>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="mt-6 border border-dashed border-brass/60 p-10 text-center"><p className="font-serif text-2xl">Nothing here yet</p>{!mode && tab === "active" && <button onClick={() => setEdit("new")} className="mt-4 h-11 bg-oak px-5 text-sm">Add {R.singular}</button>}</div>
      ) : (
        <ul className="mt-4 space-y-2">
          {visible.map((r, i) => (
            <li key={r.id} draggable={canDrag} onDragStart={() => setDrag(r.id)} onDragOver={(e) => canDrag && e.preventDefault()} onDrop={() => drag && drag !== r.id && move(drag, i)}
              className="flex flex-wrap items-center gap-3 border border-brass/30 bg-white p-3">
              {R.bulk && !mode && <input type="checkbox" aria-label={`Select ${title(r)}`} checked={sel.has(r.id)} onChange={(e) => { const n = new Set(sel); e.target.checked ? n.add(r.id) : n.delete(r.id); setSel(n); }} className="h-5 w-5" />}
              {R.imageField && <div className="h-14 w-14 shrink-0 overflow-hidden bg-sand">{r[R.imageField] && imgBase && <img src={`${imgBase}/${r[R.imageField]}`} alt="" className="h-full w-full object-cover" loading="lazy" />}</div>}
              <div className="min-w-0 flex-1 basis-40"><p className="truncate font-medium">{title(r)}</p><p className="truncate text-sm text-charcoal/60">{sub(r)}</p></div>
              {(mode ? R.toggles.filter((t) => t.field === quickField) : R.toggles).map((t) => (
                <button key={t.field} aria-pressed={!!r[t.field]} onClick={() => run(A.toggleField(R.slug, r.id, t.field, !r[t.field]))} className={`h-10 border px-3 text-sm ${r[t.field] ? "border-charcoal bg-charcoal text-ivory" : "border-brass/50 text-charcoal/70"}`}>{t.label}</button>))}
              {!mode && <div className="flex flex-wrap gap-1 text-sm">
                {canDrag && <><button aria-label="Move up" disabled={i === 0} onClick={() => move(r.id, i - 1)} className="h-10 w-10 border border-brass/50 disabled:opacity-30">↑</button><button aria-label="Move down" disabled={i === visible.length - 1} onClick={() => move(r.id, i + 1)} className="h-10 w-10 border border-brass/50 disabled:opacity-30">↓</button></>}
                <button onClick={() => setEdit(r)} className="h-10 border border-brass px-3">Edit</button>
                <button onClick={() => run(A.duplicateRow(R.slug, r.id))} className="h-10 border border-brass/50 px-3">Duplicate</button>
                {R.archivable && <button onClick={() => run(A.setArchived(R.slug, r.id, !r.archived_at))} className="h-10 border border-brass/50 px-3">{r.archived_at ? "Restore" : "Archive"}</button>}
                <button onClick={() => setDel(r)} className="h-10 border border-red-800/40 px-3 text-red-800">Delete</button>
              </div>}
            </li>
          ))}
        </ul>
      )}

      {edit && <Modal onClose={() => setEdit(null)} label={edit === "new" ? `Add ${R.singular}` : `Edit ${R.singular}`}>
        <Form R={R} row={edit === "new" ? null : edit} options={options} imgBase={imgBase} today={today} onCancel={() => setEdit(null)} onDone={(t) => { setEdit(null); setMsg({ ok: true, t }); window.setTimeout(() => setMsg(null), 4500); router.refresh(); }} /></Modal>}
      {del && <Modal onClose={() => setDel(null)} label="Delete"><DeleteBox R={R} row={del} name={String(title(del))} options={options} onClose={() => setDel(null)} onDone={(t) => { setDel(null); setMsg({ ok: true, t }); router.refresh(); }} /></Modal>}
    </div>
  );
}

function Banner({ m }: { m: { ok: boolean; t: string } | null }) {
  return m ? <p role={m.ok ? "status" : "alert"} className={`mt-3 border p-3 text-sm ${m.ok ? "border-green-700/40 bg-green-50" : "border-red-800/40 bg-red-50 text-red-900"}`}>{m.t}</p> : null;
}
function Modal({ children, onClose, label }: { children: React.ReactNode; onClose: () => void; label: string }) {
  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="max-h-[92svh] w-full max-w-2xl overflow-y-auto bg-ivory p-5 sm:p-6">{children}</div>
    </div>
  );
}

function DeleteBox({ R, row, name, options, onClose, onDone }: { R: Resource; row: Row; name: string; options: Opts; onClose: () => void; onDone: (t: string) => void }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [need, setNeed] = useState<number | null>(null); const [to, setTo] = useState("");
  async function go(opt?: { mode: "reassign" | "archive"; to?: string }) {
    setBusy(true); setErr(""); const r = await A.deleteRow(R.slug, row.id, opt); setBusy(false);
    if (r.ok) onDone(r.message || "Deleted."); else if (r.needsDecision) setNeed(r.count || 0); else setErr(r.error || "Not deleted.");
  }
  return (
    <div>
      <h2 className="font-serif text-2xl">Delete “{name}”?</h2>
      {need === null ? <p className="mt-2 text-sm">This cannot be undone. {R.archivable && "You can archive instead and restore later."}</p> : (
        <div className="mt-3 space-y-3 text-sm"><p>This category has {need} dish{need === 1 ? "" : "es"}. Choose what happens to them.</p>
          <select aria-label="Move dishes to" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls}><option value="">Move dishes to…</option>{options.categories?.filter((o) => o.value !== row.id).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
          <div className="flex flex-wrap gap-2"><button disabled={!to || busy} onClick={() => go({ mode: "reassign", to })} className="h-11 bg-charcoal px-4 text-ivory disabled:opacity-40">Move dishes and delete</button>
            <button disabled={busy} onClick={() => go({ mode: "archive" })} className="h-11 border border-brass px-4">Archive category and dishes</button></div></div>)}
      {err && <p role="alert" className="mt-2 text-sm text-red-800">{err}</p>}
      <div className="mt-5 flex gap-2">
        <button onClick={onClose} className="h-11 border border-brass px-5">Cancel</button>
        {need === null && <button disabled={busy} onClick={() => go()} className="h-11 bg-red-800 px-5 text-white disabled:opacity-50">{busy ? "Deleting…" : "Delete"}</button>}
      </div>
    </div>
  );
}

function Form({ R, row, options, imgBase, today, onDone, onCancel, inline }: { R: Resource; row: Row | null; options: Opts; imgBase: string; today: string; onDone: (t: string) => void; onCancel?: () => void; inline?: boolean }) {
  const init = () => Object.fromEntries(R.fields.map((f) => {
    const cur = row?.[f.type === "datetime" ? f.name + "__local" : f.name];
    const d = f.default === "$today" ? today : f.default;
    const v = row && row.id !== undefined || (row && R.singleton) ? cur : d;
    if (f.type === "tags") return [f.name, v ?? []];
    if (f.type === "variants") return [f.name, v ?? []];
    if (f.type === "bool") return [f.name, !!v];
    if (f.type === "image") return [f.name, v ?? null];
    if (f.type === "select") return [f.name, v != null ? String(v) : ""];
    return [f.name, v != null ? String(v) : ""];
  }));
  const [v, setV] = useState<Record<string, any>>(init); // stays filled after an error so nothing is lost
  const [errs, setErrs] = useState<Record<string, string>>({}); const [top, setTop] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: string, x: any) => setV((p) => ({ ...p, [k]: x }));
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErrs({}); setTop("");
    const r = await A.saveRow(R.slug, row?.id ?? (R.singleton ? "1" : null), v); setBusy(false);
    if (r.ok) onDone(r.message || "Saved."); else { setErrs(r.errors || {}); setTop(r.error || ""); }
  }
  const one = (f: Field) => {
    const id = `f-${f.name}`, o = f.options ? options[f.options] || [] : f.choices || [];
    switch (f.type) {
      case "bool": return <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={!!v[f.name]} onChange={(e) => set(f.name, e.target.checked)} className="h-5 w-5" />{f.label}</label>;
      case "textarea": return <textarea id={id} rows={3} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className={`${inputCls} h-auto py-2`} />;
      case "select": return <select id={id} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className={inputCls}>{(!f.required || !v[f.name]) && !f.default && <option value="">{f.required ? "Choose…" : "None"}</option>}{o.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>;
      case "number": return <input id={id} type="number" inputMode="decimal" step="0.01" min={f.min} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className={inputCls} />;
      case "datetime": return <input id={id} type="datetime-local" value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className={inputCls} />;
      case "date": case "time": return <input id={id} type={f.type} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className={inputCls} />;
      case "image": return <ImageField value={v[f.name]} onChange={(k) => set(f.name, k)} folder={f.folder || "general"} imgBase={imgBase} />;
      case "tags": return <TagsInput id={id} value={v[f.name]} onChange={(x) => set(f.name, x)} suggestions={f.suggestions} />;
      case "variants": return <VariantsInput value={v[f.name]} onChange={(x) => set(f.name, x)} />;
      default: return <input id={id} value={v[f.name] ?? ""} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} className={inputCls} />;
    }
  };
  return (
    <form onSubmit={submit} noValidate className={inline ? "mt-4" : ""}>
      {!inline && <h2 className="font-serif text-2xl">{row ? `Edit ${R.singular}` : `Add ${R.singular}`}</h2>}
      {inline && <h1 className="font-serif text-3xl">{R.title}</h1>}
      {top && <p role="alert" className="mt-3 border border-red-800/40 bg-red-50 p-3 text-sm text-red-900">{top}</p>}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {R.fields.map((f) => (
          <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
            {f.type !== "bool" && <label htmlFor={`f-${f.name}`} className="mb-1 block text-sm font-medium">{f.label}{f.required && <span className="text-red-800"> *</span>}</label>}
            {one(f)}
            {f.help && !errs[f.name] && <p className="mt-1 text-xs text-charcoal/60">{f.help}</p>}
            {errs[f.name] && <p role="alert" className="mt-1 text-sm text-red-800">{errs[f.name]}</p>}
          </div>
        ))}
      </div>
      <div className="sticky bottom-0 -mx-5 mt-6 flex gap-2 bg-ivory px-5 py-3 sm:-mx-6 sm:px-6">
        <button disabled={busy} className="h-11 bg-oak px-6 text-sm font-medium disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
        {onCancel && <button type="button" onClick={onCancel} className="h-11 border border-brass px-6 text-sm">Cancel</button>}
      </div>
    </form>
  );
}
