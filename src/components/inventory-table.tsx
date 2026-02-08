"use client";

import type { InventoryLevel } from "@/lib/database.types";

type LocationInfo = { id: string; name: string; type: string };

export function InventoryTable({
  inventory,
  locations,
  showAllLocations,
}: {
  inventory: InventoryLevel[];
  locations: LocationInfo[];
  showAllLocations: boolean;
}) {
  // Group by item
  const itemMap = new Map<
    string,
    {
      item_id: string;
      item_name: string;
      sku: string;
      category: string | null;
      unit: string;
      reorder_point: number;
      is_favorite: boolean;
      byLocation: Map<string, number>;
    }
  >();

  for (const row of inventory) {
    if (!itemMap.has(row.item_id)) {
      itemMap.set(row.item_id, {
        item_id: row.item_id,
        item_name: row.item_name,
        sku: row.sku,
        category: row.category,
        unit: row.unit,
        reorder_point: row.reorder_point,
        is_favorite: row.is_favorite,
        byLocation: new Map(),
      });
    }
    itemMap.get(row.item_id)!.byLocation.set(row.location_id, row.on_hand);
  }

  const items = Array.from(itemMap.values()).sort((a, b) =>
    a.item_name.localeCompare(b.item_name)
  );

  const warehouse = locations.find((l) => l.type === "warehouse");
  const branches = locations.filter((l) => l.type === "branch");
  const displayLocations = showAllLocations
    ? [warehouse, ...branches].filter(Boolean) as LocationInfo[]
    : locations.filter((l) => inventory.some((inv) => inv.location_id === l.id));

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        No inventory data found
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-3 font-semibold text-gray-600 sticky left-0 bg-gray-50">
                Item
              </th>
              {displayLocations.map((l) => (
                <th
                  key={l.id}
                  className="text-right py-3 px-3 font-semibold text-gray-600 whitespace-nowrap"
                >
                  {l.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.item_id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-3 sticky left-0 bg-white">
                  <div className="flex items-center gap-1.5">
                    {item.is_favorite && <span className="text-yellow-500 text-xs">★</span>}
                    <span className="font-medium">{item.item_name}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.sku} · {item.unit}
                  </div>
                </td>
                {displayLocations.map((l) => {
                  const onHand = item.byLocation.get(l.id) ?? 0;
                  const isLow =
                    l.type === "warehouse" && onHand <= item.reorder_point;
                  const isZero = onHand === 0;
                  const isNegative = onHand < 0;

                  return (
                    <td
                      key={l.id}
                      className={`text-right py-3 px-3 font-mono ${
                        isNegative
                          ? "text-danger-700 font-bold"
                          : isZero
                          ? "text-gray-300"
                          : isLow
                          ? "text-danger-600 font-semibold"
                          : ""
                      }`}
                    >
                      <span className="flex items-center justify-end gap-1.5">
                        {onHand}
                        {isLow && onHand > 0 && (
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-danger-100 text-danger-700 rounded">
                            LOW
                          </span>
                        )}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((item) => {
          const warehouseQty = warehouse
            ? item.byLocation.get(warehouse.id) ?? 0
            : 0;
          const isLow = warehouseQty <= item.reorder_point;

          return (
            <div
              key={item.item_id}
              className={`bg-white rounded-xl border p-4 ${
                isLow ? "border-danger-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    {item.is_favorite && <span className="text-yellow-500">★</span>}
                    <span className="font-semibold">{item.item_name}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.sku} · {item.category}
                  </div>
                </div>
                {isLow && (
                  <span className="px-2 py-1 text-xs font-bold bg-danger-100 text-danger-700 rounded-lg">
                    LOW
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {displayLocations.map((l) => {
                  const onHand = item.byLocation.get(l.id) ?? 0;
                  return (
                    <div key={l.id} className="flex justify-between">
                      <span className="text-gray-500">{l.name}</span>
                      <span
                        className={`font-mono ${
                          onHand < 0
                            ? "text-danger-700 font-bold"
                            : onHand === 0
                            ? "text-gray-300"
                            : ""
                        }`}
                      >
                        {onHand}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
