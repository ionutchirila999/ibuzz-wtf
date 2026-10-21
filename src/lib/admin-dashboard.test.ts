import { describe, expect, it } from "vitest";
import { getPaidSalesTotals } from "./admin-dashboard";

describe("admin dashboard sales totals", () => {
  it("counts paid non-cancelled orders for the overview, including orders still in progress", () => {
    const totals = getPaidSalesTotals([
      { status: "processing", payment_status: "paid", total: "120.50" },
      { status: "completed", payment_status: "paid", total: 80 },
      { status: "processing", payment_status: "pending", total: 500 },
      { status: "cancelled", payment_status: "paid", total: 70 },
    ]);

    expect(totals.paidOrderTotal).toBe(200.5);
    expect(totals.paidCompletedSales).toBe(80);
  });

  it("ignores non-numeric totals", () => {
    expect(getPaidSalesTotals([
      { status: "completed", payment_status: "paid", total: "not-a-number" },
    ])).toEqual({ paidOrderTotal: 0, paidCompletedSales: 0 });
  });
});
