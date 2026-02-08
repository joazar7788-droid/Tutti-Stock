"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type FilterLocation = { id: string; name: string; type: string };

export function InventoryFilters({
  locations,
  categories,
  currentLocation,
  currentCategory,
  currentSearch,
}: {
  locations: FilterLocation[];
  categories: string[];
  currentLocation?: string;
  currentCategory?: string;
  currentSearch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`/inventory?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={currentLocation ?? ""}
        onChange={(e) => updateParams("location", e.target.value)}
        className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">All Locations</option>
        {locations.map((l) => (
          <option key={l.id} value={l.id}>
            {l.name}
          </option>
        ))}
      </select>

      <select
        value={currentCategory ?? ""}
        onChange={(e) => updateParams("category", e.target.value)}
        className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        type="text"
        defaultValue={currentSearch ?? ""}
        placeholder="Search items..."
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            updateParams("q", (e.target as HTMLInputElement).value);
          }
        }}
        onBlur={(e) => updateParams("q", e.target.value)}
        className="px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 flex-1 min-w-[200px]"
      />
    </div>
  );
}
