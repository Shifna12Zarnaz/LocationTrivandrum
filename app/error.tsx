"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-svh place-items-center bg-ivory p-6 text-center">
      <div><h1 className="font-serif text-4xl">We could not load the menu</h1><p className="mt-2 text-charcoal/70">Check your connection and try again.</p>
        <button onClick={reset} className="mt-6 h-11 bg-oak px-6 text-sm font-medium">Try again</button></div>
    </main>
  );
}
