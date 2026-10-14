import { describe, expect, it } from "vitest";
import { validateImageFile, moveItem, fitWithin } from "./product-images";

describe("product image rules", () => {
  it("rejects files over 10 MB", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 })).not.toBeNull();
  });
  it("accepts a 5 MB JPEG", () => {
    expect(validateImageFile({ type: "image/jpeg", size: 5 * 1024 * 1024 })).toBeNull();
  });
  it("rejects non-image types", () => {
    expect(validateImageFile({ type: "application/pdf", size: 1000 })).not.toBeNull();
  });
  it("moves an image to the main position", () => {
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });
  it("resizes so the longest side is 1600px", () => {
    expect(fitWithin(4000, 2000)).toEqual({ width: 1600, height: 800 });
  });
});
