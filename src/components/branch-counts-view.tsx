"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatQty } from "@/lib/unit-utils";
import { CategoryTag } from "@/components/category-tag";

export type BranchCountData = {
  locationId: string;
  locationName: string;
  countedBy: string | null;
  countedAt: string | null;
  hasCount: boolean;
  items: Array<{
    itemId: string;
    itemName: string;
    category: string | null;
    qty: number;
    baseUnit: "boxes" | "pcs";
    pcsPerBox: number;
    unit: string;
  }>;
};

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

export function BranchCountsView({
  branches,
  allBranches,
  currentBranch,
}: {
  branches: BranchCountData[];
  allBranches: Array<{ id: string; name: string }>;
  currentBranch?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());

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

  function handleBranchFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("branch", value);
    } else {
      params.delete("branch");
    }
    router.push(`/branch-counts?${params.toString()}`);
  }

  const filteredBranches = currentBranch
    ? branches.filter((b) => b.locationId === currentBranch)
    : branches;

  return (
    <div className="space-y-4">
      {/* Branch filter */}
      <div>
        <select
          value={currentBranch ?? ""}
          onChange={(e) => handleBranchFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">All Branches</option>
          {allBranches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Branch cards */}
      {filteredBranches.map((branch) => {
        const isOpen = openKeys.has(branch.locationId);
        const itemsInStock = branch.items.filter((i) => i.qty > 0).length;

        if (!branch.hasCount) {
          return (
            <div
              key={branch.locationId}
              className="bg-white rounded-xl border border-gray-200 px-4 py-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg">{branch.locationName}</span>
                <span className="text-sm text-gray-400">
                  No count submitted this week
                </span>
              </div>
            </div>
          );
        }

        const countDate = branch.countedAt
          ? new Date(branch.countedAt).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            })
          : "";

        // Group items by category
        const groupedItems = new Map<string, typeof branch.items>();
        for (const item of branch.items) {
          const cat = item.category ?? "Other";
          if (!groupedItems.has(cat)) groupedItems.set(cat, []);
          groupedItems.get(cat)!.push(item);
        }

        return (
          <div
            key={branch.locationId}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <button
              onClick={() => toggle(branch.locationId)}
              className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
            >
              <div>
                <div className="font-semibold text-lg">{branch.locationName}</div>
                <div className="text-sm text-gray-400 mt-0.5">
                  Counted by {branch.countedBy} &middot; {countDate} &middot;{" "}
                  {itemsInStock} item{itemsInStock !== 1 ? "s" : ""} in stock
                </div>
              </div>
              <ChevronIcon open={isOpen} />
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-3 space-y-4">
                {Array.from(groupedItems.entries()).map(([cat, catItems]) => (
                  <div key={cat}>
                    <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                      {cat}
                    </h4>
                    <div className="space-y-1">
                      {catItems.map((item) => (
                        <div
                          key={item.itemId}
                          className={`flex items-center justify-between py-1.5 ${
                            item.qty === 0 ? "text-gray-300" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{item.itemName}</span>
                          </div>
                          <span className="text-sm font-mono font-semibold">
                            {item.qty === 0
                              ? "0"
                              : formatQty(
                                  item.qty,
                                  item.baseUnit,
                                  item.pcsPerBox,
                                  item.unit !== "pcs" &&
                                    item.unit !== "boxes"
                                    ? item.unit
                                    : undefined
                                )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
