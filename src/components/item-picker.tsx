"use client";

import { useMemo, useState } from "react";
import type { Item } from "@/lib/database.types";
import { CategoryTag, CATEGORY_CONFIG } from "@/components/category-tag";

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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories from items, ordered by CATEGORY_CONFIG
  const categories = useMemo(() => {
    const cats = new Set(items.map((i) => i.category).filter(Boolean) as string[]);
    return Object.keys(CATEGORY_CONFIG).filter((c) => cats.has(c));
  }, [items]);

  const filtered = items.filter((item) => {
    // Category filter
    if (selectedCategory && item.category !== selectedCategory) return false;
    // Text search
    if (search) {
      const q = search.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        (item.category?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  // Sort: favorites first, then alphabetically
  const sorted = [...filtered].sort((a, b) => {
    if (a.is_favorite && !b.is_favorite) return -1;
    if (!a.is_favorite && b.is_favorite) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-3">
      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? "bg-gray-800 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {categories.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(isActive ? null : cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                isActive
                  ? config.className
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {config.label}
            </button>
          );
        })}
      </div>

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
