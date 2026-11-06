"use client";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function QrPage() {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const target = `${site}/`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&margin=24&data=${encodeURIComponent(target)}`;
  async function downloadQr() {
    const response = await fetch(qr);
    if (!response.ok) throw new Error("Could not download QR code");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "restaurant-menu-qr.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  return <div className="mx-auto max-w-2xl text-center">
    <h1 className="font-serif text-3xl">Table QR code</h1>
    <p className="mt-2 text-sm text-charcoal/70">Print this code and place it on restaurant tables. Scanning opens the public menu.</p>
    <div className="mt-6 bg-white p-6 shadow-sm"><img src={qr} alt={`QR code for ${target}`} className="mx-auto aspect-square w-full max-w-md" /></div>
    <p className="mt-3 break-all text-xs text-charcoal/60">{target}</p>
    <div className="mt-5 flex flex-wrap justify-center gap-3 print:hidden">
      <button onClick={() => void downloadQr()} className="inline-flex h-11 items-center bg-oak px-5 text-sm font-medium">Download QR</button>
      <button onClick={() => window.print()} className="h-11 border border-brass px-5 text-sm">Print</button>
      <Link href="/" className="inline-flex h-11 items-center border border-brass px-5 text-sm">Open menu</Link>
    </div>
    <p className="mt-5 text-xs text-charcoal/60 print:hidden">Set NEXT_PUBLIC_SITE_URL to the live website address before printing production codes.</p>
  </div>;
}
