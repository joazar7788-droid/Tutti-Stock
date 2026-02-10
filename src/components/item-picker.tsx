"use client";

import { useState } from "react";
import type { Item } from "@/lib/database.types";
import { CategoryTag } from "@/components/category-tag";

export function ItemPicker({
  items,
  selectedIds,
  onToggle,
}: {
  items: Item[];
  selectedIds: Set<string>;
  onToggle: (itemId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase()) ||
      (item.category?.toLowerCase().includes(search.toLowerCase()) ?? false)
  );

  // Sort: favorites first, then alphabetically
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search items..."
        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      />

      <div className="max-h-[50vh] overflow-y-auto space-y-2">
        {sorted.map((item) => {
          const isSelected = selectedIds.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition-colors flex items-center justify-between ${
                isSelected
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {item.is_favorite && <span className="text-yellow-500">★</span>}
                  <span className="font-medium">{item.name}</span>
                  <CategoryTag category={item.category} />
                </div>
                {item.pcs_per_box > 1 && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {item.pcs_per_box} per box
                  </div>
                )}
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  isSelected
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-gray-300"
                }`}
              >
                {isSelected && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
        {sorted.length === 0 && (
          <p className="text-center text-gray-400 py-8">No items found</p>
        )}
      </div>

      {selectedIds.size > 0 && (
        <div className="text-sm text-brand-600 font-medium">
          {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
        </div>
      )}
    </div>
  );
}
