import { describe, expect, it } from "vitest";
import { checkoutTotal, reconcileCheckoutItems } from "./checkout";

describe("checkout cart reconciliation", () => {
  const products = [
    { id: "available", price: "12.50", stock: 2, status: "available" },
    { id: "sold", price: 10, stock: 5, status: "sold" },
    { id: "hidden", price: 9, stock: 4, status: "hidden" },
    { id: "bad-price", price: "NaN", stock: 3, status: "available" },
    { id: "empty", price: 5, stock: 0, status: "available" },
  ];

  it("excludes unavailable or invalid products and clamps quantities to current stock", () => {
    const items = reconcileCheckoutItems([
      { id: "available", quantity: 7 },
      { id: "sold", quantity: 1 },
      { id: "hidden", quantity: 1 },
      { id: "bad-price", quantity: 1 },
      { id: "empty", quantity: 1 },
      { id: "missing", quantity: 1 },
    ], products);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "available", price: 12.5, stock: 2, quantity: 2 });
  });

  it("calculates totals from reconciled current prices", () => {
    expect(checkoutTotal([{ price: 12.5, quantity: 2 }, { price: 3, quantity: 1 }])).toBe(28);
  });
});
