"use client";

import { formatQty } from "@/lib/unit-utils";

export type ActivityTransaction = {
  id: string;
  created_at: string;
  transaction_type: "RECEIVE" | "TRANSFER" | "ADJUST";
  item_name: string;
  sku: string;
  base_unit: "boxes" | "pcs";
  pcs_per_box: number;
  qty: number; // in pcs
  from_location_name: string | null;
  to_location_name: string | null;
  note: string | null;
  reason: string | null;
};

const TYPE_CONFIG = {
  TRANSFER: { label: "Delivery", className: "bg-blue-100 text-blue-700" },
  RECEIVE: { label: "Received", className: "bg-green-100 text-green-700" },
  ADJUST: { label: "Adjustment", className: "bg-amber-100 text-amber-700" },
};

function TypeBadge({ type }: { type: ActivityTransaction["transaction_type"] }) {
  const config = TYPE_CONFIG[type];
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function ActivityDetail({ tx }: { tx: ActivityTransaction }) {
  switch (tx.transaction_type) {
    case "TRANSFER":
      return <span>→ {tx.to_location_name}</span>;
    case "RECEIVE":
      return <span>→ {tx.to_location_name}</span>;
    case "ADJUST":
      return (
        <span>
          {tx.to_location_name ? `+ ${tx.to_location_name}` : `- ${tx.from_location_name}`}
          {tx.reason && <> · {tx.reason}</>}
        </span>
      );
  }
}

export function DeliveriesList({
  activities,
}: {
  activities: ActivityTransaction[];
}) {
  if (activities.length === 0) return null;

  // Group by date
  const byDate = new Map<string, ActivityTransaction[]>();
  for (const tx of activities) {
    const date = new Date(tx.created_at).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(tx);
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">History</h2>
      <div className="space-y-4">
        {Array.from(byDate.entries()).map(([date, txns]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-gray-500 mb-2">{date}</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
              {txns.map((tx) => (
                <div key={tx.id} className="px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{tx.item_name}</span>
                      <TypeBadge type={tx.transaction_type} />
                    </div>
                    <span className="font-mono font-semibold">
                      {formatQty(tx.qty, tx.base_unit, tx.pcs_per_box)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <ActivityDetail tx={tx} />
                    {tx.note && (
                      <>
                        <span>·</span>
                        <span>{tx.note}</span>
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
