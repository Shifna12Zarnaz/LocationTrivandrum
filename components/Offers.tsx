"use client";
import { useEffect, useState, useRef } from "react";
import type { Offer } from "@/lib/types";
import { Photo } from "@/lib/img";

export default function Offers({ offers }: { offers: Offer[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const scrollContainerRef = useRef<HTMLUListElement>(null);
  const displayOffers = offers.slice(0, 4);

  useEffect(() => {
    if (displayOffers.length < 2 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayOffers.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [displayOffers.length, isPaused]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.85;
      container.scrollTo({
        left: currentIndex * scrollAmount,
        behavior: "smooth"
      });
    }
  }, [currentIndex]);

  const scrollNext = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev + 1) % displayOffers.length);
    setTimeout(() => setIsPaused(false), 10000);
  };

  const scrollPrev = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev - 1 + displayOffers.length) % displayOffers.length);
    setTimeout(() => setIsPaused(false), 10000);
  };

  if (!displayOffers.length) return null;

  return (
    <section id="offers" aria-labelledby="offers-h" className="mx-auto max-w-6xl px-5 pt-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 id="offers-h" className="text-xs font-medium uppercase tracking-[0.22em]">Offers & Specials</h2>
          <span className="h-px w-16 bg-brass" />
        </div>
        {displayOffers.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              aria-label="Previous offer"
              className="grid h-10 w-10 place-items-center border border-ivory/40 hover:border-oak transition-colors text-ivory"
            >
              ‹
            </button>
            <button
              onClick={scrollNext}
              aria-label="Next offer"
              className="grid h-10 w-10 place-items-center border border-ivory/40 hover:border-oak transition-colors text-ivory"
            >
              ›
            </button>
          </div>
        )}
      </div>
      <ul
        ref={scrollContainerRef}
        className="no-scrollbar mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto md:grid md:grid-cols-2 md:overflow-visible"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {displayOffers.map((o, index) => (
          <li key={o.id} className="min-w-[85%] snap-start md:min-w-0">
            <a
              href={o.href}
              className="group relative block h-44 overflow-hidden bg-gradient-to-br from-charcoal via-stone-900 to-black text-ivory md:h-48 hover:from-stone-900 hover:via-charcoal hover:to-black transition-all duration-500"
            >
              <Photo src={o.image} tone={o.tone} alt="" className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
              <div className="relative flex h-full max-w-[65%] flex-col justify-center p-6">
                <h3 className="font-serif text-3xl leading-tight">{o.title}</h3>
                <p className="mt-1 text-sm text-ivory/90">{o.label ?? o.text}</p>
                <span className="mt-3 h-px w-8 bg-gradient-to-r from-oak to-brass" />
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
