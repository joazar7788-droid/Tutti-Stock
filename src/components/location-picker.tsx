"use client";

import type { Location } from "@/lib/database.types";

export function LocationPicker({
  locations,
  selected,
  onSelect,
  filterType,
}: {
  locations: Location[];
  selected: string | null;
  onSelect: (id: string) => void;
  filterType?: "warehouse" | "branch";
}) {
  const filtered = filterType
    ? locations.filter((l) => l.type === filterType)
    : locations;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {filtered.map((location) => (
        <button
          key={location.id}
          onClick={() => onSelect(location.id)}
          className={`p-4 rounded-xl border-2 text-left transition-colors min-h-[60px] ${
            selected === location.id
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-200 bg-white hover:border-gray-300"
          }`}
        >
          <div className="font-medium">{location.name}</div>
          <div className="text-xs text-gray-500 capitalize">{location.type}</div>
        </button>
      ))}
    </div>
  );
}
