import type { HomeData } from "@/lib/types";
import Header from "./Header";
import HeroSlider from "./HeroSlider";
import Offers from "./Offers";
import TodaySpecial from "./TodaySpecial";
import MenuExplorer from "./MenuExplorer";

export default function HomeView({ data }: { data: HomeData }) {
  const { settings: s } = data;
  const hasContact = !!(s.phone || s.address || s.hours || s.instagram || s.mapsUrl || s.whatsapp || s.googleReviewUrl || s.feedbackUrl);
  const links: string[][] = [["Home", "#top"], ["Menu", "#menu"]];
  if (data.offers.length && s.navOffers) links.push(["Offers", "#offers"]);
  if (s.story && s.navStory) links.push(["Our Story", "#story"]);
  if (s.googleReviewUrl) links.push(["Feedback", "#feedback"]);
  if (hasContact && s.navContact) links.push(["Contact", "#contact"]);
  const wa = s.whatsapp.replace(/\D/g, "");
  return (
    <>
      <Header name={s.name} logo={s.logo} links={links} />
      <main>
        <HeroSlider slides={data.slides} />
        <Offers offers={data.offers} />
        <TodaySpecial specials={data.specials} />
        <MenuExplorer categories={data.categories} dishes={data.dishes} />
        {s.story && (
          <section id="story" className="bg-gradient-to-b from-sand to-stone-100 py-16 md:py-20"><div className="mx-auto max-w-3xl px-5">
            <h2 className="font-serif text-4xl md:text-5xl text-charcoal">Our story</h2><p className="mt-6 whitespace-pre-line leading-relaxed text-charcoal/80">{s.story}</p>
          </div></section>
        )}
        {s.googleReviewUrl && (
          <section id="feedback" className="bg-sand px-5 py-16 md:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-oak">Your feedback matters</p>
              <h2 className="mt-3 font-serif text-4xl text-charcoal md:text-5xl">Enjoyed your visit?</h2>
              <p className="mx-auto mt-4 max-w-xl text-charcoal/75">Share your experience with us on Google. Your review helps our restaurant grow.</p>
              <a href={s.googleReviewUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex min-h-11 items-center bg-oak px-6 text-sm font-medium text-charcoal transition-colors hover:bg-charcoal hover:text-ivory">Leave a Google review</a>
            </div>
          </section>
        )}
      </main>
      <footer id="contact" className="bg-gradient-to-br from-charcoal via-stone-900 to-black px-5 py-12 text-ivory">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
          <div><p className="font-omegle text-2xl tracking-[0.14em]">{s.name.toUpperCase()}</p>{s.tagline && <p className="mt-2 text-sm text-ivory/70">{s.tagline}</p>}</div>
          {hasContact && (
            <ul className="space-y-1 text-sm text-ivory/80">
              {s.address && <li className="whitespace-pre-line">{s.address}</li>}
              {s.hours && <li className="whitespace-pre-line">{s.hours}</li>}
              {s.phone && <li><a className="underline hover:text-oak transition-colors" href={`tel:${s.phone}`}>{s.phone}</a></li>}
              {wa && <li><a className="underline hover:text-oak transition-colors" href={`https://wa.me/${wa}`}>WhatsApp</a></li>}
              {s.instagram && <li><a className="underline hover:text-oak transition-colors" href={s.instagram}>Instagram</a></li>}
              {s.mapsUrl && <li><a className="underline hover:text-oak transition-colors" href={s.mapsUrl}>Directions</a></li>}
              {s.googleReviewUrl && <li><a className="inline-flex min-h-11 items-center border border-oak px-4 text-oak transition-colors hover:bg-oak hover:text-charcoal" href={s.googleReviewUrl} target="_blank" rel="noreferrer">Leave feedback on Google</a></li>}
              {s.feedbackUrl && <li><a className="inline-flex min-h-11 items-center border border-oak px-4 text-oak transition-colors hover:bg-oak hover:text-charcoal" href={s.feedbackUrl} target="_blank" rel="noreferrer">Send private feedback</a></li>}
            </ul>
          )}
        </div>
      </footer>
    </>
  );
}
