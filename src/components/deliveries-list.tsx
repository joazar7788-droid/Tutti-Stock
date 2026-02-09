"use client";

import { formatQty } from "@/lib/unit-utils";

export type DeliveryTransaction = {
  id: string;
  created_at: string;
  item_name: string;
  sku: string;
  base_unit: "boxes" | "pcs";
  pcs_per_box: number;
  qty: number; // in pcs
  branch_name: string;
  note: string | null;
};

export function DeliveriesList({
  deliveries,
}: {
  deliveries: DeliveryTransaction[];
}) {
  if (deliveries.length === 0) return null;

  // Group by date
  const byDate = new Map<string, DeliveryTransaction[]>();
  for (const d of deliveries) {
    const date = new Date(d.created_at).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(d);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Delivery History</h2>
      <div className="space-y-4">
        {Array.from(byDate.entries()).map(([date, txns]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{date}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {txns.map((d) => (
                <div key={d.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{d.item_name}</span>
                      <span className="text-gray-400 text-sm ml-2">{d.sku}</span>
                    </div>
                    <span className="font-mono font-semibold">
                      {formatQty(d.qty, d.base_unit, d.pcs_per_box)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span>{d.branch_name}</span>
                    {d.note && (
                      <>
                        <span>·</span>
                        <span>{d.note}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
