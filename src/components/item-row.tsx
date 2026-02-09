"use client";

import Link from "next/link";
import type { Item } from "@/lib/database.types";
import { toggleItemActive, toggleItemFavorite } from "@/app/(authenticated)/items/actions";

export function ItemRow({ item, isOwner }: { item: Item; isOwner: boolean }) {
  return (
    <div
      className={`p-4 flex items-center gap-4 ${
        !item.is_active ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={() => toggleItemFavorite(item.id, !item.is_favorite)}
        className={`text-xl ${
          item.is_favorite ? "text-yellow-500" : "text-gray-300 hover:text-yellow-400"
        }`}
        title={item.is_favorite ? "Remove from favorites" : "Add to favorites"}
      >
        ★
      </button>

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{item.name}</div>
        <div className="text-sm text-gray-500">
          {item.sku} · {item.category ?? "No category"} · {item.base_unit}{item.pcs_per_box > 1 ? ` (${item.pcs_per_box} pcs/box)` : ""}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          Reorder at: {item.reorder_point} · Target: {item.target_stock}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isOwner && (
          <>
            <Link
              href={`/items/${item.id}/edit`}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Edit
            </Link>
            <button
              onClick={() => toggleItemActive(item.id, !item.is_active)}
              className={`px-3 py-1.5 text-sm rounded-lg ${
                item.is_active
                  ? "bg-danger-50 text-danger-700 hover:bg-danger-100"
                  : "bg-success-50 text-success-600 hover:bg-green-100"
              }`}
            >
              {item.is_active ? "Deactivate" : "Activate"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
