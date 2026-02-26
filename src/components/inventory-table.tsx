"use client";

import { useState } from "react";
import Link from "next/link";
import type { InventoryLevel } from "@/lib/database.types";
import { formatQty } from "@/lib/unit-utils";
import { CategoryTag } from "@/components/category-tag";
import { toggleItemFavorite } from "@/app/(authenticated)/items/actions";

function StarButton({
  itemId,
  isFavorite,
}: {
  itemId: string;
  isFavorite: boolean;
}) {
  const [fav, setFav] = useState(isFavorite);
  const [saving, setSaving] = useState(false);

  async function handleToggle() {
    setSaving(true);
    setFav(!fav);
    await toggleItemFavorite(itemId, !fav);
    setSaving(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      className={`text-xs transition-colors ${
        fav
          ? "text-yellow-500 hover:text-yellow-600"
          : "text-gray-300 hover:text-yellow-400"
      }`}
      title={fav ? "Remove from favorites" : "Add to favorites"}
    >
      {fav ? "★" : "☆"}
    </button>
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
              <th className="w-10 py-3 px-3" />
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
                      <StarButton
                        itemId={item.item_id}
                        isFavorite={item.is_favorite}
                      />
                      <Link href={`/items/${item.item_id}/edit`} className="font-medium hover:text-brand-600 hover:underline">{item.item_name}</Link>
                      <CategoryTag category={item.category} />
                    </div>
                    {item.pcs_per_box > 1 && (
                      <div className="text-xs text-gray-400 mt-0.5 ml-5">
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
                  <td className="py-3 px-3 text-center">
                    <Link
                      href={`/items/${item.item_id}/edit`}
                      className="text-gray-400 hover:text-brand-600 transition-colors"
                      title="Edit item"
                    >
                      <svg
                        className="w-4 h-4 inline"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                        />
                      </svg>
                    </Link>
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <StarButton
                      itemId={item.item_id}
                      isFavorite={item.is_favorite}
                    />
                    <Link href={`/items/${item.item_id}/edit`} className="font-semibold truncate hover:text-brand-600 hover:underline">
                      {item.item_name}
                    </Link>
                    <CategoryTag category={item.category} />
                  </div>
                  {item.pcs_per_box > 1 && (
                    <div className="text-xs text-gray-400 mt-0.5 ml-5">
                      {item.pcs_per_box} per box
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
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
                  <Link
                    href={`/items/${item.item_id}/edit`}
                    className="text-gray-400 hover:text-brand-600 transition-colors"
                    title="Edit item"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
