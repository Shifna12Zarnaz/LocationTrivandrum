export type Category = { id: string; slug: string; name: string; description?: string };
export type Variant = { name: string; price: number; kind: "size" | "addon" };
export type Dish = {
  id: string; categoryId: string; name: string; description: string; price: number; currency: string;
  veg: boolean; bestseller?: boolean; special?: boolean; isNew?: boolean; spice?: number;
  allergens?: string[]; dietary?: string[]; variants?: Variant[]; available: boolean; image?: string | null; tone: number;
};
export type Slide = { id: string; heading: string; subtitle: string; cta: string; href: string; image?: string | null; tone: number };
export type Offer = { id: string; title: string; text: string; label?: string; terms?: string; href: string; image?: string | null; tone: number };
export type Settings = {
  name: string; tagline: string; logo: string | null; favicon: string | null; story: string; phone: string; whatsapp: string; address: string; hours: string;
  instagram: string; mapsUrl: string; seoDescription: string; timezone: string; currency: string; multiSpecials: boolean;
  navOffers: boolean; navStory: boolean; navContact: boolean;
};
export type Special = { dish: Dish; promo?: string };
export type HomeData = { settings: Settings; slides: Slide[]; offers: Offer[]; categories: Category[]; dishes: Dish[]; specials: Special[] };
