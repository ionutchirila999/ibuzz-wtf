export type StockProduct = {
  id: string;
  stock: number | string | null;
  status: string;
  is_demo: boolean | null;
  low_stock_threshold?: number | string | null;
};

export function classifyInventory(products: readonly StockProduct[], threshold: number) {
  const eligible = products.filter((product) => !product.is_demo && product.status === "available");
  const outOfStock = eligible.filter((product) => Number(product.stock) <= 0);
  const lowStock = eligible.filter((product) => {
    const stock = Number(product.stock);
    const productThreshold = Number(product.low_stock_threshold ?? threshold);
    return Number.isFinite(stock) && stock > 0 && stock <= (Number.isFinite(productThreshold) ? productThreshold : threshold);
  });

  return { outOfStock, lowStock };
}

export function inventoryReasonLabel(reason: string, language: "en" | "th" | "ro") {
  const labels = {
    initial_stock: { en: "Initial stock", th: "สต็อกเริ่มต้น", ro: "Stoc inițial" },
    marked_sold: { en: "Marked sold", th: "ทำเครื่องหมายว่าขายแล้ว", ro: "Marcat ca vândut" },
    stock_adjustment: { en: "Stock adjustment", th: "ปรับสต็อก", ro: "Ajustare stoc" },
    restock: { en: "Restocked", th: "เติมสินค้า", ro: "Reaprovizionare" },
    damaged: { en: "Damaged / written off", th: "สินค้าเสียหาย / ตัดสต็อก", ro: "Deteriorat / scos din stoc" },
    stocktake: { en: "Stocktake", th: "ตรวจนับสต็อก", ro: "Inventariere" },
    correction: { en: "Stock correction", th: "แก้ไขสต็อก", ro: "Corectare stoc" },
    adjustment: { en: "Adjustment", th: "การปรับปรุง", ro: "Ajustare" },
    order_cancelled: { en: "Order cancelled — stock restored", th: "ยกเลิกคำสั่งซื้อ — คืนสต็อกแล้ว", ro: "Comandă anulată — stoc restaurat" },
  } as const;
  return (labels as Record<string, Record<string, string>>)[reason]?.[language] ?? reason.replaceAll("_", " ");
}
