import type { Metadata } from "next";
import HomeView from "@/components/HomeView";
import { getPublicHome } from "@/lib/data";

export const revalidate = 60; // ISR backstop. Admin saves also purge via tag "menu".
const site = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

export async function generateMetadata(): Promise<Metadata> {
  const d = await getPublicHome(); const s = d.settings;
  const desc = s.seoDescription || s.tagline || "Browse our digital menu.";
  const og = d.slides.find((x) => x.image)?.image;
  return {
    metadataBase: new URL(site), title: `${s.name} | Menu`, description: desc, alternates: { canonical: "/" },
    openGraph: { title: s.name, description: desc, type: "website", url: "/", images: og ? [{ url: og }] : undefined },
    icons: s.favicon ? { icon: s.favicon } : undefined,
  };
}

export default async function Home() {
  const d = await getPublicHome(); const s = d.settings;
  // Structured data only from real settings. Nothing invented.
  const ld = (s.address || s.phone) ? {
    "@context": "https://schema.org", "@type": "Restaurant", name: s.name, url: site, servesCuisine: ["European", "Arabic"],
    ...(s.phone && { telephone: s.phone }), ...(s.address && { address: { "@type": "PostalAddress", streetAddress: s.address.replace(/\n/g, ", ") } }),
    ...(s.logo && { image: s.logo }), hasMenu: site,
  } : null;
  return (
    <>
      {ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />}
      <HomeView data={d} />
    </>
  );
}
