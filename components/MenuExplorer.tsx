"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Category, Dish } from "@/lib/types";
import { Photo } from "@/lib/img";

const fmt = (d: Dish) => `${d.currency && d.currency !== "AED" ? `${d.currency} ` : ""}${Number.isInteger(d.price) ? d.price : d.price.toFixed(2)}`;

function Dot({ veg }: { veg: boolean }) {
  return (
    <span role="img" title={veg ? "Vegetarian" : "Non-vegetarian"} aria-label={veg ? "Vegetarian" : "Non-vegetarian"}
      className={`inline-grid h-4 w-4 shrink-0 place-items-center border ${veg ? "border-green-700" : "border-red-800"}`}>
      <span className={`h-2 w-2 rounded-full ${veg ? "bg-green-700" : "bg-red-800"}`} />
    </span>
  );
}

function Badges({ d }: { d: Dish }) {
  const b = [d.bestseller && "Bestseller", d.special && "Today's Special", d.isNew && "New"].filter(Boolean) as string[];
  if (!b.length) return null;
  return <div className="flex flex-wrap gap-1.5">{b.map((x) => <span key={x} className="bg-charcoal/85 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-oak">{x}</span>)}</div>;
}

export default function MenuExplorer({ categories, dishes }: { categories: Category[]; dishes: Dish[] }) {
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [veg, setVeg] = useState(false);
  const [best, setBest] = useState(false);
  const [spec, setSpec] = useState(false);
  const [avail, setAvail] = useState(false);
  const [diet, setDiet] = useState<string[]>([]);
  const [sel, setSel] = useState<Dish | null>(null);

  // Only offer filters the data supports.
  const has = useMemo(() => ({
    veg: dishes.some((d) => d.veg), best: dishes.some((d) => d.bestseller),
    spec: dishes.some((d) => d.special), avail: dishes.some((d) => !d.available),
    diet: Array.from(new Set(dishes.flatMap((d) => d.dietary ?? []))).sort(),
  }), [dishes]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return dishes.filter((d) =>
      (cat === "all" || d.categoryId === cat) && (!s || d.name.toLowerCase().includes(s)) &&
      (!veg || d.veg) && (!best || d.bestseller) && (!spec || d.special) && (!avail || d.available) && diet.every((t) => d.dietary?.includes(t)));
  }, [dishes, cat, q, veg, best, spec, avail, diet]);

  const active = cat !== "all" || q || veg || best || spec || avail || diet.length > 0;
  const reset = () => { setCat("all"); setQ(""); setVeg(false); setBest(false); setSpec(false); setAvail(false); setDiet([]); };

  // Deep links from hero/offers: #menu?cat=<slug> and #menu?dish=<id>
  useEffect(() => {
    const read = () => {
      const h = window.location.hash;
      const c = h.match(/cat=([\w-]+)/), dsh = h.match(/dish=([\w-]+)/);
      const found = c && categories.find((x) => x.slug === c[1]);
      if (found) { setCat(found.id); document.getElementById("menu")?.scrollIntoView(); }
      const dd = dsh && dishes.find((x) => x.id === dsh[1]);
      if (dd) { setSel(dd); document.getElementById("menu")?.scrollIntoView(); }
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [categories, dishes]);

  const chip = (on: boolean) => `h-11 border px-4 text-sm ${on ? "border-charcoal bg-charcoal text-ivory" : "border-brass/50 hover:border-brass"}`;

  return (
    <section id="menu" aria-labelledby="menu-h" className="mx-auto max-w-6xl px-5 py-14">
      <div className="flex items-center gap-4">
        <h2 id="menu-h" className="font-serif text-4xl">Explore the menu</h2>
        <span className="h-px w-16 bg-brass" />
      </div>

      <div role="group" aria-label="Menu categories" className="no-scrollbar -mx-5 mt-6 flex gap-6 overflow-x-auto px-5">
        {[{ id: "all", name: "All" }, ...categories].map((c) => (
          <button key={c.id} aria-pressed={cat === c.id} onClick={() => setCat(c.id)}
            className={`h-11 shrink-0 border-b-2 font-serif text-lg ${cat === c.id ? "border-oak" : "border-transparent text-charcoal/70 hover:text-charcoal"}`}>{c.name}</button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="search">Search dishes</label>
        <input id="search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dishes"
          className="h-11 min-w-0 flex-1 basis-48 border border-brass/50 bg-white px-4 text-sm placeholder:text-charcoal/50" />
        {has.veg && <button aria-pressed={veg} onClick={() => setVeg(!veg)} className={chip(veg)}>Vegetarian</button>}
        {has.best && <button aria-pressed={best} onClick={() => setBest(!best)} className={chip(best)}>Bestsellers</button>}
        {has.spec && <button aria-pressed={spec} onClick={() => setSpec(!spec)} className={chip(spec)}>Today&apos;s Special</button>}
        {has.avail && <button aria-pressed={avail} onClick={() => setAvail(!avail)} className={chip(avail)}>Available now</button>}
        {has.diet.map((t) => <button key={t} aria-pressed={diet.includes(t)} onClick={() => setDiet(diet.includes(t) ? diet.filter((x) => x !== t) : [...diet, t])} className={chip(diet.includes(t))}>{t}</button>)}
        {active && <button onClick={reset} className="h-11 px-3 text-sm text-brass underline underline-offset-4">Clear filters</button>}
      </div>
      <p className="mt-4 text-sm text-charcoal/70" aria-live="polite">{list.length} {list.length === 1 ? "dish" : "dishes"}</p>

      {list.length === 0 ? (
        <div className="mt-8 border border-dashed border-brass/60 p-10 text-center">
          <p className="font-serif text-2xl">No dishes match these filters</p>
          <button onClick={reset} className="mt-4 bg-oak px-6 py-3 text-sm">Clear filters</button>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((d) => (
            <li key={d.id}>
              <button onClick={() => setSel(d)} className={`group flex h-full w-full flex-col bg-white text-left shadow-[0_1px_2px_rgba(32,32,32,.08)] transition hover:bg-sand ${d.available ? "" : "opacity-70"}`}>
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Photo src={d.image} tone={d.tone} alt={d.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute left-2 top-2"><Badges d={d} /></div>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-xl leading-snug">{d.name}</h3><Dot veg={d.veg} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-charcoal/70">{d.description}</p>
                  <p className="mt-auto flex items-center justify-between pt-4 text-sm text-brass">
                    <span className="font-medium">{fmt(d)}</span>
                    {!d.available && <span className="text-xs text-charcoal/60">Unavailable</span>}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
      {sel && <DishDialog d={sel} onClose={() => setSel(null)} />}
    </section>
  );
}

function DishDialog({ d, onClose }: { d: Dish; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); }, []);
  return (
    <dialog ref={ref} onClose={onClose} onClick={(e) => e.target === ref.current && onClose()} aria-label={d.name}
      className="m-auto w-[min(92vw,560px)] max-h-[90svh] overflow-y-auto bg-ivory p-0 backdrop:bg-black/60">
      <div className="relative aspect-[4/3]">
        <Photo src={d.image} tone={d.tone} alt={d.name} className="h-full w-full object-cover" />
        <button onClick={onClose} aria-label="Close" className="absolute right-2 top-2 grid h-11 w-11 place-items-center bg-charcoal/80 text-ivory">✕</button>
        <div className="absolute bottom-2 left-2"><Badges d={d} /></div>
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-3xl leading-tight">{d.name}</h3>
          <p className="shrink-0 pt-1 text-lg text-brass">{fmt(d)}</p>
        </div>
        <p className="mt-3 leading-relaxed text-charcoal/80">{d.description}</p>
        <div className="mt-5 space-y-2 border-t border-brass/40 pt-4 text-sm">
          <div className="flex items-center gap-2"><Dot veg={d.veg} /><span>{d.veg ? "Vegetarian" : "Non-vegetarian"}</span></div>
          {d.spice ? <div><b className="font-medium">Spice: </b>{["", "Mild", "Medium", "Hot"][d.spice]}</div> : null}
          {d.allergens?.length ? <div><b className="font-medium">Contains: </b>{d.allergens.join(", ")}</div> : null}
          {d.dietary?.length ? <div><b className="font-medium">Dietary: </b>{d.dietary.join(", ")}</div> : null}
          {d.variants?.length ? (
            <ul className="space-y-1 border-t border-brass/40 pt-3">
              {d.variants.map((v, i) => <li key={i} className="flex justify-between"><span>{v.name}</span><span className="text-brass">{v.kind === "addon" ? "+" : ""}{d.currency && d.currency !== "AED" ? `${d.currency} ` : ""}{v.price}</span></li>)}
            </ul>
          ) : null}
          {!d.available && <div className="text-charcoal/70">Currently unavailable.</div>}
        </div>
      </div>
    </dialog>
  );
}
