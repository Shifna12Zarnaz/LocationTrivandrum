"use client";
import { useState } from "react";
export default function Header({ name, logo, links }: { name: string; logo: string | null; links: string[][] }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 bg-charcoal text-ivory">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a href="#top" className="font-omegle text-xl tracking-[0.14em] sm:text-2xl">{logo ? <img src={logo} alt={name} className="h-9 w-auto" /> : name.toUpperCase()}</a>
        <nav aria-label="Primary" className="hidden items-center gap-8 text-sm md:flex">
          {links.map(([l, h]) => <a key={l} href={h} className="py-1 hover:text-oak">{l}</a>)}
          <a href="#menu" className="border border-brass px-5 py-2.5 text-oak hover:bg-brass hover:text-charcoal">View Menu</a>
        </nav>
        <button className="grid h-11 w-11 place-items-center md:hidden" aria-expanded={open} aria-controls="drawer" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          <span className="block w-6 space-y-1.5"><i className="block h-px bg-ivory" /><i className="block h-px bg-ivory" /><i className="block h-px bg-ivory" /></span>
        </button>
      </div>
      {open && (
        <nav id="drawer" aria-label="Mobile" className="border-t border-white/10 px-5 pb-5 md:hidden">
          {links.map(([l, h]) => <a key={l} href={h} onClick={() => setOpen(false)} className="block border-b border-white/10 py-4">{l}</a>)}
          <a href="#menu" onClick={() => setOpen(false)} className="mt-5 block border border-brass py-3 text-center text-oak">View Menu</a>
        </nav>
      )}
    </header>
  );
}
