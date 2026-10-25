// SAMPLE DATA. Not verified restaurant information. Replaced by Supabase in phase 2.
import type { Category, Dish, HomeData, Offer, Slide } from "./types";

export const categories: Category[] = [
  { id: "signature", slug: "signature", name: "Signature Plates" },
  { id: "european", slug: "european", name: "European Classics" },
  { id: "arabic", slug: "arabic", name: "Arabic Favourites" },
  { id: "mezze", slug: "mezze", name: "Starters & Mezze" },
  { id: "desserts", slug: "desserts", name: "Desserts & Coffee" },
  { id: "beverages", slug: "beverages", name: "Beverages" },
];

const d = (id: string, categoryId: string, name: string, description: string, price: number, tone: number, o: Partial<Dish> = {}): Dish =>
  ({ id, categoryId, name, description, price, currency: "", veg: false, available: true, tone, image: null, ...o });

export const dishes: Dish[] = [
  d("lamb", "signature", "Herb Crusted Lamb Chops", "Served with saffron rice, grilled vegetables and a rosemary jus.", 78, 28, { bestseller: true, special: true, allergens: ["Dairy"] }),
  d("seabass", "signature", "Mediterranean Seabass", "Olive oil, herbs, citrus and seasonal vegetables.", 68, 190, { isNew: true, allergens: ["Fish"] }),
  d("ribeye", "european", "Grilled Ribeye", "Charcoal grilled, with pepper sauce and fries.", 95, 12, { allergens: ["Dairy"] }),
  d("pasta", "european", "Wild Mushroom Pasta", "Tagliatelle, cream, thyme and parmesan.", 52, 40, { veg: true, allergens: ["Gluten", "Dairy"] }),
  d("hummus", "mezze", "Classic Hummus", "Chickpeas, tahini, olive oil, lemon, served with warm pita.", 32, 45, { veg: true, bestseller: true, allergens: ["Sesame", "Gluten"] }),
  d("fattoush", "mezze", "Fattoush", "Crisp greens, sumac, pomegranate and toasted pita.", 30, 110, { veg: true }),
  d("mixed", "arabic", "Mixed Grill", "Lamb kofta, shish tawook and beef skewers with garlic sauce.", 84, 20, { spice: 1, bestseller: true }),
  d("kabsa", "arabic", "Chicken Kabsa", "Spiced rice, slow cooked chicken, tomato daggus.", 58, 35, { spice: 2, available: false }),
  d("baklava", "desserts", "Pistachio Baklava", "Layers of filo, pistachio and honey.", 28, 38, { veg: true, allergens: ["Nuts", "Gluten"] }),
  d("karak", "beverages", "Saffron Karak", "Slow brewed tea with saffron and cardamom.", 14, 32, { veg: true }),
];

export const slides: Slide[] = [
  { id: "s1", heading: "A Meeting of Two Culinary Worlds", subtitle: "European finesse. Arabic soul.", cta: "Explore the Menu", href: "#menu", image: "/images/hero_culinary_fusion.jpg", tone: 25 },
  { id: "s2", heading: "A Little More to Love", subtitle: "Discover our latest dining offers.", cta: "Explore Offers", href: "#offers", image: "/images/hero_dining_offers.jpg", tone: 15 },
  { id: "s3", heading: "End on a Golden Note", subtitle: "Discover something delicious.", cta: "Explore Desserts", href: "#menu?cat=desserts", image: "/images/hero_golden_desserts.jpg", tone: 38 },
];

export const offers: Offer[] = [
  { id: "o1", title: "A Little More to Love", text: "Sample offer text, editable by admin.", label: "10% off your order", href: "#menu", image: null, tone: 22 },
  { id: "o2", title: "Golden Hour", text: "Sweeten your evening.", href: "#menu?cat=desserts", image: null, tone: 38 },
  { id: "o3", title: "Chef's Special", text: "A plate chosen by the kitchen.", href: "#menu", image: null, tone: 12 },
];

export const sampleHome = (): HomeData => ({
  settings: { name: "Location Restaurant", tagline: "European finesse. Arabic soul.", logo: null, favicon: null, story: "", phone: "", whatsapp: "", address: "", hours: "", instagram: "", mapsUrl: "", seoDescription: "", timezone: "Asia/Dubai", currency: "", multiSpecials: false, navOffers: true, navStory: false, navContact: false },
  slides, offers, categories, dishes, specials: dishes.filter((x) => x.special).map((dish) => ({ dish })),
});
export const site = { name: "LOCATION RESTAURANT", tagline: "European finesse. Arabic soul.", currency: "" };
