import { describe, expect, it } from "vitest";
import { calcProfit, lineLink, productSearchConditions, SHOP_CONTACT, whatsappLink } from "./shop";

describe("calcProfit", () => {
  it("subtracts every cost from the selling price", () => {
    const r = calcProfit({ sellingPrice: 10000, purchaseCost: 5000, repairCost: 1000, shipping: 200, platformFees: 300, otherExpenses: 500 });
    expect(r.netProfit).toBe(3000);
    expect(r.margin).toBe(30);
    expect(r.warning).toBeNull();
  });
  it("warns when the deal loses money", () => {
    const r = calcProfit({ sellingPrice: 1000, purchaseCost: 900, repairCost: 200, shipping: 0, platformFees: 0, otherExpenses: 0 });
    expect(r.netProfit).toBe(-100);
    expect(r.warning).toMatch(/loses money/);
  });
  it("warns when margin is below 15%", () => {
    const r = calcProfit({ sellingPrice: 1000, purchaseCost: 900, repairCost: 0, shipping: 0, platformFees: 0, otherExpenses: 0 });
    expect(r.warning).toMatch(/Thin margin/);
  });
});

describe("WhatsApp contact", () => {
  it("opens the owner's current number", () => {
    expect(SHOP_CONTACT.whatsappNumber).toBe("66828977279");
    expect(whatsappLink().startsWith("https://wa.me/66828977279?text=")).toBe(true);
    expect(whatsappLink({ title: "iPhone 12" })).toContain("https://wa.me/66828977279?text=");
    expect(whatsappLink()).not.toContain("66896554965");
  });
});

describe("LINE contact", () => {
  it("links to the lowercase ID while showing the brand label", () => {
    expect(lineLink()).toBe("https://line.me/ti/p/CcGd-nkSXZ");
    expect(SHOP_CONTACT.lineLabel).toBe("ibuzz.wtf");
    expect(SHOP_CONTACT.lineId).toBe("ibuzz.wtf");
    expect(SHOP_CONTACT.lineId).toBe(SHOP_CONTACT.lineId.toLowerCase());
  });
});

describe("Market search matching", () => {
  it("searches names, brands and model numbers in Thai, English and Romanian", () => {
    const f = productSearchConditions("xiaomi")!;
    for (const field of ["title", "title_th", "title_ro", "brand", "model", "description", "description_th", "description_ro"]) {
      expect(f).toContain(`${field}.ilike.%xiaomi%`);
    }
  });
  it("keeps Thai tone marks and Romanian diacritics in the typed term", () => {
    expect(productSearchConditions("เมาส์")!).toContain("%เมาส์%");
    expect(productSearchConditions("baterie externă")!).toContain("%baterie externă%");
  });
  it("also finds model numbers typed without the label's hyphen", () => {
    const f = productSearchConditions("F-36A")!;
    expect(f).toContain("model.ilike.%F-36A%");
    expect(f).toContain("model.ilike.%F%36A%");
  });
  it("drops characters that would break the database filter", () => {
    const f = productSearchConditions("Fujifilm, (JX500)")!;
    expect(f).toContain(".ilike.%Fujifilm%JX500%");
    expect(f).not.toContain("Fujifilm,");
    expect(f).not.toContain("(");
  });
  it("asks for nothing when the search box is empty", () => {
    expect(productSearchConditions(undefined)).toBeUndefined();
    expect(productSearchConditions("   ")).toBeUndefined();
    expect(productSearchConditions("%%%")).toBeUndefined();
  });
  it("still searches a term the address bar turned into a number", () => {
    expect(productSearchConditions(10000 as unknown as string)).toContain("description.ilike.%10000%");
    expect(productSearchConditions(10000 as unknown as string)).not.toContain("%1%0%0%0%0%");
  });
});
