export type CheckoutCartItem = { id: string; quantity: number };
export type CheckoutProduct = { id: string; price: number | string; stock: number | string | null; status: string };

export function reconcileCheckoutItems<T extends CheckoutProduct>(cart: readonly CheckoutCartItem[], products: readonly T[]) {
  const reconciled = new Map<string, T & { stock: number; price: number; quantity: number }>();

  for (const item of cart) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) continue;

    const product = products.find((candidate) => candidate.id === item.id);
    if (!product || product.status !== "available") continue;

    const stock = Number(product.stock);
    const price = Number(product.price);
    if (!Number.isInteger(stock) || stock < 1 || !Number.isFinite(price) || price < 0) continue;

    const existing = reconciled.get(item.id);
    if (existing) {
      existing.quantity = Math.min(stock, existing.quantity + item.quantity);
    } else {
      reconciled.set(item.id, { ...product, stock, price, quantity: Math.min(item.quantity, stock) });
    }
  }

  return Array.from(reconciled.values());
}

export function checkoutTotal(items: readonly { price: number; quantity: number }[]) {
  // Database product prices use two decimal places. Accumulate in integer cents
  // to avoid floating-point artifacts in displayed and submitted totals.
  const totalCents = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  return totalCents / 100;
}
