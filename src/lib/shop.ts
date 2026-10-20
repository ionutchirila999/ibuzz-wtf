import socialAsset from "@/assets/ibuzz-social.jpg.asset.json";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type Category = "technology" | "clothing" | "footwear";

// The shop's name. Used in the header, footer and every page title.
export const SHOP_NAME = "iBuzz.wtf";
export const SHOP_SHORT_NAME = "iBuzz.wtf";
// The wording used inside the logo artwork.
export const LOGO_NAME = "iBuzz.wtf";
export const SHOP_TAGLINE = "Repair. Build. Buy. Sell.";

// The site's own address. Used for link previews so shared pages point here.
export const SITE_ORIGIN = "https://ibuzz.wtf";
// The branded picture shown when a page is shared in chat or on social media.
export const SOCIAL_IMAGE = `${SITE_ORIGIN}${socialAsset.url}`;

// Contact details for enquiry buttons.
export const SHOP_CONTACT = {
  whatsappNumber: "66828977279", // +66 82 897 7279 (082-897-7279) in international format
  lineId: "ibuzz.wtf", // lowercase: LINE IDs can't contain capital letters
  lineLabel: "ibuzz.wtf", // how the contact is shown on buttons — the exact LINE ID
};

export const CATEGORY_LABEL: Record<Category, string> = {
  technology: "Technology",
  clothing: "Clothing",
  footwear: "Footwear",
};

export const SUBCATEGORIES: Record<Category, string[]> = {
  technology: [
    "Smartphones & mobile phones",
    "Mobile phone accessories",
    "Digital cameras & lenses",
    "Tablets & laptops",
    "TVs & monitors",
    "Computer components & accessories",
    "Gaming equipment & peripherals",
    "E-scooter parts & accessories",
    "Used & refurbished electronics",
    "Repair parts & technical accessories",
  ],
  clothing: ["Tops", "Trousers & shorts", "Dresses & skirts", "Outerwear", "Sportswear"],
  footwear: ["Sneakers", "Sports shoes", "Sandals", "Boots", "Formal footwear",
    "Women's sneakers",
    "Women's casual shoes",
    "Women's sports & running shoes",
    "Women's sandals & slippers",
    "Women's heels & dress shoes",
    "Women's boots",
    "Collectible women's footwear",
  ],
};

export const SIZE_SYSTEMS = ["EU", "US Women", "UK", "JP (cm)"];

export const CONDITION_LABEL: Record<string, string> = {
  new: "New",
  pre_owned: "Pre-owned",
  refurbished: "Refurbished",
  repaired_tested: "Repaired & tested",
  untested: "Untested",
  for_parts: "For parts",
};

export function formatPrice(n: number | null | undefined) {
  return `฿${Number(n ?? 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

export function whatsappLink(product?: Pick<Product, "title">, greeting?: string) {
  const text = product
    ? `${greeting ?? "Hi, I'm interested in:"} ${product.title}`
    : (greeting ?? "Hi, I have a question");
  return `https://wa.me/${SHOP_CONTACT.whatsappNumber}?text=${encodeURIComponent(text)}`;
}
export function lineLink() {
  return "https://line.me/ti/p/CcGd-nkSXZ";
}

export interface CostInput {
  sellingPrice: number;
  purchaseCost: number;
  repairCost: number;
  shipping: number;
  platformFees: number;
  otherExpenses: number;
}

export const MIN_HEALTHY_MARGIN = 15; // percent

export function calcProfit(c: CostInput) {
  const totalCosts = c.purchaseCost + c.repairCost + c.shipping + c.platformFees + c.otherExpenses;
  const netProfit = c.sellingPrice - totalCosts;
  const margin = c.sellingPrice > 0 ? (netProfit / c.sellingPrice) * 100 : 0;
  let warning: string | null = null;
  if (netProfit <= 0) warning = "This deal loses money. Don't buy at this price.";
  else if (margin < MIN_HEALTHY_MARGIN)
    warning = `Thin margin (under ${MIN_HEALTHY_MARGIN}%). Unlikely to be worth the risk.`;
  return { totalCosts, netProfit, margin, warning };
}

export type Lang = "th" | "en" | "ro";
// Product name/description in the visitor's language, falling back to English.
export function localizedTitle(p: Product, lang: Lang) {
  return (lang === "th" ? p.title_th : lang === "ro" ? p.title_ro : null) || p.title;
}
export function localizedDescription(p: Product, lang: Lang) {
  return (lang === "th" ? p.description_th : lang === "ro" ? p.description_ro : null) || p.description;
}

export const MARKET_CATEGORIES: Category[] = ["technology", "clothing", "footwear"];
export function legacyCategory(category: Category) { return category === "footwear" ? "womens_shoes" : "technology"; }
export function legacyCondition(condition: string) { return condition === "new" ? "new" : condition === "refurbished" || condition === "repaired_tested" ? "refurbished" : "pre_owned"; }

// The Market search box matches product names in all three languages, the brand
// and model columns, and the localized descriptions — where brand names and
// model numbers also appear inside the Thai and Romanian wording.
const SEARCH_FIELDS = ["title", "title_th", "title_ro", "brand", "model", "description", "description_th", "description_ro"];

// Builds the database "or" conditions for a search term. Returns undefined when
// there is nothing to search for, so other filters (like availability) are left
// exactly as they are.
export function productSearchConditions(raw: string | undefined): string | undefined {
  const term = (raw ?? "").normalize("NFC").replace(/[^\p{L}\p{M}\p{N} ._-]/gu, "").slice(0, 100);
  if (!term.trim()) return undefined;
  const exact = `%${term.replace(/_/g, "")}%`;
  // Model numbers are often typed without the hyphen or spacing used on the
  // label (F36A for F-36A), so also let any separator stand for anything.
  const loose = `%${term.replace(/[-._ ]+/g, "%")}%`;
  const patterns = exact === loose ? [exact] : [exact, loose];
  return SEARCH_FIELDS.flatMap((f) => patterns.map((p) => `${f}.ilike.${p}`)).join(",");
}
