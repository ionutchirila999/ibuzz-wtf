import { describe, expect, it } from "vitest";
import { calcProfit } from "./shop";

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
