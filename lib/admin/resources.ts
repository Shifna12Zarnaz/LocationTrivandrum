/* Admin is config-driven. Add a field here and it appears in the form, validation and save automatically. */
export type Choice = { value: string; label: string };
export type Field = {
  name: string; label: string; help?: string; placeholder?: string; required?: boolean; default?: unknown;
  type: "text" | "textarea" | "number" | "bool" | "image" | "select" | "tags" | "datetime" | "date" | "time" | "variants";
  options?: "categories" | "items"; choices?: Choice[]; numeric?: boolean; min?: number; max?: number;
  folder?: string; suggestions?: string[]; validate?: "timezone"; half?: boolean;
};
export type Resource = {
  slug: string; table: string; title: string; singular: string; titleField: string; subtitleFields: string[]; imageField?: string;
  sortable?: boolean; archivable?: boolean; bulk?: boolean; singleton?: boolean; filterBy?: string;
  toggles: { field: string; label: string }[]; range?: [string, string]; fields: Field[];
};

const link: Field[] = [
  { name: "link_section", label: "Button goes to", type: "select", default: "menu", choices: [{ value: "menu", label: "The menu" }, { value: "offers", label: "Offers" }, { value: "special", label: "Today's special" }] },
  { name: "category_id", label: "…or a menu category", type: "select", options: "categories", help: "Optional. Overrides the choice above.", half: true },
  { name: "item_id", label: "…or one dish", type: "select", options: "items", help: "Optional. Opens that dish.", half: true },
  { name: "link_url", label: "…or a web address", type: "text", placeholder: "https://", help: "Optional. Overrides everything else." },
];

