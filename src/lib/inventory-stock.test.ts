import { describe, expect, it } from "vitest";
import { classifyInventory, inventoryReasonLabel } from "./inventory-stock";

describe("inventory classification", () => {
  const products = [
    { id: "out", stock: 0, status: "available", is_demo: false },
    { id: "low", stock: 2, status: "available", is_demo: false },
    { id: "healthy", stock: 8, status: "available", is_demo: false },
    { id: "demo", stock: 0, status: "available", is_demo: true },
    { id: "sold", stock: 0, status: "sold", is_demo: false },
    { id: "invalid", stock: "unknown", status: "available", is_demo: false },
  ];

  it("separates out-of-stock and low-stock real available listings", () => {
    const result = classifyInventory(products, 2);
    expect(result.outOfStock.map((product) => product.id)).toEqual(["out"]);
    expect(result.lowStock.map((product) => product.id)).toEqual(["low"]);
  });

  it("supports a zero threshold without duplicating out-of-stock items", () => {
    const result = classifyInventory(products, 0);
    expect(result.outOfStock.map((product) => product.id)).toEqual(["out"]);
    expect(result.lowStock).toEqual([]);
  });
});

describe("inventory reason localization", () => {
  it("translates known movement reasons into all supported languages", () => {
    expect(inventoryReasonLabel("initial_stock", "en")).toBe("Initial stock");
    expect(inventoryReasonLabel("initial_stock", "th")).toBe("สต็อกเริ่มต้น");
    expect(inventoryReasonLabel("initial_stock", "ro")).toBe("Stoc inițial");
  });

  it("keeps unknown reasons readable", () => {
    expect(inventoryReasonLabel("custom_reason", "en")).toBe("custom reason");
  });
});
