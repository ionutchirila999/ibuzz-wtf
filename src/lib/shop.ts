import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type Category = "technology" | "womens_shoes";

// The shop's name. Used in the header, footer and every page title.
export const SHOP_NAME = "Magical Tech and Wandee Market";
export const SHOP_SHORT_NAME = "Magical Tech";
// The wording used inside the logo artwork.
export const LOGO_NAME = "M&W";
export const SHOP_TAGLINE = "Repaired, inspected and resold with care";

// Contact details for enquiry buttons.
export const SHOP_CONTACT = {
  whatsappNumber: "66896554965", // 089-6554965 in international format
  lineId: "55wandee",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  technology: "Technology",
  womens_shoes: "Women's Shoes",
};

export const SUBCATEGORIES: Record<Category, string[]> = {
  technology: [
    "Smartphones & mobile phones",
    "Tablets & laptops",
    "TVs & monitors",
    "Computer components & accessories",
    "Gaming equipment & peripherals",
    "E-scooter parts & accessories",
    "Used & refurbished electronics",
    "Repair parts & technical accessories",
  ],
  womens_shoes: [
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
