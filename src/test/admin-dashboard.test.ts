import { describe, expect, it } from "vitest";
import { getPaidSalesTotals } from "@/lib/admin-dashboard";

describe("admin sales totals", () => {
  it("separates all paid orders from completed paid sales", () => {
    expect(getPaidSalesTotals([
      { status: "received", payment_status: "paid", total: 120 },
      { status: "completed", payment_status: "paid", total: "250.50" },
      { status: "processing", payment_status: "pending", total: 80 },
      { status: "cancelled", payment_status: "paid", total: 40 },
    ])).toEqual({ paidOrderTotal: 370.5, paidCompletedSales: 250.5 });
  });

  it("ignores non-finite totals and treats null totals as zero", () => {
    expect(getPaidSalesTotals([
      { status: "completed", payment_status: "paid", total: "not-a-number" },
      { status: "completed", payment_status: "paid", total: null },
      { status: "completed", payment_status: "refunded", total: 500 },
    ])).toEqual({ paidOrderTotal: 0, paidCompletedSales: 0 });
  });

  it("does not count cancelled orders in either metric", () => {
    expect(getPaidSalesTotals([
      { status: "cancelled", payment_status: "paid", total: 900 },
    ])).toEqual({ paidOrderTotal: 0, paidCompletedSales: 0 });
  });
});
