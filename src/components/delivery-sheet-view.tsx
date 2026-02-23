"use client";

import { formatQty } from "@/lib/unit-utils";
import { CATEGORY_CONFIG } from "@/components/category-tag";

type SheetItem = {
  itemName: string;
  category: string | null;
  qty: number;
  baseUnit: "boxes" | "pcs";
  pcsPerBox: number;
};

type BranchGroup = {
  branchName: string;
  items: SheetItem[];
};

export function DeliverySheetView({
  weekOf,
  branchGroups,
}: {
  weekOf: string;
  branchGroups: BranchGroup[];
}) {
  const formattedWeek = new Date(weekOf + "T00:00:00").toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <div>
      {/* Toolbar (hidden on print) */}
      <div className="no-print flex items-center gap-3 mb-6">
        <a
          href="/delivery-planner"
          className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200"
        >
          &larr; Back to Planner
        </a>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700"
        >
          Print / Save PDF
        </button>
      </div>

      {/* Sheet content */}
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Delivery Sheet</h1>
          <p className="text-gray-500 mt-1">Week of {formattedWeek}</p>
        </div>

        {branchGroups.length === 0 && (
          <p className="text-center text-gray-400">
            No deliveries planned.
          </p>
        )}

        <div className="space-y-6">
          {branchGroups.map((group) => (
            <div
              key={group.branchName}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h2 className="font-bold text-lg">{group.branchName}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {group.items.map((item, idx) => {
                  const catConfig = item.category
                    ? CATEGORY_CONFIG[item.category]
                    : null;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-4 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {item.itemName}
                        </span>
                        {catConfig && (
                          <span
                            className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${catConfig.className}`}
                          >
                            {catConfig.label}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-mono font-semibold text-gray-700">
                        {formatQty(item.qty, item.baseUnit, item.pcsPerBox)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {branchGroups.length > 0 && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500 text-center">
              {branchGroups.length} branch
              {branchGroups.length !== 1 ? "es" : ""} &middot;{" "}
              {branchGroups.reduce((sum, g) => sum + g.items.length, 0)} items
              total
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
