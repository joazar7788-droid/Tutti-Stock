"use client";

import type { InventoryLevel } from "@/lib/database.types";
import { formatQty } from "@/lib/unit-utils";

const CATEGORY_CONFIG: Record<string, { label: string; className: string }> = {
  Powders: { label: "Powder", className: "bg-purple-100 text-purple-700" },
  "Ingredient Syrups": { label: "Syrup", className: "bg-blue-100 text-blue-700" },
  Toppings: { label: "Topping", className: "bg-emerald-100 text-emerald-700" },
  "Topping Sauces": { label: "Sauce", className: "bg-amber-100 text-amber-700" },
  Bobas: { label: "Boba", className: "bg-pink-100 text-pink-700" },
  Containers: { label: "Container", className: "bg-slate-100 text-slate-600" },
};

function CategoryTag({ category }: { category: string | null }) {
  if (!category) return null;
  const config = CATEGORY_CONFIG[category];
  if (!config) return null;
  return (
    <span
      className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function InventoryTable({
  inventory,
}: {
  inventory: InventoryLevel[];
}) {
  // Group by item (warehouse only, so one row per item)
  const itemMap = new Map<
    string,
    {
      item_id: string;
      item_name: string;
      sku: string;
      category: string | null;
      unit: string;
      base_unit: "boxes" | "pcs";
      pcs_per_box: number;
      reorder_point: number;
      is_favorite: boolean;
      on_hand: number;
    }
  >();

  for (const row of inventory) {
    itemMap.set(row.item_id, {
      item_id: row.item_id,
      item_name: row.item_name,
      sku: row.sku,
      category: row.category,
      unit: row.unit,
      base_unit: row.base_unit,
      pcs_per_box: row.pcs_per_box,
      reorder_point: row.reorder_point,
      is_favorite: row.is_favorite,
      on_hand: row.on_hand,
    });
  }

  const items = Array.from(itemMap.values()).sort((a, b) =>
    a.item_name.localeCompare(b.item_name)
  );

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
              <th className="text-left py-3 px-3 font-semibold text-gray-600">
                Item
              </th>
              <th className="text-right py-3 px-3 font-semibold text-gray-600">
                On Hand
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isLow = item.on_hand <= item.reorder_point;
              const isZero = item.on_hand === 0;
              const isNegative = item.on_hand < 0;

              return (
                <tr key={item.item_id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      {item.is_favorite && <span className="text-yellow-500 text-xs">★</span>}
                      <span className="font-medium">{item.item_name}</span>
                      <CategoryTag category={item.category} />
                    </div>
                    {item.pcs_per_box > 1 && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {item.pcs_per_box} per box
                      </div>
                    )}
                  </td>
                  <td
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
                      {formatQty(item.on_hand, item.base_unit, item.pcs_per_box, item.unit)}
                      {isLow && item.on_hand > 0 && (
                        <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-danger-100 text-danger-700 rounded">
                          LOW
                        </span>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {items.map((item) => {
          const isLow = item.on_hand <= item.reorder_point;
          const isNegative = item.on_hand < 0;

          return (
            <div
              key={item.item_id}
              className={`bg-white rounded-xl border p-4 ${
                isLow ? "border-danger-200" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {item.is_favorite && <span className="text-yellow-500">★</span>}
                    <span className="font-semibold">{item.item_name}</span>
                    <CategoryTag category={item.category} />
                  </div>
                  {item.pcs_per_box > 1 && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {item.pcs_per_box} per box
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className={`font-mono font-semibold ${
                      isNegative
                        ? "text-danger-700"
                        : isLow
                        ? "text-danger-600"
                        : ""
                    }`}
                  >
                    {formatQty(item.on_hand, item.base_unit, item.pcs_per_box, item.unit)}
                  </div>
                  {isLow && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-danger-100 text-danger-700 rounded-lg">
                      LOW
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
