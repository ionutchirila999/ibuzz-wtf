import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { calcProfit, formatPrice, type CostInput } from "@/lib/shop";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS: [keyof CostInput, string][] = [
  ["sellingPrice", "Selling price"], ["purchaseCost", "Purchase cost"], ["repairCost", "Repair costs"],
  ["shipping", "Shipping"], ["platformFees", "Platform fees"], ["otherExpenses", "Other expenses"],
];

export function ProfitCalculator() {
  const [v, setV] = useState<CostInput>({ sellingPrice: 0, purchaseCost: 0, repairCost: 0, shipping: 0, platformFees: 0, otherExpenses: 0 });
  const r = calcProfit(v);
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(([k, label]) => (
          <div key={k}><Label>{label} (฿)</Label><Input type="number" min={0} value={v[k] || ""} onChange={(e) => setV((p) => ({ ...p, [k]: Number(e.target.value) }))} /></div>
        ))}
      </div>
      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm text-muted-foreground">Total costs</p>
        <p className="text-xl font-semibold">{formatPrice(r.totalCosts)}</p>
        <p className="mt-4 text-sm text-muted-foreground">Net profit</p>
        <p className={`font-display text-4xl font-bold ${r.netProfit > 0 ? "text-success" : "text-destructive"}`}>{formatPrice(r.netProfit)}</p>
        <p className="mt-1 text-sm">Margin {r.margin.toFixed(1)}%</p>
        {r.warning && v.sellingPrice > 0 && (
          <div className="mt-4 flex gap-2 rounded-lg border border-warning/40 p-3 text-sm text-warning"><AlertTriangle className="h-4 w-4 shrink-0" />{r.warning}</div>
        )}
      </div>
    </div>
  );
}
