import type { Special } from "@/lib/types";
import { Photo } from "@/lib/img";

export default function TodaySpecial({ specials }: { specials: Special[] }) {
  if (!specials.length) return null;
  return (
    <section id="special" aria-labelledby="sp-h" className="mt-8 bg-charcoal py-16 text-ivory md:mt-12 md:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-center gap-4"><h2 id="sp-h" className="text-xs font-medium uppercase tracking-[0.22em] text-oak">Today&apos;s Special</h2><span className="h-px w-16 bg-brass" /></div>
        <ul className="mt-7 space-y-8">
          {specials.map(({ dish: d, promo }) => (
            <li key={d.id} className="grid overflow-hidden border border-white/10 bg-black/20 md:grid-cols-[minmax(0,1.1fr)_minmax(280px,.9fr)]">
              <Photo src={d.image} tone={d.tone} alt={d.name} className="aspect-[16/10] w-full md:aspect-auto md:min-h-[300px]" />
              <div className="flex flex-col justify-center p-6 sm:p-8 md:p-10">
                <p className="text-[10px] uppercase tracking-[0.25em] text-oak">From the kitchen</p>
                <h3 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{d.name}</h3>
                {promo && <p className="mt-3 text-oak">{promo}</p>}
                <p className="mt-4 max-w-md leading-relaxed text-ivory/75">{d.description}</p>
                <p className="mt-5 text-xl text-oak">{d.currency && d.currency !== "AED" ? `${d.currency} ` : ""}{d.price}</p>
                {!d.available && <p className="mt-1 text-sm text-ivory/60">Currently unavailable</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
