"use client";

import { formatQty } from "@/lib/unit-utils";

export type AggregatedDelivery = {
  item_name: string;
  sku: string;
  base_unit: "boxes" | "pcs";
  pcs_per_box: number;
  total_qty: number; // in pcs
};

export function DeliveriesSummary({
  aggregated,
}: {
  aggregated: AggregatedDelivery[];
}) {
  if (aggregated.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No deliveries found for this period
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Totals</h2>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-semibold text-gray-600">Item</th>
              <th className="text-left py-3 px-3 font-semibold text-gray-600">SKU</th>
              <th className="text-right py-3 px-3 font-semibold text-gray-600">Total Delivered</th>
            </tr>
          </thead>
          <tbody>
            {aggregated.map((item) => (
              <tr key={item.sku} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3 font-medium">{item.item_name}</td>
                <td className="py-3 px-3 text-gray-500">{item.sku}</td>
                <td className="py-3 px-3 text-right font-mono font-semibold">
                  {formatQty(item.total_qty, item.base_unit, item.pcs_per_box)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {aggregated.map((item) => (
          <div key={item.sku} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{item.item_name}</div>
              <div className="text-xs text-gray-400">{item.sku}</div>
            </div>
            <div className="font-mono font-semibold">
              {formatQty(item.total_qty, item.base_unit, item.pcs_per_box)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
