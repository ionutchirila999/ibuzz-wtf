export type SalesOrder = {
  status: string;
  payment_status: string;
  total: number | string | null;
};

export function getPaidSalesTotals(orders: readonly SalesOrder[]) {
  return orders.reduce(
    (totals, order) => {
      if (order.payment_status !== "paid" || order.status === "cancelled") return totals;

      const amount = Number(order.total);
      if (!Number.isFinite(amount)) return totals;

      totals.paidOrderTotal += amount;
      if (order.status === "completed") totals.paidCompletedSales += amount;
      return totals;
    },
    { paidOrderTotal: 0, paidCompletedSales: 0 },
  );
}
