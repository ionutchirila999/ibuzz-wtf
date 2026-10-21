import { describe, expect, it } from "vitest";
import { safeTrackingUrl } from "./tracking";

describe("safeTrackingUrl", () => {
  it("accepts HTTPS carrier links", () => {
    expect(safeTrackingUrl("https://carrier.example/track?id=123")).toBe("https://carrier.example/track?id=123");
  });

  it("rejects non-HTTPS or malformed links", () => {
    expect(safeTrackingUrl("javascript:alert(1)")).toBeNull();
    expect(safeTrackingUrl("http://carrier.example/track")).toBeNull();
    expect(safeTrackingUrl("not a URL")).toBeNull();
    expect(safeTrackingUrl(null)).toBeNull();
  });
});