export const RESOURCES: Record<string, Resource> = {
  "menu-items": {
    slug: "menu-items", table: "menu_items", title: "Menu items", singular: "dish", titleField: "name", subtitleFields: ["category_id", "price"],
    imageField: "image_key", sortable: true, archivable: true, bulk: true, filterBy: "category_id",
    toggles: [{ field: "is_available", label: "Available" }, { field: "is_bestseller", label: "Bestseller" }],
    fields: [
      { name: "name", label: "Dish name", type: "text", required: true },
      { name: "category_id", label: "Category", type: "select", options: "categories", required: true, half: true },
      { name: "price", label: "Price", type: "number", required: true, min: 0, max: 100000, half: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image_key", label: "Photo", type: "image", folder: "dishes" },
      { name: "is_published", label: "Published (visible to customers)", type: "bool", default: true },
      { name: "is_available", label: "Available today", type: "bool", default: true },
      { name: "is_bestseller", label: "Mark as bestseller", type: "bool" },
      { name: "is_veg", label: "Vegetarian", type: "bool" },
      { name: "is_new", label: "New / chef's special", type: "bool" },
      { name: "spice_level", label: "Spice level", type: "select", numeric: true, default: "0", choices: [{ value: "0", label: "Not spicy" }, { value: "1", label: "Mild" }, { value: "2", label: "Medium" }, { value: "3", label: "Hot" }] },
      { name: "allergens", label: "Allergens", type: "tags", suggestions: ["Gluten", "Dairy", "Nuts", "Peanuts", "Eggs", "Fish", "Shellfish", "Soy", "Sesame"] },
      { name: "dietary", label: "Dietary labels", type: "tags", suggestions: ["Halal", "Vegan", "Gluten-free", "Dairy-free", "Nut-free"], help: "Customers can filter by these." },
      { name: "variants", label: "Sizes and add-ons", type: "variants", help: "Optional. Example: Large 45, or add-on Extra cheese +5." },
    ],
  },
  categories: {
    slug: "categories", table: "categories", title: "Categories", singular: "category", titleField: "name", subtitleFields: ["description"], imageField: "image_key",
    sortable: true, archivable: true, toggles: [{ field: "is_active", label: "Visible" }],
    fields: [
      { name: "name", label: "Category name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "image_key", label: "Image", type: "image", folder: "categories" },
      { name: "icon", label: "Icon (an emoji)", type: "text", placeholder: "🍽️", half: true, help: "Leave empty to use default icon." },
      { name: "is_active", label: "Visible to customers", type: "bool", default: true },
    ],
  },
  offers: {
    slug: "offers", table: "offers", title: "Offers", singular: "offer", titleField: "title", subtitleFields: ["discount_label", "starts_at", "ends_at"], imageField: "image_key",
    sortable: true, toggles: [{ field: "is_active", label: "Active" }], range: ["starts_at", "ends_at"],
    fields: [
      { name: "title", label: "Offer title", type: "text", required: true },
      { name: "description", label: "Short description", type: "textarea" },
      { name: "discount_label", label: "Discount label", type: "text", placeholder: "10% off your order", half: true },
      { name: "image_key", label: "Banner image", type: "image", folder: "offers" },
      { name: "starts_at", label: "Starts (restaurant time)", type: "datetime", half: true, help: "Leave empty to start now." },
      { name: "ends_at", label: "Ends (restaurant time)", type: "datetime", half: true, help: "Leave empty for no end." },
      { name: "terms", label: "Terms and conditions", type: "textarea" },
      ...link,
      { name: "is_active", label: "Active", type: "bool", default: true },
    ],
  },
  "hero-slides": {
    slug: "hero-slides", table: "hero_slides", title: "Hero slider", singular: "slide", titleField: "heading", subtitleFields: ["subtitle"], imageField: "image_key",
    sortable: true, toggles: [{ field: "is_active", label: "Active" }],
    fields: [
      { name: "heading", label: "Heading", type: "text", required: true },
      { name: "subtitle", label: "Subtitle", type: "text" },
      { name: "image_key", label: "Background photo", type: "image", folder: "slides", help: "Wide photo, at least 1600 px." },
      { name: "cta_text", label: "Button text", type: "text", placeholder: "Explore the Menu", help: "Empty hides the button." },
      ...link,
      { name: "is_active", label: "Active", type: "bool", default: true },
    ],
  },
  specials: {
    slug: "specials", table: "daily_specials", title: "Today's specials", singular: "special", titleField: "item_id", subtitleFields: ["special_date", "start_time", "end_time", "promo_text"],
    sortable: true, toggles: [{ field: "is_active", label: "Active" }], range: ["start_time", "end_time"],
    fields: [
      { name: "item_id", label: "Dish", type: "select", options: "items", required: true },
      { name: "special_date", label: "Date", type: "date", required: true, default: "$today", half: true },
      { name: "promo_text", label: "Promo text", type: "text", placeholder: "Chef's pick today", half: true },
      { name: "start_time", label: "From (optional)", type: "time", half: true },
      { name: "end_time", label: "Until (optional)", type: "time", half: true },
      { name: "is_active", label: "Active", type: "bool", default: true },
    ],
  },
  settings: {
    slug: "settings", table: "restaurant_settings", title: "Restaurant settings", singular: "settings", titleField: "name", subtitleFields: [], singleton: true, toggles: [],
    fields: [
      { name: "name", label: "Restaurant name", type: "text", required: true },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "logo_key", label: "Logo", type: "image", folder: "brand", help: "Empty shows the name as text." },
      { name: "favicon_key", label: "Browser icon", type: "image", folder: "brand" },
      { name: "story", label: "Our story", type: "textarea", help: "Empty hides the section and its link." },
      { name: "phone", label: "Phone", type: "text", half: true }, { name: "whatsapp", label: "WhatsApp number", type: "text", half: true },
      { name: "address", label: "Address", type: "textarea" }, { name: "hours", label: "Opening hours", type: "textarea" },
      { name: "instagram", label: "Instagram link", type: "text", half: true }, { name: "maps_url", label: "Google Maps link", type: "text", half: true },
      { name: "seo_description", label: "Search engine description", type: "textarea" },
      { name: "timezone", label: "Timezone", type: "text", required: true, validate: "timezone", default: "Asia/Dubai", half: true, help: "Example: Asia/Dubai. Controls offers and specials timing." },
      { name: "currency", label: "Currency symbol (leave blank for none)", type: "text", default: "", half: true },
      { name: "allow_multiple_specials", label: "Allow several specials at once", type: "bool" },
      { name: "show_offers_nav", label: "Show Offers in menu bar", type: "bool", default: true },
      { name: "show_story_nav", label: "Show Our Story in menu bar", type: "bool", default: true },
      { name: "show_contact_nav", label: "Show Contact in menu bar", type: "bool", default: true },
    ],
  },
};

/** Every (table, column) that can hold an image key. Used to avoid deleting images still in use. */
export const IMAGE_COLUMNS = Object.values(RESOURCES).flatMap((r) => r.fields.filter((f) => f.type === "image").map((f) => ({ table: r.table, column: f.name })));
