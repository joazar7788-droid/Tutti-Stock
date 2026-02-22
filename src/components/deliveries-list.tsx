"use client";

import { useState } from "react";
import { formatQty } from "@/lib/unit-utils";
import { CategoryTag } from "@/components/category-tag";

export type ActivityGroup = {
  key: string;
  title: string;
  type: "RECEIVE" | "TRANSFER" | "ADJUST";
  date: string;
  madeBy: string | null;
  items: {
    item_name: string;
    category: string | null;
    qty: number;
    base_unit: "boxes" | "pcs";
    pcs_per_box: number;
    note: string | null;
  }[];
};

const TYPE_CONFIG = {
  TRANSFER: { label: "Delivery", className: "bg-blue-100 text-blue-700" },
  RECEIVE: { label: "Received", className: "bg-green-100 text-green-700" },
  ADJUST: { label: "Adjustment", className: "bg-amber-100 text-amber-700" },
};

function TypeBadge({ type }: { type: ActivityGroup["type"] }) {
  const config = TYPE_CONFIG[type];
  return (
    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

export function DeliveriesList({ groups }: { groups: ActivityGroup[] }) {
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

  if (groups.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No activity found for this period
      </div>
    );
  }

  function toggle(key: string) {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = openKeys.has(group.key);
        const dateStr = new Date(group.date).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return (
          <div key={group.key} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              onClick={() => toggle(group.key)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TypeBadge type={group.type} />
                <span className="font-medium truncate">{group.title}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0 ml-3">
                <span className="text-xs text-gray-400">{dateStr}</span>
                <span className="text-xs text-gray-500 font-medium">
                  {group.items.length} {group.items.length === 1 ? "item" : "items"}
                </span>
                <ChevronIcon open={isOpen} />
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                {group.madeBy && (
                  <div className="px-4 py-2 text-xs text-gray-400">
                    Made by {group.madeBy}
                  </div>
                )}
                <div className="divide-y divide-gray-100">
                  {group.items.map((item, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                      <span className="text-sm flex items-center gap-1.5">
                        {item.item_name}
                        <CategoryTag category={item.category} />
                      </span>
                      <span className="text-sm font-mono font-semibold">
                        {formatQty(item.qty, item.base_unit, item.pcs_per_box)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
