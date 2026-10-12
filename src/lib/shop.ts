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
  whatsappNumber: "66896554965", // 089-6554965 in international format
  lineId: "55wandee", // the ID LINE actually opens a chat with
  lineLabel: "iBuzz.wtf", // how the contact is shown on buttons
};

export const CATEGORY_LABEL: Record<Category, string> = {
  technology: "Technology",
  clothing: "Clothing",
  footwear: "Footwear",
};

export const SUBCATEGORIES: Record<Category, string[]> = {
  technology: [
    "Smartphones & mobile phones",
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
  return `https://line.me/R/ti/p/${encodeURIComponent(SHOP_CONTACT.lineId)}`;
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

export const MARKET_CATEGORIES: Category[] = ["technology", "clothing", "footwear"];
export function legacyCategory(category: Category) { return category === "footwear" ? "womens_shoes" : "technology"; }
export function legacyCondition(condition: string) { return condition === "new" ? "new" : condition === "refurbished" || condition === "repaired_tested" ? "refurbished" : "pre_owned"; }
