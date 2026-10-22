import { describe, expect, it } from "vitest";
import { checkoutTotal, reconcileCheckoutItems } from "@/lib/checkout";

describe("checkout item reconciliation", () => {
  const products = [
    { id: "available", price: "25.50", stock: 3, status: "available" },
    { id: "sold-out", price: 10, stock: 0, status: "available" },
    { id: "sold", price: 50, stock: 5, status: "sold" },
    { id: "bad-price", price: "NaN", stock: 4, status: "available" },
    { id: "bad-stock", price: 10, stock: -1, status: "available" },
  ] as const;

  it("drops missing, unavailable, invalid-price, and invalid-stock products", () => {
    const items = reconcileCheckoutItems(
      [
        { id: "missing", quantity: 1 },
        { id: "sold-out", quantity: 1 },
        { id: "sold", quantity: 1 },
        { id: "bad-price", quantity: 1 },
        { id: "bad-stock", quantity: 1 },
      ],
      products,
    );

    expect(items).toEqual([]);
  });

  it("caps quantities to the latest available stock and normalizes numeric prices", () => {
    expect(
      reconcileCheckoutItems([{ id: "available", quantity: 9 }], products),
    ).toEqual([
      {
        id: "available",
        price: 25.5,
        stock: 3,
        status: "available",
        quantity: 3,
      },
    ]);
  });

  it("rejects invalid cart quantities", () => {
    expect(
      reconcileCheckoutItems(
        [
          { id: "available", quantity: 0 },
          { id: "available", quantity: -1 },
          { id: "available", quantity: 1.5 },
        ],
        products,
      ),
    ).toEqual([]);
  });
});

describe("checkout totals", () => {
  it("uses reconciled unit prices and quantities", () => {
    expect(
      checkoutTotal([
        { price: 25.5, quantity: 2 },
        { price: 10, quantity: 1 },
      ]),
    ).toBe(61);
  });

  it("returns zero for an empty cart", () => {
    expect(checkoutTotal([])).toBe(0);
  });
});
