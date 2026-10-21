export type CheckoutCartItem = { id: string; quantity: number };
export type CheckoutProduct = { id: string; price: number | string; stock: number | string | null; status: string };

export function reconcileCheckoutItems(cart: readonly CheckoutCartItem[], products: readonly CheckoutProduct[]) {
  return cart.flatMap((item) => {
    const product = products.find((candidate) => candidate.id === item.id);
    if (!product || product.status !== "available") return [];
    const stock = Number(product.stock);
    const price = Number(product.price);
    if (!Number.isInteger(stock) || stock < 1 || !Number.isFinite(price) || price < 0) return [];
    if (!Number.isInteger(item.quantity) || item.quantity < 1) return [];
    return [{ ...product, stock, price, quantity: Math.min(item.quantity, stock) }];
  });
}

export function checkoutTotal(items: readonly { price: number; quantity: number }[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
