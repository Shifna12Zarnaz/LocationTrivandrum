"use client";
import { useEffect, useState } from "react";
import type { Slide } from "@/lib/types";
import { Photo } from "@/lib/img";

const defaults = [
  ["A Meeting of Two Culinary Worlds", "European finesse. Arabic soul.", "Explore the menu", "#menu", "/images/hero_culinary_fusion.jpg"],
  ["A Little More to Love", "Discover our latest dining offers.", "Explore offers", "#offers", "/images/hero_dining_offers.jpg"],
  ["End on a Golden Note", "Discover something delicious.", "Explore desserts", "#menu", "/images/hero_golden_desserts.jpg"],
] as const;

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const items = slides.length ? slides : defaults.map(([heading, subtitle, cta, href, image], i) => ({ id: `default-${i}`, heading, subtitle, cta, href, image, tone: [25, 18, 38][i] } satisfies Slide));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (paused || reduced || items.length < 2) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % items.length), 3000);
    return () => window.clearInterval(timer);
  }, [paused, reduced, items.length]);
  const goTo = (next: number) => setIndex((next + items.length) % items.length);

  return <section id="top" aria-label="Restaurant highlights" className="relative h-[calc(100svh-4rem)] min-h-[560px] max-h-[760px] overflow-hidden bg-charcoal text-ivory" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
    {items.map((slide, slideIndex) => <div key={slide.id} aria-hidden={slideIndex !== index} className={`absolute inset-0 transition-opacity duration-1000 ${slideIndex === index ? "z-10 opacity-100" : "z-0 opacity-0"}`}>
      <Photo src={slide.image} tone={slide.tone} alt="" priority={slideIndex === 0} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/32" /><div className="absolute inset-0 bg-gradient-to-t from-black/66 via-black/18 to-black/28" />
      <div className="relative mx-auto flex h-full max-w-6xl items-center px-5 pb-8 sm:px-6 md:px-12"><div className="max-w-2xl pt-8">
        <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-brass sm:mb-6 sm:text-xs sm:tracking-[0.35em]">An invitation to linger</p><h1 className="max-w-xl font-serif text-[2.65rem] leading-[0.98] text-ivory sm:text-6xl md:text-7xl">{slide.heading}</h1>
        <p className="mt-5 max-w-md text-sm text-ivory/90 sm:mt-7 sm:text-lg">{slide.subtitle}</p><a href={slide.href} className="mt-7 inline-flex min-h-12 items-center bg-brass px-6 py-3 text-[10px] uppercase tracking-[0.18em] text-charcoal hover:bg-oak sm:mt-9 sm:px-7 sm:text-xs sm:tracking-[0.2em]">{slide.cta}</a>
      </div></div>
    </div>)}
    <div className="absolute inset-x-0 bottom-8 z-20 mx-auto flex max-w-6xl items-end justify-between px-6 md:px-12"><div className="flex gap-2" aria-label="Choose a slide">{items.map((slide, slideIndex) => <button key={slide.id} aria-label={`Show slide ${slideIndex + 1}`} aria-current={slideIndex === index} onClick={() => goTo(slideIndex)} className={`h-px transition-all ${slideIndex === index ? "w-12 bg-brass" : "w-7 bg-ivory/60"}`} />)}</div><div className="flex gap-2"><button aria-label="Previous slide" onClick={() => goTo(index - 1)} className="grid h-11 w-11 place-items-center border border-ivory/35 text-lg hover:border-brass hover:text-brass">‹</button><button aria-label="Next slide" onClick={() => goTo(index + 1)} className="grid h-11 w-11 place-items-center border border-ivory/35 text-lg hover:border-brass hover:text-brass">›</button></div></div>
  </section>;
}
